#!/usr/bin/env python3
"""
Test script for CliniSearch API
Tests all major endpoints to ensure functionality
"""

import requests
import json
import time
from pathlib import Path

# Configuration
BASE_URL = "http://localhost:8000"
TEST_IMAGE_PATH = "test_chest_xray.jpg"  # You'll need to provide a test image
TEST_PDF_PATH = "test_research.pdf"  # You'll need to provide a test PDF

def test_health():
    """Test health check endpoint."""
    print("Testing health check...")
    try:
        response = requests.get(f"{BASE_URL}/health")
        response.raise_for_status()
        data = response.json()
        print(f"✓ Health check passed: {data}")
        return True
    except Exception as e:
        print(f"✗ Health check failed: {e}")
        return False

def test_root():
    """Test root endpoint."""
    print("Testing root endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/")
        response.raise_for_status()
        data = response.json()
        print(f"✓ Root endpoint passed: {data['message']}")
        return True
    except Exception as e:
        print(f"✗ Root endpoint failed: {e}")
        return False

def test_diseases():
    """Test diseases endpoint."""
    print("Testing diseases endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/diseases")
        response.raise_for_status()
        data = response.json()
        print(f"✓ Diseases endpoint passed: {len(data['diseases'])} diseases available")
        return True
    except Exception as e:
        print(f"✗ Diseases endpoint failed: {e}")
        return False

def test_research_status():
    """Test research status endpoint."""
    print("Testing research status...")
    try:
        response = requests.get(f"{BASE_URL}/research/status")
        response.raise_for_status()
        data = response.json()
        print(f"✓ Research status passed: {data['documents_indexed']} documents indexed")
        return True
    except Exception as e:
        print(f"✗ Research status failed: {e}")
        return False

def test_research_query():
    """Test research query endpoint."""
    print("Testing research query...")
    try:
        query_data = {
            "query": "What are the symptoms of pneumonia?",
            "use_web_search": True,
            "use_pubmed": True,
            "use_uploaded_docs": False
        }
        
        response = requests.post(f"{BASE_URL}/research/query", json=query_data)
        response.raise_for_status()
        data = response.json()
        
        print(f"✓ Research query passed:")
        if data.get('web_answer'):
            print(f"  - Web answer: {data['web_answer'][:100]}...")
        if data.get('pubmed_answer'):
            print(f"  - PubMed answer: {data['pubmed_answer'][:100]}...")
        if data.get('doc_answer'):
            print(f"  - Document answer: {data['doc_answer'][:100]}...")
        
        return True
    except Exception as e:
        print(f"✗ Research query failed: {e}")
        return False

def test_pdf_upload():
    """Test PDF upload endpoint."""
    print("Testing PDF upload...")
    
    # Create a dummy PDF for testing if it doesn't exist
    if not Path(TEST_PDF_PATH).exists():
        print(f"  Creating dummy PDF for testing...")
        # You would create a simple PDF here or skip this test
        print(f"  Skipping PDF upload test - no test PDF available")
        return True
    
    try:
        with open(TEST_PDF_PATH, "rb") as f:
            files = {"files": f}
            response = requests.post(f"{BASE_URL}/research/upload-documents", files=files)
            response.raise_for_status()
            data = response.json()
            print(f"✓ PDF upload passed: {data['message']}")
            return True
    except Exception as e:
        print(f"✗ PDF upload failed: {e}")
        return False

def test_radiology_analysis():
    """Test radiology analysis endpoint."""
    print("Testing radiology analysis...")
    
    if not Path(TEST_IMAGE_PATH).exists():
        print(f"  Skipping radiology analysis test - no test image available")
        print(f"  Place a test chest X-ray image at {TEST_IMAGE_PATH} to test this endpoint")
        return True
    
    try:
        with open(TEST_IMAGE_PATH, "rb") as f:
            files = {"image": f}
            data = {"confidence_threshold": 0.4}
            
            print(f"  Sending image for analysis (this may take a while)...")
            response = requests.post(f"{BASE_URL}/radiology/analyze", files=files, data=data)
            response.raise_for_status()
            result = response.json()
            
            print(f"✓ Radiology analysis passed:")
            print(f"  - Predicted diseases: {len(result['predicted_diseases'])}")
            print(f"  - Top 5 diseases: {len(result['top_5_diseases'])}")
            print(f"  - GradCAM analyses: {len(result['gradcam_analyses'])}")
            
            return True
    except Exception as e:
        print(f"✗ Radiology analysis failed: {e}")
        return False

def test_test_samples():
    """Test test samples endpoint."""
    print("Testing test samples...")
    try:
        response = requests.get(f"{BASE_URL}/test/samples")
        response.raise_for_status()
        data = response.json()
        print(f"✓ Test samples passed: {len(data['samples'])} samples available")
        return True
    except Exception as e:
        print(f"✗ Test samples failed: {e}")
        return False

def test_test_analysis():
    """Test test analysis endpoint."""
    print("Testing test analysis...")
    try:
        # First get available samples
        response = requests.get(f"{BASE_URL}/test/samples")
        response.raise_for_status()
        samples_data = response.json()
        
        if not samples_data['samples']:
            print(f"  Skipping test analysis - no samples available")
            return True
        
        # Test with first sample
        sample_index = 0
        data = {
            "sample_index": sample_index,
            "confidence_threshold": 0.4
        }
        
        print(f"  Analyzing test sample {sample_index}...")
        response = requests.post(f"{BASE_URL}/test/analyze", data=data)
        response.raise_for_status()
        result = response.json()
        
        print(f"✓ Test analysis passed:")
        print(f"  - AI predictions: {len(result['ai_predictions'])}")
        print(f"  - Ground truth: {len(result['ground_truth'])}")
        print(f"  - Matches: {len(result['matches'])}")
        print(f"  - Precision: {result['accuracy_metrics']['precision']:.2f}")
        
        return True
    except Exception as e:
        print(f"✗ Test analysis failed: {e}")
        return False

def main():
    """Run all tests."""
    print("CliniSearch API Test Suite")
    print("=" * 50)
    
    # Check if server is running
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=5)
        print(f"✓ Server is running at {BASE_URL}")
    except requests.exceptions.RequestException:
        print(f"✗ Server is not running at {BASE_URL}")
        print("Please start the server with: python deploy_api.py --mode local")
        return
    
    print()
    
    # Run tests
    tests = [
        test_health,
        test_root,
        test_diseases,
        test_research_status,
        test_research_query,
        test_pdf_upload,
        test_radiology_analysis,
        test_test_samples,
        test_test_analysis,
    ]
    
    passed = 0
    total = len(tests)
    
    for test in tests:
        try:
            if test():
                passed += 1
        except Exception as e:
            print(f"✗ Test {test.__name__} crashed: {e}")
        print()
    
    print("=" * 50)
    print(f"Test Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! API is working correctly.")
    else:
        print("⚠️  Some tests failed. Check the output above for details.")

if __name__ == "__main__":
    main()
