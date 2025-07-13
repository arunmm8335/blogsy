#!/bin/bash

echo "🚀 Blogging Platform Deployment Script"
echo "======================================"

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "📁 Initializing git repository..."
    git init
    git add .
    git commit -m "Initial commit for deployment"
    git branch -M main
    echo "✅ Git repository initialized"
else
    echo "✅ Git repository already exists"
fi

# Check if remote origin exists
if ! git remote get-url origin > /dev/null 2>&1; then
    echo "🔗 Please add your GitHub repository as remote origin:"
    echo "   git remote add origin https://github.com/yourusername/blogging-platform.git"
    echo "   git push -u origin main"
else
    echo "✅ Remote origin already configured"
fi

echo ""
echo "📋 Next Steps:"
echo "1. Push your code to GitHub:"
echo "   git add . && git commit -m 'Prepare for deployment' && git push"
echo ""
echo "2. Set up MongoDB Atlas:"
echo "   - Go to https://www.mongodb.com/atlas"
echo "   - Create free cluster"
echo "   - Get connection string"
echo ""
echo "3. Set up Cloudinary:"
echo "   - Go to https://cloudinary.com/"
echo "   - Create free account"
echo "   - Get API credentials"
echo ""
echo "4. Deploy Backend to Render:"
echo "   - Go to https://render.com/"
echo "   - Connect GitHub repo"
echo "   - Set root directory to 'backend'"
echo "   - Configure environment variables"
echo ""
echo "5. Deploy Frontend to Vercel:"
echo "   - Go to https://vercel.com/"
echo "   - Import GitHub repo"
echo "   - Set root directory to 'frontend'"
echo "   - Set REACT_APP_API_URL environment variable"
echo ""
echo "📖 See DEPLOYMENT.md for detailed instructions"
echo ""
echo "🎉 Good luck with your deployment!" 