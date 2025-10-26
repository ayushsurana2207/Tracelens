#!/bin/bash

# AI Observability Platform - Deployment Script
# This script helps deploy the frontend to various platforms

echo "🚀 AI Observability Platform - Frontend Deployment"
echo "=================================================="

# Check if we're in the right directory
if [ ! -f "frontend/package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Build the frontend
echo "📦 Building frontend..."
cd frontend
npm install
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo ""
    echo "📁 Built files are in: frontend/dist/"
    echo ""
    echo "🌐 Deployment Options:"
    echo "1. Vercel (Recommended):"
    echo "   - Push to GitHub"
    echo "   - Connect repo to Vercel"
    echo "   - Deploy automatically"
    echo ""
    echo "2. Netlify:"
    echo "   - Drag & drop frontend/dist/ folder to Netlify"
    echo "   - Or connect GitHub repo"
    echo ""
    echo "3. GitHub Pages:"
    echo "   - Upload dist/ contents to gh-pages branch"
    echo ""
    echo "4. Any Static Host:"
    echo "   - Upload frontend/dist/ folder contents"
    echo ""
    echo "💡 The app works with mock data by default - no backend required!"
else
    echo "❌ Build failed!"
    exit 1
fi
