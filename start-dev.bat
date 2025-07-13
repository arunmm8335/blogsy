@echo off
echo 🚀 Starting Blogsy in development mode...

REM Check if MongoDB is running locally
echo 📊 Checking MongoDB connection...
netstat -an | find "27017" >nul
if errorlevel 1 (
    echo ❌ MongoDB is not running on localhost:27017
    echo Please start MongoDB first:
    echo   - Start MongoDB service from Windows Services
    echo   - Or use Docker: docker run -d -p 27017:27017 --name mongodb mongo:latest
    pause
    exit /b 1
)

echo ✅ MongoDB is running

REM Create .env file if it doesn't exist
if not exist "backend\.env" (
    echo 📝 Creating .env file...
    (
        echo MONGODB_URI=mongodb://localhost:27017/blogsy-db
        echo JWT_SECRET=your_jwt_secret_key_here_make_it_long_and_secure
        echo CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
        echo CLOUDINARY_API_KEY=your_cloudinary_api_key
        echo CLOUDINARY_API_SECRET=your_cloudinary_api_secret
        echo EMAIL_USER=your_email@gmail.com
        echo EMAIL_PASS=your_email_app_password
        echo PORT=5000
        echo NODE_ENV=development
    ) > backend\.env
    echo ⚠️  Please update backend\.env with your actual credentials
)

REM Install dependencies if node_modules doesn't exist
if not exist "backend\node_modules" (
    echo 📦 Installing backend dependencies...
    cd backend
    npm install
    cd ..
)

if not exist "frontend\node_modules" (
    echo 📦 Installing frontend dependencies...
    cd frontend
    npm install
    cd ..
)

echo 🔧 Starting backend server...
start "Backend" cmd /k "cd backend && npm start"

echo ⏳ Waiting for backend to start...
timeout /t 5 /nobreak >nul

echo 🎨 Starting frontend...
start "Frontend" cmd /k "cd frontend && npm start"

echo ✅ Blogsy is starting up!
echo 📱 Frontend: http://localhost:3000
echo 🔧 Backend: http://localhost:5000
echo.
echo Press any key to close this window...
pause >nul 