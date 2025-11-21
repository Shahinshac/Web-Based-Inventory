# Environment Variables Reference

## Backend (Render)

Copy these into your Render service environment variables:

```bash
NODE_ENV=production
PORT=4000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/inventorydb?retryWrites=true&w=majority
DB_NAME=inventorydb
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-secure-password-here
UNSPLASH_ACCESS_KEY=your-unsplash-key-here
```

### Variable Descriptions:

- **NODE_ENV**: Set to `production` for production deployment
- **PORT**: Server port (default: 4000, Render will override with its own port)
- **MONGODB_URI**: Your MongoDB Atlas connection string
- **DB_NAME**: Database name (default: `inventorydb`)
- **ADMIN_USERNAME**: Default admin username (created on first startup)
- **ADMIN_PASSWORD**: Default admin password (change this!)
- **UNSPLASH_ACCESS_KEY**: (Optional) Unsplash API key for auto-fetching product images

## Frontend (Vercel)

Copy this into your Vercel project environment variables:

```bash
VITE_API_URL=https://your-backend-url.onrender.com
```

### Variable Descriptions:

- **VITE_API_URL**: Your Render backend service URL (e.g., `https://inventory-api.onrender.com`)

## Local Development

### Backend (.env file in `web-app/server/`)

```bash
NODE_ENV=development
PORT=4000
MONGODB_URI=mongodb://localhost:27017
DB_NAME=inventorydb
ADMIN_USERNAME=admin
ADMIN_PASSWORD=defaultpass123
UNSPLASH_ACCESS_KEY=your-unsplash-key-here
```

### Frontend (.env file in `web-app/client/`)

```bash
VITE_API_URL=http://localhost:4000
```

## Getting MongoDB Connection String

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Click "Connect" on your cluster
3. Select "Connect your application"
4. Copy the connection string
5. Replace `<password>` with your database user password
6. Replace `<dbname>` with `inventorydb` (or your preferred database name)

Example:
```
mongodb+srv://myuser:mypassword@cluster0.xxxxx.mongodb.net/inventorydb?retryWrites=true&w=majority
```

## Security Notes

⚠️ **Important**: 
- Never commit `.env` files to Git
- Use strong passwords for `ADMIN_PASSWORD` in production
- Keep your MongoDB credentials secure
- Rotate passwords regularly

