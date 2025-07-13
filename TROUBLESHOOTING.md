# Troubleshooting Guide

## Common Issues and Solutions

### 1. MongoDB Connection Timeout

**Error:** `Operation posts.find() buffering timed out after 10000ms`

**Solutions:**

#### Option A: Use Docker (Recommended)
```bash
# Start MongoDB with Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest

# Or use the full docker-compose
docker-compose up --build
```

#### Option B: Install MongoDB Locally
- **Windows:** Download and install from [MongoDB website](https://www.mongodb.com/try/download/community)
- **Mac:** `brew install mongodb-community && brew services start mongodb-community`
- **Linux:** `sudo apt install mongodb && sudo systemctl start mongod`

#### Option C: Use MongoDB Atlas (Cloud)
1. Sign up at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a free cluster
3. Get your connection string
4. Update `MONGODB_URI` in your `.env` file

### 2. Environment Variables Not Set

**Error:** `MongoDB connection error: Invalid connection string`

**Solution:**
1. Create `backend/.env` file
2. Add the required variables (see `ENVIRONMENT_SETUP.md`)
3. Make sure `MONGODB_URI` is set correctly

### 3. Port Already in Use

**Error:** `EADDRINUSE: address already in use :::5000`

**Solutions:**
```bash
# Find and kill the process using port 5000
# Windows:
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Mac/Linux:
lsof -ti:5000 | xargs kill -9
```

### 4. Frontend Can't Connect to Backend

**Error:** `Failed to load resource: the server responded with a status of 500`

**Solutions:**
1. Check if backend is running: `http://localhost:5000/health`
2. Check backend logs for errors
3. Verify CORS settings
4. Make sure proxy is set correctly in `frontend/package.json`

### 5. File Upload Issues

**Error:** `Cloudinary configuration error`

**Solutions:**
1. Set up Cloudinary account
2. Add Cloudinary credentials to `.env`
3. Check file size limits (50MB max)

### 6. JWT Token Issues

**Error:** `JsonWebTokenError` or `TokenExpiredError`

**Solutions:**
1. Set a strong `JWT_SECRET` in `.env`
2. Clear browser localStorage
3. Log out and log back in

## Quick Start Commands

### Development Mode
```bash
# Windows
start-dev.bat

# Mac/Linux
chmod +x start-dev.sh
./start-dev.sh
```

### Docker Mode
```bash
docker-compose up --build
```

### Manual Start
```bash
# Terminal 1 - Backend
cd backend
npm install
npm start

# Terminal 2 - Frontend
cd frontend
npm install
npm start
```

## Debugging Steps

1. **Check MongoDB Connection:**
   ```bash
   # Test MongoDB connection
   mongo mongodb://localhost:27017/blogsy-db
   ```

2. **Check Backend Health:**
   ```bash
   curl http://localhost:5000/health
   ```

3. **Check Backend Logs:**
   - Look for connection errors
   - Check for missing environment variables
   - Verify database queries

4. **Check Frontend Console:**
   - Open browser DevTools
   - Look for network errors
   - Check for JavaScript errors

## Environment Variables Checklist

Make sure these are set in `backend/.env`:

- [ ] `MONGODB_URI`
- [ ] `JWT_SECRET`
- [ ] `CLOUDINARY_CLOUD_NAME`
- [ ] `CLOUDINARY_API_KEY`
- [ ] `CLOUDINARY_API_SECRET`
- [ ] `EMAIL_USER` (optional)
- [ ] `EMAIL_PASS` (optional)
- [ ] `PORT` (optional, defaults to 5000)
- [ ] `NODE_ENV` (optional, defaults to development)

## Still Having Issues?

1. Check the backend console for detailed error messages
2. Verify all environment variables are set correctly
3. Make sure MongoDB is running and accessible
4. Try restarting both frontend and backend servers
5. Clear browser cache and localStorage 