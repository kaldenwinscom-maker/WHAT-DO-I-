#!/bin/bash
# WHAT AI Platform — Quick Setup Script

set -e

echo ""
echo "  ██╗    ██╗██╗  ██╗ █████╗ ████████╗"
echo "  ██║    ██║██║  ██║██╔══██╗╚══██╔══╝"
echo "  ██║ █╗ ██║███████║███████║   ██║   "
echo "  ██║███╗██║██╔══██║██╔══██║   ██║   "
echo "  ╚███╔███╔╝██║  ██║██║  ██║   ██║   "
echo "   ╚══╝╚══╝ ╚═╝  ╚═╝╚═╝  ╚═╝   ╚═╝   "
echo ""
echo "  AI Agency Platform — Quick Setup"
echo ""

# Check Node version
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Install it first: https://nodejs.org"
    exit 1
fi

NODE_VERSION=$(node -v | sed 's/v//')
echo "✓ Node.js $NODE_VERSION found"

# Install
echo ""
echo "📦 Installing dependencies..."
npm install

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Run:        npm run dev"
echo "  2. Open:       http://localhost:3000"
echo "  3. Click Chat → Settings → add your API key"
echo ""
echo "Get a free API key:"
echo "  • Anthropic: https://console.anthropic.com/settings/keys"
echo "  • OpenAI:    https://platform.openai.com/api-keys"
echo "  • Gemini:    https://aistudio.google.com/app/apikey"
echo ""
