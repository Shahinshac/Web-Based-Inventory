// Quick script to add sample products for testing
const { MongoClient } = require('mongodb');
require('dotenv').config();

const sampleProducts = [
  {
    name: "iPhone 14 Pro Max",
    quantity: 25,
    price: 129999,
    costPrice: 120000,
    hsnCode: "85171200",
    minStock: 5,
    sku: "IPHONE14PM",
    barcode: "1234567890123"
  },
  {
    name: "Samsung Galaxy S23 Ultra",
    quantity: 18,
    price: 119999,
    costPrice: 110000,
    hsnCode: "85171200",
    minStock: 3,
    sku: "SAMS23U",
    barcode: "1234567890124"
  },
  {
    name: "MacBook Air M2",
    quantity: 12,
    price: 119900,
    costPrice: 110000,
    hsnCode: "84713000",
    minStock: 2,
    sku: "MBAIRM2",
    barcode: "1234567890125"
  },
  {
    name: "Sony WH-1000XM5",
    quantity: 30,
    price: 29990,
    costPrice: 25000,
    hsnCode: "85183000",
    minStock: 5,
    sku: "SONYWH1000",
    barcode: "1234567890126"
  },
  {
    name: "iPad Pro 11",
    quantity: 15,
    price: 89999,
    costPrice: 82000,
    hsnCode: "84713000",
    minStock: 3,
    sku: "IPADPRO11",
    barcode: "1234567890127"
  }
];

const sampleCustomers = [
  {
    name: "Rajesh Kumar",
    phone: "9876543210",
    address: "123 MG Road, Bangalore",
    gstin: "29AABCU9603R1ZX"
  },
  {
    name: "Priya Sharma",
    phone: "9876543211",
    address: "456 Brigade Road, Bangalore",
    gstin: ""
  },
  {
    name: "Amit Patel",
    phone: "9876543212",
    address: "789 Commercial Street, Bangalore",
    gstin: "29AABCU9603R1ZY"
  }
];

async function addSampleData() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('inventorydb');
    
    // Add products
    const productsResult = await db.collection('products').insertMany(sampleProducts);
    console.log(`✅ Added ${productsResult.insertedCount} products`);
    
    // Add customers  
    const customersResult = await db.collection('customers').insertMany(sampleCustomers);
    console.log(`✅ Added ${customersResult.insertedCount} customers`);
    
    console.log('✅ Sample data added successfully!');
    console.log('🚀 You can now test transactions in your app');
    
  } catch (error) {
    console.error('❌ Error adding sample data:', error);
  } finally {
    await client.close();
  }
}

addSampleData();