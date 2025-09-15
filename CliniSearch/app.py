# app.py (Final version with UI fix and combined Radiology RAG)

import streamlit as st
import os
from dotenv import load_dotenv
import asyncio
from PIL import Image
import numpy as np

# Import our utility modules
from utils.api_clients import gemini_client
from utils.rag_processing import VectorStore, perform_rag, parse_pdf, EMBEDDING_MODEL
from utils.model_inference import diagnose_and_visualize, analyze_with_gemini, disease_labels
import tempfile
import shutil

# Load environment variables from .env file
load_dotenv()

# --- Page Configuration ---
st.set_page_config(
    page_title="IntraIntel AI Agent for Radiology & Research",
    page_icon="",
    layout="wide"
)

# --- Custom CSS for Output Boxes ---
# This CSS creates a bordered box that allows text to wrap naturally.
st.markdown("""
<style>
    .output-box {
        border: 2px solid #ddd;
        border-radius: 8px;
        padding: 15px;
        background-color: #f9f9f9;
        margin-bottom: 20px;
    }
    .output-box p {
        margin-bottom: 8px;
    }
    .output-box a {
        color: #0066cc;
        text-decoration: none;
    }
    .output-box a:hover {
        text-decoration: underline;
    }
</style>
""", unsafe_allow_html=True)


# --- Initialize Session State ---
if 'vector_store' not in st.session_state:
    embedding_dim = EMBEDDING_MODEL.get_sentence_embedding_dimension()
    st.session_state.vector_store = VectorStore(dimension=embedding_dim)

if "messages" not in st.session_state:
    st.session_state.messages = []

# This state is specific to the radiology tab's uploader
if 'radiology_vector_store' not in st.session_state:
    embedding_dim = EMBEDDING_MODEL.get_sentence_embedding_dimension()
    st.session_state.radiology_vector_store = VectorStore(dimension=embedding_dim)


# --- Helper Functions ---
def handle_pdf_upload(uploaded_files, vector_store_key):
    """Processes uploaded PDF files and adds them to the specified vector store."""
    if uploaded_files:
        with st.spinner("Processing uploaded PDFs..."):
            all_chunks = []
            for uploaded_file in uploaded_files:
                bytes_data = uploaded_file.read()
                chunks = parse_pdf(bytes_data, uploaded_file.name)
                if chunks:
                    all_chunks.extend(chunks)
            if all_chunks:
                st.session_state[vector_store_key].add_documents(all_chunks)
                st.success(f"Processed and indexed {len(uploaded_files)} PDF(s).")
            else:
                st.error("Could not extract text from the uploaded PDF(s).")

def format_output_as_html(source_name: str, answer: str, sources: list) -> str:
    """
    Creates an HTML string with a custom-styled box for the output.
    """
    # Start the styled container
    output_html = '<div class="output-box">'
    output_html += f"<p><strong>Answer based on {source_name}:</strong></p>"
    output_html += "<hr>"
    # Replace newlines in the answer with <br> for HTML display
    output_html += f"<p>{answer.replace(chr(10), '<br>')}</p>"
    output_html += "<hr>"
    
    if sources:
        output_html += f"<p><strong>Sources from {source_name}:</strong></p>"
        for i, source in enumerate(sources):
            title = source.get('title', 'N/A')
            link = source.get('link', '#')
            
            if source.get('type') == "PubMed":
                pmid = link.split('/')[-2] if link.endswith('/') else link.split('/')[-1]
                output_html += f"<p>{i+1}. {title}<br>   PubMed ID: {pmid} (<a href='{link}' target='_blank'>Link</a>)</p>"
            elif source.get('type') == "Web Search":
                output_html += f"<p>{i+1}. {title}<br>   <a href='{link}' target='_blank'>Link</a></p>"
            else: # For PDF
                output_html += f"<p>{i+1}. {title} ({link})</p>"
    else:
        output_html += f"<p>No sources were retrieved from {source_name}.</p>"
    
    output_html += '</div>'
    return output_html


# --- UI Layout ---
st.title("CliniSearch AI Medical System")
st.markdown("Advanced Multimodal Assistant for Medical Research & Radiological Analysis")

# --- Main Content Tabs ---
tab1, tab2, tab3 = st.tabs(["Medical Research & Q&A", "Radiology Image Analysis", "Clinical Test Mode"])

# --- TAB 1: Medical RAG Q&A ---
with tab1:
    col1, col2 = st.columns([3, 1]) # Main content area and a sidebar-like column
    
    with col2:
        st.subheader("Controls & Tools")
        st.markdown("---")
        use_web_search = st.toggle("Enable Web Search", value=True, help="Include real-time web search results.")
        use_pubmed = st.toggle("Enable PubMed", value=True, help="Include PubMed article abstracts.")
        use_uploaded_docs_tab1 = st.toggle("Enable Uploaded Docs", value=True, help="Include your uploaded PDFs.")
        
        st.markdown("---")
        st.subheader("Upload Documents for RAG")
        st.info("Upload research papers or reports (PDFs) to include them in your questions.")
        
        uploaded_files_tab1 = st.file_uploader("Upload PDFs for Q&A", type="pdf", accept_multiple_files=True, key="pdf_uploader_tab1")
        if uploaded_files_tab1:
            if 'processed_files_tab1' not in st.session_state or st.session_state.processed_files_tab1 != [f.name for f in uploaded_files_tab1]:
                handle_pdf_upload(uploaded_files_tab1, 'vector_store')
                st.session_state.processed_files_tab1 = [f.name for f in uploaded_files_tab1]

    with col1:
        st.header("Medical Research & Question Answering")
        for message in st.session_state.messages:
            with st.chat_message(message["role"]):
                st.markdown(message["content"], unsafe_allow_html=True)

        if prompt := st.chat_input("Ask a medical research question..."):
            st.session_state.messages.append({"role": "user", "content": prompt})
            with st.chat_message("user"):
                st.markdown(prompt)

            with st.chat_message("assistant"):
                final_outputs = []
                if use_web_search:
                    with st.spinner("Searching the web and synthesizing..."):
                        web_context, web_sources = asyncio.run(perform_rag(prompt, st.session_state.vector_store, use_web=True, use_pubmed=False))
                        if web_context:
                            web_synthesis_prompt = f"Based ONLY on Web Search context, answer: {prompt}"
                            web_answer = gemini_client.generate_text(web_synthesis_prompt)
                            final_outputs.append(format_output_as_html("Web Search", web_answer, web_sources))
                
                if use_pubmed:
                    with st.spinner("Searching PubMed and synthesizing..."):
                        pubmed_context, pubmed_sources = asyncio.run(perform_rag(prompt, st.session_state.vector_store, use_web=False, use_pubmed=True))
                        if pubmed_context:
                            pubmed_synthesis_prompt = f"Based ONLY on PubMed context, answer: {prompt}"
                            pubmed_answer = gemini_client.generate_text(pubmed_synthesis_prompt)
                            final_outputs.append(format_output_as_html("PubMed Search", pubmed_answer, pubmed_sources))

                if use_uploaded_docs_tab1:
                    with st.spinner("Searching uploaded documents and synthesizing..."):
                        doc_context, doc_sources = asyncio.run(perform_rag(prompt, st.session_state.vector_store, use_web=False, use_pubmed=False))
                        if doc_context and "No relevant information" not in doc_context:
                            doc_synthesis_prompt = f"Based ONLY on uploaded document context, answer: {prompt}"
                            doc_answer = gemini_client.generate_text(doc_synthesis_prompt)
                            final_outputs.append(format_output_as_html("Uploaded Documents", doc_answer, doc_sources))

                if not final_outputs:
                    st.warning("Please enable at least one data source to get an answer.")
                else:
                    full_response = "".join(final_outputs)
                    st.markdown(full_response, unsafe_allow_html=True)
                    st.session_state.messages.append({"role": "assistant", "content": full_response})

# --- TAB 2: Radiology Image Analysis ---
with tab2:
    st.header("Advanced Radiology Image Analysis")
    st.warning("IMPORTANT: This tool is for research and educational purposes only. It is NOT a substitute for professional medical advice or diagnosis.")
    
    col_rad1, col_rad2 = st.columns([1, 2])
    
    with col_rad1:
        st.subheader("Upload & Configuration")
        uploaded_image = st.file_uploader("1. Upload Medical Image", type=["jpg", "jpeg", "png"], key="image_uploader")
        
        # Model configuration
        st.markdown("---")
        st.subheader("Analysis Settings")
        confidence_threshold = st.slider("Confidence Threshold", 0.1, 0.9, 0.4, 0.05, help="Minimum confidence for disease detection")
        model_path = st.text_input("Model Path (optional)", placeholder="Path to trained model weights", help="Leave empty to use default model")
        
        # Context PDFs
        st.markdown("---")
        st.info("Upload relevant PDFs (patient reports, prior studies) for enhanced context.")
        uploaded_files_tab2 = st.file_uploader("2. Upload Context PDF(s)", type="pdf", accept_multiple_files=True, key="pdf_uploader_tab2")
        if uploaded_files_tab2:
            if 'processed_files_tab2' not in st.session_state or st.session_state.processed_files_tab2 != [f.name for f in uploaded_files_tab2]:
                handle_pdf_upload(uploaded_files_tab2, 'radiology_vector_store')
                st.session_state.processed_files_tab2 = [f.name for f in uploaded_files_tab2]

    with col_rad2:
        if uploaded_image:
            st.image(uploaded_image, caption="Image for Analysis", width=300)
            
            if st.button("Perform Complete AI Analysis", use_container_width=True, type="primary"):
                # Create temporary directory for outputs
                temp_dir = tempfile.mkdtemp()
                
                try:
                    with st.spinner("Running AI diagnosis model..."):
                        # Convert uploaded image to PIL
                        image_pil = Image.open(uploaded_image)
                        
                        # Run complete diagnosis pipeline
                        diagnosis_results = diagnose_and_visualize(
                            image_pil,
                            model_path=model_path if model_path else None,
                            output_dir=temp_dir,
                            threshold=confidence_threshold
                        )
                    
                    # Display AI Model Results
                    st.subheader("AI Model Diagnosis")
                    predicted_diseases = diagnosis_results['diagnosis']['predicted_diseases']
                    top_5_diseases = diagnosis_results['diagnosis']['top_5_diseases']
                    
                    # Display threshold-based predictions
                    if predicted_diseases:
                        st.success(f"Detected {len(predicted_diseases)} conditions above threshold ({confidence_threshold}):")
                        
                        # Create columns for horizontal display
                        num_diseases = len(predicted_diseases)
                        cols_per_row = min(3, num_diseases)  # Max 3 columns per row
                        
                        for i in range(0, num_diseases, cols_per_row):
                            cols = st.columns(cols_per_row)
                            for j in range(cols_per_row):
                                idx = i + j
                                if idx < num_diseases:
                                    disease = predicted_diseases[idx]
                                    with cols[j]:
                                        st.metric(
                                            label=f"{idx+1}. {disease['disease']}", 
                                            value=f"{disease['confidence']:.3f}",
                                            help=f"Confidence score for {disease['disease']}"
                                        )
                    else:
                        st.info("No conditions detected above the confidence threshold.")
                    
                    # Display Top 5 diseases
                    st.subheader("Top 5 Predicted Conditions")
                    st.info("The model's top 5 predictions regardless of threshold for comprehensive analysis.")
                    
                    cols = st.columns(5)
                    for i, disease in enumerate(top_5_diseases):
                        with cols[i]:
                            st.metric(
                                label=f"#{i+1} {disease['disease'][:12]}{'...' if len(disease['disease']) > 12 else ''}", 
                                value=f"{disease['confidence']:.3f}",
                                help=f"Rank {i+1}: {disease['disease']}"
                            )
                    
                    # Display Top 5 GradCAM Visualizations
                    st.subheader("Top 5 GradCAM Analysis")
                    st.info("Individual GradCAM visualizations for the top 5 predicted conditions with AI expert analysis for each.")
                    
                    gradcam_top5_results = diagnosis_results['gradcam_top5']
                    individual_analyses = {}
                    
                    for i in range(5):
                        disease_key = f"top{i+1}_{top_5_diseases[i]['disease']}"
                        if disease_key in gradcam_top5_results:
                            disease_info = gradcam_top5_results[disease_key]
                            
                            with st.expander(f"#{i+1} {disease_info['disease']} (Confidence: {disease_info['confidence']:.3f})", expanded=(i < 2)):
                                col1, col2 = st.columns([1, 2])
                                
                                with col1:
                                    gradcam_path = f"{temp_dir}/top{i+1}_{disease_info['disease']}_gradcam.png"
                                    if os.path.exists(gradcam_path):
                                        st.image(gradcam_path, 
                                                caption=f"GradCAM for {disease_info['disease']}", 
                                                use_container_width=True)
                                
                                with col2:
                                    with st.spinner(f"Getting PubMed evidence for {disease_info['disease']}..."):
                                        # Get PubMed information for this specific disease
                                        from utils.model_inference import get_pubmed_for_disease, analyze_individual_disease_with_pubmed
                                        
                                        pubmed_context, pubmed_sources = asyncio.run(get_pubmed_for_disease(
                                            disease_info['disease'],
                                            perform_rag,
                                            st.session_state.radiology_vector_store
                                        ))
                                        
                                        # Get concise analysis with PubMed citations
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
                                        st.markdown(individual_analysis)
                                        
                                        # Show PubMed sources for this disease
                                        if pubmed_sources:
                                            st.markdown("**References:**")
                                            for j, source in enumerate(pubmed_sources[:2]):
                                                pmid = source.get('link', '').split('/')[-1] if source.get('link') else 'N/A'
                                                st.markdown(f"[{j+1}] [PMID: {pmid}]({source.get('link', '#')})")
                                                st.caption(source.get('title', 'N/A'))
                    
                    # Display Attention Map
                    st.subheader("Model Attention Analysis")
                    st.info("The attention map shows overall areas where the model focused during analysis.")
                    attention_path = f"{temp_dir}/attention_analysis.png"
                    if os.path.exists(attention_path):
                        st.image(attention_path, caption="Model Attention Map", use_container_width=True)
                        print(f"Displaying attention map: {attention_path}")
                    else:
                        st.error(f"Attention map file not found: {attention_path}")

                    # Get context from uploaded PDFs if available
                    context_info = ""
                    if st.session_state.radiology_vector_store.index.ntotal > 0:
                        with st.spinner("Retrieving relevant context from uploaded documents..."):
                            context_query = f"Clinical context for chest X-ray showing: {', '.join([d['disease'] for d in top_5_diseases])}"
                            context, sources = asyncio.run(perform_rag(
                                context_query, 
                                st.session_state.radiology_vector_store, 
                                use_web=False, use_pubmed=False
                            ))
                            if context and "No relevant information" not in context:
                                context_info = f"\n\n**Additional Context from Uploaded Documents:**\n{context}"
                                if sources:
                                    context_info += "\n\n**Context Sources:**\n"
                                    for source in sources:
                                        context_info += f"- {source['title']} ({source['link']})\n"
                    
                    # Concise Conclusion from Gemini
                    st.subheader("Quick Clinical Summary")
                    with st.spinner("Generating concise summary..."):
                        from utils.model_inference import get_concise_conclusion_from_gemini
                        concise_conclusion = get_concise_conclusion_from_gemini(
                            gemini_client,
                            top_5_diseases,
                            individual_analyses,
                            image_pil
                        )
                        st.markdown(concise_conclusion)
                    
                    # Optional: Comprehensive Conclusion (in expander)
                    with st.expander("Detailed Comprehensive Analysis", expanded=False):
                        with st.spinner("Generating detailed analysis..."):
                            from utils.model_inference import get_comprehensive_conclusion_from_gemini
                            comprehensive_conclusion = get_comprehensive_conclusion_from_gemini(
                                gemini_client,
                                top_5_diseases,
                                individual_analyses,
                                image_pil
                            )
                            
                            # Add context if available
                            if context_info:
                                final_analysis = comprehensive_conclusion + context_info
                            else:
                                final_analysis = comprehensive_conclusion
                            
                            st.markdown(final_analysis)

                    # Download Results
                    st.subheader("Download Results")
                    if st.button("Prepare Results for Download"):
                        # Create a summary report
                        report_content = f"""# Radiology Analysis Report

## AI Model Diagnosis - Above Threshold
"""
                        if predicted_diseases:
                            for disease in predicted_diseases:
                                report_content += f"- **{disease['disease']}**: {disease['confidence']:.3f} confidence\n"
                        else:
                            report_content += "- No conditions detected above threshold\n"
                        
                        report_content += f"""

## Top 5 Predictions
"""
                        for i, disease in enumerate(top_5_diseases):
                            report_content += f"{i+1}. **{disease['disease']}**: {disease['confidence']:.3f} confidence\n"
                        
                        report_content += f"""

## Individual Disease Analyses
"""
                        for disease_key, analysis in individual_analyses.items():
                            disease_name = disease_key.split('_', 1)[1]
                            report_content += f"\n### {disease_name}\n{analysis}\n"
                        
                        report_content += f"""

## Expert Radiological Conclusion
{final_analysis}

## Technical Details
- Confidence Threshold: {confidence_threshold}
- Model: ChestXrayModel (EfficientNet-based)
- Diseases Evaluated: {', '.join(disease_labels)}

---
*Generated by CliniSearch AI Agent - For research and educational purposes only*
"""
                        
                        # Save report
                        report_path = f"{temp_dir}/analysis_report.md"
                        with open(report_path, 'w', encoding='utf-8') as f:
                            f.write(report_content)
                        
                        # Create download button for the report
                        with open(report_path, 'r', encoding='utf-8') as f:
                            st.download_button(
                                label="Download Complete Analysis Report",
                                data=f.read(),
                                file_name="radiology_analysis_report.md",
                                mime="text/markdown"
                            )
                
                except Exception as e:
                    st.error(f"Error during analysis: {str(e)}")
                    st.error("Please check your model path and ensure all dependencies are installed.")
                    
                    # Add debug information
                    if st.button("Debug Info"):
                        st.code(f"Error type: {type(e).__name__}")
                        st.code(f"Error details: {str(e)}")
                        import traceback
                        st.code(f"Traceback: {traceback.format_exc()}")
                
                finally:
                    # Clean up temporary directory
                    try:
                        shutil.rmtree(temp_dir)
                    except:
                        pass
        else:
            st.info("Please upload a medical image to begin analysis.")
            
            # Show example workflow
            with st.expander("How the Analysis Works"):
                st.markdown("""
                **Complete AI-Powered Radiology Analysis Pipeline:**
                
                1. **AI Model Diagnosis**
                   - Advanced deep learning model analyzes the uploaded image
                   - Generates confidence scores for 14 different chest conditions
                   - Uses EfficientNet backbone with attention mechanisms
                   - Shows both threshold-based predictions and top 5 conditions
                
                2. **Individual Disease Analysis**
                   - Creates GradCAM visualizations for top 5 predicted conditions
                   - Provides expert AI analysis for each condition individually
                   - Explains anatomical relevance and clinical significance
                
                3. **Attention Map Analysis**
                   - Reveals overall focus areas of the model
                   - Shows anatomical regions of interest
                   - Helps assess model behavior and potential biases
                
                4. **Context Integration**
                   - Incorporates information from uploaded PDFs
                   - Enhances analysis with patient history or prior studies
                   - Provides comprehensive clinical context
                
                5. **Expert Conclusion**
                   - Synthesizes all individual analyses into a comprehensive report
                   - Provides overall radiological impression and recommendations
                   - Offers risk stratification and next steps
                
                **Supported Conditions:**
                """)
                st.write(', '.join(disease_labels))

# --- TAB 3: Test Mode ---
with tab3:
    st.header("Test Mode with NIH Chest X-ray 14 Dataset")
    st.info("Test the AI model with real medical images from the NIH dataset and compare with ground truth labels.")
    
    # Load test samples
    dataset_path = "C:/chest-xray/nih_chestxray_14"
    
    if os.path.exists(dataset_path):
        from utils.test_data_loader import load_test_samples, get_sample_info, compare_predictions_with_ground_truth
        
        # Initialize test samples in session state
        if 'test_samples' not in st.session_state:
            with st.spinner("Loading test samples from NIH dataset..."):
                st.session_state.test_samples = load_test_samples(dataset_path, num_samples=10)
        
        if st.session_state.test_samples:
            col1, col2 = st.columns([1, 2])
            
            with col1:
                st.subheader("Model Configuration")
                confidence_threshold_test = st.slider("Confidence Threshold", 0.1, 0.9, 0.4, 0.05, 
                                                     help="Minimum confidence for disease detection", key="test_threshold")
                model_path_test = st.text_input("Model Path (optional)", placeholder="Path to trained model weights", 
                                               help="Leave empty to use default model", key="test_model_path")
                
                st.markdown("---")
                st.subheader("Test Samples")
                
                # Create selectbox with sample names
                sample_options = [f"{i+1}. {sample['primary_disease']} - {sample['image_name']}" 
                                for i, sample in enumerate(st.session_state.test_samples)]
                
                selected_idx = st.selectbox(
                    "Choose a test image:",
                    range(len(sample_options)),
                    format_func=lambda x: sample_options[x],
                    key="test_sample_selector"
                )
                
                if selected_idx is not None:
                    selected_sample = st.session_state.test_samples[selected_idx]
                    
                    # Display sample info
                    st.markdown("**Ground Truth Information:**")
                    st.markdown(get_sample_info(selected_sample))
                    
                    # Reload test samples button
                    if st.button("Reload Test Samples"):
                        st.session_state.test_samples = load_test_samples(dataset_path, num_samples=10)
                        st.rerun()
            
            with col2:
                if selected_idx is not None:
                    selected_sample = st.session_state.test_samples[selected_idx]
                    
                    # Display the selected image
                    st.subheader(f"Test Image: {selected_sample['image_name']}")
                    
                    try:
                        from PIL import Image
                        test_image = Image.open(selected_sample['image_path'])
                        st.image(test_image, caption=f"Ground Truth: {selected_sample['ground_truth']}", width=300)
                        
                        # Analysis button
                        if st.button("Run AI Analysis & Compare with Ground Truth", use_container_width=True, type="primary"):
                            # Create temporary directory for outputs
                            temp_dir = tempfile.mkdtemp()
                            
                            try:
                                with st.spinner("Running AI diagnosis..."):
                                    # Run complete diagnosis pipeline
                                    diagnosis_results = diagnose_and_visualize(
                                        test_image,
                                        model_path=model_path_test if model_path_test else None,
                                        output_dir=temp_dir,
                                        threshold=confidence_threshold_test
                                    )
                                
                                # Display AI Results vs Ground Truth
                                st.subheader("AI Predictions vs Ground Truth")
                                
                                predicted_diseases = diagnosis_results['diagnosis']['predicted_diseases']
                                top_5_diseases = diagnosis_results['diagnosis']['top_5_diseases']
                                
                                # Compare with ground truth
                                comparison = compare_predictions_with_ground_truth(
                                    predicted_diseases, selected_sample['ground_truth']
                                )
                                
                                # Display comparison results
                                col_gt, col_pred = st.columns(2)
                                
                                with col_gt:
                                    st.markdown("**Ground Truth:**")
                                    for label in comparison['ground_truth']:
                                        st.markdown(f"✓ {label}")
                                
                                with col_pred:
                                    st.markdown("**AI Predictions (Above Threshold):**")
                                    if predicted_diseases:
                                        # Display horizontally in smaller format
                                        pred_text = ", ".join([f"{disease['disease']} ({disease['confidence']:.3f})" 
                                                             for disease in predicted_diseases])
                                        st.markdown(pred_text)
                                    else:
                                        st.markdown("No diseases detected above threshold")
                                
                                # Accuracy Analysis
                                st.subheader("Accuracy Analysis")
                                
                                col_match, col_miss, col_fp = st.columns(3)
                                
                                with col_match:
                                    st.markdown("**Correct Matches:**")
                                    if comparison['matches']:
                                        for match in comparison['matches']:
                                            st.success(f"✓ {match}")
                                    else:
                                        st.info("No matches found")
                                
                                with col_miss:
                                    st.markdown("**Missed Diseases:**")
                                    if comparison['missed']:
                                        for missed in comparison['missed']:
                                            st.error(f"✗ {missed}")
                                    else:
                                        st.success("No diseases missed")
                                
                                with col_fp:
                                    st.markdown("**False Positives:**")
                                    if comparison['false_positives']:
                                        for fp in comparison['false_positives']:
                                            st.warning(f"! {fp}")
                                    else:
                                        st.success("No false positives")
                                
                                # Top 5 Predictions for Reference
                                st.subheader("Top 5 AI Predictions (All)")
                                for i, disease in enumerate(top_5_diseases):
                                    confidence_color = "🔵" if disease['confidence'] > 0.5 else "⚪" if disease['confidence'] > 0.3 else "⚫"
                                    match_indicator = "[MATCH]" if disease['disease'] in comparison['ground_truth'] else ""
                                    st.markdown(f"{i+1}. {confidence_color} **{disease['disease']}**: {disease['confidence']:.3f} {match_indicator}")
                                
                                # Brief Analysis Section
                                st.subheader("Quick Evidence-Based Analysis")
                                with st.spinner("Getting PubMed evidence..."):
                                    # Get PubMed for the primary disease
                                    primary_disease = selected_sample['primary_disease']
                                    if primary_disease != "No Finding":
                                        from utils.model_inference import get_pubmed_for_disease, analyze_individual_disease_with_pubmed
                                        
                                        pubmed_context, pubmed_sources = asyncio.run(get_pubmed_for_disease(
                                            primary_disease,
                                            perform_rag,
                                            st.session_state.radiology_vector_store
                                        ))
                                        
                                        # Find if this disease was in top predictions
                                        primary_prediction = None
                                        for disease in top_5_diseases:
                                            if disease['disease'] == primary_disease:
                                                primary_prediction = disease
                                                break
                                        
                                        if primary_prediction:
                                            st.success(f"AI correctly identified {primary_disease} with {primary_prediction['confidence']:.3f} confidence")
                                        else:
                                            st.error(f"AI missed {primary_disease} from ground truth")
                                        
                                        # Show brief PubMed analysis
                                        if pubmed_sources:
                                            st.markdown("**Scientific Evidence:**")
                                            for i, source in enumerate(pubmed_sources[:2]):
                                                pmid = source.get('link', '').split('/')[-1] if source.get('link') else 'N/A'
                                                st.markdown(f"[{i+1}] [PMID: {pmid}]({source.get('link', '#')})")
                                                st.caption(source.get('title', 'N/A')[:100] + "...")
                            
                            except Exception as e:
                                st.error(f"Error during analysis: {str(e)}")
                            
                            finally:
                                # Clean up temporary directory
                                try:
                                    shutil.rmtree(temp_dir)
                                except:
                                    pass
                    
                    except Exception as e:
                        st.error(f"Error loading test image: {str(e)}")
        else:
            st.error("No test samples could be loaded from the NIH dataset.")
    else:
        st.error(f"NIH Chest X-ray 14 dataset not found at: {dataset_path}")
        st.info("Please make sure the nih_chestxray_14 folder is in the correct location.")