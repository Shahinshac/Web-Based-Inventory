// Load environment variables FIRST before anything else
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcrypt');
const { ObjectId } = require('mongodb');
const { connectDB, getDB } = require('./db');
const logger = require('./logger');
const JsBarcode = require('jsbarcode');
const QRCode = require('qrcode');
const { createCanvas } = require('canvas');
const multer = require('multer');
const fs = require('fs').promises;
const https = require('https');
const http = require('http');
const {
  validateProduct,
  validateCustomer,
  validateUserRegistration,
  validateCheckout,
  sanitizeObject,
  sanitizeString
} = require('./validators');

const app = express();
app.use(cors());
app.use(express.json());

// Configure multer for product photo uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'uploads', 'products');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (err) {
      cb(err, null);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `product-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files (jpeg, jpg, png, webp) are allowed!'));
    }
  }
});

// Serve uploaded images statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Utility: Generate unique barcode for product
function generateProductBarcode(productName, productId) {
  // Create barcode based on product ID (unique)
  // Using EAN-13 format: pad with zeros
  const numericId = parseInt(productId, 16).toString().slice(-12);
  const paddedId = numericId.padStart(12, '0');
  return paddedId;
}

// Utility: Generate barcode image as Base64
async function generateBarcodeImage(value, format = 'CODE128') {
  try {
    const canvas = createCanvas(200, 100);
    JsBarcode(canvas, value, {
      format: format,
      width: 2,
      height: 60,
      displayValue: true,
      fontSize: 14,
      margin: 10
    });
    return canvas.toDataURL();
  } catch (error) {
    logger.error('Barcode generation error:', error);
    return null;
  }
}

// Utility: Generate QR code as Base64
async function generateQRCode(data) {
  try {
    const qrDataURL = await QRCode.toDataURL(JSON.stringify(data), {
      width: 200,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    return qrDataURL;
  } catch (error) {
    logger.error('QR code generation error:', error);
    return null;
  }
}

// Utility: Fetch product image from internet
async function fetchProductImage(productName) {
  try {
    console.log(`🔍 Fetching image for product: ${productName}`);
    
    // Clean and enhance product name for better search results
    const cleanName = productName.toLowerCase().trim();
    let searchQuery = cleanName;
    
    // Add category keywords for better professional images
    const categoryMappings = {
      'iphone': 'iphone smartphone apple',
      'samsung': 'samsung galaxy smartphone',
      'laptop': 'laptop computer technology',
      'macbook': 'macbook apple laptop',
      'tv': 'television smart tv electronics',
      'headphone': 'headphones audio wireless',
      'tablet': 'tablet ipad technology',
      'watch': 'smartwatch apple watch',
      'speaker': 'bluetooth speaker audio',
      'camera': 'digital camera photography',
      'mouse': 'computer mouse wireless',
      'keyboard': 'mechanical keyboard gaming',
      'phone': 'smartphone mobile phone',
      'charger': 'usb charger power adapter',
      'cable': 'usb cable charging cord'
    };
    
    // Enhance search term based on product category
    for (const [keyword, enhanced] of Object.entries(categoryMappings)) {
      if (cleanName.includes(keyword)) {
        searchQuery = enhanced;
        break;
      }
    }
    
    const encodedQuery = encodeURIComponent(searchQuery);
    const unsplashAccessKey = process.env.UNSPLASH_ACCESS_KEY;
    
    if (unsplashAccessKey && unsplashAccessKey !== 'your-unsplash-access-key-here') {
      console.log(`🌐 Trying Unsplash API with query: ${searchQuery}`);
      try {
        const unsplashUrl = `https://api.unsplash.com/search/photos?query=${encodedQuery}&per_page=1&orientation=portrait&category=technology`;
        
        const response = await fetch(unsplashUrl, {
          headers: {
            'Authorization': `Client-ID ${unsplashAccessKey}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.results && data.results.length > 0) {
            const imageUrl = data.results[0].urls.regular;
            const downloadedImage = await downloadAndSaveImage(imageUrl, productName);
            if (downloadedImage) {
              console.log(`✅ Unsplash image fetched for: ${productName}`);
              logger.info(`✅ Auto-fetched image for product: ${productName}`);
              return downloadedImage;
            }
          } else {
            console.log(`ℹ️ No Unsplash results for: ${searchQuery}`);
          }
        } else {
          console.log(`⚠️ Unsplash API error: ${response.status}`);
        }
      } catch (error) {
        console.log('⚠️ Unsplash API error:', error.message);
        logger.warn('Unsplash API error:', error.message);
      }
    } else {
      console.log('⚠️ Unsplash API key not configured');
    }
    
    // Try multiple fallback image services with professional-looking images
    const fallbackServices = [
      // Picsum with technology seed for consistent professional look
      `https://picsum.photos/seed/${encodeURIComponent(productName)}/400/400`,
      // Via.placeholder with better styling
      `https://via.placeholder.com/400x400/f8f9fa/495057?text=${encodeURIComponent(productName.substring(0, 15))}`,
      // DummyImage with modern design
      `https://dummyimage.com/400x400/667eea/ffffff&text=${encodeURIComponent(productName.substring(0, 12))}`
    ];
    
    console.log('📷 Trying fallback image services...');
    for (const fallbackUrl of fallbackServices) {
      try {
        const fallbackImage = await downloadAndSaveImage(fallbackUrl, productName, true);
        if (fallbackImage) {
          console.log(`📷 Fallback image generated for: ${productName}`);
          logger.info(`📷 Generated fallback image for product: ${productName}`);
          return fallbackImage;
        }
      } catch (error) {
        console.log(`⚠️ Fallback service failed:`, error.message);
        continue;
      }
    }
    
    console.log(`❌ All image services failed for: ${productName}`);
    return null;
  } catch (error) {
    console.error('❌ Product image fetch error:', error);
    logger.error('Product image fetch error:', error);
    return null;
  }
}

// Utility: Download and save image
async function downloadAndSaveImage(imageUrl, productName, isPlaceholder = false) {
  try {
    const timestamp = Date.now();
    const sanitizedName = productName.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const fileName = `${sanitizedName}-${timestamp}.jpg`;
    const uploadDir = path.join(__dirname, 'uploads', 'products');
    const filePath = path.join(uploadDir, fileName);
    
    // Ensure upload directory exists
    await fs.mkdir(uploadDir, { recursive: true });
    
    return new Promise((resolve, reject) => {
      const protocol = imageUrl.startsWith('https:') ? https : http;
      
      protocol.get(imageUrl, (response) => {
        if (response.statusCode === 200) {
          const fileStream = require('fs').createWriteStream(filePath);
          response.pipe(fileStream);
          
          fileStream.on('finish', () => {
            fileStream.close();
            const relativePath = `/uploads/products/${fileName}`;
            resolve(relativePath);
          });
          
          fileStream.on('error', (err) => {
            reject(err);
          });
        } else {
          reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
        }
      }).on('error', (err) => {
        reject(err);
      });
    });
  } catch (error) {
    logger.error('Image download error:', error);
    return null;
  }
}

// HTTP request logging middleware
app.use(logger.httpLogger);

// Root health check
app.get('/', (req, res) => res.send('Welcome To Our BoB\'s Inventory Collection App ✨✨🎊🎉'));

// Simple health
app.get('/api/ping', (req, res) => res.json({ ok: true }));

// Products
app.get('/api/products', async (req, res) => {
  try {
    const db = getDB();
    const products = await db.collection('products')
      .find({})
      .sort({ name: 1 })
      .toArray();
    
    // Convert _id to id for frontend compatibility
    const formatted = products.map(p => ({
      id: p._id.toString(),
      _id: p._id.toString(),
      name: p.name,
      quantity: p.quantity,
      price: p.price,
      costPrice: p.costPrice || 0,
      hsnCode: p.hsnCode || '9999',
      minStock: p.minStock || 10,
      barcode: p.barcode || null,
      photo: p.photo || null,
      profit: p.price - (p.costPrice || 0),
      profitPercent: p.price > 0 ? (((p.price - (p.costPrice || 0)) / p.price) * 100).toFixed(2) : 0
    }));
    
    res.json(formatted);
  } catch (e) {
    logger.error(e);
    res.status(500).json({ error: e.message });
  }
});

// Customers
app.get('/api/customers', async (req, res) => {
  try {
    const db = getDB();
    const customers = await db.collection('customers')
      .find({})
      .sort({ name: 1 })
      .toArray();
    
    const formatted = customers.map(c => ({
      id: c._id.toString(),
      name: c.name,
      phone: c.phone,
      address: c.address,
      state: c.state || 'Same',
      gstin: c.gstin || ''
    }));
    
    res.json(formatted);
  } catch (e) {
    logger.error(e);
    res.status(500).json({ error: e.message });
  }
});

// Checkout: Enhanced with discount, state GST, profit tracking
app.post('/api/checkout', async (req, res) => {
  try {
    // Validate checkout data
    const validationErrors = validateCheckout(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({ error: validationErrors.join(', ') });
    }

    const payload = req.body;
    const items = Array.isArray(payload.items) ? payload.items : [];
    const customerId = payload.customerId || null;
    const discountPercent = parseFloat(payload.discountPercent) || 0;
    const customerState = payload.customerState || 'Same'; // 'Same' or 'Other'
    
    // Normalize payment mode to lowercase
    let paymentMode = (payload.paymentMode || 'cash').toLowerCase();
    
    // Handle split payment details
    let splitPaymentDetails = null;
    if (paymentMode === 'split') {
      splitPaymentDetails = {
        cashAmount: parseFloat(payload.cashAmount) || 0,
        upiAmount: parseFloat(payload.upiAmount) || 0,
        cardAmount: parseFloat(payload.cardAmount) || 0,
        totalAmount: parseFloat(payload.totalAmount) || parseFloat(payload.total) || 0
      };
    }
    
    const userId = payload.userId || null;
    const username = sanitizeString(payload.username || 'Unknown');
    const db = getDB();
    
    // Get customer details
    let customerName = 'Walk-in Customer';
    let customerPhone = null;
    let customerAddress = '';
    if (customerId) {
      const customer = await db.collection('customers').findOne({ _id: new ObjectId(customerId) });
      if (customer) {
        customerName = customer.name;
        customerPhone = customer.phone;
        customerAddress = customer.address || '';
      }
    }
    
    // Generate bill number
    const billPrefix = `INV-${new Date().getFullYear()}-`;
    const billCount = await db.collection('bills').countDocuments({ billNumber: new RegExp(`^${billPrefix}`) });
    const billNumber = `${billPrefix}${String(billCount + 1).padStart(4, '0')}`;
    
    // Calculate totals
    let subtotal = 0;
    let totalCost = 0;
    const isSameState = customerState === 'Same';
    
    // Prepare bill document
    const bill = {
      billNumber,
      customerId: customerId ? new ObjectId(customerId) : null,
      customerName,
      customerPhone,
      customerAddress,
      customerState,
      isSameState,
      discountPercent,
      paymentMode,
      paymentStatus: 'Paid',
      billDate: new Date(),
      items: [],
      createdBy: userId,
      createdByUsername: username
    };
    
    // Add split payment details if applicable
    if (splitPaymentDetails) {
      bill.splitPaymentDetails = splitPaymentDetails;
    }

    // Process items and update inventory
    for (const it of items) {
      // Get product details
      const product = await db.collection('products').findOne({ _id: new ObjectId(it.productId) });
      
      if (!product) continue;
      
      const lineSubtotal = it.price * it.quantity;
      const lineCost = (product.costPrice || 0) * it.quantity;
      
      // Calculate line profit before discount
      const lineProfit = lineSubtotal - lineCost;
      
      bill.items.push({
        productId: new ObjectId(it.productId),
        productName: product.name,
        hsnCode: product.hsnCode || '9999',
        quantity: it.quantity,
        costPrice: product.costPrice || 0,
        unitPrice: it.price,
        lineSubtotal: lineSubtotal,
        lineCost: lineCost,
        lineProfit: lineProfit
      });
      
      subtotal += lineSubtotal;
      totalCost += lineCost;
      
      // Update product quantity
      await db.collection('products').updateOne(
        { _id: new ObjectId(it.productId) },
        { $inc: { quantity: -it.quantity } }
      );
    }

    // Calculate discount
    const discountAmount = (subtotal * discountPercent) / 100;
    const afterDiscount = subtotal - discountAmount;
    
    // Calculate GST
    let cgst = 0, sgst = 0, igst = 0;
    let gstAmount = 0;
    
    if (isSameState) {
      // Same state: CGST 9% + SGST 9% = 18%
      cgst = afterDiscount * 0.09;
      sgst = afterDiscount * 0.09;
      gstAmount = cgst + sgst;
    } else {
      // Different state: IGST 18%
      igst = afterDiscount * 0.18;
      gstAmount = igst;
    }
    
    const grandTotal = afterDiscount + gstAmount;
    const totalProfit = subtotal - totalCost - discountAmount; // Net profit after discount, before tax
    
    // Add calculated values to bill
    bill.subtotal = parseFloat(subtotal.toFixed(2));
    bill.discountAmount = parseFloat(discountAmount.toFixed(2));
    bill.afterDiscount = parseFloat(afterDiscount.toFixed(2));
    bill.cgst = parseFloat(cgst.toFixed(2));
    bill.sgst = parseFloat(sgst.toFixed(2));
    bill.igst = parseFloat(igst.toFixed(2));
    bill.gstAmount = parseFloat(gstAmount.toFixed(2));
    bill.grandTotal = parseFloat(grandTotal.toFixed(2));
    bill.totalCost = parseFloat(totalCost.toFixed(2));
    bill.totalProfit = parseFloat(totalProfit.toFixed(2));

    // Insert bill
    const result = await db.collection('bills').insertOne(bill);
    
    // Log audit trail
    await logAudit(db, 'SALE_COMPLETED', userId, username, {
      billId: result.insertedId.toString(),
      billNumber,
      customerName: bill.customerName,
      grandTotal: bill.grandTotal,
      profit: bill.totalProfit,
      itemCount: bill.items.length,
      paymentMode
    });
    
    // Send invoice email if customer has email
    if (customerId) {
      const customer = await db.collection('customers').findOne({ _id: new ObjectId(customerId) });
      if (customer && customer.email) {
        const invoiceData = {
          invoiceNumber: billNumber,
          date: bill.billDate,
          customer: {
            name: customerName,
            email: customer.email,
            phone: customerPhone
          },
          items: bill.items.map(item => ({
            name: item.productName,
            quantity: item.quantity,
            price: item.unitPrice,
            total: item.lineSubtotal
          })),
          subtotal: bill.subtotal,
          discountPercent: bill.discountPercent,
          discountAmount: bill.discountAmount,
          taxRate: 18,
          taxAmount: bill.gstAmount,
          cgst: bill.cgst,
          sgst: bill.sgst,
          igst: bill.igst,
          total: bill.grandTotal,
          paymentMode: bill.paymentMode
        };
        
        // Send email asynchronously (don't wait for it)
        sendInvoiceEmail(invoiceData, customer.email).catch(err => {
          logger.error('Failed to send invoice email:', err);
        });
      }
    }
    
    res.json({ 
      billId: result.insertedId.toString(), 
      billNumber,
      customerName: bill.customerName,
      customerPhone: bill.customerPhone,
      paymentMode: bill.paymentMode,
      items: bill.items.map(item => ({
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        lineSubtotal: item.lineSubtotal
      })),
      subtotal: bill.subtotal,
      discountPercent: bill.discountPercent,
      discountAmount: bill.discountAmount,
      afterDiscount: bill.afterDiscount,
      gstAmount: bill.gstAmount,
      grandTotal: bill.grandTotal,
      profit: bill.totalProfit
    });
  } catch (e) {
    logger.error(e);
    res.status(500).json({ error: e.message });
  }
});

// Add Product
app.post('/api/products', async (req, res) => {
  try {
    const { name, quantity, price, costPrice, hsnCode, minStock, userId, username, autoFetchImage = true } = req.body;
    
    // Validate product data
    const productData = { name, quantity, price, costPrice, hsnCode, minStock };
    const validationErrors = validateProduct(productData);
    if (validationErrors.length > 0) {
      return res.status(400).json({ error: validationErrors.join(', ') });
    }
    
    const db = getDB();
    
    const product = {
      name: sanitizeObject(name),
      quantity: parseInt(quantity) || 0,
      price: parseFloat(price) || 0,
      costPrice: parseFloat(costPrice) || 0,
      hsnCode: hsnCode || '9999',
      minStock: parseInt(minStock) || 10,
      barcode: null, // Will be generated after insertion
      photo: null,   // Will be fetched automatically or uploaded separately
      createdAt: new Date(),
      createdBy: userId || null,
      createdByUsername: username || 'Unknown'
    };
    
    const result = await db.collection('products').insertOne(product);
    const productId = result.insertedId.toString();
    
    // Generate automatic barcode
    const barcodeValue = generateProductBarcode(name, productId);
    
    // Attempt to auto-fetch product image
    let autoFetchedPhoto = null;
    if (autoFetchImage) {
      try {
        autoFetchedPhoto = await fetchProductImage(name);
      } catch (error) {
        logger.warn(`Failed to auto-fetch image for ${name}:`, error.message);
      }
    }
    
    // Update product with barcode and auto-fetched photo
    await db.collection('products').updateOne(
      { _id: result.insertedId },
      { 
        $set: { 
          barcode: barcodeValue,
          photo: autoFetchedPhoto 
        } 
      }
    );
    
    // Log audit trail
    await logAudit(db, 'PRODUCT_ADDED', userId, username, {
      productId: productId,
      productName: name,
      barcode: barcodeValue,
      quantity,
      price,
      costPrice,
      autoImage: autoFetchedPhoto ? 'success' : 'failed'
    });
    
    res.json({ 
      id: productId, 
      ...product,
      barcode: barcodeValue,
      photo: autoFetchedPhoto,
      autoImageFetched: !!autoFetchedPhoto
    });
  } catch (e) {
    logger.error(e);
    res.status(500).json({ error: e.message });
  }
});

// Update Product Stock
app.patch('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, userId, username } = req.body;
    const db = getDB();
    
    // Get product before update
    const product = await db.collection('products').findOne({ _id: new ObjectId(id) });
    const oldQuantity = product?.quantity || 0;
    const newQuantity = parseInt(quantity) || 0;
    
    await db.collection('products').updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: { 
          quantity: newQuantity,
          lastModifiedBy: userId || null,
          lastModifiedByUsername: username || 'Unknown',
          lastModified: new Date()
        } 
      }
    );
    
    // Log audit trail
    await logAudit(db, 'PRODUCT_STOCK_UPDATED', userId, username, {
      productId: id,
      productName: product?.name || 'Unknown',
      oldQuantity,
      newQuantity,
      change: newQuantity - oldQuantity
    });
    
    res.json({ success: true });
  } catch (e) {
    logger.error(e);
    res.status(500).json({ error: e.message });
  }
});

// Delete Product
app.delete('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, username } = req.query;
    const db = getDB();
    
    // Get product before deleting
    const product = await db.collection('products').findOne({ _id: new ObjectId(id) });
    
    // Delete product photo if exists
    if (product?.photo) {
      try {
        await fs.unlink(path.join(__dirname, 'uploads', 'products', path.basename(product.photo)));
      } catch (err) {
        logger.warn('Failed to delete product photo:', err.message);
      }
    }
    
    await db.collection('products').deleteOne({ _id: new ObjectId(id) });
    
    // Log audit trail
    await logAudit(db, 'PRODUCT_DELETED', userId, username, {
      productId: id,
      productName: product?.name || 'Unknown',
      quantity: product?.quantity || 0,
      price: product?.price || 0
    });
    
    res.json({ success: true });
  } catch (e) {
    logger.error(e);
    res.status(500).json({ error: e.message });
  }
});

// Generate barcode image for a product
app.get('/api/products/:id/barcode', async (req, res) => {
  try {
    const { id } = req.params;
    const format = req.query.format || 'image'; // 'image' or 'qr'
    const db = getDB();
    
    const product = await db.collection('products').findOne({ _id: new ObjectId(id) });
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    const barcodeValue = product.barcode || generateProductBarcode(product.name, id);
    
    if (format === 'qr') {
      // Generate QR code with product info
      const qrData = {
        id: id,
        name: product.name,
        barcode: barcodeValue,
        price: product.price
      };
      const qrImage = await generateQRCode(qrData);
      res.json({ barcode: barcodeValue, qrCode: qrImage });
    } else {
      // Generate standard barcode
      const barcodeImage = await generateBarcodeImage(barcodeValue);
      res.json({ barcode: barcodeValue, image: barcodeImage });
    }
  } catch (e) {
    logger.error(e);
    res.status(500).json({ error: e.message });
  }
});

// Search product by barcode (for POS scanning)
app.get('/api/products/barcode/:barcode', async (req, res) => {
  try {
    const { barcode } = req.params;
    const db = getDB();
    
    // Search by barcode, SKU, or product name (case-insensitive)
    const searchQuery = {
      $or: [
        { barcode: barcode },
        { sku: barcode },
        { name: { $regex: barcode, $options: 'i' } }
      ]
    };
    
    const product = await db.collection('products').findOne(searchQuery);
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json({
      id: product._id.toString(),
      name: product.name,
      price: product.price,
      costPrice: product.costPrice || 0,
      quantity: product.quantity,
      barcode: product.barcode,
      sku: product.sku,
      photo: product.photo
    });
  } catch (e) {
    logger.error(e);
    res.status(500).json({ error: e.message });
  }
});

// Upload product photo
app.post('/api/products/:id/photo', upload.single('photo'), async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, username } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ error: 'No photo file uploaded' });
    }
    
    const db = getDB();
    const product = await db.collection('products').findOne({ _id: new ObjectId(id) });
    
    if (!product) {
      // Clean up uploaded file
      await fs.unlink(req.file.path);
      return res.status(404).json({ error: 'Product not found' });
    }
    
    // Delete old photo if exists
    if (product.photo) {
      try {
        await fs.unlink(path.join(__dirname, 'uploads', 'products', path.basename(product.photo)));
      } catch (err) {
        logger.warn('Failed to delete old photo:', err.message);
      }
    }
    
    // Save relative URL path
    const photoUrl = `/uploads/products/${req.file.filename}`;
    
    await db.collection('products').updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: { 
          photo: photoUrl,
          lastModifiedBy: userId || null,
          lastModifiedByUsername: username || 'Unknown',
          lastModified: new Date()
        } 
      }
    );
    
    // Log audit trail
    await logAudit(db, 'PRODUCT_PHOTO_UPDATED', userId, username, {
      productId: id,
      productName: product.name,
      photoUrl: photoUrl
    });
    
    res.json({ 
      success: true, 
      photo: photoUrl,
      message: 'Product photo uploaded successfully' 
    });
  } catch (e) {
    logger.error(e);
    // Clean up file on error
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkErr) {
        logger.error('Failed to clean up file:', unlinkErr);
      }
    }
    res.status(500).json({ error: e.message });
  }
});

// Auto-fetch product photo from internet
app.post('/api/products/:id/auto-photo', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, username } = req.body;
    const db = getDB();
    
    const product = await db.collection('products').findOne({ _id: new ObjectId(id) });
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    // Delete old photo if exists
    if (product.photo) {
      try {
        await fs.unlink(path.join(__dirname, 'uploads', 'products', path.basename(product.photo)));
      } catch (err) {
        logger.warn('Failed to delete old photo:', err.message);
      }
    }
    
    // Fetch new image
    const autoFetchedPhoto = await fetchProductImage(product.name);
    
    if (!autoFetchedPhoto) {
      return res.status(404).json({ error: 'Could not find suitable image for this product' });
    }
    
    await db.collection('products').updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: { 
          photo: autoFetchedPhoto,
          lastModifiedBy: userId || null,
          lastModifiedByUsername: username || 'Unknown',
          lastModified: new Date()
        } 
      }
    );
    
    // Log audit trail
    await logAudit(db, 'PRODUCT_PHOTO_AUTO_FETCHED', userId, username, {
      productId: id,
      productName: product.name,
      photoUrl: autoFetchedPhoto
    });
    
    res.json({ 
      success: true, 
      photo: autoFetchedPhoto,
      message: 'Product photo auto-fetched successfully' 
    });
  } catch (e) {
    logger.error(e);
    res.status(500).json({ error: e.message });
  }
});

// Delete product photo
app.delete('/api/products/:id/photo', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, username } = req.query;
    const db = getDB();
    
    const product = await db.collection('products').findOne({ _id: new ObjectId(id) });
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    if (product.photo) {
      try {
        await fs.unlink(path.join(__dirname, 'uploads', 'products', path.basename(product.photo)));
      } catch (err) {
        logger.warn('Failed to delete photo file:', err.message);
      }
    }
    
    await db.collection('products').updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: { 
          photo: null,
          lastModifiedBy: userId || null,
          lastModifiedByUsername: username || 'Unknown',
          lastModified: new Date()
        } 
      }
    );
    
    // Log audit trail
    await logAudit(db, 'PRODUCT_PHOTO_DELETED', userId, username, {
      productId: id,
      productName: product.name
    });
    
    res.json({ success: true, message: 'Product photo deleted successfully' });
  } catch (e) {
    logger.error(e);
    res.status(500).json({ error: e.message });
  }
});

// Add Customer
app.post('/api/customers', async (req, res) => {
  try {
    const { name, phone, address, gstin, userId, username } = req.body;
    
    // Validate customer data
    const customerData = { name, phone, address, gstin };
    const validationErrors = validateCustomer(customerData);
    if (validationErrors.length > 0) {
      return res.status(400).json({ error: validationErrors.join(', ') });
    }
    
    const db = getDB();
    
    const customer = {
      name: sanitizeObject(name),
      phone: phone ? sanitizeObject(phone) : '',
      address: address ? sanitizeObject(address) : '',
      gstin: gstin ? sanitizeObject(gstin) : '',
      createdAt: new Date(),
      createdBy: userId || null,
      createdByUsername: username || 'Unknown'
    };
    
    const result = await db.collection('customers').insertOne(customer);
    
    // Log audit trail
    await logAudit(db, 'CUSTOMER_ADDED', userId, username, {
      customerId: result.insertedId.toString(),
      customerName: name,
      phone
    });
    
    res.json({ id: result.insertedId.toString(), ...customer });
  } catch (e) {
    logger.error(e);
    res.status(500).json({ error: e.message });
  }
});

// Get Invoices
app.get('/api/invoices', async (req, res) => {
  try {
    const db = getDB();
    const bills = await db.collection('bills')
      .find({})
      .sort({ billDate: -1 })
      .limit(100)
      .toArray();
    
    const formatted = bills.map(bill => ({
      id: bill._id.toString(),
      customer_id: bill.customerId ? bill.customerId.toString() : null,
      customer_name: bill.customerName || 'Walk-in',
      customerPhone: bill.customerPhone || null,
      customerAddress: bill.customerAddress || null,
      subtotal: bill.subtotal || 0,
      discountPercent: bill.discountPercent || 0,
      discountValue: bill.discountPercent || 0,
      discountAmount: bill.discountAmount || 0,
      afterDiscount: bill.afterDiscount || 0,
      taxRate: (bill.cgst > 0 || bill.sgst > 0) ? 18 : (bill.igst > 0 ? 18 : 0),
      taxAmount: bill.gstAmount || 0,
      cgst: bill.cgst || 0,
      sgst: bill.sgst || 0,
      igst: bill.igst || 0,
      total: bill.grandTotal || 0,
      totalProfit: bill.totalProfit || 0,
      paymentMode: bill.paymentMode || 'Cash',
      splitPaymentDetails: bill.splitPaymentDetails || null,
      items: bill.items ? bill.items.map(item => ({
        productId: item.productId ? item.productId.toString() : null,
        productName: item.productName || 'Unknown',
        name: item.productName || 'Unknown',
        hsnCode: item.hsnCode || '9999',
        quantity: item.quantity || 0,
        unitPrice: item.unitPrice || 0,
        price: item.unitPrice || 0,
        lineSubtotal: item.lineSubtotal || 0
      })) : [],
      created_at: bill.billDate,
      date: bill.billDate,
      createdByUsername: bill.createdByUsername || 'Unknown',
      billNumber: bill.billNumber || bill._id.toString()
    }));
    
    res.json(formatted);
  } catch (e) {
    logger.error(e);
    res.status(500).json({ error: e.message });
  }
});

// Get Stats
app.get('/api/stats', async (req, res) => {
  try {
    const db = getDB();
    
    const productCount = await db.collection('products').countDocuments();
    const customerCount = await db.collection('customers').countDocuments();
    
    const revenueResult = await db.collection('bills').aggregate([
      { $match: { paymentStatus: 'Paid' } },
      { $group: { _id: null, total: { $sum: '$grandTotal' } } }
    ]).toArray();
    
    const invoiceCount = await db.collection('bills').countDocuments();
    const lowStockCount = await db.collection('products').countDocuments({ quantity: { $lt: 20 } });
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todaySalesResult = await db.collection('bills').aggregate([
      { 
        $match: { 
          paymentStatus: 'Paid',
          billDate: { $gte: today }
        } 
      },
      { $group: { _id: null, total: { $sum: '$grandTotal' }, profit: { $sum: '$totalProfit' } } }
    ]).toArray();

    res.json({
      totalProducts: productCount,
      totalCustomers: customerCount,
      totalRevenue: revenueResult.length > 0 ? revenueResult[0].total : 0,
      totalInvoices: invoiceCount,
      lowStockCount: lowStockCount,
      todaySales: todaySalesResult.length > 0 ? todaySalesResult[0].total : 0,
      todayProfit: todaySalesResult.length > 0 ? todaySalesResult[0].profit : 0
    });
  } catch (e) {
    logger.error(e);
    res.status(500).json({ error: e.message });
  }
});

// ==================== AUDIT TRAIL SYSTEM ====================

// Helper function to log user actions
async function logAudit(db, action, userId, username, details = {}) {
  try {
    const auditLog = {
      action,
      userId: userId ? new ObjectId(userId) : null,
      username: username || 'System',
      timestamp: new Date(),
      details,
      ipAddress: null // Can be enhanced to capture IP
    };
    
    await db.collection('audit_logs').insertOne(auditLog);
  } catch (e) {
    logger.error('Audit logging error:', e);
  }
}

// Get Audit Logs (Admin Only)
app.get('/api/audit-logs', async (req, res) => {
  try {
    const db = getDB();
    const limit = parseInt(req.query.limit) || 100;
    const action = req.query.action; // Filter by action type
    
    let query = {};
    if (action) {
      query.action = action;
    }
    
    const logs = await db.collection('audit_logs')
      .find(query)
      .sort({ timestamp: -1 })
      .limit(limit)
      .toArray();
    
    const formatted = logs.map(log => ({
      id: log._id.toString(),
      action: log.action,
      userId: log.userId ? log.userId.toString() : null,
      username: log.username,
      timestamp: log.timestamp,
      details: log.details
    }));
    
    res.json(formatted);
  } catch (e) {
    logger.error('Get audit logs error:', e);
    res.status(500).json({ error: e.message });
  }
});

// Get User Activity Summary (Admin Only)
app.get('/api/audit-logs/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const db = getDB();
    
    const logs = await db.collection('audit_logs')
      .find({ userId: new ObjectId(userId) })
      .sort({ timestamp: -1 })
      .limit(50)
      .toArray();
    
    const summary = await db.collection('audit_logs').aggregate([
      { $match: { userId: new ObjectId(userId) } },
      { $group: { _id: '$action', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]).toArray();
    
    res.json({
      recentActivity: logs.map(log => ({
        id: log._id.toString(),
        action: log.action,
        timestamp: log.timestamp,
        details: log.details
      })),
      summary: summary.map(s => ({
        action: s._id,
        count: s.count
      }))
    });
  } catch (e) {
    logger.error('Get user activity error:', e);
    res.status(500).json({ error: e.message });
  }
});

// ==================== USER MANAGEMENT ENDPOINTS ====================

// OTP ENDPOINTS REMOVED - Direct registration enabled

// Step 1: Send OTP to email [DISABLED]
/* app.post('/api/users/send-otp', async (req, res) => {
  console.log('📧 Received OTP request for:', req.body.email);
  try {
    const { email } = req.body;
    
    if (!email) {
      console.log('❌ No email provided');
      return res.status(400).json({ error: 'Email is required' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log('❌ Invalid email format:', email);
      return res.status(400).json({ error: 'Invalid email format' });
    }

    const db = getDB();
    console.log('✅ Database connected');
    
    // Check if email already registered
    const existingEmail = await db.collection('users').findOne({ email: email.toLowerCase() });
    if (existingEmail) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Generate OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    console.log('\n========================================');
    console.log('🔢 GENERATED OTP:', otp);
    console.log('📧 For Email:', email);
    console.log('⏰ Expires At:', expiresAt.toLocaleString());
    console.log('========================================\n');

    // Store OTP in database
    await db.collection('otps').deleteMany({ email: email.toLowerCase() }); // Remove old OTPs
    await db.collection('otps').insertOne({
      email: email.toLowerCase(),
      otp: otp,
      expiresAt: expiresAt,
      verified: false,
      createdAt: new Date()
    });
    console.log('💾 OTP stored in database');

    // OTP generation complete - Email sending disabled
    console.log('\n📤 OTP generated successfully');
    console.log('   OTP:', otp);
    console.log('   For:', email);
    
    // Success response - Return OTP directly since email is disabled
      res.json({ 
        success: true, 
        message: 'OTP sent successfully! Check your email inbox (and spam folder).',
        expiresIn: 600,
        emailSent: true
      });
      
    } catch (emailError) {
      logger.error('\n❌❌❌ EMAIL FAILED TO SEND ❌❌❌');
      logger.error('Error Message:', emailError.message);
      logger.error('Error Code:', emailError.code);
      logger.error('Command:', emailError.command);
      
      // Still return success but warn user
      res.json({ 
        success: true, 
        message: `OTP generated but email failed. Your OTP is: ${otp} (Check server logs)`,
        expiresIn: 600,
        otp: otp, // Show OTP since email failed
        emailSent: false,
        emailError: emailError.message
      });
    }
  } catch (e) {
    logger.error('Send OTP error:', e);
    res.status(500).json({ error: e.message });
  }
});

// Step 2: Verify OTP
app.post('/api/users/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    
    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP are required' });
    }

    const db = getDB();
    
    // Find OTP record
    const otpRecord = await db.collection('otps').findOne({ 
      email: email.toLowerCase(),
      otp: otp 
    });

    if (!otpRecord) {
      return res.status(400).json({ error: 'Invalid OTP' });
    }

    // Check if OTP expired
    if (new Date() > otpRecord.expiresAt) {
      await db.collection('otps').deleteOne({ _id: otpRecord._id });
      return res.status(400).json({ error: 'OTP expired. Please request a new one.' });
    }

    // Mark as verified
    await db.collection('otps').updateOne(
      { _id: otpRecord._id },
      { $set: { verified: true } }
    );

    res.json({ 
      success: true, 
      message: 'Email verified successfully!' 
    });
  } catch (e) {
    logger.error('Verify OTP error:', e);
    res.status(500).json({ error: e.message });
  }
});

*/ // End of disabled OTP endpoints

// Register User (Direct - No OTP Required)
app.post('/api/users/register', async (req, res) => {
  try {
    const { username, password, email } = req.body;
    
    // Validate user registration data
    const userData = { username, password, email };
    const validationErrors = validateUserRegistration(userData);
    if (validationErrors.length > 0) {
      return res.status(400).json({ error: validationErrors.join(', ') });
    }
    
    const db = getDB();
    
    // Direct registration (No OTP verification required)
    
    // Check if username already exists
    const existingUser = await db.collection('users').findOne({ username: username.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ error: 'Username already taken' });
    }
    
    // Check if email already exists
    const existingEmail = await db.collection('users').findOne({ email: email.toLowerCase() });
    if (existingEmail) {
      return res.status(400).json({ error: 'Email already registered' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user (sanitize inputs)
    const user = {
      username: sanitizeObject(username.toLowerCase()),
      password: hashedPassword,
      email: sanitizeObject(email.toLowerCase()),
      role: 'user',
      approved: false,
      createdAt: new Date(),
      lastLogin: null
    };
    
    const result = await db.collection('users').insertOne(user);
    
    res.json({
      success: true,
      message: 'Registration successful! Please wait for admin approval.',
      user: {
        id: result.insertedId.toString(),
        username: user.username,
        email: user.email,
        approved: user.approved
      }
    });
  } catch (e) {
    logger.error('Registration error:', e);
    res.status(500).json({ error: e.message });
  }
});

// User Login
app.post('/api/users/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }
    
    const db = getDB();
    
    // Find user
    const user = await db.collection('users').findOne({ username: username.toLowerCase() });
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    
    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.password);
    
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    
    // Check if approved
    if (!user.approved) {
      return res.status(403).json({ 
        error: 'Your account is pending admin approval',
        approved: false
      });
    }
    
    // Update last login
    await db.collection('users').updateOne(
      { _id: user._id },
      { $set: { lastLogin: new Date() } }
    );
    
    res.json({
      success: true,
      user: {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
        role: user.role,
        approved: user.approved
      }
    });
  } catch (e) {
    logger.error('Login error:', e);
    res.status(500).json({ error: e.message });
  }
});



// Get All Users (Admin Only)
app.get('/api/users', async (req, res) => {
  try {
    const db = getDB();
    
    const users = await db.collection('users')
      .find({})
      .sort({ createdAt: -1 })
      .toArray();
    
    const formatted = users.map(u => ({
      _id: u._id.toString(),
      username: u.username,
      email: u.email,
      role: u.role,
      approved: u.approved,
      createdAt: u.createdAt,
      lastLogin: u.lastLogin
    }));
    
    res.json(formatted);
  } catch (e) {
    logger.error('Get users error:', e);
    res.status(500).json({ error: e.message });
  }
});

// Approve User (Admin Only)
app.patch('/api/users/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDB();
    
    await db.collection('users').updateOne(
      { _id: new ObjectId(id) },
      { $set: { approved: true } }
    );
    
    res.json({ success: true, message: 'User approved successfully' });
  } catch (e) {
    logger.error('Approve user error:', e);
    res.status(500).json({ error: e.message });
  }
});

// Unapprove User (Admin Only) - Revoke access without deleting
app.patch('/api/users/:id/unapprove', async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDB();
    
    await db.collection('users').updateOne(
      { _id: new ObjectId(id) },
      { $set: { approved: false } }
    );
    
    res.json({ success: true, message: 'User access revoked successfully' });
  } catch (e) {
    logger.error('Unapprove user error:', e);
    res.status(500).json({ error: e.message });
  }
});

// Change User Role (Admin Only)
app.patch('/api/users/:id/role', async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    const db = getDB();
    
    // Validate role
    const validRoles = ['admin', 'manager', 'cashier'];
    if (!role || !validRoles.includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be admin, manager, or cashier.' });
    }
    
    // Update user role
    const result = await db.collection('users').updateOne(
      { _id: new ObjectId(id) },
      { $set: { role: role } }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    logger.info(`User role updated: ${id} -> ${role}`);
    res.json({ success: true, message: 'User role updated successfully', role: role });
  } catch (e) {
    logger.error('Change user role error:', e);
    res.status(500).json({ error: e.message });
  }
});

// Delete User (Admin Only)
app.delete('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDB();
    
    // Get user info before deleting
    const userToDelete = await db.collection('users').findOne({ _id: new ObjectId(id) });
    
    if (!userToDelete) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    await db.collection('users').deleteOne({ _id: new ObjectId(id) });
    
    res.json({ 
      success: true, 
      message: 'User deleted successfully',
      deletedUserId: id,
      deletedUsername: userToDelete.username
    });
  } catch (e) {
    logger.error('Delete user error:', e);
    res.status(500).json({ error: e.message });
  }
});

// Check if user account still exists and is approved (for session validation)
app.get('/api/users/check/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDB();
    
    const user = await db.collection('users').findOne({ _id: new ObjectId(id) });
    
    if (!user) {
      return res.json({ 
        exists: false, 
        approved: false,
        message: 'User account not found'
      });
    }
    
    res.json({ 
      exists: true, 
      approved: user.approved,
      username: user.username
    });
  } catch (e) {
    logger.error('Check user error:', e);
    res.status(500).json({ error: e.message });
  }
});

// ==================== ANALYTICS ENDPOINTS ====================

// Get sales trend (last 30 days)
app.get('/api/analytics/sales-trend', async (req, res) => {
  try {
    const db = getDB();
    const days = parseInt(req.query.days) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const sales = await db.collection('bills')
      .find({ billDate: { $gte: startDate } })
      .sort({ billDate: 1 })
      .toArray();
    
    // Group by date
    const dailySales = {};
    sales.forEach(bill => {
      const date = new Date(bill.billDate).toLocaleDateString();
      if (!dailySales[date]) {
        dailySales[date] = { revenue: 0, profit: 0, count: 0 };
      }
      dailySales[date].revenue += bill.grandTotal || 0;
      dailySales[date].profit += bill.totalProfit || 0;
      dailySales[date].count += 1;
    });
    
    res.json(dailySales);
  } catch (e) {
    logger.error(e);
    res.status(500).json({ error: 'Failed to get sales trend' });
  }
});

// Get top products
app.get('/api/analytics/top-products', async (req, res) => {
  try {
    const db = getDB();
    const limit = parseInt(req.query.limit) || 10;
    const days = parseInt(req.query.days) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const bills = await db.collection('bills')
      .find({ billDate: { $gte: startDate } })
      .toArray();
    
    // Aggregate product sales
    const productSales = {};
    bills.forEach(bill => {
      bill.items.forEach(item => {
        const productName = item.productName;
        if (!productSales[productName]) {
          productSales[productName] = { 
            quantity: 0, 
            revenue: 0, 
            profit: 0 
          };
        }
        productSales[productName].quantity += item.quantity;
        productSales[productName].revenue += item.lineSubtotal || 0;
        productSales[productName].profit += item.lineProfit || 0;
      });
    });
    
    // Sort by revenue and get top N
    const topProducts = Object.entries(productSales)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, limit);
    
    res.json(topProducts);
  } catch (e) {
    logger.error(e);
    res.status(500).json({ error: 'Failed to get top products' });
  }
});

// Get low stock items
app.get('/api/analytics/low-stock', async (req, res) => {
  try {
    const db = getDB();
    
    const lowStock = await db.collection('products')
      .find({ $expr: { $lte: ['$quantity', '$minStock'] } })
      .sort({ quantity: 1 })
      .toArray();
    
    const formatted = lowStock.map(p => ({
      name: p.name,
      currentStock: p.quantity,
      minStock: p.minStock || 10,
      shortage: (p.minStock || 10) - p.quantity
    }));
    
    res.json(formatted);
  } catch (e) {
    logger.error(e);
    res.status(500).json({ error: 'Failed to get low stock items' });
  }
});

// Get revenue vs profit summary
app.get('/api/analytics/revenue-profit', async (req, res) => {
  try {
    const db = getDB();
    const days = parseInt(req.query.days) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const bills = await db.collection('bills')
      .find({ billDate: { $gte: startDate } })
      .toArray();
    
    const totalRevenue = bills.reduce((sum, bill) => sum + (bill.grandTotal || 0), 0);
    const totalProfit = bills.reduce((sum, bill) => sum + (bill.totalProfit || 0), 0);
    const totalCost = bills.reduce((sum, bill) => sum + (bill.totalCost || 0), 0);
    const totalBills = bills.length;
    
    res.json({
      totalRevenue: parseFloat(totalRevenue.toFixed(2)),
      totalProfit: parseFloat(totalProfit.toFixed(2)),
      totalCost: parseFloat(totalCost.toFixed(2)),
      profitMargin: totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(2) : 0,
      totalBills,
      averageOrderValue: totalBills > 0 ? (totalRevenue / totalBills).toFixed(2) : 0
    });
  } catch (e) {
    logger.error(e);
    res.status(500).json({ error: 'Failed to get revenue-profit data' });
  }
});

// ==================== BACKUP ENDPOINTS ====================

// Backup all data to JSON
app.get('/api/backup/json', async (req, res) => {
  try {
    const db = getDB();
    const backup = {
      timestamp: new Date().toISOString(),
      products: await db.collection('products').find({}).toArray(),
      customers: await db.collection('customers').find({}).toArray(),
      bills: await db.collection('bills').find({}).toArray(),
      users: await db.collection('users').find({}, { projection: { password: 0 } }).toArray()
    };
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=backup-${Date.now()}.json`);
    res.json(backup);
  } catch (e) {
    logger.error(e);
    res.status(500).json({ error: 'Backup failed' });
  }
});

// Export products to CSV
app.get('/api/export/products', async (req, res) => {
  try {
    const db = getDB();
    const products = await db.collection('products').find({}).toArray();
    
    let csv = 'Name,SKU,Quantity,Price,Cost Price,HSN Code,Min Stock,Profit\n';
    products.forEach(p => {
      const profit = p.price - (p.costPrice || 0);
      csv += `"${p.name}","${p.sku || ''}",${p.quantity},${p.price},${p.costPrice || 0},"${p.hsnCode || ''}",${p.minStock || 10},${profit}\n`;
    });
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=products-${Date.now()}.csv`);
    res.send(csv);
  } catch (e) {
    logger.error(e);
    res.status(500).json({ error: 'Export failed' });
  }
});

// Export invoices to CSV
app.get('/api/export/invoices', async (req, res) => {
  try {
    const db = getDB();
    const bills = await db.collection('bills').find({}).toArray();
    
    let csv = 'Bill Number,Date,Customer,Items,Subtotal,Discount,Tax,Total,Profit,Payment Mode\n';
    bills.forEach(b => {
      const itemCount = b.items?.length || 0;
      csv += `"${b.billNumber}","${new Date(b.billDate).toLocaleString()}","${b.customerName}",${itemCount},${b.subtotal},${b.discountAmount},${b.gstAmount},${b.grandTotal},${b.totalProfit},"${b.paymentMode}"\n`;
    });
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=invoices-${Date.now()}.csv`);
    res.send(csv);
  } catch (e) {
    logger.error(e);
    res.status(500).json({ error: 'Export failed' });
  }
});

// NOTE: No static file serving - this is an API-only server
// Frontend is deployed separately on Vercel

const port = process.env.PORT || 4000;

// Initialize your original admin user
async function initializeAdminUser() {
  try {
    const db = getDB();
    const usersCollection = db.collection('users');
    
    // Get admin credentials from environment variables
    const adminUsername = process.env.ADMIN_USERNAME || 'admin';
    const adminPassword = process.env.ADMIN_PASSWORD || 'defaultpass123';
    
    // Check if your original admin account exists
    const existingAdmin = await usersCollection.findOne({ username: adminUsername });
    
    if (!existingAdmin) {
      // Create your original admin account
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      
      await usersCollection.insertOne({
        username: adminUsername,
        password: hashedPassword,
        email: 'admin@example.com',
        role: 'admin',
        approved: true,
        createdAt: new Date(),
        isDefault: true
      });
      
      logger.info(`✅ Created admin user: ${adminUsername}`);
    } else {
      logger.info(`ℹ️  Admin user already exists: ${adminUsername}`);
    }
    
  } catch (error) {
    logger.error('Error initializing admin user:', error);
  }
}

// ADMIN ONLY - Clear all database collections
app.delete('/api/admin/clear-all-data', async (req, res) => {
  try {
    const db = getDB();
    
    // Clear all collections
    await db.collection('products').deleteMany({});
    await db.collection('customers').deleteMany({});
    await db.collection('bills').deleteMany({});
    await db.collection('expenses').deleteMany({});
    await db.collection('audit_logs').deleteMany({});
    
    // Keep users collection but delete all except admin
    await db.collection('users').deleteMany({ role: { $ne: 'admin' } });
    
    logger.info('🗑️  All database data cleared successfully');
    
    res.json({ 
      success: true, 
      message: 'All data cleared successfully',
      cleared: {
        products: true,
        customers: true,
        bills: true,
        expenses: true,
        audit_logs: true,
        users: 'All non-admin users deleted'
      }
    });
  } catch (error) {
    logger.error('Error clearing database:', error);
    res.status(500).json({ error: 'Failed to clear database', details: error.message });
  }
});

// Connect to MongoDB and start server
connectDB()
  .then(async () => {
    // Initialize your original admin user
    await initializeAdminUser();
    
    app.listen(port, () => {
      logger.info(`🚀 Inventory API listening on port ${port}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  })
  .catch(err => {
    logger.error('Failed to connect to database:', err);
    process.exit(1);
  });
