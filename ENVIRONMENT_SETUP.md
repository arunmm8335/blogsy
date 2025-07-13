# Environment Setup Guide

## Required Environment Variables

Create a `.env` file in the `backend` directory with the following variables:

### Database Configuration
```
MONGODB_URI=mongodb://localhost:27017/blogsy-db
```

### JWT Configuration
```
JWT_SECRET=your_jwt_secret_key_here_make_it_long_and_secure
```

### Cloudinary Configuration (for media uploads)
```
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

### Email Configuration (for password reset)
```
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_app_password
```

### Server Configuration
```
PORT=5000
NODE_ENV=development
```

## Setup Instructions

1. **MongoDB**: The application uses MongoDB. When running with Docker, it's automatically configured.

2. **Cloudinary**: 
   - Sign up at [cloudinary.com](https://cloudinary.com)
   - Get your cloud name, API key, and API secret from your dashboard
   - These are used for storing and serving media files

3. **Email (Gmail)**:
   - Use a Gmail account
   - Enable 2-factor authentication
   - Generate an App Password
   - Use the App Password as EMAIL_PASS

4. **JWT Secret**: 
   - Generate a secure random string
   - This is used to sign and verify authentication tokens

## Running the Application

### With Docker (Recommended)
```bash
docker-compose up --build
```

### Without Docker
1. Start MongoDB
2. Install backend dependencies: `cd backend && npm install`
3. Install frontend dependencies: `cd frontend && npm install`
4. Start backend: `cd backend && npm start`
5. Start frontend: `cd frontend && npm start` 