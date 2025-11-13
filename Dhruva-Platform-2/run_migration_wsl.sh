#!/bin/bash

# WSL Setup and Migration Script for migrate_data.py
# This script sets up the environment and runs the migration script in WSL

# Don't exit on error immediately - we want to handle psycopg2 installation gracefully
set +e  # Allow script to continue on errors for psycopg2 installation
set -u  # Exit on undefined variables
set -o pipefail  # Exit on pipe failures

echo "🚀 WSL Migration Setup for migrate_data.py"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Step 1: Check Python 3 installation
echo -e "\n📋 Step 1: Checking Python 3 installation..."
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version)
    print_status "Python 3 found: $PYTHON_VERSION"
else
    print_error "Python 3 is not installed"
    echo "Install Python 3 with: sudo apt update && sudo apt install python3 python3-pip python3-venv"
    exit 1
fi

# Step 2: Check if virtual environment exists, create if not
echo -e "\n📋 Step 2: Setting up Python virtual environment..."
VENV_DIR="migration_venv"

if [ ! -d "$VENV_DIR" ]; then
    print_info "Creating virtual environment..."
    python3 -m venv $VENV_DIR
    print_status "Virtual environment created"
else
    print_status "Virtual environment already exists"
fi

# Step 2.5: Check system dependencies
echo -e "\n📋 Step 2.5: Checking system dependencies..."
HAS_LIBPQ_DEV=0
if dpkg -l 2>/dev/null | grep -q "^ii.*libpq-dev"; then
    HAS_LIBPQ_DEV=1
    print_status "PostgreSQL development libraries found"
else
    print_warning "PostgreSQL development libraries (libpq-dev) not found"
    print_info "These may be needed for psycopg2 installation"
    print_info "If psycopg2 installation fails, install them with:"
    echo "  sudo apt update && sudo apt install -y libpq-dev python3-dev build-essential"
fi

# Step 3: Activate virtual environment and install dependencies
echo -e "\n📋 Step 3: Installing Python dependencies..."
source $VENV_DIR/bin/activate

# Upgrade pip, setuptools, and wheel
print_info "Upgrading pip, setuptools, and wheel..."
pip install --upgrade pip setuptools wheel --quiet

# Install required packages with better error handling
print_info "Installing required packages..."

# Install pymongo and python-dotenv first (these are usually straightforward)
print_info "Installing pymongo and python-dotenv..."
if ! pip install pymongo==4.3.3 python-dotenv==0.21.0 --quiet; then
    print_error "Failed to install pymongo or python-dotenv"
    deactivate
    exit 1
fi

# Try installing psycopg2-binary with multiple strategies
print_info "Installing psycopg2-binary..."
PSYCOPG2_INSTALLED=0

# Strategy 1: Try specific version with no cache
if pip install --no-cache-dir psycopg2-binary==2.9.9 --quiet 2>&1; then
    if python3 -c "import psycopg2" 2>/dev/null; then
        print_status "psycopg2-binary 2.9.9 installed successfully"
        PSYCOPG2_INSTALLED=1
    fi
fi

# Strategy 2: Try latest version if specific version failed
if [ $PSYCOPG2_INSTALLED -eq 0 ]; then
    print_info "Trying latest psycopg2-binary version..."
    if pip install --no-cache-dir psycopg2-binary --quiet 2>&1; then
        if python3 -c "import psycopg2" 2>/dev/null; then
            print_status "psycopg2-binary (latest) installed successfully"
            PSYCOPG2_INSTALLED=1
        fi
    fi
fi

# Strategy 3: Try regular psycopg2 if binary failed (requires system deps)
if [ $PSYCOPG2_INSTALLED -eq 0 ]; then
    print_warning "psycopg2-binary installation failed, trying regular psycopg2..."
    print_info "This requires system dependencies (libpq-dev, python3-dev)"
    if pip install --no-cache-dir psycopg2 --quiet 2>&1; then
        if python3 -c "import psycopg2" 2>/dev/null; then
            print_status "psycopg2 installed successfully"
            PSYCOPG2_INSTALLED=1
        fi
    fi
fi

# Strategy 4: Last resort - try with verbose output to see the issue
if [ $PSYCOPG2_INSTALLED -eq 0 ]; then
    print_error "All installation methods failed. Showing verbose output..."
    pip install --no-cache-dir psycopg2-binary 2>&1 | tail -30
    print_error ""
    print_error "Could not install psycopg2. Please try one of the following:"
    echo ""
    echo "1. Install system dependencies and try again:"
    echo "   sudo apt update && sudo apt install -y libpq-dev python3-dev build-essential"
    echo "   Then run this script again."
    echo ""
    echo "2. Or install psycopg2-binary manually in the virtual environment:"
    echo "   source migration_venv/bin/activate"
    echo "   pip install --upgrade pip setuptools wheel"
    echo "   pip install --no-cache-dir psycopg2-binary"
    echo ""
    deactivate
    exit 1
fi

# Verify installation
print_info "Verifying installed packages..."
if python3 -c "import pymongo; import psycopg2; import dotenv" 2>/dev/null; then
    print_status "All dependencies verified successfully"
else
    print_error "Some dependencies are missing. Please check the installation."
    deactivate
    exit 1
fi

# Step 4: Check MongoDB connection
echo -e "\n📋 Step 4: Checking MongoDB connection..."
MONGO_HOST="${MONGO_HOST:-localhost}"
MONGO_PORT="${MONGO_PORT:-27017}"

if command -v mongosh &> /dev/null || command -v mongo &> /dev/null; then
    print_info "MongoDB client found, checking connection..."
    if mongosh --host $MONGO_HOST:$MONGO_PORT --eval "db.adminCommand('ping')" --quiet &> /dev/null 2>&1 || \
       mongo --host $MONGO_HOST:$MONGO_PORT --eval "db.adminCommand('ping')" --quiet &> /dev/null 2>&1; then
        print_status "MongoDB is accessible at $MONGO_HOST:$MONGO_PORT"
    else
        print_warning "Cannot connect to MongoDB at $MONGO_HOST:$MONGO_PORT"
        print_info "Make sure MongoDB is running. You can start it with Docker:"
        echo "  docker compose -f docker-compose-db.yml up -d mongo"
    fi
else
    print_warning "MongoDB client not found. Skipping connection check."
    print_info "Make sure MongoDB is running and accessible at $MONGO_HOST:$MONGO_PORT"
fi

# Step 5: Check PostgreSQL connections
echo -e "\n📋 Step 5: Checking PostgreSQL connections..."

# Check PostgreSQL client
if ! command -v psql &> /dev/null; then
    print_warning "PostgreSQL client (psql) not found"
    print_info "Install with: sudo apt install postgresql-client"
else
    print_status "PostgreSQL client found"
fi

# Check app database (port 5433)
print_info "Checking PostgreSQL app database (localhost:5433)..."
if PGPASSWORD=dhruva123 psql -h localhost -p 5433 -U dhruvaadmin -d dhruva_app -c "SELECT 1;" &> /dev/null 2>&1; then
    print_status "PostgreSQL app database is accessible"
else
    print_warning "Cannot connect to PostgreSQL app database at localhost:5433"
    print_info "Make sure PostgreSQL containers are running:"
    echo "  docker compose -f docker-compose-db-postgresql.yml up -d app_db_pg log_db_pg"
fi

# Check log database (port 5434)
print_info "Checking PostgreSQL log database (localhost:5434)..."
if PGPASSWORD=dhruvalog123 psql -h localhost -p 5434 -U dhruvalogadmin -d dhruva_log -c "SELECT 1;" &> /dev/null 2>&1; then
    print_status "PostgreSQL log database is accessible"
else
    print_warning "Cannot connect to PostgreSQL log database at localhost:5434"
fi

# Step 6: Check for .env file and MongoDB connection configuration
echo -e "\n📋 Step 6: Checking environment configuration..."
if [ -f ".env" ]; then
    print_status ".env file found"
    
    # Check for MongoDB connection string
    if grep -q "MONGO_DB_CONNECTION_STRING" .env 2>/dev/null; then
        print_status "MONGO_DB_CONNECTION_STRING found in .env"
    else
        # Check if APP_DB_CONNECTION_STRING is set and if it's PostgreSQL
        APP_DB_CONN=$(grep "APP_DB_CONNECTION_STRING" .env 2>/dev/null | cut -d'=' -f2- | tr -d ' "' | head -1 || echo "")
        if [ -n "${APP_DB_CONN:-}" ]; then
            if echo "${APP_DB_CONN}" | grep -q "^postgresql://"; then
                print_warning "APP_DB_CONNECTION_STRING points to PostgreSQL, not MongoDB"
                print_info "The migration script will use the default MongoDB connection"
                print_info "To override, set MONGO_DB_CONNECTION_STRING in .env or export it:"
                echo "  export MONGO_DB_CONNECTION_STRING=\"mongodb://dhruvaadmin:dhruva123@localhost:27017/admin?authSource=admin\""
            elif echo "${APP_DB_CONN}" | grep -q "^mongodb://\|^mongodb+srv://"; then
                print_status "APP_DB_CONNECTION_STRING points to MongoDB (will be used)"
            fi
        else
            print_info "No APP_DB_CONNECTION_STRING found, using defaults"
        fi
    fi
    
    # Check for MongoDB database name
    if grep -q "MONGO_DB_NAME" .env 2>/dev/null; then
        print_status "MONGO_DB_NAME found in .env"
    else
        MONGO_DB_NAME=$(grep "APP_DB_NAME" .env 2>/dev/null | cut -d'=' -f2- | tr -d ' "' | head -1 || echo "")
        if [ -n "${MONGO_DB_NAME:-}" ]; then
            print_info "Using APP_DB_NAME for MongoDB: ${MONGO_DB_NAME}"
        else
            print_info "Using default MongoDB database: admin"
        fi
    fi
else
    print_warning ".env file not found"
    print_info "The script will use default connection strings from migrate_data.py"
fi

# Check if MONGO_DB_CONNECTION_STRING is set in environment
# Use ${VAR:-} to avoid "unbound variable" error with set -u
if [ -n "${MONGO_DB_CONNECTION_STRING:-}" ]; then
    print_status "MONGO_DB_CONNECTION_STRING is set in environment"
    if echo "${MONGO_DB_CONNECTION_STRING}" | grep -q "^mongodb://\|^mongodb+srv://"; then
        print_status "MongoDB connection string is valid"
    else
        print_error "MONGO_DB_CONNECTION_STRING doesn't start with 'mongodb://' or 'mongodb+srv://'"
        print_info "Current value: ${MONGO_DB_CONNECTION_STRING}"
        print_info "Please set a valid MongoDB connection string"
        exit 1
    fi
fi

# Step 7: Verify migrate_data.py exists
echo -e "\n📋 Step 7: Verifying migration script..."
if [ -f "migrate_data.py" ]; then
    print_status "migrate_data.py found"
    # Make it executable
    chmod +x migrate_data.py 2>/dev/null || true
else
    print_error "migrate_data.py not found in current directory"
    exit 1
fi

# Step 8: Run the migration
echo -e "\n📋 Step 8: Running migration script..."
echo "=========================================="
print_info "Starting migration from MongoDB to PostgreSQL..."
print_info "Make sure both MongoDB and PostgreSQL databases are running and accessible"
echo ""

# Run the migration script (keep error handling disabled to capture exit code)
python3 migrate_data.py
MIGRATION_EXIT_CODE=$?

# Deactivate virtual environment before checking exit code
deactivate

if [ "${MIGRATION_EXIT_CODE}" -eq 0 ]; then
    echo ""
    print_status "Migration completed successfully!"
    echo ""
    print_status "Setup and migration complete!"
    exit 0
else
    echo ""
    print_error "Migration failed with exit code ${MIGRATION_EXIT_CODE}"
    exit ${MIGRATION_EXIT_CODE}
fi

