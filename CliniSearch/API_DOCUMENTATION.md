# CliniSearch AI Medical System API Documentation

## Overview

The CliniSearch API is a serverless FastAPI application that provides advanced medical research and radiological analysis capabilities. It converts the original Streamlit application into a RESTful API suitable for serverless deployment.

## Features

- **Medical Research & Q&A**: Web search, PubMed integration, and document-based RAG
- **Radiology Image Analysis**: AI-powered chest X-ray analysis with GradCAM visualizations
- **Test Mode**: Validation against NIH Chest X-ray 14 dataset
- **Document Processing**: PDF upload and processing for context enhancement

## Quick Start

### Local Development

```bash
# Install dependencies
pip install -r requirements.txt


# Activate env
source /home/tienthuan29/workspaces/projects/AiResearch/Diffusion-based-IAD/.venv/bin/activate

# Run the API server
python deploy_api.py --mode local

# Or directly with uvicorn
uvicorn api:app --host 0.0.0.0 --port 8000 --reload
```

### Serverless Deployment

```bash
# Vercel
python deploy_api.py --mode vercel
vercel --prod

# AWS Lambda
python deploy_api.py --mode lambda
# Package and deploy to Lambda

# Docker
python deploy_api.py --mode docker
docker build -t clinisearch-api .
docker run -p 8000:8000 clinisearch-api
```

## API Endpoints

### Base URL
- Local: `http://localhost:8000`
- Production: Your deployed URL

### Authentication
Currently no authentication required. Add API keys or JWT tokens for production use.

## Core Endpoints

### 1. Health Check

**GET** `/health`

Check API health and Gemini availability.

**Response:**
```json
{
  "status": "healthy",
  "gemini_available": true
}
```

### 2. Medical Research & Q&A

#### Upload Research Documents

**POST** `/research/upload-documents`

Upload PDF documents for research context.

**Request:**
- `files`: List of PDF files (multipart/form-data)

**Response:**
```json
{
  "message": "Successfully processed and indexed 2 PDF(s)",
  "chunks_added": 45
}
```

#### Research Query

**POST** `/research/query`

Perform medical research query with multiple data sources.

**Request Body:**
```json
{
  "query": "What are the latest treatments for pneumonia?",
  "use_web_search": true,
  "use_pubmed": true,
  "use_uploaded_docs": true
}
```

**Response:**
```json
{
  "web_answer": "Based on web search...",
  "web_sources": [
    {
      "type": "Web Search",
      "title": "Pneumonia Treatment Guidelines",
      "link": "https://example.com"
    }
  ],
  "pubmed_answer": "Based on PubMed research...",
  "pubmed_sources": [
    {
      "type": "PubMed",
      "title": "Recent Advances in Pneumonia Treatment",
      "link": "https://pubmed.ncbi.nlm.nih.gov/12345678/"
    }
  ],
  "doc_answer": "Based on uploaded documents...",
  "doc_sources": [
    {
      "type": "PDF Document",
      "title": "PDF: research_paper.pdf",
      "link": "Page ~5"
    }
  ]
}
```

### 3. Radiology Image Analysis

#### Upload Context Documents

**POST** `/radiology/upload-context-documents`

Upload PDF documents for radiology context.

**Request:**
- `files`: List of PDF files (multipart/form-data)

#### Analyze Radiology Image

**POST** `/radiology/analyze`

Perform complete AI analysis on radiology image.

**Request:**
- `image`: Medical image file (multipart/form-data)
- `confidence_threshold`: Float (0.1-0.9, default: 0.4)
- `model_path`: Optional custom model path

**Response:**
```json
{
  "predicted_diseases": [
    {
      "disease": "Pneumonia",
      "confidence": 0.85
    }
  ],
  "top_5_diseases": [
    {
      "disease": "Pneumonia",
      "confidence": 0.85
    },
    {
      "disease": "Consolidation",
      "confidence": 0.72
    }
  ],
  "gradcam_analyses": {
    "top1_Pneumonia": "base64_encoded_image",
    "top2_Consolidation": "base64_encoded_image"
  },
  "attention_map": "base64_encoded_image",
  "individual_analyses": {
    "top1_Pneumonia": "Detailed analysis with PubMed citations...",
    "top2_Consolidation": "Detailed analysis with PubMed citations..."
  },
  "concise_conclusion": "Quick clinical summary...",
  "comprehensive_analysis": "Detailed comprehensive analysis..."
}
```

### 4. Test Mode

#### Get Test Samples

**GET** `/test/samples`

Get available test samples from NIH dataset.

**Response:**
```json
{
  "samples": [
    {
      "index": 0,
      "image_name": "00000001_000.png",
      "primary_disease": "Pneumonia",
      "ground_truth": ["Pneumonia", "Consolidation"]
    }
  ]
}
```

#### Analyze Test Sample

**POST** `/test/analyze`

Analyze a test sample and compare with ground truth.

**Request:**
- `sample_index`: Integer (0-based index)
- `confidence_threshold`: Float (0.1-0.9, default: 0.4)
- `model_path`: Optional custom model path

**Response:**
```json
{
  "ai_predictions": [
    {
      "disease": "Pneumonia",
      "confidence": 0.85
    }
  ],
  "ground_truth": ["Pneumonia", "Consolidation"],
  "matches": ["Pneumonia"],
  "missed": ["Consolidation"],
  "false_positives": [],
  "accuracy_metrics": {
    "precision": 1.0,
    "recall": 0.5,
    "f1_score": 0.67,
    "total_ground_truth": 2,
    "total_predictions": 1,
    "matches": 1,
    "missed": 1,
    "false_positives": 0
  }
}
```

### 5. Utility Endpoints

#### Get Disease Labels

**GET** `/diseases`

Get list of supported disease labels.

**Response:**
```json
{
  "diseases": [
    "Atelectasis", "Consolidation", "Infiltration", 
    "Pneumothorax", "Edema", "Emphysema", 
    "Fibrosis", "Effusion", "Pneumonia", 
    "Pleural_Thickening", "Cardiomegaly", 
    "Nodule", "Mass", "Hernia"
  ]
}
```

#### Get Research Status

**GET** `/research/status`

Get status of research vector store.

**Response:**
```json
{
  "documents_indexed": 45,
  "embedding_dimension": 384
}
```

#### Get Radiology Status

**GET** `/radiology/status`

Get status of radiology vector store.

**Response:**
```json
{
  "documents_indexed": 12,
  "embedding_dimension": 384
}
```

## Error Handling

The API uses standard HTTP status codes:

- `200`: Success
- `400`: Bad Request (invalid input)
- `404`: Not Found (resource not found)
- `500`: Internal Server Error

Error responses include a JSON object with error details:

```json
{
  "detail": "Error message describing what went wrong"
}
```

## Rate Limiting

Currently no rate limiting implemented. Add rate limiting middleware for production use.

## CORS

CORS is enabled for all origins. Configure appropriately for production:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://yourdomain.com"],
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)
```

## Environment Variables

Required environment variables:

```bash
GOOGLE_API_KEY=your_gemini_api_key
ANTHROPIC_API_KEY=your_claude_api_key  # Optional
```

## Model Requirements

The radiology analysis requires:

1. **Pre-trained model weights** (EfficientNet-based)
2. **NIH Chest X-ray 14 dataset** for test mode (optional)
3. **Sufficient memory** for model inference

## Performance Considerations

- **Memory**: Radiology analysis requires significant RAM for model inference
- **Storage**: Temporary files are created during analysis and cleaned up
- **Cold starts**: Serverless functions may have cold start delays
- **Timeouts**: Some operations may take 30+ seconds

## Security Considerations

1. **File uploads**: Validate file types and sizes
2. **API keys**: Store securely, never expose in client code
3. **CORS**: Configure appropriate origins
4. **Rate limiting**: Implement to prevent abuse
5. **Authentication**: Add for production use

## Monitoring and Logging

Add logging and monitoring for production:

```python
import logging
from fastapi.middleware.cors import CORSMiddleware

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Add request logging middleware
@app.middleware("http")
async def log_requests(request, call_next):
    logger.info(f"Request: {request.method} {request.url}")
    response = await call_next(request)
    logger.info(f"Response: {response.status_code}")
    return response
```

## Example Usage

### Python Client

```python
import requests
import json

# Upload documents
with open("research_paper.pdf", "rb") as f:
    files = {"files": f}
    response = requests.post("http://localhost:8000/research/upload-documents", files=files)
    print(response.json())

# Research query
query_data = {
    "query": "What are the symptoms of pneumonia?",
    "use_web_search": True,
    "use_pubmed": True,
    "use_uploaded_docs": True
}
response = requests.post("http://localhost:8000/research/query", json=query_data)
print(response.json())

# Radiology analysis
with open("chest_xray.jpg", "rb") as f:
    files = {"image": f}
    data = {"confidence_threshold": 0.4}
    response = requests.post("http://localhost:8000/radiology/analyze", files=files, data=data)
    print(response.json())
```

### JavaScript/Node.js Client

```javascript
const FormData = require('form-data');
const fs = require('fs');
const axios = require('axios');

// Upload documents
const form = new FormData();
form.append('files', fs.createReadStream('research_paper.pdf'));

axios.post('http://localhost:8000/research/upload-documents', form, {
  headers: form.getHeaders()
}).then(response => {
  console.log(response.data);
});

// Research query
const queryData = {
  query: "What are the symptoms of pneumonia?",
  use_web_search: true,
  use_pubmed: true,
  use_uploaded_docs: true
};

axios.post('http://localhost:8000/research/query', queryData)
  .then(response => {
    console.log(response.data);
  });
```

## Support

For issues and questions:
1. Check the API documentation at `/docs` (Swagger UI)
2. Review error messages in responses
3. Check server logs for detailed error information
4. Ensure all dependencies are properly installed
5. Verify environment variables are set correctly
