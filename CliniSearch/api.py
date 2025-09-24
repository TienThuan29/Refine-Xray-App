# api.py - Serverless API for CliniSearch AI Medical System
# Converted from Streamlit app to FastAPI for serverless deployment

import os
import asyncio
import tempfile
import shutil
import base64
from typing import List, Dict, Optional, Union
from pathlib import Path
import json
from io import BytesIO

from fastapi import FastAPI, File, UploadFile, Form, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from pydantic import BaseModel
from PIL import Image
import numpy as np
import torch
from open_clip import create_model_from_pretrained, get_tokenizer

# Import our utility modules
from utils.api_clients import gemini_client
from utils.rag_processing import VectorStore, perform_rag, parse_pdf, EMBEDDING_MODEL
from utils.model_inference import diagnose_and_visualize, analyze_with_gemini, disease_labels
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(
    title="CliniSearch AI Medical System API",
    description="Advanced Multimodal Assistant for Medical Research & Radiological Analysis",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global vector stores (in production, use proper database/Redis)
embedding_dim = EMBEDDING_MODEL.get_sentence_embedding_dimension()
research_vector_store = VectorStore(dimension=embedding_dim)
radiology_vector_store = VectorStore(dimension=embedding_dim)

# Initialize BiomedCLIP model for X-ray detection
try:
    model_id = "hf-hub:microsoft/BiomedCLIP-PubMedBERT_256-vit_base_patch16_224"
    xray_model, xray_preprocess = create_model_from_pretrained(model_id)
    xray_tokenizer = get_tokenizer(model_id)
    xray_model.eval()
    BIOMEDCLIP_AVAILABLE = True
except Exception as e:
    print(f"Warning: BiomedCLIP model not available: {e}")
    xray_model = None
    xray_preprocess = None
    xray_tokenizer = None
    BIOMEDCLIP_AVAILABLE = False

# Pydantic models for request/response
class ResearchQuery(BaseModel):
    query: str
    use_web_search: bool = True
    use_pubmed: bool = True
    use_uploaded_docs: bool = True

class ResearchResponse(BaseModel):
    web_answer: Optional[str] = None
    web_sources: List[Dict] = []
    pubmed_answer: Optional[str] = None
    pubmed_sources: List[Dict] = []
    doc_answer: Optional[str] = None
    doc_sources: List[Dict] = []

class RadiologyAnalysisRequest(BaseModel):
    confidence_threshold: float = 0.4
    model_path: Optional[str] = None

class DiseasePrediction(BaseModel):
    disease: str
    confidence: float

class RadiologyAnalysisResponse(BaseModel):
    predicted_diseases: List[DiseasePrediction]
    top_5_diseases: List[DiseasePrediction]
    gradcam_analyses: Dict[str, str]
    attention_map: Optional[str] = None
    individual_analyses: Dict[str, str]
    concise_conclusion: str
    comprehensive_analysis: Optional[str] = None

class TestSampleInfo(BaseModel):
    image_name: str
    primary_disease: str
    ground_truth: List[str]
    image_path: str

class TestAnalysisResponse(BaseModel):
    ai_predictions: List[DiseasePrediction]
    ground_truth: List[str]
    matches: List[str]
    missed: List[str]
    false_positives: List[str]
    accuracy_metrics: Dict[str, float]

class XrayDetectionResponse(BaseModel):
    is_xray: bool
    xray_probability: float
    confidence_level: str
    model_available: bool

# Helper functions
def format_output_as_html(source_name: str, answer: str, sources: list) -> str:
    """Creates an HTML string with a custom-styled box for the output."""
    output_html = '<div class="output-box">'
    output_html += f"<p><strong>Answer based on {source_name}:</strong></p>"
    output_html += "<hr>"
    output_html += f"<p>{answer.replace(chr(10), '<br>')}</p>"
    output_html += "<hr>"
    
    if sources:
        output_html += f"<p><strong>Sources from {source_name}:</strong></p>"
        for i, source in enumerate(sources):
            title = source.get('title', 'N/A')
            link = source.get('link', '#')
            
            if source.get('type') == "PubMed":
                pmid = link.split('/')[-2] if link.endswith('/') else link.split('/')[-1]
                output_html += f"<p>{i+1}. {title}<br>   PubMed ID: {pmid} (<a href='{link}' target='_blank'>Link</a>)</p>"
            elif source.get('type') == "Web Search":
                output_html += f"<p>{i+1}. {title}<br>   <a href='{link}' target='_blank'>Link</a></p>"
            else:  # For PDF
                output_html += f"<p>{i+1}. {title} ({link})</p>"
    else:
        output_html += f"<p>No sources were retrieved from {source_name}.</p>"
    
    output_html += '</div>'
    return output_html

def image_to_base64(image_path: str) -> str:
    """Convert image file to base64 string."""
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode('utf-8')

def xray_probability(image: Image.Image) -> float:
    """Calculate the probability that an image is an X-ray using BiomedCLIP."""
    if not BIOMEDCLIP_AVAILABLE:
        raise HTTPException(status_code=503, detail="BiomedCLIP model not available")
    
    # Preprocess the image
    img = xray_preprocess(image.convert("RGB")).unsqueeze(0)
    
    # Define positive and negative labels
    labels_pos = ["a chest X-ray radiograph", "a bone X-ray radiograph", "a dental X-ray radiograph"]
    labels_neg = [
        "a CT scan", "an MRI scan", "an ultrasound image",
        "a natural photograph", "a document scan", "a drawing or illustration"
    ]
    labels = labels_pos + labels_neg
    
    with torch.no_grad():
        image_features, text_features, logit_scale = xray_model(
            img, xray_tokenizer(labels, context_length=256)
        )
        probs = (logit_scale * image_features @ text_features.T).softmax(dim=-1)[0]
    
    # Calculate X-ray probability as sum of positive label probabilities
    p_xray = probs[:len(labels_pos)].sum().item()
    return p_xray


# API Endpoints

@app.get("/")
async def root():
    """Root endpoint with API information."""
    return {
        "message": "CliniSearch AI Medical System API",
        "version": "1.0.0",
        "endpoints": {
            "research": "/research/query",
            "radiology": "/radiology/analyze",
            "xray_detection": "/xray/detect",
            "test": "/test/analyze",
            "upload_docs": "/research/upload-documents",
            "health": "/health"
        }
    }

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy", 
        "gemini_available": gemini_client is not None,
        "biomedclip_available": BIOMEDCLIP_AVAILABLE
    }

@app.post("/xray/detect", response_model=XrayDetectionResponse)
async def detect_xray_image(image: UploadFile = File(...)):
    """Detect if an uploaded image is an X-ray image using BiomedCLIP."""
    try:
        # Validate image file
        if not image.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        # Check if BiomedCLIP model is available
        if not BIOMEDCLIP_AVAILABLE:
            return XrayDetectionResponse(
                is_xray=False,
                xray_probability=0.0,
                confidence_level="unavailable",
                model_available=False
            )
        
        # Convert uploaded image to PIL
        image_bytes = await image.read()
        image_pil = Image.open(BytesIO(image_bytes))
        
        # Calculate X-ray probability
        probability = xray_probability(image_pil)
        
        # Determine if it's an X-ray (threshold = 0.5)
        is_xray = probability >= 0.5
        
        # Determine confidence level
        if probability >= 0.8:
            confidence_level = "high"
        elif probability >= 0.6:
            confidence_level = "medium"
        elif probability >= 0.4:
            confidence_level = "low"
        else:
            confidence_level = "very_low"
        
        return XrayDetectionResponse(
            is_xray=is_xray,
            xray_probability=round(probability, 4),
            confidence_level=confidence_level,
            model_available=True
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error during X-ray detection: {str(e)}")


# Research & Q&A Endpoints

@app.post("/research/upload-documents")
async def upload_research_documents(files: List[UploadFile] = File(...)):
    """Upload PDF documents for research Q&A."""
    try:
        all_chunks = []
        for uploaded_file in files:
            if uploaded_file.content_type != "application/pdf":
                raise HTTPException(status_code=400, detail=f"File {uploaded_file.filename} is not a PDF")
            
            bytes_data = await uploaded_file.read()
            chunks = parse_pdf(bytes_data, uploaded_file.filename)
            if chunks:
                all_chunks.extend(chunks)
        
        if all_chunks:
            research_vector_store.add_documents(all_chunks)
            return {
                "message": f"Successfully processed and indexed {len(files)} PDF(s)",
                "chunks_added": len(all_chunks)
            }
        else:
            raise HTTPException(status_code=400, detail="Could not extract text from the uploaded PDF(s)")
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing documents: {str(e)}")


@app.post("/research/query", response_model=ResearchResponse)
async def research_query(query_request: ResearchQuery):
    """Perform medical research query with multiple data sources."""
    try:
        response = ResearchResponse()
        
        if query_request.use_web_search:
            web_context, web_sources = await perform_rag(
                query_request.query, 
                research_vector_store, 
                use_web=True, 
                use_pubmed=False
            )
            if web_context:
                web_synthesis_prompt = f"Based ONLY on Web Search context, answer: {query_request.query}"
                response.web_answer = gemini_client.generate_text(web_synthesis_prompt)
                response.web_sources = web_sources
        
        if query_request.use_pubmed:
            pubmed_context, pubmed_sources = await perform_rag(
                query_request.query, 
                research_vector_store, 
                use_web=False, 
                use_pubmed=True
            )
            if pubmed_context:
                pubmed_synthesis_prompt = f"Based ONLY on PubMed context, answer: {query_request.query}"
                response.pubmed_answer = gemini_client.generate_text(pubmed_synthesis_prompt)
                response.pubmed_sources = pubmed_sources
        
        if query_request.use_uploaded_docs:
            doc_context, doc_sources = await perform_rag(
                query_request.query, 
                research_vector_store, 
                use_web=False, 
                use_pubmed=False
            )
            if doc_context and "No relevant information" not in doc_context:
                doc_synthesis_prompt = f"Based ONLY on uploaded document context, answer: {query_request.query}"
                response.doc_answer = gemini_client.generate_text(doc_synthesis_prompt)
                response.doc_sources = doc_sources
        
        return response
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing research query: {str(e)}")


# Radiology Analysis Endpoints

@app.post("/radiology/upload-context-documents")
async def upload_radiology_context_documents(files: List[UploadFile] = File(...)):
    """Upload PDF documents for radiology context."""
    try:
        all_chunks = []
        for uploaded_file in files:
            if uploaded_file.content_type != "application/pdf":
                raise HTTPException(status_code=400, detail=f"File {uploaded_file.filename} is not a PDF")
            
            bytes_data = await uploaded_file.read()
            chunks = parse_pdf(bytes_data, uploaded_file.filename)
            if chunks:
                all_chunks.extend(chunks)
        
        if all_chunks:
            radiology_vector_store.add_documents(all_chunks)
            return {
                "message": f"Successfully processed and indexed {len(files)} PDF(s) for radiology context",
                "chunks_added": len(all_chunks)
            }
        else:
            raise HTTPException(status_code=400, detail="Could not extract text from the uploaded PDF(s)")
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing radiology context documents: {str(e)}")


@app.post("/radiology/analyze", response_model=RadiologyAnalysisResponse)
async def analyze_radiology_image(
    image: UploadFile = File(...),
    confidence_threshold: float = Form(0.4),
    model_path: Optional[str] = Form(None)
):
    """Perform complete AI analysis on radiology image."""
    try:
        # Validate image file
        if not image.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        # Create temporary directory for outputs
        temp_dir = tempfile.mkdtemp()
        
        try:
            # Convert uploaded image to PIL
            image_bytes = await image.read()
            image_pil = Image.open(BytesIO(image_bytes))
            
            # Run complete diagnosis pipeline
            diagnosis_results = diagnose_and_visualize(
                image_pil,
                model_path=model_path,
                output_dir=temp_dir,
                threshold=confidence_threshold
            )
            
            # Extract results
            predicted_diseases = [
                DiseasePrediction(disease=d['disease'], confidence=d['confidence'])
                for d in diagnosis_results['diagnosis']['predicted_diseases']
            ]
            
            top_5_diseases = [
                DiseasePrediction(disease=d['disease'], confidence=d['confidence'])
                for d in diagnosis_results['diagnosis']['top_5_diseases']
            ]
            
            # Process GradCAM analyses
            gradcam_analyses = {}
            individual_analyses = {}
            gradcam_top5_results = diagnosis_results['gradcam_top5']
            
            for i in range(5):
                disease_key = f"top{i+1}_{top_5_diseases[i].disease}"
                if disease_key in gradcam_top5_results:
                    disease_info = gradcam_top5_results[disease_key]
                    
                    # Convert GradCAM image to base64
                    gradcam_path = f"{temp_dir}/top{i+1}_{disease_info['disease']}_gradcam.png"
                    if os.path.exists(gradcam_path):
                        gradcam_analyses[disease_key] = image_to_base64(gradcam_path)
                    
                    # Get individual analysis with PubMed
                    from utils.model_inference import get_pubmed_for_disease, analyze_individual_disease_with_pubmed
                    
                    pubmed_context, pubmed_sources = await get_pubmed_for_disease(
                        disease_info['disease'],
                        perform_rag,
                        radiology_vector_store
                    )
                    
                    individual_analysis = analyze_individual_disease_with_pubmed(
                        gemini_client,
                        disease_info['disease'],
                        disease_info['confidence'],
                        np.array(disease_info['overlay']),
                        image_pil,
                        pubmed_context,
                        pubmed_sources
                    )
                    individual_analyses[disease_key] = individual_analysis
            
            # Convert attention map to base64
            attention_map = None
            attention_path = f"{temp_dir}/attention_analysis.png"
            if os.path.exists(attention_path):
                attention_map = image_to_base64(attention_path)
            
            # Get context from uploaded PDFs if available
            context_info = ""
            if radiology_vector_store.index.ntotal > 0:
                context_query = f"Clinical context for chest X-ray showing: {', '.join([d.disease for d in top_5_diseases])}"
                context, sources = await perform_rag(
                    context_query, 
                    radiology_vector_store, 
                    use_web=False, use_pubmed=False
                )
                if context and "No relevant information" not in context:
                    context_info = f"\n\n**Additional Context from Uploaded Documents:**\n{context}"
            
            # Generate concise conclusion
            from utils.model_inference import get_concise_conclusion_from_gemini
            concise_conclusion = get_concise_conclusion_from_gemini(
                gemini_client,
                [{'disease': d.disease, 'confidence': d.confidence} for d in top_5_diseases],
                individual_analyses,
                image_pil
            )
            
            # Generate comprehensive analysis
            from utils.model_inference import get_comprehensive_conclusion_from_gemini
            comprehensive_analysis = get_comprehensive_conclusion_from_gemini(
                gemini_client,
                [{'disease': d.disease, 'confidence': d.confidence} for d in top_5_diseases],
                individual_analyses,
                image_pil
            )
            
            if context_info:
                comprehensive_analysis += context_info
            
            return RadiologyAnalysisResponse(
                predicted_diseases=predicted_diseases,
                top_5_diseases=top_5_diseases,
                gradcam_analyses=gradcam_analyses,
                attention_map=attention_map,
                individual_analyses=individual_analyses,
                concise_conclusion=concise_conclusion,
                comprehensive_analysis=comprehensive_analysis
            )
        
        finally:
            # Clean up temporary directory
            try:
                shutil.rmtree(temp_dir)
            except:
                pass
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error during radiology analysis: {str(e)}")


# Test Mode Endpoints

@app.get("/test/samples")
async def get_test_samples():
    """Get available test samples from NIH dataset."""
    try:
        dataset_path = "C:/chest-xray/nih_chestxray_14"
        
        if not os.path.exists(dataset_path):
            raise HTTPException(status_code=404, detail="NIH Chest X-ray 14 dataset not found")
        
        from utils.test_data_loader import load_test_samples
        test_samples = load_test_samples(dataset_path, num_samples=10)
        
        if not test_samples:
            raise HTTPException(status_code=404, detail="No test samples could be loaded")
        
        return {
            "samples": [
                {
                    "index": i,
                    "image_name": sample['image_name'],
                    "primary_disease": sample['primary_disease'],
                    "ground_truth": sample['ground_truth']
                }
                for i, sample in enumerate(test_samples)
            ]
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error loading test samples: {str(e)}")

@app.post("/test/analyze", response_model=TestAnalysisResponse)
async def analyze_test_sample(
    sample_index: int = Form(...),
    confidence_threshold: float = Form(0.4),
    model_path: Optional[str] = Form(None)
):
    """Analyze a test sample and compare with ground truth."""
    try:
        dataset_path = "C:/chest-xray/nih_chestxray_14"
        
        if not os.path.exists(dataset_path):
            raise HTTPException(status_code=404, detail="NIH Chest X-ray 14 dataset not found")
        
        from utils.test_data_loader import load_test_samples, compare_predictions_with_ground_truth
        
        test_samples = load_test_samples(dataset_path, num_samples=10)
        
        if not test_samples or sample_index >= len(test_samples):
            raise HTTPException(status_code=404, detail="Test sample not found")
        
        selected_sample = test_samples[sample_index]
        
        # Create temporary directory for outputs
        temp_dir = tempfile.mkdtemp()
        
        try:
            from PIL import Image
            test_image = Image.open(selected_sample['image_path'])
            
            # Run complete diagnosis pipeline
            diagnosis_results = diagnose_and_visualize(
                test_image,
                model_path=model_path,
                output_dir=temp_dir,
                threshold=confidence_threshold
            )
            
            # Extract predictions
            predicted_diseases = [
                DiseasePrediction(disease=d['disease'], confidence=d['confidence'])
                for d in diagnosis_results['diagnosis']['predicted_diseases']
            ]
            
            # Compare with ground truth
            comparison = compare_predictions_with_ground_truth(
                diagnosis_results['diagnosis']['predicted_diseases'],
                selected_sample['ground_truth']
            )
            
            # Calculate accuracy metrics
            total_gt = len(comparison['ground_truth'])
            total_pred = len(comparison['matches']) + len(comparison['false_positives'])
            precision = len(comparison['matches']) / total_pred if total_pred > 0 else 0
            recall = len(comparison['matches']) / total_gt if total_gt > 0 else 0
            f1_score = 2 * (precision * recall) / (precision + recall) if (precision + recall) > 0 else 0
            
            accuracy_metrics = {
                "precision": precision,
                "recall": recall,
                "f1_score": f1_score,
                "total_ground_truth": total_gt,
                "total_predictions": total_pred,
                "matches": len(comparison['matches']),
                "missed": len(comparison['missed']),
                "false_positives": len(comparison['false_positives'])
            }
            
            return TestAnalysisResponse(
                ai_predictions=predicted_diseases,
                ground_truth=comparison['ground_truth'],
                matches=comparison['matches'],
                missed=comparison['missed'],
                false_positives=comparison['false_positives'],
                accuracy_metrics=accuracy_metrics
            )
        
        finally:
            # Clean up temporary directory
            try:
                shutil.rmtree(temp_dir)
            except:
                pass
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error during test analysis: {str(e)}")


# Utility Endpoints

@app.get("/diseases")
async def get_disease_labels():
    """Get list of supported disease labels."""
    return {"diseases": disease_labels}

@app.get("/research/status")
async def get_research_status():
    """Get status of research vector store."""
    return {
        "documents_indexed": research_vector_store.index.ntotal,
        "embedding_dimension": research_vector_store.dimension
    }

@app.get("/radiology/status")
async def get_radiology_status():
    """Get status of radiology vector store."""
    return {
        "documents_indexed": radiology_vector_store.index.ntotal,
        "embedding_dimension": radiology_vector_store.dimension
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
