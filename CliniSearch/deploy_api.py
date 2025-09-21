#!/usr/bin/env python3
"""
Deployment script for CliniSearch API
Supports both local development and serverless deployment
"""

import os
import sys
import subprocess
import argparse
from pathlib import Path

def check_dependencies():
    """Check if all required dependencies are installed."""
    try:
        import fastapi
        import uvicorn
        import torch
        import PIL
        print("✓ All dependencies are installed")
        return True
    except ImportError as e:
        print(f"✗ Missing dependency: {e}")
        print("Please run: pip install -r requirements.txt")
        return False

def run_local_server(host="0.0.0.0", port=8000, reload=True):
    """Run the API server locally."""
    if not check_dependencies():
        sys.exit(1)
    
    print(f"Starting CliniSearch API server on {host}:{port}")
    print("API Documentation available at: http://localhost:8000/docs")
    
    cmd = [
        "uvicorn", 
        "api:app", 
        "--host", host, 
        "--port", str(port)
    ]
    
    if reload:
        cmd.append("--reload")
    
    try:
        subprocess.run(cmd, check=True)
    except KeyboardInterrupt:
        print("\nServer stopped by user")
    except subprocess.CalledProcessError as e:
        print(f"Error starting server: {e}")
        sys.exit(1)

def create_dockerfile():
    """Create a Dockerfile for containerized deployment."""
    dockerfile_content = """FROM python:3.9-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \\
    libgl1-mesa-glx \\
    libglib2.0-0 \\
    libsm6 \\
    libxext6 \\
    libxrender-dev \\
    libgomp1 \\
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Expose port
EXPOSE 8000

# Run the application
CMD ["uvicorn", "api:app", "--host", "0.0.0.0", "--port", "8000"]
"""
    
    with open("Dockerfile", "w") as f:
        f.write(dockerfile_content)
    
    print("✓ Created Dockerfile for containerized deployment")

def create_vercel_config():
    """Create Vercel configuration for serverless deployment."""
    vercel_config = {
        "version": 2,
        "builds": [
            {
                "src": "api.py",
                "use": "@vercel/python"
            }
        ],
        "routes": [
            {
                "src": "/(.*)",
                "dest": "api.py"
            }
        ]
    }
    
    import json
    with open("vercel.json", "w") as f:
        json.dump(vercel_config, f, indent=2)
    
    print("✓ Created vercel.json for Vercel deployment")

def create_aws_lambda_handler():
    """Create AWS Lambda handler for serverless deployment."""
    lambda_handler = """import os
import sys
from pathlib import Path

# Add the current directory to Python path
sys.path.insert(0, str(Path(__file__).parent))

from api import app
from mangum import Mangum

# Create the Lambda handler
handler = Mangum(app)

# For local testing
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
"""
    
    with open("lambda_handler.py", "w") as f:
        f.write(lambda_handler)
    
    print("✓ Created lambda_handler.py for AWS Lambda deployment")

def main():
    parser = argparse.ArgumentParser(description="Deploy CliniSearch API")
    parser.add_argument("--mode", choices=["local", "docker", "vercel", "lambda"], 
                       default="local", help="Deployment mode")
    parser.add_argument("--host", default="0.0.0.0", help="Host to bind to")
    parser.add_argument("--port", type=int, default=8000, help="Port to bind to")
    parser.add_argument("--no-reload", action="store_true", help="Disable auto-reload")
    
    args = parser.parse_args()
    
    if args.mode == "local":
        run_local_server(args.host, args.port, not args.no_reload)
    elif args.mode == "docker":
        create_dockerfile()
        print("Run: docker build -t clinisearch-api .")
        print("Run: docker run -p 8000:8000 clinisearch-api")
    elif args.mode == "vercel":
        create_vercel_config()
        print("Run: vercel --prod")
    elif args.mode == "lambda":
        create_aws_lambda_handler()
        print("Package the application and deploy to AWS Lambda")

if __name__ == "__main__":
    main()
