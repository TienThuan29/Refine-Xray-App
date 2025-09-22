@echo off
echo Fixing pip and installing Docling...

REM Try to fix pip first
echo Attempting to fix pip installation...
python -m ensurepip --upgrade --user

REM Try to install docling directly
echo Installing Docling directly...
python -m pip install docling --user

if errorlevel 1 (
    echo Failed with --user flag, trying without...
    python -m pip install docling
    if errorlevel 1 (
        echo All installation methods failed.
        echo Please try manually:
        echo 1. Download get-pip.py from https://bootstrap.pypa.io/get-pip.py
        echo 2. Run: python get-pip.py
        echo 3. Then run: pip install docling
        pause
        exit /b 1
    )
)

echo Installation completed!
echo Testing Docling installation...
python -c "from docling.document_converter import DocumentConverter; print('Docling installed successfully!')"

if errorlevel 1 (
    echo Docling installation test failed.
    echo Please check the installation manually.
) else (
    echo Docling is working correctly!
)

pause
