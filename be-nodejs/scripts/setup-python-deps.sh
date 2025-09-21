#!/bin/bash

# Setup Python dependencies for Docling
echo "Setting up Python dependencies for Docling..."

# Check if Python is installed
if ! command -v python &> /dev/null; then
    echo "Python is not installed. Please install Python 3.8 or higher."
    exit 1
fi

# Check Python version
python_version=$(python -c 'import sys; print(".".join(map(str, sys.version_info[:2])))')
echo "Python version: $python_version"

# Install pip if not available
if ! command -v pip &> /dev/null; then
    echo "Installing pip..."
    python -m ensurepip --upgrade
    if [ $? -ne 0 ]; then
        echo "Failed to install pip. Please install pip manually."
        exit 1
    fi
fi

# Install requirements
echo "Installing Docling..."
pip install -r ../requirements.txt

if [ $? -ne 0 ]; then
    echo "Failed to install dependencies. Trying with python -m pip..."
    python -m pip install -r ../requirements.txt
    if [ $? -ne 0 ]; then
        echo "Failed to install dependencies with both pip and python -m pip."
        echo "Please check your Python installation and try manually:"
        echo "pip install docling"
        exit 1
    fi
fi

echo "Python dependencies setup completed!"
echo "You can now test Docling by running:"
echo 'python -c "from docling.document_converter import DocumentConverter; print(\"Docling installed successfully!\")"'
