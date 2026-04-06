# Setup script for Xref (Windows PowerShell)

$ErrorActionPreference = "Stop"

Write-Host "Installing Xref dependencies..." -ForegroundColor Green

# Check for Python 3
try {
    $pythonVersion = python --version 2>&1
    if ($pythonVersion -notmatch "Python 3") {
        throw "Python 3 required"
    }
} catch {
    Write-Host "Error: Python 3 is required but not found." -ForegroundColor Red
    Write-Host "Install Python 3.8 or later and try again."
    exit 1
}

# Install core dependencies
Write-Host "Installing core Python packages..."
python -m pip install --upgrade pip
python -m pip install -r requirements.txt --no-deps
python -m pip install python-docx pymupdf beautifulsoup4 requests lxml jinja2

# Install Playwright for web support if --web flag is provided
if ($args -contains "--web") {
    Write-Host "Installing Playwright for web URL support..."
    python -m pip install playwright
    python -m playwright install chromium
    Write-Host "Web support enabled." -ForegroundColor Green
} else {
    Write-Host "Skipping Playwright (web URL support). To enable: .\setup.ps1 --web"
}

Write-Host ""
Write-Host "✓ Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "To verify: python skills/xref/tools/xref.py setup-check"
