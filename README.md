# 📦 Inventory Management System

A modern, full-stack web application for inventory and billing management with real-time updates, barcode scanning, and comprehensive sales tracking.

## ✨ Features

- 🛍️ **Product Management** - Add, edit, and track inventory with barcode support
- 💰 **Billing System** - Create bills with multiple payment modes (Cash, UPI, Card, Split)
- 📊 **Dashboard** - Real-time analytics and sales metrics
- 🧾 **Professional Invoices** - Beautiful printable invoices with GST calculation
- 📱 **Responsive Design** - Works on desktop, tablet, and mobile
- 🔍 **Barcode Scanner** - Built-in camera-based barcode scanning
- 💳 **Split Payments** - Support for multiple payment methods per transaction
- 📈 **Sales Reports** - Comprehensive sales tracking and reporting

## 🚀 Live Demo

🌐 **[View Live Application](https://your-vercel-url.vercel.app)**

## 📋 Tech Stack

### Frontend
- **React** - UI framework
- **Vite** - Build tool
- **HTML5-QRCode** - Barcode scanning
- **jsPDF** - PDF generation

### Backend
- **Node.js** - Runtime environment
- **Express** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM

### Deployment
- **Vercel** - Frontend hosting
- **Render/MongoDB Atlas** - Backend & database

## 🛠️ Installation

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or Atlas)
- npm or yarn

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/Shahinshac/Web-Based-Inventory.git
   cd Web-Based-Inventory
   ```

2. **Install dependencies**
   ```bash
   # Install client dependencies
   cd web-app/client
   npm install

   # Install server dependencies
   cd ../server
   npm install
   ```

3. **Configure environment variables**
   ```bash
   # Create .env in web-app/server/
   MONGODB_URI=your_mongodb_connection_string
   PORT=5000
   ```

4. **Start the application**
   ```bash
   # Terminal 1: Start backend
   cd web-app/server
   npm start

   # Terminal 2: Start frontend
   cd web-app/client
   npm run dev
   ```

5. **Open your browser**
   ```
   http://localhost:3000
   ```

## 📁 Project Structure

```
Inventory-Web-App/
├── web-app/
│   ├── client/          # React frontend
│   │   ├── src/
│   │   │   ├── App.jsx  # Main application
│   │   │   ├── constants.js  # App constants
│   │   │   └── styles.css    # Global styles
│   │   └── package.json
│   └── server/          # Express backend
│       ├── index.js     # Server entry point
│       ├── db.js        # Database connection
│       ├── validators.js # Input validation
│       └── package.json
├── api/                 # Vercel serverless functions
├── db/                  # Database scripts
├── config/              # Configuration files
├── docs/                # Documentation
└── scripts/             # Deployment scripts
```

## 🎯 Key Features Implemented

### ✅ Payment System
- Cash, UPI, Card, and Split payment support
- Real-time validation for split payments
- Automatic calculation and verification

### ✅ GST Calculation
- Fixed 18% GST (9% CGST + 9% SGST or 18% IGST)
- Automatic tax calculation on all transactions
- GST-compliant invoice generation

### ✅ Professional Invoicing
- Modern gradient design
- Color-coded calculations
- Print-optimized layout
- Split payment breakdown display
- Amount in words conversion

### ✅ Inventory Management
- Real-time stock tracking
- Low stock alerts
- Barcode-based product lookup
- Bulk product import/export

## 🔧 Configuration

### Environment Variables

**Backend (.env)**
```env
MONGODB_URI=mongodb://localhost:27017/inventory
PORT=5000
NODE_ENV=production
```

**Frontend (update in constants.js)**
```javascript
const API_URL = 'http://localhost:5000' // or your production URL
```

## 📖 Documentation

Detailed documentation available in the `/docs` folder:
- [Backend Setup](docs/BACKEND_SETUP.md)
- [Deployment Guide](docs/DEPLOY_BACKEND.md)
- [Environment Setup](docs/ENVIRONMENT_SETUP.md)
- [Barcode Troubleshooting](docs/BARCODE_TROUBLESHOOTING.md)

## 🚢 Deployment

### Deploy to Vercel (Frontend)
```bash
cd web-app/client
vercel --prod
```

### Deploy Backend
See [DEPLOY_BACKEND.md](docs/DEPLOY_BACKEND.md) for detailed instructions.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Shahinsha**
- GitHub: [@Shahinshac](https://github.com/Shahinshac)

## 🙏 Acknowledgments

- Built with modern web technologies
- Designed for small to medium businesses
- Optimized for Indian GST compliance

---

**Made with ❤️ for efficient inventory management**
