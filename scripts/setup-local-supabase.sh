#!/bin/bash

# Setup script for local Supabase instance
# This script initializes and sets up a local Supabase database for testing

set -e

echo "🚀 Setting up local Supabase for testing..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker Desktop first:"
    echo "   macOS: https://docs.docker.com/desktop/install/mac-install/"
    echo "   Or run: brew install --cask docker"
    exit 1
fi

# Check if Docker is running
if ! docker info &> /dev/null; then
    echo "❌ Docker is not running. Please start Docker Desktop."
    exit 1
fi

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "📦 Installing Supabase CLI..."
    
    # Try Homebrew first (recommended for macOS)
    if command -v brew &> /dev/null; then
        echo "   Using Homebrew to install..."
        brew install supabase/tap/supabase
    else
        # Fall back to npm, but handle permission errors
        echo "   Using npm to install (may require sudo)..."
        if npm install -g supabase 2>/dev/null; then
            echo "✓ Supabase CLI installed via npm"
        else
            echo ""
            echo "❌ Failed to install Supabase CLI. Please install manually:"
            echo ""
            echo "Option 1 (Recommended for macOS):"
            echo "   brew install supabase/tap/supabase"
            echo ""
            echo "Option 2 (If you have Homebrew):"
            echo "   npm install -g supabase"
            echo "   (If you get permission errors, you may need to fix npm permissions)"
            echo ""
            echo "Option 3 (Fix npm permissions):"
            echo "   mkdir -p ~/.npm-global"
            echo "   npm config set prefix '~/.npm-global'"
            echo "   echo 'export PATH=~/.npm-global/bin:\$PATH' >> ~/.zshrc"
            echo "   source ~/.zshrc"
            echo "   npm install -g supabase"
            echo ""
            exit 1
        fi
    fi
else
    echo "✓ Supabase CLI is already installed"
fi

# Navigate to project root
cd "$(dirname "$0")/.."

# Initialize Supabase if not already initialized
if [ ! -f "supabase/config.toml" ]; then
    echo "📝 Initializing Supabase..."
    supabase init
else
    echo "✓ Supabase already initialized"
fi

# Start Supabase
echo "🔧 Starting local Supabase instance..."
supabase start

# Get connection details
echo ""
echo "✅ Local Supabase is running!"
echo ""
echo "📋 Connection Details:"
supabase status

echo ""
echo "📝 Next steps:"
echo "1. Copy the connection details above to your .env.test.local file"
echo "2. Run: npm run supabase:migrate-local"
echo "3. Run: npm run test:e2e"
echo ""

