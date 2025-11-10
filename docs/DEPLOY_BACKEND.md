# Automatic Backend Deployment Script

## Quick Deploy (Recommended)

Click this button to deploy automatically:

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/Shahinshac/Web-Based-Inventory)

This will:
1. ✅ Automatically create a new Render service
2. ✅ Configure all settings from `render.yaml`
3. ✅ Deploy your backend server

## After Deployment

1. **Get Your Backend URL**
   - After deployment completes, Render will show you the URL
   - It will look like: `https://inventory-backend.onrender.com`
   - Copy this URL

2. **Add MongoDB Connection**
   - In Render Dashboard → Your Service → Environment
   - Add `MONGODB_URI` = Your MongoDB Atlas connection string
   - Click "Save Changes"

3. **Update Frontend (Vercel)**
   - Go to Vercel Dashboard
   - Your Project → Settings → Environment Variables
   - Add new variable:
     - Name: `VITE_API_URL`
     - Value: `https://inventory-backend.onrender.com` (your backend URL)
   - Click "Save"
   - Redeploy your frontend

## Manual Deployment (If button doesn't work)

```bash
# 1. Install Render CLI
npm install -g render-cli

# 2. Login to Render
render login

# 3. Create new service
render create web

# Follow prompts:
# - Name: inventory-backend
# - Region: oregon
# - Branch: main
# - Build Command: cd web-app/server && npm install
# - Start Command: cd web-app/server && node index.js

# 4. Set environment variables
render env set MONGODB_URI="your_mongodb_connection_string"
render env set PORT=4000
render env set NODE_ENV=production

# 5. Deploy
render deploy
```

## What Happens Next?

- ⏱️ **Deployment takes 2-3 minutes**
- 🚀 **Your backend will be live** at `https://inventory-backend.onrender.com`
- 💾 **Connects to MongoDB** automatically
- 🔄 **Auto-deploys** on every push to GitHub

## Verify It Works

Test your backend:
```bash
curl https://inventory-backend.onrender.com/
```

You should see a response from your server!

## Need Help?

If the automatic deployment doesn't work:
1. Go to https://render.com
2. Click "New +" → "Web Service"
3. Connect your GitHub: `Shahinshac/Web-Based-Inventory`
4. Use these settings:
   - Name: `inventory-backend`
   - Root Directory: `web-app/server`
   - Build: `npm install`
   - Start: `node index.js`
   - Add `MONGODB_URI` environment variable

That's it! 🎉
