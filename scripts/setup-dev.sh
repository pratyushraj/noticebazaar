#!/bin/bash
# CreatorArmour Development Setup Script

set -e

echo "🚀 Setting up CreatorArmour Development Environment..."
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 18+ first."
    exit 1
fi

echo "✅ Node.js version: $(node --version)"

# Install frontend dependencies
echo ""
echo "📦 Installing frontend dependencies..."
npm install --legacy-peer-deps

# Install backend dependencies
echo ""
echo "📦 Installing backend dependencies..."
cd server
npm install --legacy-peer-deps
cd ..

# Check for .env file
if [ ! -f .env.local ] && [ ! -f .env ]; then
    echo ""
    echo "⚠️  No .env file found. Creating .env.example..."
    echo "Please copy .env.example to .env.local and fill in your Supabase credentials."
fi

# Check Supabase CLI
if command -v supabase &> /dev/null; then
    echo ""
    echo "✅ Supabase CLI found"
    echo "To run migrations: supabase db push"
else
    echo ""
    echo "⚠️  Supabase CLI not found. Install with: npm install -g supabase"
    echo "Or run migrations manually via Supabase dashboard."
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Copy .env.example to .env.local and add your Supabase credentials"
echo "2. Run migrations: make migrate (or supabase db push)"
echo "3. Seed demo data: make seed"
echo "4. Start dev servers: make dev"
echo ""

