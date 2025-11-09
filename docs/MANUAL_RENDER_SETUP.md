# MANUAL RENDER SETUP GUIDE

## 🚨 IF YOUR BACKEND IS NOT WORKING, FOLLOW THESE STEPS:

### Step 1: Create New Web Service on Render

1. Go to: https://dashboard.render.com
2. Click **"New +"** → **"Web Service"**
3. Click **"Build and deploy from a Git repository"** → **"Next"**

### Step 2: Connect Repository

1. Click **"Connect GitHub"**
2. Find: `Shahinshac/Web-Based-Inventory`
3. Click **"Connect"**

### Step 3: Configure Service (COPY-PASTE EXACTLY)

**Name:**
```
inventory-backend
```

**Region:**
```
Oregon (US West)
```

**Branch:**
```
main
```

**Root Directory:**
```
web-app/server
```

**Runtime:**
```
Node
```

**Build Command:**
```
npm install
```

**Start Command:**
```
node index.js
```

**Instance Type:**
```
Free
```

### Step 4: Environment Variables

Click **"Add Environment Variable"** for each:

**Variable 1:**
```
Key: MONGODB_URI
Value: mongodb+srv://shahinshac123_db_user:3uyicMLnfOJYZUgf@cluster0.majmsqd.mongodb.net/?appName=Cluster0&tlsAllowInvalidCertificates=true
```

**Variable 2:**
```
Key: NODE_ENV
Value: production
```

**Variable 3:**
```
Key: PORT
Value: 4000
```

**Variable 4:**
```
Key: DB_NAME
Value: inventorydb
```

**Variable 5:**
```
Key: ADMIN_USERNAME
Value: admin
```

**Variable 6:**
```
Key: ADMIN_PASSWORD
Value: shaahnc
```

### Step 5: Create & Deploy

1. Click **"Create Web Service"**
2. Wait 2-3 minutes for deployment
3. Status should change to **"Live"**
4. Your URL will be: `https://inventory-backend.onrender.com`

### Step 6: Verify Backend Works

Open in browser or run this command:
```
curl https://inventory-backend.onrender.com/api/ping
```

Should return: `{"ok":true}`

### Step 7: Update Vercel

1. Go to: https://vercel.com/dashboard
2. Select your project
3. **Settings** → **Environment Variables**
4. Add new variable:
   - **Name:** `VITE_API_URL`
   - **Value:** `https://inventory-backend.onrender.com`
   - **Environment:** Production ✓
5. Click **"Save"**
6. Go to **Deployments** → Click **⋯** → **"Redeploy"**

## ✅ VERIFICATION

After both deployments complete:

1. Open your Vercel app
2. Try to add a product
3. It should work!

If it still doesn't work, check browser console (F12) for errors.
