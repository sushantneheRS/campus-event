# Backend Deployment Guide

## Prerequisites
1. MongoDB Atlas account (free tier available)
2. Render.com account (free tier available)
3. GitHub repository with your backend code

## Step 1: Set up MongoDB Atlas
1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a free cluster
3. Create a database user
4. Get your connection string
5. Whitelist all IP addresses (0.0.0.0/0) for development

## Step 2: Deploy to Render.com
1. Go to [Render.com](https://render.com)
2. Connect your GitHub account
3. Create a new Web Service
4. Select your repository
5. Configure the service:
   - **Name**: campus-event-backend
   - **Environment**: Node
   - **Build Command**: `npm install && npm run postinstall`
   - **Start Command**: `node server.js`
   - **Plan**: Free

## Step 3: Environment Variables
Add these environment variables in Render dashboard:

```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/campus-events?retryWrites=true&w=majority
JWT_SECRET=your-super-secret-jwt-key-here-make-it-very-long-and-random
JWT_EXPIRE=7d
NODE_ENV=production
PORT=5000
FRONTEND_URL=https://campus-event.netlify.app
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## Step 4: Health Check
- Render will automatically check `/api/health` endpoint
- Make sure your backend is responding to this endpoint

## Step 5: Update Frontend
- Update your frontend's API URL to point to your Render deployment
- Example: `https://campus-event-backend.onrender.com`

## Troubleshooting
1. **Build fails**: Check if all dependencies are in package.json
2. **Database connection fails**: Verify MongoDB URI and network access
3. **CORS errors**: Ensure frontend URL is in CORS configuration
4. **Socket.io issues**: Check if WebSocket connections are allowed

## Free Tier Limitations
- Render free tier sleeps after 15 minutes of inactivity
- First request after sleep may take 30+ seconds
- Consider upgrading to paid plan for production use
