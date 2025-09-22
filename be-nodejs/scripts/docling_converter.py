#!/usr/bin/env python3
"""
Docling PDF to Markdown Converter
This script converts PDF files to markdown using Docling library
"""

import sys
import json
import tempfile
import os
from pathlib import Path

def convert_pdf_to_markdown(pdf_file_path):
    """
    Convert PDF file to markdown using Docling
    
    Args:
        pdf_file_path (str): Path to PDF file
        
    Returns:
        dict: Result with success status and markdown content or error message
    """
    try:
        # Import docling
        from docling.document_converter import DocumentConverter
        from docling.datamodel.base_models import InputFormat
        
        # Get file size for logging
        file_size = os.path.getsize(pdf_file_path)
        print(f"Processing PDF file: {pdf_file_path} (Size: {file_size / 1024 / 1024:.2f} MB)", file=sys.stderr)
        
        # Initialize converter with optimized settings for large files
        converter = DocumentConverter()
        
        print("Starting PDF conversion...", file=sys.stderr)
        
        # Convert PDF to document
        result = converter.convert(pdf_file_path)
        
        print("PDF conversion completed, exporting to markdown...", file=sys.stderr)
        
        # Export to markdown
        markdown_content = result.document.export_to_markdown()
        
        print(f"Markdown export completed. Content length: {len(markdown_content)} characters", file=sys.stderr)
        
        return {
            "success": True,
            "markdown": markdown_content,
            "error": None
        }
        
    except ImportError as e:
        return {
            "success": False,
            "markdown": None,
            "error": f"Docling not installed. Please run: pip install docling"
        }
    except Exception as e:
        print(f"Conversion error: {str(e)}", file=sys.stderr)
        return {
            "success": False,
            "markdown": None,
            "error": f"Conversion failed: {str(e)}"
        }

def main():
    """Main function to handle command line arguments"""
    if len(sys.argv) != 2:
        print(json.dumps({
            "success": False,
            "markdown": None,
            "error": "Usage: python docling_converter.py <pdf_file_path>"
        }))
        sys.exit(1)
    
    pdf_file_path = sys.argv[1]
    
    # Check if file exists
    if not os.path.exists(pdf_file_path):
        print(json.dumps({
            "success": False,
            "markdown": None,
            "error": f"File not found: {pdf_file_path}"
        }))
        sys.exit(1)
    
    result = convert_pdf_to_markdown(pdf_file_path)
    
    # Output result as JSON
    print(json.dumps(result))

if __name__ == "__main__":
    main()
