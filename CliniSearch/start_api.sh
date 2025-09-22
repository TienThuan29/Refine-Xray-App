#!/bin/bash

# CliniSearch API Startup Script
# This script starts the CliniSearch API server with proper configuration

echo "CliniSearch AI Medical System API"
echo "================================="

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    echo "Error: Python 3 is not installed or not in PATH"
    exit 1
fi

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "Installing dependencies..."
pip install -r requirements.txt

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "Warning: .env file not found. Creating template..."
    cat > .env << EOF
# CliniSearch API Environment Variables
GOOGLE_API_KEY=your_gemini_api_key_here
ANTHROPIC_API_KEY=your_claude_api_key_here
EOF
    echo "Please edit .env file and add your API keys before running the server."
    exit 1
fi

# Check if API keys are set
if ! grep -q "your_.*_api_key_here" .env; then
    echo "API keys appear to be configured."
else
    echo "Warning: Please configure your API keys in .env file"
    echo "Required: GOOGLE_API_KEY"
    echo "Optional: ANTHROPIC_API_KEY"
fi

# Start the server
echo "Starting CliniSearch API server..."
echo "API Documentation: http://localhost:8000/docs"
echo "Health Check: http://localhost:8000/health"
echo "Press Ctrl+C to stop the server"
echo ""

python deploy_api.py --mode local --host 0.0.0.0 --port 8000
