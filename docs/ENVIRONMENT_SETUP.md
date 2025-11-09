# Environment Setup Guide

This guide will help you set up the environment variables needed to run the Inventory Web App securely.

## 🔐 Security Notice
**NEVER commit .env files to GitHub!** They contain sensitive credentials.

## 📋 Setup Steps

### 1. Server Environment (.env)

Navigate to `web-app/server/` and create a `.env` file:

```bash
# Server Environment Variables

# MongoDB Connection
MONGODB_URI=your-mongodb-connection-string
DB_NAME=inventorydb

# Admin Credentials (Change these!)
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-secure-backend-password

# Email Configuration (for OTP verification)
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-gmail-app-password

# Image Fetching API (Optional - for auto product photos)
UNSPLASH_ACCESS_KEY=your-unsplash-access-key-here

# Server Configuration
PORT=4000
NODE_ENV=development
```

### 2. Client Environment (.env)

Navigate to `web-app/client/` and create a `.env` file:

```bash
# Client Environment Variables

# API Configuration
VITE_API_URL=http://localhost:4000

# Admin Authentication Password
VITE_ADMIN_PASSWORD=your-secure-frontend-password
```

## 🔧 Configuration Details

### MongoDB Setup
1. Create a MongoDB Atlas account
2. Create a cluster and get the connection string
3. Replace `MONGODB_URI` with your connection string

### Email Setup (Gmail)
1. Enable 2-Step Verification on your Google Account
2. Go to https://myaccount.google.com/apppasswords
3. Generate an App Password for "Mail"
4. Use your Gmail address for `EMAIL_USER`
5. Use the 16-character app password for `EMAIL_PASSWORD`

### Unsplash API Setup (Optional - for Auto Product Images)
1. Visit https://unsplash.com/developers
2. Create a free account and register your application
3. Get your Access Key (free tier: 50 requests/hour)
4. Add `UNSPLASH_ACCESS_KEY` to your server .env file
5. **Without API key**: System will generate placeholder images

### Admin Credentials
- `ADMIN_USERNAME`: Backend admin username (for database operations)
- `ADMIN_PASSWORD`: Backend admin password (hashed and stored in database)
- `VITE_ADMIN_PASSWORD`: Frontend admin password (for UI modifications)

## 🛡️ Security Best Practices

1. **Use Strong Passwords**: Make passwords at least 12 characters with mixed case, numbers, and symbols
2. **Different Passwords**: Use different passwords for backend and frontend
3. **Regular Updates**: Change passwords regularly
4. **No Defaults**: Never use default passwords in production

## 🚀 Running the Application

After setting up the environment files:

1. **Start Backend**:
   ```bash
   cd web-app/server
   npm start
   ```

2. **Start Frontend**:
   ```bash
   cd web-app/client
   npm run dev
   ```

## 📝 Example .env Files

See `.env.example` files in both `server/` and `client/` directories for template examples.

---

**Remember**: These .env files are already included in .gitignore and will not be committed to GitHub.