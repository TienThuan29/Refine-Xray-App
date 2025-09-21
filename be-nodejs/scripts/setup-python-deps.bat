@echo off
echo Setting up Python dependencies for Docling...

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo Python is not installed. Please install Python 3.8 or higher.
    pause
    exit /b 1
)

REM Check Python version
for /f "tokens=2" %%i in ('python --version 2^>^&1') do set python_version=%%i
echo Python version: %python_version%

REM Check if pip is available
pip --version >nul 2>&1
if errorlevel 1 (
    echo pip not found. Installing pip...
    python -m ensurepip --upgrade
    if errorlevel 1 (
        echo Failed to install pip. Please install pip manually.
        pause
        exit /b 1
    )
)

REM Install requirements
echo Installing Docling...
pip install -r ..\requirements.txt

if errorlevel 1 (
    echo Failed to install dependencies. Trying with python -m pip...
    python -m pip install -r ..\requirements.txt
    if errorlevel 1 (
        echo Failed to install dependencies with both pip and python -m pip.
        echo Please check your Python installation and try manually:
        echo pip install docling
        pause
        exit /b 1
    )
)

echo Python dependencies setup completed!
echo You can now test Docling by running:
echo python -c "from docling.document_converter import DocumentConverter; print('Docling installed successfully!')"
pause
