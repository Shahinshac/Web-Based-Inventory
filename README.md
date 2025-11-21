# Inventory Management System

A modern, full-stack inventory management system with React frontend and Node.js backend.

## 🚀 Features

- **Product Management**: Add, edit, delete products with barcode support
- **Customer Management**: Track customer information and GST details
- **Point of Sale (POS)**: Complete checkout system with GST calculation
- **Invoice Generation**: Automatic invoice creation with bill numbers
- **Analytics Dashboard**: Sales trends, top products, revenue tracking
- **User Management**: Role-based access control (Admin, Manager, Cashier)
- **Audit Trail**: Complete activity logging
- **Barcode & QR Code**: Generate barcodes and QR codes for products

## 📋 Prerequisites

- Node.js 18+ and npm
- MongoDB Atlas account (or local MongoDB)
- Vercel account (for frontend deployment)
- Render account (for backend deployment)

## 🏗️ Project Structure

```
.
├── web-app/
│   ├── client/          # React frontend (Vite)
│   └── server/          # Express.js backend
├── db/                  # Database scripts and samples
└── README.md
```

## 🚀 Deployment

### Backend Deployment (Render)

1. **Create a new Web Service on Render:**
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select the repository

2. **Configure the service:**
   - **Name**: `inventory-api` (or your preferred name)
   - **Root Directory**: `web-app/server`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

3. **Set Environment Variables:**
   ```
   NODE_ENV=production
   PORT=4000
   MONGODB_URI=your-mongodb-connection-string
   DB_NAME=inventorydb
   ADMIN_USERNAME=admin
   ADMIN_PASSWORD=your-secure-password
   UNSPLASH_ACCESS_KEY=your-unsplash-key (optional)
   ```

4. **Deploy:**
   - Click "Create Web Service"
   - Wait for deployment to complete
   - Copy your service URL (e.g., `https://inventory-api.onrender.com`)

### Frontend Deployment (Vercel)

1. **Create a new project on Vercel:**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "Add New..." → "Project"
   - Import your GitHub repository

2. **Configure the project:**
   - **Root Directory**: `web-app/client`
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

3. **Set Environment Variables:**
   ```
   VITE_API_URL=https://your-render-backend-url.onrender.com
   ```
   Replace with your actual Render backend URL.

4. **Deploy:**
   - Click "Deploy"
   - Wait for deployment to complete
   - Your app will be live at `https://your-project.vercel.app`

## 🔧 Local Development

### Backend Setup

1. Navigate to the server directory:
   ```bash
   cd web-app/server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file (copy from `.env.example`):
   ```bash
   cp .env.example .env
   ```

4. Update `.env` with your MongoDB connection string and other variables.

5. Start the server:
   ```bash
   npm start
   ```
   Server will run on `http://localhost:4000`

### Frontend Setup

1. Navigate to the client directory:
   ```bash
   cd web-app/client
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file (copy from `.env.example`):
   ```bash
   cp .env.example .env
   ```

4. Update `.env` with your API URL:
   ```
   VITE_API_URL=http://localhost:4000
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```
   App will run on `http://localhost:5173` (or the port Vite assigns)

## 📝 Environment Variables

### Backend (.env)
- `MONGODB_URI`: MongoDB connection string
- `DB_NAME`: Database name (default: `inventorydb`)
- `PORT`: Server port (default: `4000`)
- `NODE_ENV`: Environment (`development` or `production`)
- `ADMIN_USERNAME`: Default admin username
- `ADMIN_PASSWORD`: Default admin password
- `UNSPLASH_ACCESS_KEY`: (Optional) Unsplash API key for product images

### Frontend (.env)
- `VITE_API_URL`: Backend API URL

## 🔐 Default Admin Account

On first startup, the backend automatically creates an admin user:
- **Username**: Set via `ADMIN_USERNAME` env var (default: `admin`)
- **Password**: Set via `ADMIN_PASSWORD` env var

**Important**: Change the default password in production!

## 📦 Database Setup

1. Create a MongoDB Atlas account at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster (free tier is fine)
3. Create a database user
4. Whitelist IP addresses (for Render, use `0.0.0.0/0` or Render's IP ranges)
5. Get your connection string and set it as `MONGODB_URI`

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, Chart.js
- **Backend**: Node.js, Express.js
- **Database**: MongoDB
- **Authentication**: bcrypt
- **File Upload**: Multer
- **Barcode/QR**: jsbarcode, qrcode

## 📄 License

MIT

## 🤝 Support

For issues and questions, please open an issue on GitHub.
