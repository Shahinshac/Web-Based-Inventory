# Quick Fix: Render Deployment Error

## Problem
Your Render deployment is failing with:
```
❌ Connection attempt failed
Server localhost:27017 error
```

This means the `MONGODB_URI` environment variable is **not set** in Render.

## Solution (5 minutes)

### Step 1: Get Your MongoDB Connection String

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Click **"Connect"** on your cluster
3. Select **"Connect your application"**
4. Copy the connection string (looks like):
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
5. Replace `<password>` with your actual database user password
6. Replace the `?` part with `/inventorydb?retryWrites=true&w=majority` (or add `&appName=inventory`)

**Final format should be:**
```
mongodb+srv://myuser:mypassword@cluster0.xxxxx.mongodb.net/inventorydb?retryWrites=true&w=majority
```

### Step 2: Set Environment Variables in Render

1. Go to your Render service dashboard
2. Click **"Environment"** in the left sidebar
3. Click **"Add Environment Variable"** button
4. Add these variables one by one:

   **Variable 1:**
   - Key: `MONGODB_URI`
   - Value: `mongodb+srv://username:password@cluster.mongodb.net/inventorydb?retryWrites=true&w=majority`
   - (Use your actual connection string from Step 1)

   **Variable 2:**
   - Key: `NODE_ENV`
   - Value: `production`

   **Variable 3:**
   - Key: `PORT`
   - Value: `4000`

   **Variable 4:**
   - Key: `DB_NAME`
   - Value: `inventorydb`

   **Variable 5:**
   - Key: `ADMIN_USERNAME`
   - Value: `admin` (or your preferred admin username)

   **Variable 6:**
   - Key: `ADMIN_PASSWORD`
   - Value: `your-secure-password-here` (choose a strong password!)

5. Click **"Save Changes"** after adding all variables
6. Render will automatically redeploy (wait 2-3 minutes)

### Step 3: Verify MongoDB Atlas Network Access

1. In MongoDB Atlas, go to **"Network Access"** (left sidebar)
2. Click **"Add IP Address"**
3. Click **"Allow Access from Anywhere"** (adds `0.0.0.0/0`)
   - Or add Render's IP ranges if you prefer
4. Click **"Confirm"**

### Step 4: Check Deployment

1. Go back to Render dashboard
2. Click **"Events"** tab to see deployment progress
3. Wait for deployment to complete (green checkmark)
4. Click **"Logs"** tab to verify connection:
   - Look for: `✅ Connected to MongoDB successfully`

## Still Having Issues?

### Check These:

1. **MongoDB Connection String Format:**
   - Must start with `mongodb+srv://` or `mongodb://`
   - Password must be URL-encoded if it contains special characters
   - Database name should be in the path: `/inventorydb`

2. **MongoDB Atlas Status:**
   - Cluster must be running (not paused)
   - Database user must exist and have correct password
   - Network Access must allow Render's IPs

3. **Render Environment Variables:**
   - Go to Environment tab
   - Verify all 6 variables are set
   - Check for typos in variable names (case-sensitive!)
   - Make sure there are no extra spaces

4. **Test Connection:**
   - After deployment, visit: `https://your-service.onrender.com/api/ping`
   - Should return: `{"ok":true}`

## Example Environment Variables

Here's what your Render Environment tab should look like:

```
MONGODB_URI = mongodb+srv://myuser:mypass123@cluster0.abc123.mongodb.net/inventorydb?retryWrites=true&w=majority
NODE_ENV = production
PORT = 4000
DB_NAME = inventorydb
ADMIN_USERNAME = admin
ADMIN_PASSWORD = MySecurePassword123!
```

## Need Help?

- Check Render logs: Dashboard → Your Service → Logs tab
- Check MongoDB Atlas logs: Atlas → Monitoring tab
- Verify connection string format matches examples above

