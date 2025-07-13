#!/bin/bash

# Development startup script for Blogsy

echo "🚀 Starting Blogsy in development mode..."

# Check if MongoDB is running locally
echo "📊 Checking MongoDB connection..."
if ! nc -z localhost 27017 2>/dev/null; then
    echo "❌ MongoDB is not running on localhost:27017"
    echo "Please start MongoDB first:"
    echo "  - On Windows: Start MongoDB service"
    echo "  - On Mac: brew services start mongodb-community"
    echo "  - On Linux: sudo systemctl start mongod"
    echo ""
    echo "Or use Docker: docker run -d -p 27017:27017 --name mongodb mongo:latest"
    exit 1
fi

echo "✅ MongoDB is running"

# Create .env file if it doesn't exist
if [ ! -f "backend/.env" ]; then
    echo "📝 Creating .env file..."
    cat > backend/.env << EOF
MONGODB_URI=mongodb://localhost:27017/blogsy-db
JWT_SECRET=your_jwt_secret_key_here_make_it_long_and_secure
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_app_password
PORT=5000
NODE_ENV=development
EOF
    echo "⚠️  Please update backend/.env with your actual credentials"
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "backend/node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    cd backend && npm install && cd ..
fi

if [ ! -d "frontend/node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    cd frontend && npm install && cd ..
fi

# Start backend
echo "🔧 Starting backend server..."
cd backend && npm start &
BACKEND_PID=$!

# Wait for backend to start
echo "⏳ Waiting for backend to start..."
sleep 5

# Start frontend
echo "🎨 Starting frontend..."
cd frontend && npm start &
FRONTEND_PID=$!

echo "✅ Blogsy is starting up!"
echo "📱 Frontend: http://localhost:3000"
echo "🔧 Backend: http://localhost:5000"
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait for user to stop
wait 