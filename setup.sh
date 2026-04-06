#!/usr/bin/env bash
# Setup script for Xref (macOS/Linux)

set -e

echo "Installing Xref dependencies..."

# Check for Python 3
if ! command -v python3 &> /dev/null; then
    echo "Error: Python 3 is required but not found."
    echo "Install Python 3.8 or later and try again."
    exit 1
fi

# Install core dependencies
echo "Installing core Python packages..."
python3 -m pip install --upgrade pip
python3 -m pip install -r requirements.txt --no-deps
python3 -m pip install python-docx pymupdf beautifulsoup4 requests lxml jinja2

# Install Playwright for web support if --web flag is provided
if [[ "$1" == "--web" ]]; then
    echo "Installing Playwright for web URL support..."
    python3 -m pip install playwright
    python3 -m playwright install chromium
    echo "Web support enabled."
else
    echo "Skipping Playwright (web URL support). To enable: bash setup.sh --web"
fi

echo ""
echo "✓ Setup complete!"
echo ""
echo "To verify: python3 skills/xref/tools/xref.py setup-check"
