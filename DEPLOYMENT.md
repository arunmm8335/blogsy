# 🚀 Blogging Platform Deployment Guide

This guide will help you deploy your blogging platform for free using Render (backend) and Vercel (frontend).

## 📋 Prerequisites

1. **GitHub Account** - To host your code
2. **MongoDB Atlas Account** - For free database hosting
3. **Cloudinary Account** - For image uploads (optional)
4. **Render Account** - For backend hosting
5. **Vercel Account** - For frontend hosting

## 🗄️ Step 1: Set Up MongoDB Atlas (Database)

1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a free account
3. Create a new cluster (free tier)
4. Create a database user with read/write permissions
5. Get your connection string
6. Add your IP address to the whitelist (or use 0.0.0.0/0 for all IPs)

## ☁️ Step 2: Set Up Cloudinary (Image Storage)

1. Go to [Cloudinary](https://cloudinary.com/)
2. Create a free account
3. Get your Cloud Name, API Key, and API Secret

## 🔧 Step 3: Deploy Backend to Render

### 3.1 Push Code to GitHub
```bash
# Initialize git if not already done
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/yourusername/blogging-platform.git
git push -u origin main
```

### 3.2 Deploy on Render
1. Go to [Render](https://render.com/)
2. Sign up with your GitHub account
3. Click "New +" → "Web Service"
4. Connect your GitHub repository
5. Configure the service:
   - **Name**: `blogging-platform-backend`
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free

### 3.3 Set Environment Variables
In Render dashboard, go to your service → Environment → Add the following:

```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/blogging-platform?retryWrites=true&w=majority
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRE=30d
NODE_ENV=production
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
REDIS_URL=redis://localhost:6379
```

### 3.4 Get Backend URL
After deployment, note your backend URL: `https://your-app-name.onrender.com`

## 🌐 Step 4: Deploy Frontend to Vercel

### 4.1 Prepare Frontend
1. Go to your frontend directory
2. Create `.env` file:
```
REACT_APP_API_URL=https://your-backend-url.onrender.com/api
```

### 4.2 Deploy on Vercel
1. Go to [Vercel](https://vercel.com/)
2. Sign up with your GitHub account
3. Click "New Project"
4. Import your GitHub repository
5. Configure the project:
   - **Framework Preset**: Create React App
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`

### 4.3 Set Environment Variables
In Vercel dashboard, go to your project → Settings → Environment Variables:

```
REACT_APP_API_URL=https://your-backend-url.onrender.com/api
```

### 4.4 Update Backend CORS
In Render, update the `FRONTEND_URL` environment variable:
```
FRONTEND_URL=https://your-frontend-domain.vercel.app
```

## 🔄 Step 5: Update Backend CORS

After getting your frontend URL, update the backend environment variable:
1. Go to Render dashboard
2. Your backend service → Environment
3. Add/Update: `FRONTEND_URL=https://your-frontend-domain.vercel.app`
4. Redeploy the service

## 🧪 Step 6: Test Your Deployment

1. Visit your frontend URL
2. Try to register/login
3. Create a post
4. Upload images
5. Add comments
6. Test like/dislike functionality

## 🔧 Troubleshooting

### Common Issues:

1. **CORS Errors**: Make sure `FRONTEND_URL` is set correctly in backend
2. **Database Connection**: Check MongoDB Atlas IP whitelist
3. **Image Uploads**: Verify Cloudinary credentials
4. **Build Errors**: Check if all dependencies are in package.json

### Environment Variables Checklist:

**Backend (Render):**
- ✅ MONGODB_URI
- ✅ JWT_SECRET
- ✅ JWT_EXPIRE
- ✅ NODE_ENV=production
- ✅ CLOUDINARY_CLOUD_NAME
- ✅ CLOUDINARY_API_KEY
- ✅ CLOUDINARY_API_SECRET
- ✅ EMAIL_HOST
- ✅ EMAIL_PORT
- ✅ EMAIL_USER
- ✅ EMAIL_PASS
- ✅ FRONTEND_URL

**Frontend (Vercel):**
- ✅ REACT_APP_API_URL

## 🎉 Success!

Your blogging platform is now live! Share your URLs:
- **Frontend**: `https://your-app.vercel.app`
- **Backend**: `https://your-app.onrender.com`

## 📈 Next Steps

1. **Custom Domain**: Add your own domain
2. **SSL Certificate**: Automatically provided by Vercel/Render
3. **Monitoring**: Set up uptime monitoring
4. **Backup**: Set up database backups
5. **Analytics**: Add Google Analytics

## 💰 Cost Breakdown

- **MongoDB Atlas**: Free (512MB)
- **Cloudinary**: Free (25GB storage, 25GB bandwidth)
- **Render**: Free (750 hours/month)
- **Vercel**: Free (unlimited)
- **Total**: $0/month! 🎉

---

**Need help?** Check the troubleshooting section or create an issue in your GitHub repository. 