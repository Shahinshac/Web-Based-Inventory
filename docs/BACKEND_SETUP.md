# Backend Server Setup Guide

## Current Issue
Your frontend is deployed on Vercel but trying to connect to `localhost:4000` which doesn't exist in production.

## Solution Options

### Option 1: Deploy Backend to Render.com (Recommended - FREE)

1. **Create Render Account**
   - Go to https://render.com
   - Sign up with your GitHub account

2. **Create New Web Service**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository: `Shahinshac/Web-Based-Inventory`
   - Name: `inventory-backend`
   - Root Directory: `web-app/server`
   - Runtime: `Node`
   - Build Command: `npm install`
   - Start Command: `npm start` or `node index.js`

3. **Set Environment Variables**
   Add these in Render dashboard:
   ```
   MONGODB_URI=your_mongodb_connection_string
   PORT=4000
   NODE_ENV=production
   ```

4. **Get Your Backend URL**
   - After deployment, Render will give you a URL like: `https://inventory-backend.onrender.com`

5. **Update Frontend Environment**
   - Go to Vercel dashboard → Your project → Settings → Environment Variables
   - Add: `VITE_API_URL` = `https://inventory-backend.onrender.com`
   - Redeploy frontend

### Option 2: Deploy Backend to Railway.app (FREE)

1. Go to https://railway.app
2. Connect GitHub repo
3. Select `web-app/server` directory
4. Add environment variables
5. Deploy
6. Update `VITE_API_URL` in Vercel

### Option 3: Use Vercel Serverless Functions (Advanced)

This requires converting your Express backend to serverless functions.

## MongoDB Atlas Setup

Your database needs to be accessible from anywhere:

1. Go to MongoDB Atlas → Network Access
2. Click "Add IP Address"
3. Select "Allow Access from Anywhere" (0.0.0.0/0)
4. Save

## Quick Fix for Local Development

If you want to run backend locally:

```bash
cd web-app/server
npm install
# Create .env file with your MongoDB connection
echo "MONGODB_URI=your_mongodb_uri_here" > .env
echo "PORT=4000" >> .env
npm start
```

Then frontend will connect to localhost:4000

## Recommended: Deploy Backend NOW

**Step-by-step for Render.com:**

1. Go to render.com → New Web Service
2. Connect `Shahinshac/Web-Based-Inventory` repo
3. Settings:
   - Name: `inventory-api`
   - Root Directory: `web-app/server`
   - Build: `npm install`
   - Start: `node index.js`
4. Environment:
   - `MONGODB_URI` = (your MongoDB connection string)
   - `PORT` = `4000`
5. Create Web Service
6. Copy the URL (e.g., `https://inventory-api.onrender.com`)
7. Vercel dashboard → Environment Variables:
   - Add `VITE_API_URL` = `https://inventory-api.onrender.com`
8. Redeploy Vercel

## Current Errors Explained

```
ERR_CONNECTION_REFUSED localhost:4000
```

This means frontend is trying to connect to a local server that doesn't exist in production.

**Fix:** Deploy backend + update `VITE_API_URL` environment variable in Vercel.
