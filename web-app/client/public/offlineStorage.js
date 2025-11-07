// IndexedDB wrapper for offline data storage
class OfflineStorage {
  constructor() {
    this.dbName = 'InventoryOfflineDB';
    this.dbVersion = 1;
    this.db = null;
  }

  // Initialize IndexedDB
  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);
      
      request.onerror = () => {
        console.error('❌ IndexedDB error:', request.error);
        reject(request.error);
      };
      
      request.onsuccess = () => {
        this.db = request.result;
        console.log('✅ IndexedDB initialized');
        resolve(this.db);
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        console.log('🔧 Setting up IndexedDB schema...');
        
        // Offline transactions store
        if (!db.objectStoreNames.contains('offlineTransactions')) {
          const transactionStore = db.createObjectStore('offlineTransactions', {
            keyPath: 'id',
            autoIncrement: true
          });
          transactionStore.createIndex('timestamp', 'timestamp', { unique: false });
          transactionStore.createIndex('status', 'status', { unique: false });
        }
        
        // Cached products store
        if (!db.objectStoreNames.contains('products')) {
          const productStore = db.createObjectStore('products', {
            keyPath: '_id'
          });
          productStore.createIndex('name', 'name', { unique: false });
          productStore.createIndex('category', 'category', { unique: false });
          productStore.createIndex('lastUpdated', 'lastUpdated', { unique: false });
        }
        
        // Cached customers store
        if (!db.objectStoreNames.contains('customers')) {
          const customerStore = db.createObjectStore('customers', {
            keyPath: '_id'
          });
          customerStore.createIndex('name', 'name', { unique: false });
          customerStore.createIndex('phone', 'phone', { unique: false });
          customerStore.createIndex('lastUpdated', 'lastUpdated', { unique: false });
        }
        
        // Cached bills store (for recent transactions)
        if (!db.objectStoreNames.contains('bills')) {
          const billStore = db.createObjectStore('bills', {
            keyPath: '_id'
          });
          billStore.createIndex('billNumber', 'billNumber', { unique: false });
          billStore.createIndex('date', 'date', { unique: false });
          billStore.createIndex('total', 'total', { unique: false });
          billStore.createIndex('lastUpdated', 'lastUpdated', { unique: false });
        }
        
        // App settings store
        if (!db.objectStoreNames.contains('settings')) {
          const settingsStore = db.createObjectStore('settings', {
            keyPath: 'key'
          });
        }
        
        console.log('✅ IndexedDB schema created');
      };
    });
  }

  // Generic method to add data to a store
  async addData(storeName, data) {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      
      // Add timestamp for tracking
      const dataWithTimestamp = {
        ...data,
        lastUpdated: new Date().toISOString()
      };
      
      const request = store.add(dataWithTimestamp);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Generic method to update data in a store
  async updateData(storeName, data) {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      
      // Add timestamp for tracking
      const dataWithTimestamp = {
        ...data,
        lastUpdated: new Date().toISOString()
      };
      
      const request = store.put(dataWithTimestamp);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Generic method to get all data from a store
  async getAllData(storeName) {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Generic method to get data by ID
  async getDataById(storeName, id) {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(id);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Generic method to delete data by ID
  async deleteData(storeName, id) {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(id);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Clear all data from a store
  async clearStore(storeName) {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Offline transaction specific methods
  async saveOfflineTransaction(billData, token) {
    const transaction = {
      data: billData,
      token: token,
      timestamp: new Date().toISOString(),
      status: 'pending',
      retryCount: 0
    };
    
    return this.addData('offlineTransactions', transaction);
  }

  async getOfflineTransactions() {
    return this.getAllData('offlineTransactions');
  }

  async removeOfflineTransaction(id) {
    return this.deleteData('offlineTransactions', id);
  }

  async updateOfflineTransactionStatus(id, status) {
    const transaction = await this.getDataById('offlineTransactions', id);
    if (transaction) {
      transaction.status = status;
      transaction.retryCount = (transaction.retryCount || 0) + 1;
      return this.updateData('offlineTransactions', transaction);
    }
  }

  // Cache management methods
  async cacheProducts(products) {
    // Clear existing products
    await this.clearStore('products');
    
    // Add all products
    const promises = products.map(product => this.updateData('products', product));
    return Promise.all(promises);
  }

  async getCachedProducts() {
    return this.getAllData('products');
  }

  async cacheCustomers(customers) {
    // Clear existing customers
    await this.clearStore('customers');
    
    // Add all customers
    const promises = customers.map(customer => this.updateData('customers', customer));
    return Promise.all(promises);
  }

  async getCachedCustomers() {
    return this.getAllData('customers');
  }

  async cacheBills(bills) {
    // Clear existing bills
    await this.clearStore('bills');
    
    // Add recent bills (limit to last 100)
    const recentBills = bills.slice(-100);
    const promises = recentBills.map(bill => this.updateData('bills', bill));
    return Promise.all(promises);
  }

  async getCachedBills() {
    return this.getAllData('bills');
  }

  // Settings management
  async saveSetting(key, value) {
    return this.updateData('settings', { key, value });
  }

  async getSetting(key) {
    const setting = await this.getDataById('settings', key);
    return setting ? setting.value : null;
  }

  // Database stats and cleanup
  async getStorageStats() {
    const stats = {};
    const stores = ['products', 'customers', 'bills', 'offlineTransactions', 'settings'];
    
    for (const store of stores) {
      const data = await this.getAllData(store);
      stats[store] = {
        count: data.length,
        size: JSON.stringify(data).length
      };
    }
    
    return stats;
  }

  async cleanup() {
    // Remove old cached data (older than 7 days)
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 7);
    const cutoffISO = cutoffDate.toISOString();
    
    const stores = ['products', 'customers', 'bills'];
    
    for (const storeName of stores) {
      const data = await this.getAllData(storeName);
      const oldData = data.filter(item => 
        item.lastUpdated && item.lastUpdated < cutoffISO
      );
      
      for (const item of oldData) {
        await this.deleteData(storeName, item._id);
      }
      
      console.log(`🧹 Cleaned ${oldData.length} old records from ${storeName}`);
    }
  }
}

// Create global instance
const offlineStorage = new OfflineStorage();

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = OfflineStorage;
}

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
  offlineStorage.init().catch(console.error);
});

console.log('📦 Offline storage module loaded');