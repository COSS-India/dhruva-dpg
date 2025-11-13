#!/bin/bash

# Simple script to install dependencies for migrate_data.py
# This can be run manually if the main script has issues

set -e

echo "🔧 Installing migration dependencies..."

# Check if we're in a virtual environment
if [ -z "$VIRTUAL_ENV" ]; then
    echo "⚠️  Not in a virtual environment. Creating one..."
    python3 -m venv migration_venv
    source migration_venv/bin/activate
    echo "✅ Virtual environment activated"
fi

# Upgrade pip and build tools
echo "📦 Upgrading pip, setuptools, and wheel..."
pip install --upgrade pip setuptools wheel

# Install system dependencies if needed
echo "📦 Checking system dependencies..."
if ! python3 -c "import psycopg2" 2>/dev/null; then
    echo "⚠️  psycopg2 not found. Installing..."
    
    # Try psycopg2-binary first (no system deps needed)
    echo "   Trying psycopg2-binary..."
    if pip install --no-cache-dir psycopg2-binary 2>&1; then
        if python3 -c "import psycopg2" 2>/dev/null; then
            echo "✅ psycopg2-binary installed successfully"
        else
            echo "❌ psycopg2-binary installation failed"
            echo ""
            echo "💡 Solution: Install system dependencies first:"
            echo "   sudo apt update"
            echo "   sudo apt install -y libpq-dev python3-dev build-essential"
            echo "   Then run this script again, or use: pip install psycopg2"
            exit 1
        fi
    else
        echo "❌ Failed to install psycopg2-binary"
        echo ""
        echo "💡 Solution: Install system dependencies:"
        echo "   sudo apt update"
        echo "   sudo apt install -y libpq-dev python3-dev build-essential"
        echo "   Then run: pip install psycopg2"
        exit 1
    fi
else
    echo "✅ psycopg2 already installed"
fi

# Install other dependencies
echo "📦 Installing pymongo and python-dotenv..."
pip install pymongo==4.3.3 python-dotenv==0.21.0

# Verify all packages
echo "✅ Verifying installation..."
python3 -c "import pymongo; import psycopg2; import dotenv; print('✅ All packages imported successfully')"

echo ""
echo "✅ All dependencies installed successfully!"
echo ""
echo "You can now run: python3 migrate_data.py"

