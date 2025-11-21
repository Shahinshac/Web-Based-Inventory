const { MongoClient } = require('mongodb');
const logger = require('./logger');

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const dbName = process.env.DB_NAME || 'inventorydb';

let client;
let db;

// Mask credentials in URI for safe logging
function maskUri(connectionUri) {
  try {
    const url = new URL(connectionUri);
    if (url.password) url.password = '***';
    if (url.username) url.username = url.username.substring(0, 3) + '***';
    return url.toString();
  } catch {
    return connectionUri.substring(0, 20) + '***';
  }
}

// Create database indexes for optimal performance
async function createIndexes(database) {
  try {
    logger.info('🔧 Creating database indexes...');
    
    // Products collection indexes
    await database.collection('products').createIndex({ name: 1 });
    await database.collection('products').createIndex({ sku: 1 }, { unique: true, sparse: true });
    await database.collection('products').createIndex({ quantity: 1 });
    await database.collection('products').createIndex({ price: 1 });
    await database.collection('products').createIndex({ hsnCode: 1 });
    
    // Customers collection indexes
    await database.collection('customers').createIndex({ name: 1 });
    await database.collection('customers').createIndex({ phone: 1 }, { sparse: true });
    await database.collection('customers').createIndex({ email: 1 }, { sparse: true });
    
    // Invoices collection indexes
    await database.collection('invoices').createIndex({ created_at: -1 }); // Most recent first
    await database.collection('invoices').createIndex({ customer_id: 1 });
    await database.collection('invoices').createIndex({ total: -1 });
    await database.collection('invoices').createIndex({ 'items.productId': 1 });
    
    // Users collection indexes
    await database.collection('users').createIndex({ username: 1 }, { unique: true });
    await database.collection('users').createIndex({ email: 1 }, { unique: true });
    await database.collection('users').createIndex({ approved: 1 });
    await database.collection('users').createIndex({ role: 1 });
    await database.collection('users').createIndex({ lastLogin: -1 });
    
    logger.info('✅ Database indexes created successfully\n');
  } catch (error) {
    console.warn('⚠️  Index creation warning (non-critical):', error.message);
    // Don't fail deployment if indexes already exist or have minor issues
  }
}

async function connectDB() {
  if (db) return db;
  
  const maxAttempts = 6;
  let attempt = 0;
  
  // Validate and log connection info (masked)
  logger.info('🔐 MongoDB URI format:', uri.startsWith('mongodb+srv://') ? 'SRV' : 'Standard');
  logger.info('🔗 Connecting to:', maskUri(uri));
  logger.info('📦 Database name:', dbName);
  logger.info('🏗️  Node.js version:', process.version);
  logger.info('📚 MongoDB driver version:', require('mongodb/package.json').version);
  
  while (attempt < maxAttempts) {
    attempt++;
    const timestamp = new Date().toISOString();
    logger.info(`\n[${timestamp}] 🔄 Connection attempt ${attempt}/${maxAttempts}...`);
    
    try {
      // Robust connection options for Node.js 20 + MongoDB Atlas
      const options = {
        // Parser and topology (required for driver v4+)
        useNewUrlParser: true,
        useUnifiedTopology: true,
        
        // Timeouts
        serverSelectionTimeoutMS: 10000,
        connectTimeoutMS: 10000,
        socketTimeoutMS: 45000,
        
        // Network
        family: 4, // Force IPv4 to avoid IPv6 resolution issues
        
        // TLS/SSL - Let Atlas connection string control TLS
        // Don't override with conflicting options
        tls: uri.includes('mongodb+srv://') || uri.includes('ssl=true') || uri.includes('tls=true'),
        
        // Retry logic
        retryWrites: true,
        retryReads: true,
        
        // Connection pool
        maxPoolSize: 10,
        minPoolSize: 2,
      };
      
      logger.info('⚙️  Connection options:', JSON.stringify({
        ...options,
        useNewUrlParser: options.useNewUrlParser,
        useUnifiedTopology: options.useUnifiedTopology,
        tls: options.tls,
        family: options.family
      }, null, 2));
      
      client = new MongoClient(uri, options);
      await client.connect();
      
      // Test the connection
      const pingResult = await client.db('admin').command({ ping: 1 });
      logger.info('🏓 Ping result:', pingResult);
      
      db = client.db(dbName);
      
      // Log topology details for debugging
      const topology = client.topology;
      if (topology?.s?.description) {
        const desc = topology.s.description;
        logger.info('🌐 Topology type:', desc.type);
        
        if (desc.servers && desc.servers.size > 0) {
          const serverInfo = Array.from(desc.servers.entries()).map(([host, server]) => ({
            host,
            type: server.type,
            roundTripTime: server.roundTripTime
          }));
          logger.info('📡 Connected servers:', JSON.stringify(serverInfo, null, 2));
        }
      }
      
      logger.info('✅ Connected to MongoDB successfully');
      logger.info(`📊 Using database: ${dbName}\n`);
      
      // Create database indexes for performance
      await createIndexes(db);
      
      return db;
      
    } catch (error) {
      logger.error(`\n❌ Connection attempt ${attempt} failed`);
      logger.error('Error name:', error.name);
      logger.error('Error message:', error.message);
      
      // Detailed diagnostics without full stack trace spam
      if (error.cause) {
        logger.error('Underlying cause:', error.cause.message || error.cause);
      }
      
      // Check topology state if available
      if (client?.topology?.s?.description) {
        const desc = client.topology.s.description;
        logger.error('Topology state:', {
          type: desc.type,
          setName: desc.setName,
          serverCount: desc.servers?.size || 0
        });
        
        // Show server errors
        if (desc.servers && desc.servers.size > 0) {
          desc.servers.forEach((server, host) => {
            if (server.error) {
              logger.error(`Server ${host} error:`, server.error.message);
            }
          });
        }
      }
      
      // Detect and suggest fixes for common issues
      const errorMsg = error.message.toLowerCase();
      const errorCode = error.code;
      
      if (errorMsg.includes('tls') || errorMsg.includes('ssl') || errorMsg.includes('alert number 80')) {
        logger.error('\n⚠️  TLS/SSL HANDSHAKE FAILURE DETECTED');
        logger.error('Possible causes:');
        logger.error('  1. IP not whitelisted in MongoDB Atlas Network Access');
        logger.error('  2. TLS version mismatch (Atlas requires TLS 1.2+)');
        logger.error('  3. Certificate validation failure');
        logger.error('  4. Firewall blocking outbound connections');
        logger.error('\nActions to take:');
        logger.error('  ✓ Add 0.0.0.0/0 to Atlas Network Access (or Render IPs)');
        logger.error('  ✓ Ensure connection string includes &tls=true');
        logger.error('  ✓ Check Atlas cluster is not paused/stopped');
      }
      
      if (errorMsg.includes('replicasetnoprimary') || errorMsg.includes('no primary')) {
        logger.error('\n⚠️  NO PRIMARY REPLICA DETECTED');
        logger.error('Actions: Check MongoDB Atlas cluster status and health');
      }
      
      if (errorMsg.includes('enotfound') || errorMsg.includes('querysrv')) {
        logger.error('\n⚠️  DNS/SRV RESOLUTION FAILURE');
        logger.error('Actions: Check DNS settings, try standard connection string instead of SRV');
      }
      
      if (errorCode === 'ETIMEDOUT' || errorCode === 'ECONNREFUSED') {
        logger.error('\n⚠️  NETWORK CONNECTIVITY ISSUE');
        logger.error('Actions: Check firewall, proxy settings, or Atlas status');
      }
      
      // If this was the last attempt, exit with error
      if (attempt >= maxAttempts) {
        logger.error('\n💥 ALL CONNECTION ATTEMPTS FAILED');
        logger.error('Deployment cannot proceed without database connection');
        logger.error('Review the error messages above and check:');
        logger.error('  - MONGODB_URI environment variable is correct');
        logger.error('  - MongoDB Atlas Network Access allows this IP');
        logger.error('  - MongoDB Atlas cluster is running');
        logger.error('  - No firewall blocking port 27017 or 27017+');
        
        // Exit with non-zero code for deployment failure
        process.exit(1);
      }
      
      // Exponential backoff: 1s, 2s, 4s, 8s, 16s, 16s
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 16000);
      logger.info(`⏳ Retrying in ${delay}ms...\n`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

function getDB() {
  if (!db) throw new Error('Database not connected. Call connectDB first.');
  return db;
}

async function closeDB() {
  if (client) {
    await client.close();
    logger.info('MongoDB connection closed');
  }
}

module.exports = { connectDB, getDB, closeDB };
