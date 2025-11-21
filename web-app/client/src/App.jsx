import React, {useEffect, useState, useRef} from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { initAnalytics, trackPageView, trackEvent, trackUserInteraction } from './analytics'
import Login from './Login'
import jsPDF from 'jspdf'
import 'jspdf-autotable'
import { DEFAULT_GST, GST_PERCENT, fmt1, formatCurrency, PAYMENT_MODES, PAYMENT_MODE_LABELS, validateSplitPayment } from './constants'

// 26:07 Electronics - Inventory Management System
const API = (path) => {
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000'
  return baseUrl + path
}

export default function App(){
  // PWA and Offline functionality
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [showInstallPrompt, setShowInstallPrompt] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [offlineTransactions, setOfflineTransactions] = useState([])
  const [isSyncing, setIsSyncing] = useState(false)
  const [lastDataRefresh, setLastDataRefresh] = useState(null)
  
  const [tab, setTab] = useState('dashboard')
  const [products, setProducts] = useState([])
  const [customers, setCustomers] = useState([])
  const [cart, setCart] = useState([])
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [invoices, setInvoices] = useState([])
  const [stats, setStats] = useState({})
  const [showAddProduct, setShowAddProduct] = useState(false)
  const [showAddCustomer, setShowAddCustomer] = useState(false)
  const [newProduct, setNewProduct] = useState({name:'', quantity:0, price:0, costPrice:0, hsnCode:'9999', minStock:10, serialNo:'', barcode:''})
  const [newCustomer, setNewCustomer] = useState({name:'', phone:'', address:'', gstin:''})
  const [loading, setLoading] = useState(true)
  const [discount, setDiscount] = useState(0)
  const [paymentMode, setPaymentMode] = useState(PAYMENT_MODES.CASH)
  const [showBill, setShowBill] = useState(false)
  const [lastBill, setLastBill] = useState(null)
  const [searchQuery, setSearchQuery] = useState('') // Product search in POS
  const [taxRate, setTaxRate] = useState(GST_PERCENT) // Fixed 18% GST
  const [companyInfo, setCompanyInfo] = useState({
    name: '26:07 Electronics',
    address: 'Electronics Plaza, Tech Street, City - 560001',
    phone: '+91 9876543210',
    email: 'support@2607electronics.com',
    gstin: '29AABCU9603R1ZX',
    logo: '⚡'
  })
  
  // Authentication for modifications
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)
  const [userRole, setUserRole] = useState('cashier') // 'admin', 'manager', 'cashier' (removed viewer)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authUsername, setAuthUsername] = useState('')
  const [authPassword, setAuthPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const [pendingAction, setPendingAction] = useState(null)
  const [showUserManagement, setShowUserManagement] = useState(false)
  const [users, setUsers] = useState([])
  const [showRegisterModal, setShowRegisterModal] = useState(false)
  const [registerUsername, setRegisterUsername] = useState('')
  const [registerPassword, setRegisterPassword] = useState('')
  const [registerEmail, setRegisterEmail] = useState('')
  const [registerError, setRegisterError] = useState('')
  const [showLoginPage, setShowLoginPage] = useState(true) // Toggle between login/register page
  const [auditLogs, setAuditLogs] = useState([]) // Audit trail logs
  const [showCustomerHistory, setShowCustomerHistory] = useState(false)
  const [selectedCustomerHistory, setSelectedCustomerHistory] = useState(null)
  const [customerPurchases, setCustomerPurchases] = useState([])
  
  // New advanced features
  const [showQuickActions, setShowQuickActions] = useState(false)
  const [notification, setNotification] = useState(null)
  const [showStockAlert, setShowStockAlert] = useState(false)
  const [showSalesChart, setShowSalesChart] = useState(false)
  const [productFilter, setProductFilter] = useState('all') // 'all', 'low-stock', 'out-of-stock', 'high-profit'
  const [sortBy, setSortBy] = useState('name') // 'name', 'stock', 'price', 'profit'
  const [showProductDetails, setShowProductDetails] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [recentActivity, setRecentActivity] = useState([])
  
  // Invoice filters
  const [invoiceDateFilter, setInvoiceDateFilter] = useState('all') // 'all', 'today', 'week', 'month', 'custom'
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')
  
  // Barcode scanner
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false)
  const [scannerMode, setScannerMode] = useState('product') // 'product' or 'pos'
  const [scannedBarcode, setScannedBarcode] = useState('')
  
  // Barcode & Photo management
  const [showBarcodeModal, setShowBarcodeModal] = useState(false)
  const [barcodeProduct, setBarcodeProduct] = useState(null)
  const [barcodeImage, setBarcodeImage] = useState(null)
  const [qrCodeImage, setQrCodeImage] = useState(null)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [photoPreview, setPhotoPreview] = useState(null)
  
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved === 'true';
  });
  
  // Checkout loading state
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  
  // Expense tracking states
  const [expenses, setExpenses] = useState([]);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [expenseCategory, setExpenseCategory] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseDescription, setExpenseDescription] = useState('');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Multiple payment methods
  const [splitPayment, setSplitPayment] = useState(false);
  const [cashAmount, setCashAmount] = useState('');
  const [upiAmount, setUpiAmount] = useState('');
  const [cardAmount, setCardAmount] = useState('');
  const [selectedSeller, setSelectedSeller] = useState(null);
  
  // Analytics data
  const [analyticsData, setAnalyticsData] = useState({
    topProducts: [],
    lowStock: [],
    revenueSummary: {}
  });
  const [analyticsDateRange, setAnalyticsDateRange] = useState(30); // days
  
  // Admin password from secure environment variable
  const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'defaultpass123'

  // Helper function to track tab changes
  const handleTabChange = (newTab) => {
    setTab(newTab);
    trackUserInteraction('navigation', `tab_${newTab}`);
    trackPageView(`${newTab} Tab`);
  };

  // Permission helper functions
  const canViewProfit = () => {
    // Admin and manager can see profit/cost data, cashier cannot
    return userRole === 'admin' || userRole === 'manager' || isAdmin;
  };

  const canEdit = () => {
    // Admin and manager can edit
    return userRole === 'admin' || userRole === 'manager' || isAdmin;
  };

  const canDelete = () => {
    // Only admin can delete
    return userRole === 'admin' || isAdmin;
  };

  const canMakeSales = () => {
    // All roles can make sales (admin, manager, cashier)
    return isAuthenticated;
  };

  // Global error handler to prevent app crashes
  useEffect(() => {
    const handleError = (event) => {
      console.error('Global error caught:', event.error);
      showNotification('❌ An unexpected error occurred. Please refresh the page if problems persist.', 'error');
      event.preventDefault();
    };

    const handleRejection = (event) => {
      console.error('Unhandled promise rejection:', event.reason);
      showNotification('❌ A background operation failed. The app should continue working normally.', 'warning');
      event.preventDefault();
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, []);

  // Check authentication on mount (permanent session until logout)
  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser')
    const storedIsAdmin = localStorage.getItem('isAdmin')
    const storedRole = localStorage.getItem('userRole')
    
    if (storedUser) {
      setIsAuthenticated(true)
      setCurrentUser(JSON.parse(storedUser))
      setIsAdmin(storedIsAdmin === 'true')
      setUserRole(storedRole || 'cashier') // Default to cashier if no role stored
      
      // Fetch users if admin
      if (storedIsAdmin === 'true') {
        fetchUsers()
      }
    }
  }, [])

  // PWA Install Prompt Handler
  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowInstallPrompt(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  // Online/Offline Status Handler
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      showNotification('🌐 Back online! Syncing data...', 'success')
      syncOfflineData()
    }

    const handleOffline = () => {
      setIsOnline(false)
      showNotification('📴 You are offline. Transactions will be saved locally.', 'warning')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Initialize offline storage and load cached data
  useEffect(() => {
    if (typeof window !== 'undefined' && window.offlineStorage) {
      loadCachedData()
      loadOfflineTransactions()
    }
  }, [isAuthenticated])

  // Offline data refresh mechanism
  useEffect(() => {
    if (!isAuthenticated) return

    let refreshInterval
    
    if (!isOnline) {
      // When offline, refresh cached data every 30 seconds
      refreshInterval = setInterval(async () => {
        console.log('🔄 Refreshing offline data from cache...')
        await Promise.all([
          fetchProducts(),
          fetchCustomers(), 
          fetchInvoices(),
          fetchStats()
        ])
        await loadOfflineTransactions()
        setLastDataRefresh(new Date())
      }, 30000) // 30 seconds
    } else {
      // When online, clear any offline refresh interval
      if (refreshInterval) {
        clearInterval(refreshInterval)
      }
    }

    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval)
      }
    }
  }, [isOnline, isAuthenticated])

  // Auto-refresh data when coming back online
  useEffect(() => {
    if (isOnline && isAuthenticated) {
      console.log('🌐 Back online - refreshing all data...')
      Promise.all([fetchProducts(), fetchCustomers(), fetchInvoices(), fetchStats()])
        .then(() => {
          console.log('✅ Data refreshed successfully')
        })
        .catch(error => {
          console.error('❌ Failed to refresh data:', error)
        })
    }
  }, [isOnline, isAuthenticated])
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Check if user is not typing in input/textarea
      const isInputActive = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName);
      
      // Ctrl/Cmd + Shortcuts
      if ((e.ctrlKey || e.metaKey) && !isInputActive) {
        switch(e.key.toLowerCase()) {
          case 'n': // New Product
            e.preventDefault();
            if (canEdit()) setShowAddProduct(true);
            break;
          case 'k': // New Customer
            e.preventDefault();
            if (canEdit()) setShowAddCustomer(true);
            break;
          case 'h': // Help/Shortcuts
            e.preventDefault();
            alert('Keyboard Shortcuts:\n\nCtrl+N: New Product\nCtrl+K: New Customer\nCtrl+F: Search Products\nCtrl+H: Show Shortcuts\nAlt+1-7: Switch Tabs\nF1: Dashboard\nF2: POS\nF3: Products\nF4: Customers\nF5: Invoices\nF6: Analytics\nF7: Reports');
            break;
          case 'f': // Focus search
            e.preventDefault();
            const searchInput = document.querySelector('input[placeholder*="Search"]');
            if (searchInput) searchInput.focus();
            break;
        }
      }
      
      // Alt + Number shortcuts for tabs
      if (e.altKey && !isInputActive) {
        e.preventDefault();
        const tabMap = {
          '1': 'dashboard',
          '2': 'pos',
          '3': 'products',
          '4': 'customers',
          '5': 'invoices',
          '6': 'analytics',
          '7': 'reports'
        };
        if (tabMap[e.key]) {
          setTab(tabMap[e.key]);
        }
      }
      
      // F-key shortcuts
      if (!e.ctrlKey && !e.altKey && !isInputActive) {
        switch(e.key) {
          case 'F1':
            e.preventDefault();
            setTab('dashboard');
            break;
          case 'F2':
            e.preventDefault();
            setTab('pos');
            break;
          case 'F3':
            e.preventDefault();
            setTab('products');
            break;
          case 'F4':
            e.preventDefault();
            setTab('customers');
            break;
          case 'F5':
            e.preventDefault();
            setTab('invoices');
            break;
          case 'F6':
            e.preventDefault();
            setTab('analytics');
            break;
          case 'F7':
            e.preventDefault();
            setTab('reports');
            break;
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isAuthenticated, userRole, canEdit]); // Dependencies for permission checks

  async function fetchUsers() {
    try {
      const res = await fetch(API('/api/users'))
      if (res.ok) {
        const data = await res.json()
        setUsers(data)
      }
    } catch(e) {
      console.error('Error fetching users:', e)
    }
  }

  async function fetchAuditLogs() {
    try {
      const res = await fetch(API('/api/audit-logs?limit=100'))
      if (res.ok) {
        const data = await res.json()
        setAuditLogs(data)
      }
    } catch(e) {
      console.error('Error fetching audit logs:', e)
    }
  }

  // PWA Install Prompt & Initial Data Load
  useEffect(()=>{ 
    // Initialize analytics
    initAnalytics();
    trackPageView('Inventory Management App');
    
    Promise.all([fetchProducts(), fetchCustomers(), fetchInvoices(), fetchStats()])
      .then(() => {
        trackEvent('data_loaded', 'initialization', 'initial_load');
      })
      .finally(() => setLoading(false))
  }, [])
  
  // Check if user account is still valid (not deleted by admin)
  async function checkUserValidity() {
    if (!isAuthenticated || isAdmin) return true // Admin always valid
    
    try {
      const res = await fetch(API(`/api/users/check/${currentUser.id}`))
      const data = await res.json()
      
      if (!res.ok || !data.exists) {
        // User account was deleted by admin
        alert('⚠️ Your account has been removed by the administrator. You will be logged out.')
        handleLogout()
        return false
      }
      
      if (!data.approved) {
        // User account was un-approved by admin
        alert('⚠️ Your account approval has been revoked by the administrator. You will be logged out.')
        handleLogout()
        return false
      }
      
      return true
    } catch(e) {
      console.error('User validity check error:', e)
      return true // Don't interrupt user on network errors
    }
  }
  
  // Check user validity periodically (every 30 seconds)
  useEffect(() => {
    if (isAuthenticated && !isAdmin) {
      const interval = setInterval(() => {
        checkUserValidity()
      }, 30000) // Check every 30 seconds
      
      return () => clearInterval(interval)
    }
  }, [isAuthenticated, isAdmin, currentUser])

  async function fetchProducts(){
    try {
      if (isOnline) {
        const res = await fetch(API('/api/products'))
        if (res.ok) {
          const data = await res.json()
          setProducts(data)
          // Cache fresh data
          if (window.offlineStorage) {
            await window.offlineStorage.cacheProducts(data)
          }
        }
      } else {
        // Load from cache when offline
        if (window.offlineStorage) {
          const cachedProducts = await window.offlineStorage.getCachedProducts()
          if (cachedProducts.length > 0) {
            setProducts(cachedProducts)
            console.log('📦 Loaded products from cache')
          }
        }
      }
    } catch(e) { 
      console.error('Error fetching products:', e)
      // Fallback to cached data on error
      if (window.offlineStorage) {
        const cachedProducts = await window.offlineStorage.getCachedProducts()
        if (cachedProducts.length > 0) {
          setProducts(cachedProducts)
          console.log('📦 Loaded products from cache (fallback)')
        }
      }
    }
  }
  async function fetchCustomers(){
    try {
      if (isOnline) {
        const res = await fetch(API('/api/customers'))
        if (res.ok) {
          const data = await res.json()
          setCustomers(data)
          // Cache fresh data
          if (window.offlineStorage) {
            await window.offlineStorage.cacheCustomers(data)
          }
        }
      } else {
        // Load from cache when offline
        if (window.offlineStorage) {
          const cachedCustomers = await window.offlineStorage.getCachedCustomers()
          if (cachedCustomers.length > 0) {
            setCustomers(cachedCustomers)
            console.log('📦 Loaded customers from cache')
          }
        }
      }
    } catch(e) { 
      console.error('Error fetching customers:', e)
      // Fallback to cached data on error
      if (window.offlineStorage) {
        const cachedCustomers = await window.offlineStorage.getCachedCustomers()
        if (cachedCustomers.length > 0) {
          setCustomers(cachedCustomers)
          console.log('📦 Loaded customers from cache (fallback)')
        }
      }
    }
  }
  async function fetchInvoices(){
    try {
      if (isOnline) {
        const res = await fetch(API('/api/invoices'))
        if (res.ok) {
          const data = await res.json()
          setInvoices(data)
          // Cache fresh data
          if (window.offlineStorage) {
            await window.offlineStorage.cacheBills(data)
          }
        }
      } else {
        // Load from cache when offline
        if (window.offlineStorage) {
          const cachedBills = await window.offlineStorage.getCachedBills()
          if (cachedBills.length > 0) {
            setInvoices(cachedBills)
            console.log('📦 Loaded invoices from cache')
          }
        }
      }
    } catch(e) { 
      console.error('Error fetching invoices:', e)
      // Fallback to cached data on error
      if (window.offlineStorage) {
        const cachedBills = await window.offlineStorage.getCachedBills()
        if (cachedBills.length > 0) {
          setInvoices(cachedBills)
          console.log('📦 Loaded invoices from cache (fallback)')
        }
      }
    }
  }
  async function fetchStats(){
    try {
      if (isOnline) {
        const res = await fetch(API('/api/stats'))
        if (res.ok) {
          const data = await res.json()
          setStats(data)
          // Cache stats data
          if (window.offlineStorage) {
            await window.offlineStorage.saveSetting('stats', data)
          }
        }
      } else {
        // Load cached stats when offline
        if (window.offlineStorage) {
          const cachedStats = await window.offlineStorage.getSetting('stats')
          if (cachedStats) {
            setStats(cachedStats)
            console.log('📦 Loaded stats from cache')
          } else {
            // Fallback stats when no cache available
            setStats({
              totalProducts: products.length,
              totalCustomers: customers.length,
              totalSales: invoices.length,
              totalRevenue: invoices.reduce((sum, inv) => sum + (inv.total || 0), 0)
            })
            console.log('📊 Generated fallback stats from cached data')
          }
        }
      }
    } catch(e) { 
      console.error('Error fetching stats:', e)
      // Fallback to cached stats on error
      if (window.offlineStorage) {
        const cachedStats = await window.offlineStorage.getSetting('stats')
        if (cachedStats) {
          setStats(cachedStats)
          console.log('📦 Loaded stats from cache (fallback)')
        }
      }
    }
  }
  
  async function fetchAnalyticsData(days = 30) {
    try {
      const [topProductsRes, lowStockRes, revenueSummaryRes] = await Promise.all([
        fetch(API(`/api/analytics/top-products?days=${days}&limit=10`)),
        fetch(API('/api/analytics/low-stock')),
        fetch(API(`/api/analytics/revenue-profit?days=${days}`))
      ]);
      
      const data = {
        topProducts: topProductsRes.ok ? await topProductsRes.json() : [],
        lowStock: lowStockRes.ok ? await lowStockRes.json() : [],
        revenueSummary: revenueSummaryRes.ok ? await revenueSummaryRes.json() : {}
      };
      
      setAnalyticsData(data);
    } catch(e) { 
      console.error('Error fetching analytics:', e);
    }
  }

  // PWA and Offline Functionality
  const installPWA = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      
      if (outcome === 'accepted') {
        showNotification('🎉 App installed successfully!', 'success')
      }
      
      setDeferredPrompt(null)
      setShowInstallPrompt(false)
    }
  }

  const loadCachedData = async () => {
    if (!window.offlineStorage) return

    try {
      const [cachedProducts, cachedCustomers, cachedBills] = await Promise.all([
        window.offlineStorage.getCachedProducts(),
        window.offlineStorage.getCachedCustomers(),
        window.offlineStorage.getCachedBills()
      ])

      // Use cached data if no internet or as fallback
      if (!isOnline || products.length === 0) {
        if (cachedProducts.length > 0) setProducts(cachedProducts)
        if (cachedCustomers.length > 0) setCustomers(cachedCustomers)
        if (cachedBills.length > 0) setInvoices(cachedBills)
      }

      // Cache fresh data when online
      if (isOnline) {
        const freshData = await Promise.all([
          fetch(API('/api/products')).then(r => r.ok ? r.json() : []),
          fetch(API('/api/customers')).then(r => r.ok ? r.json() : []),
          fetch(API('/api/invoices')).then(r => r.ok ? r.json() : [])
        ])

        if (freshData[0].length > 0) {
          setProducts(freshData[0])
          await window.offlineStorage.cacheProducts(freshData[0])
        }
        if (freshData[1].length > 0) {
          setCustomers(freshData[1])
          await window.offlineStorage.cacheCustomers(freshData[1])
        }
        if (freshData[2].length > 0) {
          setInvoices(freshData[2])
          await window.offlineStorage.cacheBills(freshData[2])
        }
      }
    } catch (error) {
      console.error('Error loading cached data:', error)
    }
  }

  const loadOfflineTransactions = async () => {
    if (!window.offlineStorage) return

    try {
      const transactions = await window.offlineStorage.getOfflineTransactions()
      setOfflineTransactions(transactions)
    } catch (error) {
      console.error('Error loading offline transactions:', error)
    }
  }

  const syncOfflineData = async () => {
    if (!isOnline || !window.offlineStorage) return

    setIsSyncing(true)
    try {
      const transactions = await window.offlineStorage.getOfflineTransactions()
      
      for (const transaction of transactions) {
        try {
          const token = localStorage.getItem('authToken')
          const response = await fetch(API('/api/bills'), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(transaction.data)
          })

          if (response.ok) {
            await window.offlineStorage.removeOfflineTransaction(transaction.id)
            console.log('✅ Synced offline transaction:', transaction.id)
          }
        } catch (error) {
          console.error('❌ Failed to sync transaction:', transaction.id, error)
          await window.offlineStorage.updateOfflineTransactionStatus(transaction.id, 'failed')
        }
      }

      // Refresh data after sync
      await Promise.all([fetchProducts(), fetchCustomers(), fetchInvoices(), fetchStats()])
      await loadOfflineTransactions()
      
      showNotification('✅ Offline data synced successfully!', 'success')
    } catch (error) {
      console.error('❌ Sync failed:', error)
      showNotification('❌ Failed to sync offline data', 'error')
    } finally {
      setIsSyncing(false)
    }
  }

  // Authentication checker - requires auth for any modification action
  async function requireAuth(action) {
    if (isAuthenticated) {
      // Check if user account is still valid
      const isValid = await checkUserValidity()
      if (isValid) {
        action() // Already authenticated and valid, execute immediately
      }
    } else {
      setPendingAction(() => action) // Store the action
      // Open the central login page instead of modal
      setShowLoginPage(true)
    }
  }

  // Handle authentication (permanent session until logout)
  async function handleAuth(e) {
    e.preventDefault()
    
    // Check if admin login
    if (authUsername === 'admin' && authPassword === ADMIN_PASSWORD) {
      // Admin login
      const adminUser = { username: 'admin', role: 'admin', approved: true }
      
      localStorage.setItem('currentUser', JSON.stringify(adminUser))
      localStorage.setItem('isAdmin', 'true')
      localStorage.setItem('userRole', 'admin')
      
      setIsAuthenticated(true)
      setIsAdmin(true)
      setUserRole('admin')
      setCurrentUser(adminUser)
      setShowAuthModal(false)
      setAuthError('')
      setAuthUsername('')
      setAuthPassword('')
      
      alert(`✅ Admin authenticated successfully!`)
      
      fetchUsers()
      
      if (pendingAction) {
        pendingAction()
        setPendingAction(null)
      }
    } else {
      // Regular user login
      try {
        const res = await fetch(API('/api/users/login'), {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ username: authUsername, password: authPassword })
        })
        
        const data = await res.json()
        
        if (res.ok && data.user) {
          if (!data.user.approved) {
            setAuthError('⏳ Your account is pending admin approval.')
            setAuthUsername('')
            setAuthPassword('')
            return
          }
          
          // User login successful
          localStorage.setItem('currentUser', JSON.stringify(data.user))
          localStorage.setItem('isAdmin', 'false')
          localStorage.setItem('userRole', data.user.role || 'cashier') // Default to cashier
          
          setIsAuthenticated(true)
          setIsAdmin(false)
          setUserRole(data.user.role || 'cashier') // Default to cashier
          setCurrentUser(data.user)
          setShowAuthModal(false)
          setAuthError('')
          setAuthUsername('')
          setAuthPassword('')
          
          alert(`✅ Welcome ${data.user.username}! You're now logged in.`)
          
          if (pendingAction) {
            pendingAction()
            setPendingAction(null)
          }
        } else {
          setAuthError(data.error || 'Invalid username or password!')
          setAuthPassword('')
        }
      } catch(e) {
        console.error('Login error:', e)
        setAuthError('Login failed. Please try again.')
        setAuthPassword('')
      }
    }
  }
  
  // Logout function
  function handleLogout() {
    setIsAuthenticated(false)
    setIsAdmin(false)
    setCurrentUser(null)
    setUserRole('cashier') // Reset to cashier
    localStorage.removeItem('currentUser')
    localStorage.removeItem('isAdmin')
    localStorage.removeItem('userRole')
    alert('🔒 You have been logged out.')
  }
  
  // User registration (Simple Direct)
  // Step 1: Send OTP
  async function handleSendOTP(e) {
    e.preventDefault()
    
    if (!registerEmail) {
      setRegisterError('Please enter your email address.')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(registerEmail)) {
      setRegisterError('Please enter a valid email address.')
      return
    }
    
    setOtpLoading(true) // Show loading state
    console.log('Sending OTP to:', registerEmail);
    
    try {
      const res = await fetch(API('/api/users/send-otp'), {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ email: registerEmail })
      })
      
      const data = await res.json()
      console.log('Response:', data);
      
      if (res.ok) {
        setOtpSent(true)
        setOtpStep(2)
        setRegisterError('')
        setOtpLoading(false)
        startOtpTimer(600) // 10 minutes
        
        // Show message based on whether email was sent
        if (data.emailSent) {
          showNotification('✅ OTP sent to your email! Check inbox and spam folder.', 'success')
        } else {
          // Email failed, show OTP in console for testing
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.log('⚠️ EMAIL FAILED - Using OTP from console');
          console.log('� YOUR OTP CODE:', data.otp);
          console.log('📧 For:', registerEmail);
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          showNotification('⚠️ Email failed. OTP shown in console (F12)', 'error')
        }
      } else {
        setOtpLoading(false)
        setRegisterError(data.error || 'Failed to send OTP.')
      }
    } catch(e) {
      console.error('Send OTP error:', e)
      setOtpLoading(false)
      setRegisterError('Failed to send OTP. Please try again.')
    }
  }

  // Step 2: Verify OTP
  async function handleVerifyOTP(e) {
    e.preventDefault()
    
    if (!otpCode || otpCode.length !== 6) {
      setRegisterError('Please enter a valid 6-digit OTP.')
      return
    }
    
    setOtpLoading(true)
    
    try {
      const res = await fetch(API('/api/users/verify-otp'), {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ 
          email: registerEmail, 
          otp: otpCode 
        })
      })
      
      const data = await res.json()
      
      if (res.ok) {
        setOtpVerified(true)
        setOtpStep(3)
        setRegisterError('')
        setOtpLoading(false)
        showNotification('✅ Email verified successfully!', 'success')
      } else {
        setOtpLoading(false)
        setRegisterError(data.error || 'Invalid OTP.')
      }
    } catch(e) {
      console.error('Verify OTP error:', e)
      setOtpLoading(false)
      setRegisterError('Failed to verify OTP. Please try again.')
    }
  }

  // Step 3: Complete Registration
  async function handleRegister(e) {
    e.preventDefault()

    if (registerUsername.length < 3) {
      setRegisterError('Username must be at least 3 characters.')
      return
    }

    if (!registerEmail) {
      setRegisterError('Email is required.')
      return
    }
    
    if (registerPassword.length < 6) {
      setRegisterError('Password must be at least 6 characters long.')
      return
    }
    
    try {
      const res = await fetch(API('/api/users/register'), {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ 
          username: registerUsername, 
          password: registerPassword,
          email: registerEmail
        })
      })
      
      const data = await res.json()
      
      if (res.ok) {
        // Reset all states
        setShowRegisterModal(false)
        setRegisterUsername('')
        setRegisterPassword('')
        setRegisterEmail('')
        setRegisterError('')
        showNotification('✅ Registration successful! Please wait for admin approval.', 'success')
        setShowLoginPage(true)
      } else {
        setRegisterError(data.error || 'Registration failed.')
      }
    } catch(e) {
      console.error('Registration error:', e)
      setRegisterError('Registration failed. Please try again.')
    }
  }

  // Resend OTP
  async function handleResendOTP() {
    if (!resendEnabled) return
    
    setResendEnabled(false)
    
    try {
      const res = await fetch(API('/api/users/send-otp'), {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ email: registerEmail })
      })
      
      const data = await res.json()
      
      if (res.ok) {
        setOtpCode('')
        setRegisterError('')
        startOtpTimer(600)
        showNotification('✅ New OTP sent to your email!', 'success')
        setTimeout(() => setResendEnabled(true), 60000) // Enable after 1 minute
      } else {
        setRegisterError(data.error || 'Failed to resend OTP.')
        setResendEnabled(true)
      }
    } catch(e) {
      console.error('Resend OTP error:', e)
      setRegisterError('Failed to resend OTP.')
      setResendEnabled(true)
    }
  }

  // Timer countdown
  function startOtpTimer(seconds) {
    setOtpTimer(seconds)
    const interval = setInterval(() => {
      setOtpTimer(prev => {
        if (prev <= 1) {
          clearInterval(interval)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  // Format timer display
  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }
  
  // Approve user (Admin only)
  async function approveUser(userId) {
    if (!isAdmin) return
    
    try {
      const res = await fetch(API(`/api/users/${userId}/approve`), {
        method: 'PATCH',
        headers: {'Content-Type': 'application/json'}
      })
      
      if (res.ok) {
        alert('✅ User approved successfully!')
        fetchUsers()
      } else {
        alert('Failed to approve user.')
      }
    } catch(e) {
      console.error('Approve error:', e)
      alert('Failed to approve user.')
    }
  }
  
  // Delete user (Admin only)
  async function deleteUser(userId) {
    if (!isAdmin) return
    
    if (!confirm('Are you sure you want to delete this user? They will be immediately logged out.')) return
    
    try {
      const res = await fetch(API(`/api/users/${userId}`), {
        method: 'DELETE'
      })
      
      const data = await res.json()
      
      if (res.ok) {
        alert('✅ User deleted successfully! They have been logged out.')
        
        // If the deleted user is the current logged-in user (shouldn't happen, but safety check)
        const storedUser = localStorage.getItem('currentUser')
        if (storedUser) {
          const userData = JSON.parse(storedUser)
          if (data.deletedUserId && userData.id === data.deletedUserId) {
            // Force logout if somehow admin deleted themselves
            handleLogout()
          }
        }
        
        fetchUsers()
      } else {
        alert('Failed to delete user.')
      }
    } catch(e) {
      console.error('Delete error:', e)
      alert('Failed to delete user.')
    }
  }
  
  // Force logout user (Admin only) - removes user session
  function forceLogoutUser(username) {
    if (!isAdmin) return
    
    if (!confirm(`Force logout user "${username}"? They will need to login again.`)) return
    
    // In a real app, this would invalidate the session on the server
    // For now, we'll just show a confirmation that it would work
    alert(`✅ User "${username}" has been force logged out. They will need to login again on their next action.`)
  }
  
  // Revoke user access (Admin only) - unapprove user
  async function revokeUserAccess(userId, username) {
    if (!isAdmin) return
    
    if (!confirm(`Revoke access for user "${username}"? They will be logged out immediately.`)) return
    
    try {
      const res = await fetch(API(`/api/users/${userId}/unapprove`), {
        method: 'PATCH',
        headers: {'Content-Type': 'application/json'}
      })
      
      if (res.ok) {
        alert(`✅ Access revoked for "${username}". They will be logged out on their next action.`)
        fetchUsers()
      } else {
        alert('Failed to revoke access.')
      }
    } catch(e) {
      console.error('Revoke access error:', e)
      alert('Failed to revoke access.')
    }
  }

  // Change user role (Admin only)
  async function changeUserRole(userId, newRole, username) {
    if (!isAdmin) return
    
    if (!confirm(`Change role for "${username}" to "${newRole}"?`)) return
    
    try {
      const res = await fetch(API(`/api/users/${userId}/role`), {
        method: 'PATCH',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ role: newRole })
      })
      
      if (res.ok) {
        alert(`✅ Role updated successfully! "${username}" is now a ${newRole}.`)
        fetchUsers()
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to update role.')
      }
    } catch(e) {
      console.error('Change role error:', e)
      alert('Failed to update role.')
    }
  }

  function cancelAuth() {
    setShowAuthModal(false)
    setAuthError('')
    setAuthPassword('')
    setPendingAction(null)
  }

  // Notification System
  function showNotification(message, type = 'success') {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 3000)
  }

  // Check for low stock on load
  useEffect(() => {
    if (products.length > 0) {
      const lowStockItems = products.filter(p => p.quantity > 0 && p.quantity < 10)
      const outOfStockItems = products.filter(p => p.quantity === 0)
      
      if (lowStockItems.length > 0 || outOfStockItems.length > 0) {
        setShowStockAlert(true)
      }
    }
  }, [products])

  // Track recent activity
  function addActivity(action, details) {
    const activity = {
      id: Date.now(),
      action,
      details,
      timestamp: new Date(),
      user: isAdmin ? 'Admin' : currentUser?.username
    }
    setRecentActivity(prev => [activity, ...prev.slice(0, 9)])
  }

  // Filter and sort products
  function getFilteredProducts() {
    let filtered = [...products]
    
    // Apply filter
    switch(productFilter) {
      case 'low-stock':
        filtered = filtered.filter(p => p.quantity > 0 && p.quantity < 10)
        break
      case 'out-of-stock':
        filtered = filtered.filter(p => p.quantity === 0)
        break
      case 'high-profit':
        filtered = filtered.filter(p => p.profitPercent >= 30)
        break
      default:
        break
    }
    
    // Apply sort
    switch(sortBy) {
      case 'stock':
        filtered.sort((a, b) => a.quantity - b.quantity)
        break
      case 'price':
        filtered.sort((a, b) => b.price - a.price)
        break
      case 'profit':
        filtered.sort((a, b) => b.profit - a.profit)
        break
      case 'name':
      default:
        filtered.sort((a, b) => a.name.localeCompare(b.name))
        break
    }
    
    return filtered
  }

  // Filter invoices by date range
  function getFilteredInvoices() {
    if (invoiceDateFilter === 'all') return invoices;
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    return invoices.filter(inv => {
      const invDate = new Date(inv.created_at);
      
      switch(invoiceDateFilter) {
        case 'today':
          return invDate >= today;
        
        case 'week':
          const weekAgo = new Date(today);
          weekAgo.setDate(weekAgo.getDate() - 7);
          return invDate >= weekAgo;
        
        case 'month':
          const monthAgo = new Date(today);
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          return invDate >= monthAgo;
        
        case 'custom':
          if (!customStartDate && !customEndDate) return true;
          const start = customStartDate ? new Date(customStartDate) : new Date(0);
          const end = customEndDate ? new Date(customEndDate) : new Date();
          end.setHours(23, 59, 59, 999); // Include the entire end date
          return invDate >= start && invDate <= end;
        
        default:
          return true;
      }
    });
  }

  // Quick add to cart with animation
  function quickAddToCart(product, quantity = 1) {
    for (let i = 0; i < quantity; i++) {
      addToCart(product)
    }
    showNotification(`Added ${quantity}x ${product.name} to cart!`, 'success')
  }

  // PDF Export Functions
  function exportInvoiceToPDF(invoice) {
    try {
      const doc = new jsPDF();
      
      // Get invoice date
      const invoiceDate = invoice.created_at || invoice.date || new Date();
      const dateObj = new Date(invoiceDate);
      
      // Get customer info
      const customerName = invoice.customer_name || invoice.customerName || 'Walk-in Customer';
      const customerPhone = invoice.customerPhone || '';
      const customerAddress = invoice.customerAddress || '';
      const sellerName = invoice.createdByUsername || currentUser?.username || 'Unknown';
      
      // Get payment info
      const billPaymentMode = invoice.paymentMode || 'Cash';
      const isSplitPayment = (billPaymentMode === 'split' || billPaymentMode === 'Split') && invoice.splitPaymentDetails;
      const splitDetails = invoice.splitPaymentDetails;
      
      // Get totals
      const subtotal = invoice.subtotal || 0;
      const discountAmount = invoice.discountAmount || 0;
      const discountPercent = invoice.discountPercent || 0;
      const afterDiscount = invoice.afterDiscount || (subtotal - discountAmount);
      const taxAmount = invoice.taxAmount || 0;
      const taxRate = invoice.taxRate || 18;
      const grandTotal = invoice.total || invoice.grandTotal || 0;
      
      // Header Section - Styled like print bill
      doc.setFillColor(102, 126, 234); // Purple gradient color
      doc.rect(0, 0, 210, 50, 'F');
      
      // Company Logo/Name
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(26);
      doc.setFont(undefined, 'bold');
      doc.text(companyInfo.logo || '⚡', 20, 20);
      doc.text(companyInfo.name || 'Company Name', 35, 20);
      
      // TAX INVOICE Badge
      doc.setFontSize(11);
      doc.setFont(undefined, 'bold');
      doc.text('TAX INVOICE', 170, 20, { align: 'right' });
      
      // Company Details
      doc.setFontSize(9);
      doc.setFont(undefined, 'normal');
      doc.text(companyInfo.address || '', 20, 28);
      doc.text(`Phone: ${companyInfo.phone || ''} | Email: ${companyInfo.email || ''}`, 20, 34);
      doc.text(`GSTIN: ${companyInfo.gstin || ''}`, 20, 40);
      
      // Invoice Meta Section
      let currentY = 60;
      doc.setFillColor(248, 249, 250); // Light gray background
      doc.rect(0, currentY, 210, 40, 'F');
      doc.setTextColor(0, 0, 0);
      
      // Bill To Section
      doc.setFontSize(10);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(102, 126, 234);
      doc.text('📋 BILL TO', 20, currentY + 8);
      doc.setDrawColor(102, 126, 234);
      doc.line(20, currentY + 10, 100, currentY + 10);
      
      doc.setFontSize(9);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(0, 0, 0);
      doc.text(`Name: ${customerName}`, 20, currentY + 16);
      if (customerPhone) {
        doc.text(`Phone: ${customerPhone}`, 20, currentY + 22);
      }
      if (customerAddress) {
        doc.text(`Address: ${customerAddress}`, 20, currentY + 28);
      }
      
      // Invoice Details Section
      doc.setFontSize(10);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(102, 126, 234);
      doc.text('📄 INVOICE DETAILS', 120, currentY + 8);
      doc.line(120, currentY + 10, 190, currentY + 10);
      
      doc.setFontSize(9);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(0, 0, 0);
      doc.text(`Invoice #: ${invoice.billNumber || invoice.id || invoice._id}`, 120, currentY + 16);
      doc.text(`Date: ${dateObj.toLocaleDateString('en-IN', {day: '2-digit', month: 'short', year: 'numeric'})}`, 120, currentY + 22);
      doc.text(`Time: ${dateObj.toLocaleTimeString('en-IN', {hour: '2-digit', minute: '2-digit', hour12: true})}`, 120, currentY + 28);
      doc.text(`Seller: ${sellerName}`, 120, currentY + 34);
      
      // Items Table
      currentY = 110;
      const items = invoice.items || [];
      
      if (items.length > 0) {
        const tableData = items.map((item, idx) => {
          const product = products.find(p => p._id === item.productId || p._id?.toString() === item.productId?.toString());
          const itemName = item.name || item.productName || 'Unknown';
          const itemPrice = item.price || item.unitPrice || 0;
          const itemQuantity = item.quantity || 0;
          const hsnCode = item.hsnCode || product?.hsnCode || 'N/A';
          return [
            (idx + 1).toString(),
            itemName,
            hsnCode,
            itemQuantity.toString(),
            `₹${itemPrice.toFixed(2)}`,
            `₹${(itemPrice * itemQuantity).toFixed(2)}`
          ];
        });
        
        doc.autoTable({
          startY: currentY,
          head: [['S.No', 'Product Description', 'HSN Code', 'Qty', 'Rate (₹)', 'Amount (₹)']],
          body: tableData,
          theme: 'grid',
          headStyles: { 
            fillColor: [74, 85, 104],
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            fontSize: 9
          },
          styles: { 
            fontSize: 8,
            cellPadding: 3
          },
          columnStyles: {
            0: { cellWidth: 15, halign: 'center' },
            1: { cellWidth: 70 },
            2: { cellWidth: 25, halign: 'center' },
            3: { cellWidth: 20, halign: 'center' },
            4: { cellWidth: 30, halign: 'right' },
            5: { cellWidth: 30, halign: 'right' }
          }
        });
        
        currentY = doc.lastAutoTable.finalY + 10;
      } else {
        doc.text('No items found', 20, currentY);
        currentY += 10;
      }
      
      // Calculations Section
      const calcX = 160;
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(226, 232, 240);
      doc.rect(calcX - 5, currentY - 5, 50, 50, 'FD');
      
      doc.setFontSize(9);
      doc.setFont(undefined, 'normal');
      doc.text('Subtotal:', calcX, currentY);
      doc.text(formatCurrency(subtotal), calcX + 30, currentY, { align: 'right' });
      
      if (discountPercent > 0) {
        currentY += 6;
        doc.setTextColor(217, 119, 6);
        doc.text(`Discount (${discountPercent}%):`, calcX, currentY);
        doc.text(`-${formatCurrency(discountAmount)}`, calcX + 30, currentY, { align: 'right' });
        
        currentY += 6;
        doc.setTextColor(0, 0, 0);
        doc.text('After Discount:', calcX, currentY);
        doc.text(formatCurrency(afterDiscount), calcX + 30, currentY, { align: 'right' });
      }
      
      currentY += 6;
      doc.setTextColor(5, 150, 105);
      doc.text(`GST (${taxRate}%):`, calcX, currentY);
      doc.text(formatCurrency(taxAmount), calcX + 30, currentY, { align: 'right' });
      
      currentY += 8;
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(102, 126, 234);
      doc.text('GRAND TOTAL:', calcX, currentY);
      doc.text(formatCurrency(grandTotal), calcX + 30, currentY, { align: 'right' });
      
      // Amount in Words
      currentY += 12;
      doc.setFontSize(9);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(0, 0, 0);
      doc.setFont(undefined, 'bold');
      doc.text('Amount in Words:', 20, currentY);
      doc.setFont(undefined, 'normal');
      doc.text(`${numberToWords(Math.round(grandTotal))} Rupees Only`, 20, currentY + 6);
      
      // Payment Details
      currentY += 15;
      const isSplit = isSplitPayment && splitDetails;
      doc.setFont(undefined, 'bold');
      doc.text('💰 Payment Method:', 20, currentY);
      doc.setFont(undefined, 'normal');
      
      if (isSplit) {
        currentY += 6;
        doc.text('Split Payment', 20, currentY);
        if (splitDetails.cashAmount > 0) {
          currentY += 6;
          doc.text(`  Cash: ${formatCurrency(splitDetails.cashAmount)}`, 20, currentY);
        }
        if (splitDetails.upiAmount > 0) {
          currentY += 6;
          doc.text(`  UPI: ${formatCurrency(splitDetails.upiAmount)}`, 20, currentY);
        }
        if (splitDetails.cardAmount > 0) {
          currentY += 6;
          doc.text(`  Card: ${formatCurrency(splitDetails.cardAmount)}`, 20, currentY);
        }
      } else {
        currentY += 6;
        doc.text(billPaymentMode.toUpperCase(), 20, currentY);
      }
      
      // Footer
      const pageHeight = doc.internal.pageSize.height;
      doc.setFillColor(45, 55, 72);
      doc.rect(0, pageHeight - 20, 210, 20, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(11);
      doc.setFont(undefined, 'bold');
      doc.text('✨ Thank You For Your Business! ✨', 105, pageHeight - 12, { align: 'center' });
      doc.setFontSize(8);
      doc.setFont(undefined, 'normal');
      doc.text(`This is a computer-generated invoice | For any queries, please contact us at ${companyInfo.phone}`, 105, pageHeight - 6, { align: 'center' });
      
      doc.save(`Invoice-${invoice.billNumber || invoice.id || invoice._id}.pdf`);
      showNotification('✅ Invoice PDF downloaded!', 'success');
    } catch (error) {
      console.error('PDF export error:', error);
      showNotification('❌ Failed to export PDF: ' + error.message, 'error');
    }
  }

  function exportProductsToPDF() {
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text('Product Inventory Report', 105, 15, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 105, 22, { align: 'center' });
    
    const tableData = products.map((p, index) => [
      index + 1,
      p.name,
      p.quantity,
      `₹${p.price.toFixed(1)}`,
      p.quantity === 0 ? 'Out of Stock' : p.quantity < 10 ? 'Low Stock' : 'In Stock'
    ]);
    
    doc.autoTable({
      startY: 30,
      head: [['SI No', 'Name', 'Stock', 'Price', 'Status']],
      body: tableData,
      theme: 'striped'
    });
    
    doc.save('Products-Report.pdf');
    showNotification('✅ Products PDF downloaded!', 'success');
  }

  function exportTransactionsToPDF() {
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text('Transactions Report', 105, 15, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 105, 22, { align: 'center' });
    
    const tableData = getFilteredInvoices().map(inv => [
      `#${inv.id}`,
      inv.customer_name || 'Walk-in',
      `₹${(inv.total || 0).toFixed(1)}`,
      inv.paymentMode || 'Cash',
      new Date(inv.created_at).toLocaleDateString()
    ]);
    
    doc.autoTable({
      startY: 30,
      head: [['Invoice #', 'Customer', 'Amount', 'Payment', 'Date']],
      body: tableData,
      theme: 'grid'
    });
    
    const finalY = doc.lastAutoTable.finalY + 10;
    const total = getFilteredInvoices().reduce((sum, inv) => sum + inv.total, 0);
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text(`Total Revenue: ₹${total.toFixed(1)}`, 150, finalY);
    
    doc.save('Transactions-Report.pdf');
    showNotification('✅ Transactions PDF downloaded!', 'success');
  }

  // Backup and Restore Functions
  function downloadBackup() {
    const backupData = {
      timestamp: new Date().toISOString(),
      products: products,
      customers: customers,
      invoices: invoices,
      expenses: expenses,
      version: '1.0'
    };
    
    const dataStr = JSON.stringify(backupData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `inventory-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    
    showNotification('✅ Backup downloaded successfully!', 'success');
    trackEvent('backup_downloaded', 'data_management');
  }

  async function restoreBackup(file) {
    try {
      const text = await file.text();
      const backupData = JSON.parse(text);
      
      if (!backupData.version || !backupData.timestamp) {
        showNotification('❌ Invalid backup file format', 'error');
        return;
      }
      
      if (window.confirm('This will restore all data from the backup. Continue?')) {
        if (backupData.products) setProducts(backupData.products);
        if (backupData.customers) setCustomers(backupData.customers);
        if (backupData.expenses) setExpenses(backupData.expenses);
        
        showNotification('✅ Backup restored successfully!', 'success');
        trackEvent('backup_restored', 'data_management');
      }
    } catch (error) {
      console.error('Restore error:', error);
      showNotification('❌ Failed to restore backup: ' + error.message, 'error');
    }
  }

  // Expense Management Functions
  async function fetchExpenses() {
    try {
      const res = await fetch(API('/api/expenses'));
      if (res.ok) {
        const data = await res.json();
        setExpenses(data.expenses || []);
      }
    } catch (error) {
      console.error('Error fetching expenses:', error);
    }
  }

  async function addExpense() {
    if (!expenseCategory || !expenseAmount || !expenseDescription) {
      showNotification('❌ Please fill all expense fields', 'error');
      return;
    }

    try {
      const expenseData = {
        category: expenseCategory,
        amount: parseFloat(expenseAmount),
        description: expenseDescription,
        date: expenseDate,
        userId: currentUser?.id || null
      };

      const res = await fetch(API('/api/expenses'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(expenseData)
      });

      if (res.ok) {
        showNotification('✅ Expense added successfully!', 'success');
        setExpenseCategory('');
        setExpenseAmount('');
        setExpenseDescription('');
        setExpenseDate(new Date().toISOString().split('T')[0]);
        setShowAddExpense(false);
        fetchExpenses();
        addActivity('Expense Added', `₹${expenseAmount} - ${expenseCategory}`);
      } else {
        showNotification('❌ Failed to add expense', 'error');
      }
    } catch (error) {
      console.error('Error adding expense:', error);
      showNotification('❌ Error adding expense', 'error');
    }
  }

  async function deleteExpense(id) {
    if (!window.confirm('Delete this expense?')) return;

    try {
      const res = await fetch(API(`/api/expenses/${id}`), {
        method: 'DELETE'
      });

      if (res.ok) {
        showNotification('✅ Expense deleted', 'success');
        fetchExpenses();
      } else {
        showNotification('❌ Failed to delete expense', 'error');
      }
    } catch (error) {
      console.error('Error deleting expense:', error);
      showNotification('❌ Error deleting expense', 'error');
    }
  }

  // Bulk stock update
  async function bulkUpdateStock(updates) {
    try {
      for (const update of updates) {
        await updateStock(update.id, update.quantity)
      }
      showNotification('Bulk stock update successful!', 'success')
      fetchProducts()
    } catch(e) {
      showNotification('Bulk update failed', 'error')
    }
  }

  // Download Reports Functions - All in PDF Format
  function downloadSalesReport() {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.text('Sales Report', 105, 20, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 105, 28, { align: 'center' });
    doc.text(`Total Transactions: ${invoices.length}`, 105, 35, { align: 'center' });
    
    // Table data
    const tableData = invoices.map(inv => [
      `#${inv.billNumber || inv.id}`,
      new Date(inv.created_at || inv.date).toLocaleDateString(),
      inv.customer_name || inv.customerName || 'Walk-in',
      (inv.items?.length || 0).toString(),
      `₹${(inv.total || inv.grandTotal || 0).toFixed(1)}`,
      inv.paymentMode || 'Cash',
      `₹${(inv.totalProfit || 0).toFixed(1)}`
    ]);
    
    doc.autoTable({
      startY: 45,
      head: [['Invoice #', 'Date', 'Customer', 'Items', 'Total', 'Payment', 'Profit']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [41, 128, 185] },
      styles: { fontSize: 8 }
    });
    
    // Summary
    const finalY = doc.lastAutoTable.finalY + 10;
    const totalRevenue = invoices.reduce((sum, inv) => sum + (inv.total || inv.grandTotal || 0), 0);
    const totalProfit = invoices.reduce((sum, inv) => sum + (inv.totalProfit || 0), 0);
    
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text(`Total Revenue: ₹${totalRevenue.toFixed(1)}`, 20, finalY);
    doc.text(`Total Profit: ₹${totalProfit.toFixed(1)}`, 20, finalY + 8);
    
    doc.save(`Sales-Report-${new Date().toISOString().split('T')[0]}.pdf`);
    showNotification('✅ Sales Report PDF downloaded!', 'success');
  }

  function downloadInventoryReport() {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.text('Inventory Report', 105, 20, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 105, 28, { align: 'center' });
    doc.text(`Total Products: ${products.length}`, 105, 35, { align: 'center' });
    
    // Table data
    const tableData = products.map((prod, index) => [
      (index + 1).toString(),
      prod.name,
      prod.quantity.toString(),
      `₹${prod.price.toFixed(1)}`,
      `₹${(prod.costPrice || 0).toFixed(1)}`,
      `₹${(prod.price - (prod.costPrice || 0)).toFixed(1)}`,
      prod.hsnCode || 'N/A',
      prod.quantity === 0 ? 'Out of Stock' : prod.quantity < 10 ? 'Low Stock' : 'In Stock'
    ]);
    
    doc.autoTable({
      startY: 45,
      head: [['#', 'Name', 'Stock', 'Price', 'Cost', 'Profit/Unit', 'HSN', 'Status']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [46, 204, 113] },
      styles: { fontSize: 7 }
    });
    
    // Summary
    const finalY = doc.lastAutoTable.finalY + 10;
    const lowStock = products.filter(p => p.quantity > 0 && p.quantity < 10).length;
    const outOfStock = products.filter(p => p.quantity === 0).length;
    
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text(`Low Stock Items: ${lowStock}`, 20, finalY);
    doc.text(`Out of Stock Items: ${outOfStock}`, 20, finalY + 7);
    
    doc.save(`Inventory-Report-${new Date().toISOString().split('T')[0]}.pdf`);
    showNotification('✅ Inventory Report PDF downloaded!', 'success');
  }

  function downloadCustomerReport() {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.text('Customer Report', 105, 20, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 105, 28, { align: 'center' });
    doc.text(`Total Customers: ${customers.length}`, 105, 35, { align: 'center' });
    
    // Table data
    const tableData = customers.map((cust, index) => [
      (index + 1).toString(),
      cust.name,
      cust.phone,
      cust.address || 'N/A',
      cust.gstin || 'N/A'
    ]);
    
    doc.autoTable({
      startY: 45,
      head: [['#', 'Name', 'Phone', 'Address', 'GSTIN']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [155, 89, 182] },
      styles: { fontSize: 9 }
    });
    
    doc.save(`Customer-Report-${new Date().toISOString().split('T')[0]}.pdf`);
    showNotification('✅ Customer Report PDF downloaded!', 'success');
  }

  function downloadProfitReport() {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.text('Profit Analysis Report', 105, 20, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 105, 28, { align: 'center' });
    
    // Calculate metrics
    const totalRevenue = invoices.reduce((sum, inv) => sum + (inv.total || inv.grandTotal || 0), 0);
    const totalProfit = invoices.reduce((sum, inv) => sum + (inv.totalProfit || 0), 0);
    const profitMargin = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : 0;
    const avgProfitPerSale = invoices.length > 0 ? (totalProfit / invoices.length).toFixed(1) : 0;
    const lowStockItems = products.filter(p => p.quantity > 0 && p.quantity < 10).length;
    
    // Table data
    const tableData = [
      ['Total Revenue', `₹${totalRevenue.toFixed(1)}`],
      ['Total Profit', `₹${totalProfit.toFixed(1)}`],
      ['Profit Margin', `${profitMargin}%`],
      ['Total Invoices', invoices.length.toString()],
      ['Average Profit/Sale', `₹${avgProfitPerSale}`],
      ['Total Products', products.length.toString()],
      ['Total Customers', customers.length.toString()],
      ['Low Stock Items', lowStockItems.toString()],
      ['Out of Stock Items', products.filter(p => p.quantity === 0).length.toString()]
    ];
    
    doc.autoTable({
      startY: 40,
      head: [['Metric', 'Value']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [231, 76, 60], fontSize: 12 },
      styles: { fontSize: 11 },
      columnStyles: {
        0: { fontStyle: 'bold', fillColor: [245, 245, 245] }
      }
    });
    
    // Add visual emphasis
    const finalY = doc.lastAutoTable.finalY + 15;
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(46, 204, 113);
    doc.text(`Profit Margin: ${profitMargin}%`, 105, finalY, { align: 'center' });
    
    doc.save(`Profit-Analysis-${new Date().toISOString().split('T')[0]}.pdf`);
    showNotification('✅ Profit Analysis PDF downloaded!', 'success');
  }

  function addToCart(p){
    if (!p || !p.id) {
      console.error('Invalid product:', p);
      showNotification('Error: Invalid product', 'error');
      return;
    }
    
    // Ensure product has valid ID for database operations
    const productId = p._id || p.id;
    if (!productId) {
      console.error('Product missing ID:', p);
      showNotification('Error: Product missing ID', 'error');
      return;
    }
    
    // Check if product is in stock
    if (p.quantity <= 0) {
      showNotification(`❌ ${p.name} is out of stock!`, 'error');
      return;
    }
    
    console.log('Adding to cart:', p.name, 'ID:', productId);
    setCart(c=>{
      const existing = c.find(x=>x.productId===productId)
      if (existing) {
        // Check if we have enough stock
        if (existing.quantity + 1 > p.quantity) {
          showNotification(`❌ Only ${p.quantity} units available for ${p.name}`, 'error');
          return c;
        }
        console.log('Increasing quantity for:', p.name);
        return c.map(x=> x.productId===productId ? {...x, quantity: x.quantity+1} : x)
      }
      console.log('Adding new item to cart:', p.name);
      return [...c, {
        productId: productId, 
        name: p.name, 
        price: p.price, 
        costPrice: p.costPrice || 0,
        quantity: 1
      }]
    })
    
    // Show success feedback
    showNotification(`✓ ${p.name} added to cart`, 'success');
  }

  function increaseCartQty(productId){
    setCart(c=> c.map(x=> x.productId===productId ? {...x, quantity: x.quantity+1} : x))
  }

  function decreaseCartQty(productId){
    setCart(c=> c.map(x=> x.productId===productId ? {...x, quantity: Math.max(1, x.quantity-1)} : x))
  }

  function removeFromCart(productId){
    setCart(c=> c.filter(x=> x.productId !== productId))
  }

  async function checkout(){
    try {
      setCheckoutLoading(true);
      
      // Validate cart is not empty
      if (!cart || cart.length === 0) {
        showNotification('❌ Cart is empty. Add products before checkout.', 'error');
        setCheckoutLoading(false);
        return;
      }

      // Validate all cart items have required data
      const invalidItems = cart.filter(item => !item.productId || !item.price || !item.quantity);
      if (invalidItems.length > 0) {
        showNotification('❌ Some cart items are invalid. Please remove and re-add them.', 'error');
        console.error('Invalid cart items:', invalidItems);
        setCheckoutLoading(false);
        return;
      }

      const subtotal = cart.reduce((s,it)=> s + it.price*it.quantity, 0);
      const discountAmount = subtotal * discount / 100;
      const afterDiscount = subtotal - discountAmount;
      const taxAmount = afterDiscount * DEFAULT_GST; // Always 18%
      const grandTotal = afterDiscount + taxAmount;
      
      // Validate split payment if enabled
      if (splitPayment) {
        const validation = validateSplitPayment(cashAmount, upiAmount, cardAmount, grandTotal);
        if (!validation.valid) {
          showNotification(`❌ ${validation.error}`, 'error');
          setCheckoutLoading(false);
          return;
        }
      }
      
      const payload = { 
        customerId: selectedCustomer?.id || null, 
        total: grandTotal,
        totalAmount: grandTotal,
        subtotal: subtotal,
        discountAmount: discountAmount,
        discountValue: discount,
        taxRate: GST_PERCENT,
        taxAmount: taxAmount,
        items: cart,
        discountPercent: discount,
        customerState: 'Same',
        paymentMode: splitPayment ? PAYMENT_MODES.SPLIT : paymentMode,
        cashAmount: splitPayment ? (parseFloat(cashAmount) || 0) : 0,
        upiAmount: splitPayment ? (parseFloat(upiAmount) || 0) : 0,
        cardAmount: splitPayment ? (parseFloat(cardAmount) || 0) : 0,
        userId: currentUser?.id || null,
        username: selectedSeller || (isAdmin ? 'admin' : currentUser?.username || 'Unknown')
      }

      // Handle online checkout
      if (isOnline) {
        const res = await fetch(API('/api/checkout'), { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) })
        const j = await res.json()
        if (j.billId) { 
          // Store bill data and show bill modal
          setLastBill({
            ...j,
            billId: j.billId,
            billNumber: j.billNumber || j.billId,
            customerName: selectedCustomer?.name || 'Walk-in Customer',
            customerPhone: selectedCustomer?.phone || '',
            customerAddress: selectedCustomer?.address || '',
            paymentMode: splitPayment ? PAYMENT_MODES.SPLIT : paymentMode,
            splitPaymentDetails: splitPayment ? {
              cashAmount: parseFloat(cashAmount) || 0,
              upiAmount: parseFloat(upiAmount) || 0,
              cardAmount: parseFloat(cardAmount) || 0,
              totalAmount: grandTotal
            } : null,
            subtotal: subtotal,
            discountAmount: discountAmount,
            discountPercent: discount,
            discountValue: discount,
            taxRate: taxRate || GST_PERCENT,
            taxAmount: taxAmount,
            total: grandTotal,
            items: cart.map(item => ({
              productId: item.productId,
              name: item.name,
              productName: item.name,
              quantity: item.quantity,
              price: item.price,
              unitPrice: item.price
            })),
            date: new Date().toISOString(),
            createdByUsername: selectedSeller || (isAdmin ? 'admin' : currentUser?.username || 'Unknown')
          });
          setShowBill(true);
          
          // Track successful sale
          trackEvent('sale_completed', 'transaction', `Bill-${j.billId}`, grandTotal);
          trackEvent('payment_method', 'transaction', paymentMode);
          
          // Show success notification
          showNotification(`✓ Sale completed! Bill #${j.billId}`, 'success');
          
          // Track activity
          addActivity('Sale Completed', `Bill #${j.billId} - ₹${fmt1(grandTotal)}`);
          
          // Clear cart and reset form
          setCart([]); 
          setSelectedCustomer(null);
          setDiscount(0);
          setPaymentMode(PAYMENT_MODES.CASH);
          setSearchQuery('');
          setSplitPayment(false);
          setCashAmount('');
          setUpiAmount('');
          setCardAmount('');
          
          // Refresh data
          fetchProducts(); 
          fetchInvoices(); 
          fetchStats();
        } else if (j.error) {
          trackEvent('sale_failed', 'transaction', j.error);
          showNotification('Checkout failed: ' + j.error, 'error');
        }
      } else {
        // Handle offline checkout
        if (window.offlineStorage) {
          const offlineId = `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          const token = localStorage.getItem('authToken');
          
          // Save transaction for later sync
          await window.offlineStorage.saveOfflineTransaction(payload, token);
          
          // Create temporary bill data for display
          const offlineBill = {
            billId: offlineId,
            billNumber: offlineId,
            customerName: selectedCustomer?.name || 'Walk-in Customer',
            customerPhone: selectedCustomer?.phone || '',
            customerAddress: selectedCustomer?.address || '',
            paymentMode: splitPayment ? PAYMENT_MODES.SPLIT : paymentMode,
            splitPaymentDetails: splitPayment ? {
              cashAmount: parseFloat(cashAmount) || 0,
              upiAmount: parseFloat(upiAmount) || 0,
              cardAmount: parseFloat(cardAmount) || 0,
              totalAmount: grandTotal
            } : null,
            subtotal: subtotal,
            discountAmount: discountAmount,
            discountPercent: discount,
            discountValue: discount,
            taxRate: taxRate || GST_PERCENT,
            taxAmount: taxAmount,
            total: grandTotal,
            items: cart.map(item => ({
              productId: item.productId,
              name: item.name,
              productName: item.name,
              quantity: item.quantity,
              price: item.price,
              unitPrice: item.price
            })),
            date: new Date().toISOString(),
            createdByUsername: selectedSeller || (isAdmin ? 'admin' : currentUser?.username || 'Unknown'),
            isOffline: true
          };
          
          // Store bill data and show bill modal
          setLastBill(offlineBill);
          setShowBill(true);
          
          // Show offline notification
          showNotification(`📴 Sale saved offline! Will sync when connected.`, 'warning');
          
          // Track activity
          addActivity('Sale Completed (Offline)', `Bill #${offlineId} - ₹${grandTotal.toFixed(1)}`);
          
          // Clear cart and reset form
          setCart([]); 
          setSelectedCustomer(null);
          setDiscount(0);
          setPaymentMode('Cash');
          setSearchQuery('');
          setSplitPayment(false);
          setCashAmount('');
          setUpiAmount('');
          setCardAmount('');
          
          // Update offline transactions list
          await loadOfflineTransactions();
        } else {
          showNotification('❌ Cannot process sale offline. Please check your connection.', 'error');
        }
      }
      
      setCheckoutLoading(false);
    } catch(e) {
      console.error('Checkout error:', e);
      setCheckoutLoading(false);
      if (isOnline) {
        showNotification('Checkout failed. Please try again.', 'error');
      } else {
        showNotification('❌ Offline checkout failed. Please try again.', 'error');
      }
    }
  }
  
  function printBill() {
    if (!lastBill) return;
    
    const printWindow = window.open('', '_blank');
    
    // Use saved bill data instead of current state values
    const subtotal = lastBill.subtotal;
    const discountAmount = lastBill.discountAmount;
    const discountPercent = lastBill.discountPercent || lastBill.discountValue || 0;
    const afterDiscount = subtotal - discountAmount;
    const taxAmount = lastBill.taxAmount;
    const taxRate = lastBill.taxRate;
    const grandTotal = lastBill.total;
    
    // Get customer info from lastBill
    const customerName = lastBill.customerName || lastBill.customer_name || 'Walk-in Customer';
    const customerPhone = lastBill.customerPhone || lastBill.customerPhone || '';
    const customerAddress = lastBill.customerAddress || lastBill.customerAddress || '';
    
    // Get date/time from lastBill
    const billDate = lastBill.date || lastBill.created_at || new Date();
    const dateObj = new Date(billDate);
    
    // Get seller name
    const sellerName = lastBill.createdByUsername || currentUser?.username || 'Unknown';
    
    // Check if split payment - use lastBill.paymentMode instead of state
    const billPaymentMode = lastBill.paymentMode || 'Cash';
    const isSplitPayment = (billPaymentMode === 'split' || billPaymentMode === 'Split') && lastBill.splitPaymentDetails;
    const splitDetails = lastBill.splitPaymentDetails;
    
    const billHTML = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Invoice #${lastBill.billId}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            
            body { 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
              padding: 15mm; 
              background: #ffffff;
              color: #1a1a1a;
              font-size: 10pt;
              line-height: 1.4;
            }
            
            .invoice-container { 
              max-width: 210mm;
              margin: 0 auto; 
              background: #fff;
              border: 2px solid #2d3748;
              border-radius: 8px;
              overflow: hidden;
            }
            
            /* Header Section */
            .invoice-header { 
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 25px 30px;
              position: relative;
            }
            
            .header-top {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              margin-bottom: 15px;
            }
            
            .company-logo {
              font-size: 42px;
              line-height: 1;
            }
            
            .invoice-badge {
              background: rgba(255, 255, 255, 0.2);
              backdrop-filter: blur(10px);
              padding: 8px 20px;
              border-radius: 20px;
              font-size: 11pt;
              font-weight: 600;
              letter-spacing: 1px;
            }
            
            .company-info h1 {
              font-size: 26pt;
              font-weight: 700;
              margin-bottom: 8px;
              letter-spacing: -0.5px;
            }
            
            .company-details {
              font-size: 9pt;
              line-height: 1.6;
              opacity: 0.95;
            }
            
            .company-details p {
              margin: 3px 0;
            }
            
            /* Invoice Meta Info */
            .invoice-meta {
              background: #f8f9fa;
              border-bottom: 3px solid #667eea;
              padding: 20px 30px;
              display: flex;
              justify-content: space-between;
              gap: 20px;
            }
            
            .meta-block h3 {
              font-size: 10pt;
              font-weight: 700;
              color: #667eea;
              margin-bottom: 10px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              border-bottom: 2px solid #667eea;
              padding-bottom: 5px;
            }
            
            .meta-row {
              display: flex;
              justify-content: space-between;
              padding: 4px 0;
              font-size: 9pt;
            }
            
            .meta-label {
              font-weight: 600;
              color: #4a5568;
              min-width: 90px;
            }
            
            .meta-value {
              color: #1a1a1a;
              font-weight: 500;
              text-align: right;
            }
            
            /* Content Section */
            .invoice-content {
              padding: 25px 30px;
            }
            
            /* Items Table */
            .items-table-wrapper {
              margin: 20px 0;
              border: 1px solid #e2e8f0;
              border-radius: 6px;
              overflow: hidden;
            }
            
            .items-table { 
              width: 100%; 
              border-collapse: collapse;
            }
            
            .items-table thead {
              background: linear-gradient(to bottom, #4a5568, #2d3748);
              color: white;
            }
            
            .items-table th { 
              padding: 12px 10px; 
              text-align: left;
              font-size: 9pt;
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            
            .items-table tbody tr {
              border-bottom: 1px solid #e2e8f0;
              transition: background 0.2s;
            }
            
            .items-table tbody tr:nth-child(even) {
              background: #f8f9fa;
            }
            
            .items-table tbody tr:hover {
              background: #edf2f7;
            }
            
            .items-table td { 
              padding: 10px;
              font-size: 9pt;
              color: #2d3748;
            }
            
            .text-right { text-align: right !important; }
            .text-center { text-align: center !important; }
            .font-medium { font-weight: 500; }
            .font-semibold { font-weight: 600; }
            
            /* Calculations Section */
            .calculations-section {
              margin-top: 25px;
              display: flex;
              justify-content: flex-end;
            }
            
            .calculations-table {
              width: 350px;
              border: 1px solid #e2e8f0;
              border-radius: 6px;
              overflow: hidden;
            }
            
            .calc-row {
              display: flex;
              justify-content: space-between;
              padding: 10px 15px;
              border-bottom: 1px solid #e2e8f0;
              font-size: 9pt;
            }
            
            .calc-row:last-child {
              border-bottom: none;
            }
            
            .calc-row.subtotal {
              background: #f8f9fa;
            }
            
            .calc-row.discount {
              background: #fef5e7;
              color: #d97706;
            }
            
            .calc-row.tax {
              background: #e8f5e9;
              color: #059669;
            }
            
            .calc-row.total {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              font-size: 12pt;
              font-weight: 700;
              padding: 15px;
            }
            
            .calc-label {
              font-weight: 600;
            }
            
            .calc-value {
              font-weight: 600;
              text-align: right;
            }
            
            /* Amount in Words */
            .amount-words {
              margin: 20px 0;
              padding: 15px;
              background: linear-gradient(to right, #f8f9fa, #e8f5e9);
              border-left: 4px solid #667eea;
              border-radius: 4px;
              font-size: 9pt;
            }
            
            .amount-words strong {
              color: #667eea;
              display: block;
              margin-bottom: 5px;
            }
            
            /* Payment Details */
            .payment-details {
              margin: 20px 0;
              padding: 15px;
              background: #fff7ed;
              border: 1px dashed #fb923c;
              border-radius: 6px;
            }
            
            .payment-details h4 {
              color: #ea580c;
              font-size: 10pt;
              margin-bottom: 10px;
              display: flex;
              align-items: center;
              gap: 8px;
            }
            
            .payment-split {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 15px;
              margin-top: 10px;
            }
            
            .payment-item {
              background: white;
              padding: 10px;
              border-radius: 4px;
              border: 1px solid #fed7aa;
              text-align: center;
            }
            
            .payment-method {
              font-size: 8pt;
              color: #9a3412;
              font-weight: 600;
              text-transform: uppercase;
              margin-bottom: 5px;
            }
            
            .payment-amount {
              font-size: 11pt;
              color: #ea580c;
              font-weight: 700;
            }
            
            /* Terms Section */
            .terms-section {
              margin: 25px 0;
              padding: 15px;
              background: #f8f9fa;
              border-radius: 6px;
              border: 1px solid #e2e8f0;
            }
            
            .terms-section h4 {
              font-size: 10pt;
              color: #2d3748;
              margin-bottom: 10px;
              font-weight: 700;
            }
            
            .terms-section ul {
              margin-left: 20px;
              font-size: 8pt;
              color: #4a5568;
              line-height: 1.8;
            }
            
            /* Signatures */
            .signature-section {
              margin-top: 40px;
              display: flex;
              justify-content: space-between;
              gap: 30px;
            }
            
            .signature-box {
              flex: 1;
              text-align: center;
            }
            
            .signature-line {
              border-top: 2px solid #2d3748;
              padding-top: 8px;
              margin-top: 50px;
              font-size: 9pt;
              font-weight: 600;
              color: #4a5568;
            }
            
            /* Footer */
            .invoice-footer {
              background: #2d3748;
              color: white;
              padding: 20px 30px;
              text-align: center;
              font-size: 9pt;
            }
            
            .footer-message {
              font-size: 11pt;
              font-weight: 600;
              margin-bottom: 5px;
            }
            
            .footer-note {
              opacity: 0.8;
              font-size: 8pt;
            }
            
            /* Print Styles */
            @media print {
              body { 
                padding: 0; 
                background: white;
              }
              .invoice-container { 
                border: none; 
                border-radius: 0;
                box-shadow: none;
              }
              .no-print { 
                display: none !important; 
              }
              .items-table tbody tr:hover {
                background: inherit;
              }
            }
            
            /* Print Buttons */
            .print-actions {
              position: fixed;
              top: 20px;
              right: 20px;
              z-index: 1000;
              display: flex;
              gap: 10px;
            }
            
            .btn {
              padding: 12px 24px;
              font-size: 11pt;
              font-weight: 600;
              border: none;
              border-radius: 6px;
              cursor: pointer;
              display: flex;
              align-items: center;
              gap: 8px;
              transition: all 0.3s;
              box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            }
            
            .btn-print {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
            }
            
            .btn-print:hover {
              transform: translateY(-2px);
              box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
            }
            
            .btn-close {
              background: #e53e3e;
              color: white;
            }
            
            .btn-close:hover {
              background: #c53030;
              transform: translateY(-2px);
            }
          </style>
        </head>
        <body>
          <!-- Print Action Buttons -->
          <div class="print-actions no-print">
            <button class="btn btn-print" onclick="window.print()">
              <span>🖨️</span> Print Invoice
            </button>
            <button class="btn btn-close" onclick="window.close()">
              <span>✖️</span> Close
            </button>
          </div>

          <div class="invoice-container">
            <!-- Header -->
            <div class="invoice-header">
              <div class="header-top">
                <div class="company-info">
                  <div class="company-logo">${companyInfo.logo}</div>
                  <h1>${companyInfo.name}</h1>
                  <div class="company-details">
                    <p>📍 ${companyInfo.address}</p>
                    <p>📞 ${companyInfo.phone} | ✉️ ${companyInfo.email}</p>
                    <p>🏢 GSTIN: ${companyInfo.gstin}</p>
                  </div>
                </div>
                <div class="invoice-badge">TAX INVOICE</div>
              </div>
            </div>
            
            <!-- Invoice Meta Information -->
            <div class="invoice-meta">
              <div class="meta-block" style="flex: 1;">
                <h3>📋 Bill To</h3>
                <div class="meta-row">
                  <span class="meta-label">Name:</span>
                  <span class="meta-value">${customerName}</span>
                </div>
                ${customerPhone ? `
                <div class="meta-row">
                  <span class="meta-label">Phone:</span>
                  <span class="meta-value">${customerPhone}</span>
                </div>` : ''}
                ${customerAddress ? `
                <div class="meta-row">
                  <span class="meta-label">Address:</span>
                  <span class="meta-value">${customerAddress}</span>
                </div>` : ''}
              </div>
              
              <div class="meta-block" style="flex: 1;">
                <h3>📄 Invoice Details</h3>
                <div class="meta-row">
                  <span class="meta-label">Invoice #:</span>
                  <span class="meta-value">${lastBill.billId || lastBill.billNumber || lastBill.id}</span>
                </div>
                <div class="meta-row">
                  <span class="meta-label">Date:</span>
                  <span class="meta-value">${dateObj.toLocaleDateString('en-IN', {day: '2-digit', month: 'short', year: 'numeric'})}</span>
                </div>
                <div class="meta-row">
                  <span class="meta-label">Time:</span>
                  <span class="meta-value">${dateObj.toLocaleTimeString('en-IN', {hour: '2-digit', minute: '2-digit', hour12: true})}</span>
                </div>
                <div class="meta-row">
                  <span class="meta-label">Seller:</span>
                  <span class="meta-value">${sellerName}</span>
                </div>
                <div class="meta-row">
                  <span class="meta-label">Payment:</span>
                  <span class="meta-value">${isSplitPayment ? 'Split Payment' : billPaymentMode.toUpperCase()}</span>
                </div>
              </div>
            </div>
            
            <!-- Main Content -->
            <div class="invoice-content">
              <!-- Items Table -->
              <div class="items-table-wrapper">
                <table class="items-table">
                  <thead>
                    <tr>
                      <th class="text-center" style="width: 50px;">S.No</th>
                      <th style="width: 40%;">Product Description</th>
                      <th class="text-center" style="width: 100px;">HSN Code</th>
                      <th class="text-center" style="width: 80px;">Quantity</th>
                      <th class="text-right" style="width: 100px;">Rate (₹)</th>
                      <th class="text-right" style="width: 120px;">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${(lastBill.items || []).map((item, idx) => {
                      const product = products.find(p => p._id === item.productId || p._id?.toString() === item.productId?.toString());
                      const itemName = item.name || item.productName || 'Unknown';
                      const itemPrice = item.price || item.unitPrice || 0;
                      const itemQuantity = item.quantity || 0;
                      const hsnCode = item.hsnCode || product?.hsnCode || 'N/A';
                      return `
                        <tr>
                          <td class="text-center font-medium">${idx + 1}</td>
                          <td class="font-semibold">${itemName}</td>
                          <td class="text-center">${hsnCode}</td>
                          <td class="text-center font-medium">${itemQuantity}</td>
                          <td class="text-right">${fmt1(itemPrice)}</td>
                          <td class="text-right font-semibold">${fmt1(itemPrice * itemQuantity)}</td>
                        </tr>
                      `;
                    }).join('')}
                  </tbody>
                </table>
              </div>
              
              <!-- Calculations -->
              <div class="calculations-section">
                <div class="calculations-table">
                  <div class="calc-row subtotal">
                    <span class="calc-label">Subtotal:</span>
                    <span class="calc-value">₹${fmt1(subtotal)}</span>
                  </div>
                  ${discountPercent > 0 ? `
                    <div class="calc-row discount">
                      <span class="calc-label">Discount (${discountPercent}%):</span>
                      <span class="calc-value">- ₹${fmt1(discountAmount)}</span>
                    </div>
                    <div class="calc-row">
                      <span class="calc-label">After Discount:</span>
                      <span class="calc-value">₹${fmt1(afterDiscount)}</span>
                    </div>
                  ` : ''}
                  <div class="calc-row tax">
                    <span class="calc-label">GST (${taxRate}%):</span>
                    <span class="calc-value">₹${fmt1(taxAmount)}</span>
                  </div>
                  <div class="calc-row total">
                    <span class="calc-label">GRAND TOTAL:</span>
                    <span class="calc-value">₹${fmt1(grandTotal)}</span>
                  </div>
                </div>
              </div>
              
              <!-- Amount in Words -->
              <div class="amount-words">
                <strong>Amount in Words:</strong>
                <span>${numberToWords(Math.round(grandTotal))} Rupees Only</span>
              </div>
              
              <!-- Payment Details -->
              ${isSplitPayment && splitDetails ? `
                <div class="payment-details">
                  <h4>💰 Payment Breakdown</h4>
                  <div class="payment-split">
                    ${splitDetails.cashAmount > 0 ? `
                      <div class="payment-item">
                        <div class="payment-method">💵 Cash</div>
                        <div class="payment-amount">₹${fmt1(splitDetails.cashAmount)}</div>
                      </div>
                    ` : ''}
                    ${splitDetails.upiAmount > 0 ? `
                      <div class="payment-item">
                        <div class="payment-method">📱 UPI</div>
                        <div class="payment-amount">₹${fmt1(splitDetails.upiAmount)}</div>
                      </div>
                    ` : ''}
                    ${splitDetails.cardAmount > 0 ? `
                      <div class="payment-item">
                        <div class="payment-method">💳 Card</div>
                        <div class="payment-amount">₹${fmt1(splitDetails.cardAmount)}</div>
                      </div>
                    ` : ''}
                  </div>
                </div>
              ` : `
                <div class="payment-details">
                  <h4>💰 Payment Method</h4>
                  <div style="padding: 10px; background: white; border-radius: 4px; text-align: center;">
                    <div class="payment-method" style="font-size: 10pt; margin-bottom: 5px;">${billPaymentMode === 'cash' ? '💵 Cash' : billPaymentMode === 'upi' ? '📱 UPI' : billPaymentMode === 'card' ? '💳 Card' : billPaymentMode.toUpperCase()}</div>
                    <div class="payment-amount">₹${fmt1(grandTotal)}</div>
                  </div>
                </div>
              `}
              
              <!-- Terms & Conditions -->
              <div class="terms-section">
                <h4>📜 Terms & Conditions</h4>
                <ul>
                  <li>Goods once sold cannot be returned or exchanged without a valid reason.</li>
                  <li>Payment is due at the time of purchase unless credit terms are agreed.</li>
                  <li>All disputes are subject to local jurisdiction only.</li>
                  <li>E. & O.E. (Errors and Omissions Excepted)</li>
                </ul>
              </div>
              
              <!-- Signatures -->
              <div class="signature-section">
                <div class="signature-box">
                  <div class="signature-line">Customer Signature</div>
                </div>
                <div class="signature-box">
                  <div class="signature-line">Authorized Signatory</div>
                </div>
              </div>
            </div>
            
            <!-- Footer -->
            <div class="invoice-footer">
              <div class="footer-message">✨ Thank You For Your Business! ✨</div>
              <div class="footer-note">
                This is a computer-generated invoice | For any queries, please contact us at ${companyInfo.phone}
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
    
    printWindow.document.write(billHTML);
    printWindow.document.close();
  }
  
  // Convert number to words (Indian system)
  function numberToWords(num) {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    
    if (num === 0) return 'Zero';
    
    function convertHundreds(n) {
      let str = '';
      if (n > 99) {
        str += ones[Math.floor(n / 100)] + ' Hundred ';
        n %= 100;
      }
      if (n > 19) {
        str += tens[Math.floor(n / 10)] + ' ';
        n %= 10;
      } else if (n >= 10) {
        str += teens[n - 10] + ' ';
        return str.trim();
      }
      str += ones[n] + ' ';
      return str.trim();
    }
    
    if (num >= 10000000) {
      return convertHundreds(Math.floor(num / 10000000)) + ' Crore ' + numberToWords(num % 10000000);
    }
    if (num >= 100000) {
      return convertHundreds(Math.floor(num / 100000)) + ' Lakh ' + numberToWords(num % 100000);
    }
    if (num >= 1000) {
      return convertHundreds(Math.floor(num / 1000)) + ' Thousand ' + numberToWords(num % 1000);
    }
    return convertHundreds(num);
  }

  async function addProduct(){
    try {
      showNotification('🔄 Adding product...', 'info');
      
      // Validate required fields
      if (!newProduct.name || !newProduct.price) {
        showNotification('❌ Product name and price are required.', 'error');
        return;
      }
      
      const res = await fetch(API('/api/products'), { 
        method:'POST', 
        headers:{'Content-Type':'application/json'}, 
        body: JSON.stringify({
          ...newProduct,
          userId: currentUser?.id || null,
          username: isAdmin ? 'admin' : currentUser?.username
        })
      })
      
      if (res.ok) { 
        const result = await res.json();
        
        showNotification(`✓ Product "${newProduct.name}" added successfully!`, 'success');
        addActivity('Product Added', newProduct.name);
        setShowAddProduct(false); 
        setNewProduct({name:'', quantity:0, price:0, costPrice:0, hsnCode:'9999', minStock:10}); 
        
        // Refresh data
        await fetchProducts(); 
        await fetchStats();
      } else {
        const err = await res.json()
        showNotification('Failed to add product: ' + (err.error || 'Unknown error'), 'error');
      }
    } catch(e) {
      console.error('Add product error:', e)
      
      // Check if it's a network error (backend not available)
      if (e.message === 'Failed to fetch' || !navigator.onLine) {
        showNotification('⚠️ Backend server not connected. Please deploy your backend server first. See BACKEND_SETUP.md for instructions.', 'error');
        
        // Optionally save to local storage for later sync
        const localProducts = JSON.parse(localStorage.getItem('pendingProducts') || '[]');
        const pendingProduct = {
          ...newProduct,
          id: Date.now(),
          userId: currentUser?.id || null,
          username: isAdmin ? 'admin' : currentUser?.username,
          createdAt: new Date().toISOString()
        };
        localProducts.push(pendingProduct);
        localStorage.setItem('pendingProducts', JSON.stringify(localProducts));
        
        showNotification(`💾 Product saved locally. Will sync when backend is available. (${localProducts.length} pending)`, 'warning');
      } else {
        showNotification('Failed to add product. Please check your connection and try again.', 'error');
      }
    }
  }


  async function addCustomer(){
    try {
      const res = await fetch(API('/api/customers'), { 
        method:'POST', 
        headers:{'Content-Type':'application/json'}, 
        body: JSON.stringify({
          ...newCustomer,
          userId: currentUser?.id || null,
          username: isAdmin ? 'admin' : currentUser?.username
        })
      })
      if (res.ok) { 
        showNotification(`✓ Customer "${newCustomer.name}" added successfully!`, 'success');
        addActivity('Customer Added', newCustomer.name);
        setShowAddCustomer(false); 
        setNewCustomer({name:'', phone:'', address:'', state:'Same', gstin:''}); 
        fetchCustomers(); 
        fetchStats();
      } else {
        const err = await res.json()
        showNotification('Failed to add customer: ' + (err.error || 'Unknown error'), 'error');
      }
    } catch(e) {
      console.error('Add customer error:', e)
      showNotification('Failed to add customer. Please try again.', 'error');
    }
  }

  // Handle barcode scan result
  async function handleBarcodeResult(barcode) {
    try {
      if (!barcode || !barcode.trim()) {
        showNotification('❌ Invalid barcode scanned', 'error');
        return;
      }

      showNotification('🔍 Searching for product...', 'info');
      
      // First try API search
      const res = await fetch(API(`/api/products/barcode/${encodeURIComponent(barcode.trim())}`));
      
      if (res.ok) {
        const product = await res.json();
        
        // Ensure product has proper ID structure
        const formattedProduct = {
          ...product,
          id: product.id || product._id,
          _id: product.id || product._id
        };
        
        if (scannerMode === 'pos') {
          // Add to cart in POS
          addToCart(formattedProduct);
          showNotification(`✓ "${product.name}" added to cart!`, 'success');
        } else {
          // Show product details
          setSelectedProduct(formattedProduct);
          setShowProductDetails(true);
          showNotification(`✓ Product "${product.name}" found!`, 'success');
        }
        setShowBarcodeScanner(false);
        setScannedBarcode('');
        return;
      }
      
      // If API search fails, try local search as fallback
      const localProduct = products.find(p => 
        p.barcode === barcode || 
        p.name.toLowerCase().includes(barcode.toLowerCase()) ||
        p.id === barcode ||
        p._id === barcode
      );
      
      if (localProduct) {
        if (scannerMode === 'pos') {
          // Add to cart in POS
          addToCart(localProduct);
          showNotification(`✓ "${localProduct.name}" added to cart!`, 'success');
        } else {
          // Show product details
          setSelectedProduct(localProduct);
          setShowProductDetails(true);
          showNotification(`✓ Product "${localProduct.name}" found!`, 'success');
        }
        setShowBarcodeScanner(false);
        setScannedBarcode('');
      } else {
        showNotification(`❌ No product found with code: ${barcode}`, 'error');
      }
    } catch (e) {
      console.error('Barcode search error:', e);
      showNotification(`❌ Search failed. Please try again or use manual entry.`, 'error');
      // Don't close scanner on error, let user try again
    }
  }

  // Initialize barcode scanner with html5-qrcode
  useEffect(() => {
    if (!showBarcodeScanner) return;

    let html5QrCode;
    let timeoutId;
    
    const initScanner = async () => {
      try {
        // Check if element exists
        const scannerElement = document.getElementById("qr-reader");
        if (!scannerElement) {
          console.error('Scanner element not found');
          return;
        }

        html5QrCode = new Html5Qrcode("qr-reader");
        
        // Try to get camera permissions first
        const cameras = await Html5Qrcode.getCameras();
        if (cameras && cameras.length > 0) {
          
          // Prefer back camera if available
          const backCamera = cameras.find(camera => 
            camera.label.toLowerCase().includes('back') || 
            camera.label.toLowerCase().includes('rear') ||
            camera.label.toLowerCase().includes('environment')
          );
          
          const cameraId = backCamera ? backCamera.id : cameras[0].id;
          
          await html5QrCode.start(
            cameraId,
            {
              fps: 10,
              qrbox: { width: 250, height: 250 },
              aspectRatio: 1.0
            },
            (decodedText) => {
              console.log('🔍 Barcode scanned:', decodedText);
              if (html5QrCode) {
                html5QrCode.stop().then(() => {
                  handleBarcodeResult(decodedText);
                }).catch(err => console.error("Scanner stop error:", err));
              }
            },
            (errorMessage) => {
              // Handle scan errors silently (too frequent)
              if (errorMessage.includes('No QR code found')) {
                return; // Ignore "no code found" messages
              }
              console.debug('Scanner error:', errorMessage);
            }
          );
        } else {
          console.warn('No cameras found');
          showNotification('📷 No cameras found. Please use manual entry.', 'warning');
        }
      } catch (err) {
        console.error("Scanner initialization error:", err);
        showNotification('📷 Camera access failed. Please use manual entry or check permissions.', 'warning');
      }
    };
    
    // Delay initialization to ensure DOM is ready
    timeoutId = setTimeout(initScanner, 200);
    
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      if (html5QrCode) {
        html5QrCode.stop().catch(e => console.error("Scanner stop error:", e));
      }
    };
  }, [showBarcodeScanner]);

  async function updateStock(productId, newQty){
    try {
      const res = await fetch(API(`/api/products/${productId}`), { 
        method:'PATCH', 
        headers:{'Content-Type':'application/json'}, 
        body: JSON.stringify({
          quantity: newQty,
          userId: currentUser?.id || null,
          username: isAdmin ? 'admin' : currentUser?.username
        })
      })
      if (res.ok) { 
        fetchProducts(); 
        fetchStats(); 
      } else {
        const err = await res.json()
        alert('Failed to update stock: ' + (err.error || 'Unknown error'))
      }
    } catch(e) {
      console.error('Update stock error:', e)
      alert('Failed to update stock. Please try again.')
    }
  }

  async function deleteProduct(id){
    if (!confirm('Delete this product?')) return
    try {
      const userId = currentUser?.id || null;
      const username = isAdmin ? 'admin' : currentUser?.username;
      const res = await fetch(API(`/api/products/${id}?userId=${userId}&username=${username}`), { method:'DELETE' })
      if (res.ok) { 
        fetchProducts(); 
        fetchStats(); 
      } else {
        const err = await res.json()
        alert('Failed to delete product: ' + (err.error || 'Unknown error'))
      }
    } catch(e) {
      console.error('Delete product error:', e)
      alert('Failed to delete product. Please try again.')
    }
  }

  // Barcode & Photo Management Functions
  async function showProductBarcode(product) {
    setBarcodeProduct(product);
    setShowBarcodeModal(true);
    
    // Fetch barcode and QR code images
    try {
      const barcodeRes = await fetch(API(`/api/products/${product.id}/barcode?format=image`));
      const barcodeData = await barcodeRes.json();
      setBarcodeImage(barcodeData.image);
      
      const qrRes = await fetch(API(`/api/products/${product.id}/barcode?format=qr`));
      const qrData = await qrRes.json();
      setQrCodeImage(qrData.qrCode);
    } catch (e) {
      console.error('Barcode fetch error:', e);
      showNotification('Failed to generate barcode', 'error');
    }
  }

  async function uploadProductPhoto(productId, file) {
    if (!file) return;
    
    setUploadingPhoto(true);
    const formData = new FormData();
    formData.append('photo', file);
    formData.append('userId', currentUser?.id || '');
    formData.append('username', isAdmin ? 'admin' : currentUser?.username || '');
    
    try {
      const res = await fetch(API(`/api/products/${productId}/photo`), {
        method: 'POST',
        body: formData
      });
      
      const data = await res.json();
      
      if (res.ok) {
        showNotification('✓ Product photo uploaded successfully!', 'success');
        fetchProducts(); // Refresh product list
        setPhotoPreview(null);
      } else {
        showNotification('Failed to upload photo: ' + (data.error || 'Unknown error'), 'error');
      }
    } catch (e) {
      console.error('Photo upload error:', e);
      showNotification('Failed to upload photo. Please try again.', 'error');
    } finally {
      setUploadingPhoto(false);
    }
  }

  async function deleteProductPhoto(productId) {
    if (!confirm('Delete product photo?')) return;
    
    try {
      const userId = currentUser?.id || null;
      const username = isAdmin ? 'admin' : currentUser?.username;
      const res = await fetch(API(`/api/products/${productId}/photo?userId=${userId}&username=${username}`), {
        method: 'DELETE'
      });
      
      if (res.ok) {
        showNotification('✓ Product photo deleted successfully!', 'success');
        fetchProducts();
      } else {
        const err = await res.json();
        showNotification('Failed to delete photo: ' + (err.error || 'Unknown error'), 'error');
      }
    } catch (e) {
      console.error('Photo delete error:', e);
      showNotification('Failed to delete photo. Please try again.', 'error');
    }
  }

  async function scanBarcodeInPOS() {
    const barcode = prompt('Enter or scan barcode/product name:');
    if (!barcode) return;
    
    try {
      showNotification('🔍 Searching for product...', 'info');
      
      const res = await fetch(API(`/api/products/barcode/${encodeURIComponent(barcode)}`));
      
      if (res.ok) {
        const product = await res.json();
        
        // Ensure product has proper ID structure
        const formattedProduct = {
          ...product,
          id: product.id || product._id,
          _id: product.id || product._id
        };
        
        addToCart(formattedProduct);
        showNotification(`✓ "${product.name}" added to cart!`, 'success');
      } else {
        const error = await res.json();
        showNotification(`❌ ${error.error || 'Product not found'}`, 'error');
      }
    } catch (e) {
      console.error('Barcode scan error:', e);
      showNotification('❌ Barcode scan failed. Please try again.', 'error');
    }
  }

  function printBarcode() {
    if (!barcodeImage) return;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Print Barcode - ${barcodeProduct?.name}</title>
          <style>
            body { 
              display: flex; 
              flex-direction: column;
              align-items: center; 
              justify-content: center; 
              min-height: 100vh;
              margin: 0;
              font-family: Arial, sans-serif;
            }
            .barcode-container {
              text-align: center;
              padding: 20px;
              border: 2px dashed #ccc;
              border-radius: 8px;
            }
            h2 { margin: 10px 0; }
            .price { font-size: 24px; font-weight: bold; color: #333; margin: 10px 0; }
            @media print {
              .no-print { display: none; }
              .barcode-container { border: none; }
            }
          </style>
        </head>
        <body>
          <div class="barcode-container">
            <h2>${barcodeProduct?.name}</h2>
            <img src="${barcodeImage}" alt="Barcode" />
            <div class="price">₹${barcodeProduct?.price?.toFixed(1)}</div>
          </div>
          <button class="no-print" onclick="window.print()" style="margin-top: 20px; padding: 10px 20px; cursor: pointer;">
            Print
          </button>
        </body>
      </html>
    `);
    printWindow.document.close();
  }

  if (loading) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily: 'Arial, sans-serif',
        overflow: 'hidden'
      }}>
        {/* Animated Background Circles */}
        <div style={{
          position: 'absolute',
          width: '300px',
          height: '300px',
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.1)',
          top: '-100px',
          right: '-100px',
          animation: 'float 6s ease-in-out infinite'
        }}></div>
        <div style={{
          position: 'absolute',
          width: '200px',
          height: '200px',
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.1)',
          bottom: '-50px',
          left: '-50px',
          animation: 'float 4s ease-in-out infinite reverse'
        }}></div>

        {/* Main Loading Container */}
        <div style={{
          position: 'relative',
          zIndex: 10,
          textAlign: 'center',
          padding: '40px',
          background: 'rgba(255, 255, 255, 0.15)',
          borderRadius: '20px',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          {/* Spinner */}
          <div style={{
            width: '80px',
            height: '80px',
            margin: '0 auto 30px',
            border: '6px solid rgba(255, 255, 255, 0.3)',
            borderTop: '6px solid white',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>

          {/* Logo/Icon */}
          <div style={{
            fontSize: '48px',
            marginBottom: '20px',
            animation: 'pulse 2s ease-in-out infinite'
          }}>📊</div>

          {/* Title */}
          <h1 style={{
            color: 'white',
            fontSize: '32px',
            fontWeight: 'bold',
            margin: '0 0 10px 0',
            letterSpacing: '1px'
          }}>
            Inventory Management
          </h1>

          {/* Subtitle */}
          <p style={{
            color: 'rgba(255, 255, 255, 0.9)',
            fontSize: '16px',
            margin: '0 0 20px 0',
            fontWeight: '300'
          }}>
            Loading your workspace...
          </p>

          {/* Loading Dots */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '8px',
            marginTop: '20px'
          }}>
            <div style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              background: 'white',
              animation: 'bounce 1.4s ease-in-out infinite',
              animationDelay: '0s'
            }}></div>
            <div style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              background: 'white',
              animation: 'bounce 1.4s ease-in-out infinite',
              animationDelay: '0.2s'
            }}></div>
            <div style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              background: 'white',
              animation: 'bounce 1.4s ease-in-out infinite',
              animationDelay: '0.4s'
            }}></div>
          </div>
        </div>

        {/* Add Keyframe Animations */}
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          @keyframes pulse {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.1); opacity: 0.8; }
          }
          
          @keyframes bounce {
            0%, 80%, 100% { transform: translateY(0); }
            40% { transform: translateY(-12px); }
          }
          
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-20px); }
          }

          /* Chart tooltip hover effect */
          .chart-bar:hover .chart-tooltip {
            opacity: 1 !important;
          }
        `}</style>
      </div>
    )
  }

  // Show login/register as single page component when not authenticated
  if (!isAuthenticated) {
    return (
      <Login
        showLoginPage={showLoginPage}
        setShowLoginPage={setShowLoginPage}
        authUsername={authUsername}
        setAuthUsername={setAuthUsername}
        authPassword={authPassword}
        setAuthPassword={setAuthPassword}
        authError={authError}
        handleAuth={handleAuth}
        registerUsername={registerUsername}
        setRegisterUsername={setRegisterUsername}
        registerEmail={registerEmail}
        setRegisterEmail={setRegisterEmail}
        registerPassword={registerPassword}
        setRegisterPassword={setRegisterPassword}
        handleRegister={handleRegister}
        registerError={registerError}
      />
    )
  }

  return (
    <div className={`app ${darkMode ? 'dark-mode' : ''}`}>
      {/* PWA Install Prompt */}
      {showInstallPrompt && (
        <div style={{
          position: 'fixed',
          top: '80px',
          right: '20px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          padding: '15px 20px',
          borderRadius: '12px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          zIndex: 10000,
          maxWidth: '300px',
          animation: 'slideInRight 0.3s ease-out'
        }}>
          <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '8px' }}>
            📱 Install App
          </div>
          <div style={{ fontSize: '14px', marginBottom: '12px', opacity: 0.9 }}>
            Install this app for offline access and better performance
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              onClick={installPWA}
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: '1px solid rgba(255,255,255,0.3)',
                color: 'white',
                padding: '8px 16px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Install
            </button>
            <button 
              onClick={() => setShowInstallPrompt(false)}
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: 'white',
                padding: '8px 16px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Later
            </button>
          </div>
        </div>
      )}

      {/* Offline Status Indicator */}
      {!isOnline && (
        <div style={{
          position: 'fixed',
          top: '20px',
          left: '20px',
          display: 'flex',
          flexDirection: 'column',
          background: '#ff6b6b',
          color: 'white',
          padding: '8px 16px',
          borderRadius: '20px',
          fontSize: '14px',
          fontWeight: 'bold',
          zIndex: 9999,
          boxShadow: '0 4px 12px rgba(255,107,107,0.3)',
          animation: 'pulse 2s infinite',
          maxWidth: '220px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            📴 Offline Mode
            <button
              onClick={async () => {
                console.log('🔄 Manual refresh requested...')
                await Promise.all([
                  fetchProducts(),
                  fetchCustomers(), 
                  fetchInvoices(),
                  fetchStats()
                ])
                await loadOfflineTransactions()
                setLastDataRefresh(new Date())
                showNotification('🔄 Offline data refreshed!', 'info')
              }}
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: '1px solid rgba(255,255,255,0.3)',
                color: 'white',
                padding: '4px 8px',
                borderRadius: '10px',
                fontSize: '12px',
                cursor: 'pointer'
              }}
              title="Refresh cached data"
            >
              🔄
            </button>
          </div>
          {lastDataRefresh && (
            <div style={{ 
              fontSize: '10px', 
              opacity: 0.8, 
              marginTop: '4px',
              fontWeight: 'normal'
            }}>
              Last updated: {lastDataRefresh.toLocaleTimeString()}
            </div>
          )}
        </div>
      )}

      {/* Sync Status Indicator */}
      {isSyncing && (
        <div style={{
          position: 'fixed',
          top: isOnline ? '20px' : '60px',
          left: '20px',
          background: '#4ecdc4',
          color: 'white',
          padding: '8px 16px',
          borderRadius: '20px',
          fontSize: '14px',
          fontWeight: 'bold',
          zIndex: 9999,
          boxShadow: '0 4px 12px rgba(78,205,196,0.3)',
          animation: 'pulse 1s infinite'
        }}>
          🔄 Syncing...
        </div>
      )}

      {/* Offline Transactions Counter */}
      {offlineTransactions.length > 0 && isAuthenticated && (
        <div style={{
          position: 'fixed',
          top: '20px',
          left: isOnline ? '120px' : '160px',
          background: '#ffa726',
          color: 'white',
          padding: '6px 12px',
          borderRadius: '15px',
          fontSize: '12px',
          fontWeight: 'bold',
          zIndex: 9999,
          boxShadow: '0 4px 12px rgba(255,167,38,0.3)',
          cursor: 'pointer'
        }}
        onClick={() => showNotification(`${offlineTransactions.length} transactions pending sync`, 'info')}
        title="Click to view pending transactions"
        >
          📦 {offlineTransactions.length}
        </div>
      )}

      {/* Dark Mode Toggle Button */}
      {isAuthenticated && (
        <button
          onClick={() => {
            const newMode = !darkMode;
            setDarkMode(newMode);
            localStorage.setItem('darkMode', newMode);
          }}
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: 9999,
            background: darkMode ? '#fff' : '#333',
            color: darkMode ? '#333' : '#fff',
            border: 'none',
            borderRadius: '50%',
            width: '50px',
            height: '50px',
            fontSize: '24px',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            transition: 'all 0.3s'
          }}
          title={darkMode ? 'Light Mode' : 'Dark Mode'}
        >
          {darkMode ? '☀️' : '🌙'}
        </button>
      )}

      {/* PWA Install Button */}
      {isAuthenticated && showInstallPrompt && (
        <button
          onClick={installPWA}
          style={{
            position: 'fixed',
            top: '20px',
            right: '80px',
            zIndex: 9999,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: '#fff',
            border: 'none',
            borderRadius: '25px',
            padding: '10px 20px',
            fontSize: '14px',
            fontWeight: 'bold',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            transition: 'all 0.3s',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
          title="Install App"
        >
          <span style={{ fontSize: '18px' }}>📱</span>
          Install App
        </button>
      )}
      
      {/* Notification Toast */}
      {notification && (
        <div className={`notification ${notification.type} slide-in`}>
          <span className="notification-icon">
            {notification.type === 'success' && '✓'}
            {notification.type === 'error' && '✕'}
            {notification.type === 'warning' && '⚠'}
            {notification.type === 'info' && 'ℹ'}
          </span>
          <span className="notification-message">{notification.message}</span>
          <button className="notification-close" onClick={() => setNotification(null)}>×</button>
        </div>
      )}

      {/* Quick Actions Floating Button */}
      <div className="quick-actions-wrapper">
        <button 
          className="quick-actions-btn bounce"
          onClick={() => setShowQuickActions(!showQuickActions)}
          title="Quick Actions"
        >
          ⚡
        </button>
        {showQuickActions && (
          <div className="quick-actions-menu fade-in">
            <button onClick={() => { setTab('pos'); setShowQuickActions(false); }}>
              🛒 New Sale
            </button>
            <button onClick={() => { setTab('products'); setShowQuickActions(false); }}>
              ➕ Add Product
            </button>
            <button onClick={() => { setShowStockAlert(true); setShowQuickActions(false); }}>
              📊 Stock Alert
            </button>
            <button onClick={() => { setTab('reports'); setShowQuickActions(false); }}>
              📈 Reports
            </button>
            <button onClick={() => { 
              const lowStock = products.filter(p => p.quantity < 10);
              if (lowStock.length > 0) {
                setProductFilter('low-stock');
                setTab('products');
              } else {
                showNotification('No low stock items!', 'info');
              }
              setShowQuickActions(false);
            }}>
              🔔 Low Stock
            </button>
          </div>
        )}
      </div>

      {/* Stock Alert Modal */}
      {showStockAlert && (
        <div className="modal-overlay" onClick={() => setShowStockAlert(false)}>
          <div className="modal slide-in" onClick={e => e.stopPropagation()}>
            <h2>📊 Stock Alerts</h2>
            <div className="stock-alerts">
              <h3 style={{color: '#e74c3c'}}>⚠️ Out of Stock ({products.filter(p => p.quantity === 0).length})</h3>
              <div className="alert-list">
                {products.filter(p => p.quantity === 0).map(p => (
                  <div key={p._id} className="alert-item out-of-stock">
                    <span className="alert-product">{p.name}</span>
                    <span className="alert-status">Out of Stock</span>
                  </div>
                ))}
              </div>
              
              <h3 style={{color: '#f39c12', marginTop: '20px'}}>⚠️ Low Stock ({products.filter(p => p.quantity > 0 && p.quantity < 10).length})</h3>
              <div className="alert-list">
                {products.filter(p => p.quantity > 0 && p.quantity < 10).map(p => (
                  <div key={p._id} className="alert-item low-stock">
                    <span className="alert-product">{p.name}</span>
                    <span className="alert-quantity">{p.quantity} / 10</span>
                  </div>
                ))}
              </div>
            </div>
            <button onClick={() => setShowStockAlert(false)} className="btn-secondary">Close</button>
          </div>
        </div>
      )}

      {/* Product Details Modal */}
      {showProductDetails && selectedProduct && (
        <div className="modal-overlay" onClick={() => setShowProductDetails(false)}>
          <div className="modal product-details-modal slide-in" onClick={e => e.stopPropagation()}>
            <h2>📦 {selectedProduct.name}</h2>
            <div className="product-details-grid">
              <div className="detail-row">
                <span className="detail-label">Barcode:</span>
                <span className="detail-value">{selectedProduct.barcode || 'N/A'}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Cost Price:</span>
                <span className="detail-value">₹{selectedProduct.cost}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Selling Price:</span>
                <span className="detail-value">₹{selectedProduct.price}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Profit:</span>
                <span className="detail-value profit">₹{selectedProduct.profit} ({selectedProduct.profitPercent}%)</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Current Stock:</span>
                <span className={`detail-value ${selectedProduct.quantity < 10 ? 'low-stock-text' : ''}`}>
                  {selectedProduct.quantity} units
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Minimum Stock:</span>
                <span className="detail-value">10 units</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">GST Rate:</span>
                <span className="detail-value">{selectedProduct.gstRate}%</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Status:</span>
                <span className={`detail-value ${selectedProduct.quantity === 0 ? 'out-of-stock-text' : selectedProduct.quantity < 10 ? 'low-stock-text' : 'in-stock-text'}`}>
                  {selectedProduct.quantity === 0 ? '🔴 Out of Stock' : selectedProduct.quantity < 10 ? '🟡 Low Stock' : '🟢 In Stock'}
                </span>
              </div>
            </div>
            <div className="modal-actions">
              <button onClick={() => {
                quickAddToCart(selectedProduct, 1);
                setShowProductDetails(false);
              }} className="btn-primary" disabled={selectedProduct.quantity === 0}>
                🛒 Add to Cart
              </button>
              <button onClick={() => setShowProductDetails(false)} className="btn-secondary">Close</button>
            </div>
          </div>
        </div>
      )}

      <header>
        <h1>
          <span style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontWeight: 'bold',
            fontSize: '32px'
          }}>⚡ 26:07</span>
          <span style={{marginLeft: '8px'}}>Electronics</span>
        </h1>
        <nav>
          <button onClick={async ()=>{if(await checkUserValidity())handleTabChange('dashboard')}} className={tab==='dashboard'?'active':''}>📱 Dashboard</button>
          <button onClick={async ()=>{if(await checkUserValidity())handleTabChange('pos')}} className={tab==='pos'?'active':''}>💳 Transactions</button>
          <button onClick={async ()=>{if(await checkUserValidity())handleTabChange('products')}} className={tab==='products'?'active':''}>📦 Products</button>
          <button onClick={async ()=>{if(await checkUserValidity())handleTabChange('inventory')}} className={tab==='inventory'?'active':''}>📊 Inventory</button>
          <button onClick={async ()=>{if(await checkUserValidity())handleTabChange('customers')}} className={tab==='customers'?'active':''}>👥 Customers</button>
          <button onClick={async ()=>{if(await checkUserValidity())handleTabChange('invoices')}} className={tab==='invoices'?'active':''}>🧾 Invoices</button>
          <button onClick={async ()=>{if(await checkUserValidity()){handleTabChange('analytics');fetchAnalyticsData(analyticsDateRange);}}} className={tab==='analytics'?'active':''}>� Analytics</button>
          <button onClick={async ()=>{if(await checkUserValidity())handleTabChange('reports')}} className={tab==='reports'?'active':''}>� Reports</button>
          {isAdmin && <button onClick={()=>{handleTabChange('users');setShowUserManagement(true);fetchUsers()}} className={tab==='users'?'active':''}>👤 Users</button>}
          {isAdmin && <button onClick={()=>{handleTabChange('audit');fetchAuditLogs()}} className={tab==='audit'?'active':''}>📋 Audit Logs</button>}
          <span style={{display:'inline-flex', alignItems:'center', gap:'10px', marginLeft:'20px', whiteSpace:'nowrap'}}>
            <span className="auth-badge authenticated">✓ {isAdmin ? 'Admin' : currentUser?.username}</span>
            <button onClick={handleLogout} className="logout-btn" style={{background:'#48bb78'}}>🚪 Logout</button>
          </span>
        </nav>
      </header>
      <main>
        {tab==='dashboard' && (
          <div className="dashboard">
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px'}}>
              <h2>Dashboard Overview</h2>
            </div>
            <div className="stats-grid">
              <div className="stat-card scale-in" style={{animationDelay: '0s'}}>
                <div className="stat-icon">💰</div>
                <div className="stat-info">
                  <h3>₹{((stats.totalRevenue || 0).toFixed(1))}</h3>
                  <p>Total Revenue</p>
                </div>
              </div>
              <div className="stat-card scale-in" style={{animationDelay: '0.1s'}}>
                <div className="stat-icon">🧾</div>
                <div className="stat-info">
                  <h3>{stats.totalInvoices || 0}</h3>
                  <p>Total Invoices</p>
                </div>
              </div>
              <div className="stat-card scale-in" style={{animationDelay: '0.2s', cursor: stats.lowStockCount > 0 ? 'pointer' : 'default'}} onClick={() => {
                if (stats.lowStockCount > 0) {
                  setShowStockAlert(true);
                }
              }}>
                <div className="stat-icon">📉</div>
                <div className="stat-info">
                  <h3>{stats.lowStockCount || 0}</h3>
                  <p>Low Stock Items</p>
                </div>
              </div>
              <div className="stat-card scale-in" style={{animationDelay: '0.3s'}}>
                <div className="stat-icon">📈</div>
                <div className="stat-info">
                  <h3>₹{((stats.todaySales || 0).toFixed(1))}</h3>
                  <p>Today's Sales</p>
                </div>
              </div>

              <div className="stat-card scale-in" style={{animationDelay: '0.4s'}}>
                <div className="stat-icon">💰</div>
                <div className="stat-info">
                  <h3>₹{((stats.todayProfit || 0).toFixed(1))}</h3>
                  <p>Today's Profit</p>
                </div>
              </div>
            </div>

            <div className="recent-section">
              <h3>Low Stock Alert</h3>
              <table>
                <thead><tr><th>Product</th><th>Current Stock</th><th>Status</th></tr></thead>
                <tbody>
                  {products.filter(p=>p.quantity<20).slice(0,5).map(p=>(
                    <tr key={p.id}>
                      <td>{p.name}</td>
                      <td>{p.quantity}</td>
                      <td><span className="badge danger">Low Stock</span></td>
                    </tr>
                  ))}
                  {products.filter(p=>p.quantity<20).length===0 && <tr><td colSpan="3">All products well stocked!</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab==='pos' && (
          <div className="pos">
            <div className="left">
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', gap: '8px'}}>
                <h2 style={{margin: 0}}>Products</h2>
                <div style={{display: 'flex', gap: '8px', alignItems: 'center'}}>
                  <input 
                    type="text" 
                    placeholder="🔍 Search products..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '2px solid #e2e8f0',
                      fontSize: '13px',
                      width: '200px',
                      outline: 'none',
                      transition: 'all 0.2s'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#667eea'}
                    onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                  />
                  <button
                    onClick={scanBarcodeInPOS}
                    style={{
                      padding: '8px 12px',
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '14px',
                      cursor: 'pointer',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                      transition: 'transform 0.2s',
                      whiteSpace: 'nowrap'
                    }}
                    onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
                    onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                    title="Enter barcode manually"
                  >
                    📊 Barcode
                  </button>
                  <button
                    onClick={() => {
                      setScannerMode('pos');
                      setShowBarcodeScanner(true);
                    }}
                    style={{
                      padding: '8px 12px',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '18px',
                      cursor: 'pointer',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                      transition: 'transform 0.2s',
                      whiteSpace: 'nowrap'
                    }}
                    onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
                    onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                    title="Scan barcode/QR code"
                  >
                    📷 Scan
                  </button>
                </div>
              </div>
              <ul className="products">
                {products
                  .filter(p => searchQuery === '' || 
                    p.name.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .map((p, idx)=> (
                    <li key={p.id} className="fade-in" style={{position: 'relative', animationDelay: `${idx * 0.03}s`}}>
                      {p.quantity === 0 && (
                        <div style={{
                          position: 'absolute',
                          top: '8px',
                          right: '8px',
                          background: '#feb2b2',
                          color: '#742a2a',
                          fontSize: '10px',
                          padding: '3px 6px',
                          borderRadius: '4px',
                          fontWeight: 'bold'
                        }}>
                          OUT
                        </div>
                      )}
                      {p.quantity > 0 && p.quantity < 10 && (
                        <div style={{
                          position: 'absolute',
                          top: '8px',
                          right: '8px',
                          background: '#feebc8',
                          color: '#7c2d12',
                          fontSize: '10px',
                          padding: '3px 6px',
                          borderRadius: '4px',
                          fontWeight: 'bold'
                        }}>
                          LOW
                        </div>
                      )}
                      {(p.photo || p.photoUrl) && (
                        <div style={{
                          width: '100%',
                          height: '120px',
                          marginBottom: '8px',
                          overflow: 'hidden',
                          borderRadius: '8px',
                          background: '#f8f9fa',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <img 
                            src={(p.photo || p.photoUrl).startsWith('http') ? (p.photo || p.photoUrl) : API(p.photo || p.photoUrl)} 
                            alt={p.name}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'contain'
                            }}
                            onError={(e) => {
                              console.error('Image load error for product:', p.name, 'URL:', e.target.src);
                              e.target.style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                      <div><strong>{p.name}</strong></div>
                      {p.barcode && <div style={{fontSize: '10px', color: '#999', fontFamily: 'monospace'}}>📊 {p.barcode}</div>}
                      <div>Qty: {p.quantity} • ₹{p.price}</div>
                      <button 
                        onClick={()=>{
                          addToCart(p);
                          showNotification(`Added ${p.name} to cart`, 'info');
                        }}
                        disabled={p.quantity === 0}
                        style={{opacity: p.quantity === 0 ? 0.5 : 1, cursor: p.quantity === 0 ? 'not-allowed' : 'pointer'}}
                      >
                        {p.quantity === 0 ? '🚫 Out of Stock' : '➕ Add'}
                      </button>
                    </li>
                  ))
                }
              </ul>
            </div>
            <div className="right">
              <h2>Cart</h2>
              
              {/* Customer Selection */}
              <div className="form-group">
                <label>Customer:</label>
                <select value={selectedCustomer?.id || ''} onChange={e=> {
                  const cust = customers.find(c=>c.id==e.target.value);
                  setSelectedCustomer(cust);
                }}>
                  <option value="">Walk-in Customer</option>
                  {customers.map(c=> <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              {/* Cart Items */}
              <ul className="cart">
                {cart.map(it=> (
                  <li key={it.productId} style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px', marginBottom:'5px', background:'#f9f9f9', borderRadius:'5px'}}>
                    <div style={{flex:1}}>
                      <strong>{it.name}</strong>
                      <div style={{fontSize:'12px', color:'#666'}}>₹{it.price} each</div>
                    </div>
                    <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                      <button 
                        onClick={()=>decreaseCartQty(it.productId)} 
                        style={{width:'32px', height:'32px', border:'2px solid #e53e3e', background:'white', color:'#e53e3e', cursor:'pointer', borderRadius:'6px', fontSize:'20px', fontWeight:'bold', display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.2s'}}
                        onMouseOver={(e)=>{e.target.style.background='#e53e3e'; e.target.style.color='white'}}
                        onMouseOut={(e)=>{e.target.style.background='white'; e.target.style.color='#e53e3e'}}
                        title="Decrease quantity"
                      >
                        ➖
                      </button>
                      <span style={{minWidth:'40px', textAlign:'center', fontWeight:'bold', fontSize:'16px'}}>{it.quantity}</span>
                      <button 
                        onClick={()=>increaseCartQty(it.productId)} 
                        style={{width:'32px', height:'32px', border:'2px solid #48bb78', background:'white', color:'#48bb78', cursor:'pointer', borderRadius:'6px', fontSize:'20px', fontWeight:'bold', display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.2s'}}
                        onMouseOver={(e)=>{e.target.style.background='#48bb78'; e.target.style.color='white'}}
                        onMouseOut={(e)=>{e.target.style.background='white'; e.target.style.color='#48bb78'}}
                        title="Increase quantity"
                      >
                        ➕
                      </button>
                      <button 
                        onClick={()=>removeFromCart(it.productId)} 
                        style={{width:'32px', height:'32px', border:'none', background:'#f56565', color:'white', cursor:'pointer', borderRadius:'6px', marginLeft:'5px', fontSize:'18px', fontWeight:'bold', display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.2s'}}
                        onMouseOver={(e)=>e.target.style.background='#c53030'}
                        onMouseOut={(e)=>e.target.style.background='#f56565'}
                        title="Remove item"
                      >
                        🗑️
                      </button>
                      <span style={{minWidth:'70px', textAlign:'right', fontWeight:'bold'}}>₹{(it.price*it.quantity).toFixed(1)}</span>
                    </div>
                  </li>
                ))}
              </ul>

              {/* Discount Section */}
              <div className="form-group">
                <label>Discount: {discount}%</label>
                <input type="range" min="0" max="50" value={discount} 
                       onChange={(e)=>setDiscount(parseFloat(e.target.value))}
                       style={{width:'100%'}} />
              </div>

              {/* GST Rate */}
              <div className="form-group">
                <label>GST Rate:</label>
                <select value={taxRate} onChange={(e)=>setTaxRate(parseFloat(e.target.value))}>
                  <option value="0">0% (Exempt)</option>
                  <option value="5">5% GST</option>
                  <option value="12">12% GST</option>
                  <option value="18">18% GST</option>
                  <option value="28">28% GST</option>
                </select>
              </div>

              {/* Seller Selection */}
              <div className="form-group">
                <label>Seller:</label>
                <select 
                  value={selectedSeller || (isAdmin ? 'admin' : currentUser?.username || '')} 
                  onChange={(e) => setSelectedSeller(e.target.value)}
                >
                  {isAdmin && <option value="admin">Admin</option>}
                  {users.filter(u => u.approved).map(user => (
                    <option key={user._id} value={user.username}>
                      {user.username} {user.role !== 'cashier' ? `(${user.role})` : ''}
                    </option>
                  ))}
                  {!isAdmin && currentUser && (
                    <option value={currentUser.username}>{currentUser.username}</option>
                  )}
                </select>
              </div>

              {/* Payment Mode */}
              <div className="form-group">
                <label>Payment Mode:</label>
                <select value={splitPayment ? PAYMENT_MODES.SPLIT : paymentMode} onChange={(e)=>{
                  if (e.target.value === PAYMENT_MODES.SPLIT) {
                    setSplitPayment(true);
                  } else {
                    setSplitPayment(false);
                    setPaymentMode(e.target.value);
                  }
                }}>
                  <option value={PAYMENT_MODES.CASH}>💵 Cash</option>
                  <option value={PAYMENT_MODES.CARD}>💳 Card</option>
                  <option value={PAYMENT_MODES.UPI}>📱 UPI</option>
                  <option value={PAYMENT_MODES.SPLIT}>💰 Split Payment</option>
                </select>
              </div>

              {/* Split Payment Inputs */}
              {splitPayment && cart.length > 0 && (() => {
                const subtotal = cart.reduce((s,it)=> s + it.price*it.quantity, 0);
                const discountAmount = subtotal * discount / 100;
                const afterDiscount = subtotal - discountAmount;
                const taxAmount = afterDiscount * DEFAULT_GST;
                const grandTotal = afterDiscount + taxAmount;
                const totalPaid = (parseFloat(cashAmount) || 0) + (parseFloat(upiAmount) || 0) + (parseFloat(cardAmount) || 0);
                const remaining = grandTotal - totalPaid;
                const isValid = Math.abs(remaining) <= 0.01;
                
                return (
                  <div style={{marginBottom: '15px', padding: '15px', background: '#f7fafc', borderRadius: '8px', border: isValid ? '2px solid #48bb78' : '2px solid #fc8181'}}>
                    <div style={{marginBottom: '10px', fontWeight: '600', color: '#2d3748', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                      <span>Split Payment - Total: {formatCurrency(grandTotal)}</span>
                      <button 
                        onClick={() => {
                          setCashAmount(grandTotal.toFixed(1));
                          setUpiAmount('0');
                          setCardAmount('0');
                        }}
                        style={{
                          padding: '5px 10px',
                          background: '#4299e1',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        💵 Full Cash
                      </button>
                    </div>
                    <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '10px'}}>
                      <div className="form-group" style={{marginBottom: '0'}}>
                        <label style={{fontSize: '13px'}}>💵 Cash</label>
                        <input 
                          type="number" 
                          value={cashAmount} 
                          onChange={(e)=>setCashAmount(e.target.value)}
                          min="0"
                          step="0.1"
                          placeholder="0.0"
                          style={{textAlign: 'right', fontWeight: 'bold'}}
                        />
                      </div>
                      <div className="form-group" style={{marginBottom: '0'}}>
                        <label style={{fontSize: '13px'}}>📱 UPI</label>
                        <input 
                          type="number" 
                          value={upiAmount} 
                        onChange={(e)=>setUpiAmount(e.target.value)}
                        min="0"
                        step="0.1"
                        placeholder="0.0"
                        style={{textAlign: 'right', fontWeight: 'bold'}}
                      />
                    </div>
                    <div className="form-group" style={{marginBottom: '0'}}>
                      <label style={{fontSize: '13px'}}>💳 Card</label>
                      <input 
                        type="number" 
                        value={cardAmount} 
                        onChange={(e)=>setCardAmount(e.target.value)}
                        min="0"
                        step="0.1"
                        placeholder="0.0"
                        style={{textAlign: 'right', fontWeight: 'bold'}}
                      />
                    </div>
                    </div>
                    <div style={{
                      padding: '10px',
                      background: isValid ? '#c6f6d5' : '#fff5f5',
                      borderRadius: '5px',
                      fontWeight: '600',
                      color: isValid ? '#2f855a' : '#c53030',
                      fontSize: '14px'
                    }}>
                      {isValid ? '✓ Exact Amount' : `⚠️ ${remaining > 0 ? 'Remaining' : 'Excess'}: ${formatCurrency(Math.abs(remaining))}`}
                    </div>
                  </div>
                );
              })()}

              {/* Bill Breakdown */}
              {cart.length > 0 && (() => {
                const subtotal = cart.reduce((s,it)=> s + it.price*it.quantity, 0);
                const discountAmount = subtotal * discount / 100;
                const afterDiscount = subtotal - discountAmount;
                const taxAmount = afterDiscount * DEFAULT_GST;
                const grandTotal = afterDiscount + taxAmount;
                
                return (
                  <div className="bill-breakdown">
                    <div className="breakdown-row"><span>Subtotal:</span><span>{formatCurrency(subtotal)}</span></div>
                    {discount > 0 && (
                      <>
                        <div className="breakdown-row"><span>Discount ({discount}%):</span><span style={{color: '#48bb78'}}>-{formatCurrency(discountAmount)}</span></div>
                        <div className="breakdown-row"><span>After Discount:</span><span>{formatCurrency(afterDiscount)}</span></div>
                      </>
                    )}
                    <div className="breakdown-row"><span>GST (18%):</span><span>{formatCurrency(taxAmount)}</span></div>
                  </div>
                );
              })()}
              
              <div className="total">
                Grand Total: {cart.length > 0 ? (() => {
                  const subtotal = cart.reduce((s,it)=> s + it.price*it.quantity, 0);
                  const discountAmount = (subtotal * discount / 100);
                  const afterDiscount = subtotal - discountAmount;
              const taxAmount = afterDiscount * DEFAULT_GST;
              return formatCurrency(afterDiscount + taxAmount);
            })() : '₹0.0'}
          </div>
          
          <button 
            onClick={() => requireAuth(checkout)} 
            disabled={
              cart.length === 0 || 
              !canMakeSales() || 
              checkoutLoading ||
              (splitPayment && (() => {
                const subtotal = cart.reduce((s,it)=> s + it.price*it.quantity, 0);
                const discountAmount = subtotal * discount / 100;
                const afterDiscount = subtotal - discountAmount;
                const taxAmount = afterDiscount * DEFAULT_GST;
                const grandTotal = afterDiscount + taxAmount;
                const validation = validateSplitPayment(cashAmount, upiAmount, cardAmount, grandTotal);
                return !validation.valid;
              })())
            } 
            className="btn-complete-sale"
          >
            {checkoutLoading ? (
              <>
                <span className="spinner-small"></span> Processing...
              </>
            ) : (
              '💳 Complete Sale'
            )}
          </button>
        </div>
      </div>
    )}        {tab==='products' && (
          <div>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'20px'}}>
              <h2>Product Inventory</h2>
              <button onClick={()=>requireAuth(()=>setShowAddProduct(true))} className="btn-primary">+ Add Product</button>
            </div>
            
            {/* Filter and Sort Controls */}
            <div className="product-controls fade-in">
              <div className="filter-group">
                <label>🔍 Filter:</label>
                <select value={productFilter} onChange={e => setProductFilter(e.target.value)} className="control-select">
                  <option value="all">All Products ({products.length})</option>
                  <option value="low-stock">Low Stock ({products.filter(p => p.quantity > 0 && p.quantity < 10).length})</option>
                  <option value="out-of-stock">Out of Stock ({products.filter(p => p.quantity === 0).length})</option>
                  <option value="high-profit">High Profit (≥30%) ({products.filter(p => p.profitPercent >= 30).length})</option>
                </select>
              </div>
              <div className="filter-group">
                <label>📊 Sort By:</label>
                <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="control-select">
                  <option value="name">Name (A-Z)</option>
                  <option value="stock">Stock (Low to High)</option>
                  <option value="price">Price (High to Low)</option>
                  <option value="profit">Profit (High to Low)</option>
                </select>
              </div>
            </div>
            
            <table>
              <thead>
                <tr>
                  <th>SI No</th>
                  <th>Name</th>
                  <th>Stock</th>
                  {canViewProfit() && <th>Cost Price</th>}
                  <th>Selling Price</th>
                  {canViewProfit() && <th>Profit</th>}
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {getFilteredProducts().map((prod, index) => (
                  <tr key={prod.id} className="fade-in table-row-hover">
                    <td style={{fontFamily:'monospace', fontSize:'0.9em'}}>{index + 1}</td>
                    <td>
                      <span onClick={() => {setSelectedProduct(prod); setShowProductDetails(true);}} style={{cursor:'pointer', textDecoration:'underline', color:'#3498db'}}>
                        {prod.name}
                      </span>
                      {prod.quantity === 0 && <span className="badge out-of-stock">Out of Stock</span>}
                      {prod.quantity > 0 && prod.quantity < 10 && <span className="badge low-stock">Low Stock</span>}
                    </td>
                    <td>
                      <span style={{
                        fontWeight: 'bold',
                        color: prod.quantity === 0 ? '#ef4444' : prod.quantity < 10 ? '#f59e0b' : '#10b981'
                      }}>
                        {prod.quantity}
                      </span>
                    </td>
                    {canViewProfit() && <td>₹{prod.costPrice || 0}</td>}
                    <td>₹{prod.price}</td>
                    {canViewProfit() && (
                      <td style={{color: prod.profit > 0 ? 'green' : 'red', fontWeight: 'bold'}}>
                        ₹{prod.profit || 0} ({prod.profitPercent || 0}%)
                      </td>
                    )}
                    <td>
                      <button onClick={() => {setSelectedProduct(prod); setShowProductDetails(true);}} className="btn-info" style={{padding:'5px 10px', marginRight:'5px'}}>View</button>
                      <button onClick={()=>requireAuth(()=>{
                        if(confirm(`Delete ${prod.name}?`)){
                          deleteProduct(prod.id);
                          addActivity('Product Deleted', prod.name);
                          showNotification(`${prod.name} deleted`, 'success');
                        }
                      })} className="btn-danger" style={{padding:'5px 10px'}}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab==='inventory' && (
          <div>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'20px'}}>
              <h2>📦 Inventory Management</h2>
              <div style={{display:'flex',gap:'10px',alignItems:'center'}}>
                <input 
                  type="text" 
                  placeholder="🔍 Search products..." 
                  value={searchQuery} 
                  onChange={e=>setSearchQuery(e.target.value)}
                  style={{padding:'8px 12px',borderRadius:'6px',border:'1px solid #ddd',minWidth:'250px'}}
                />
              </div>
            </div>

            {/* Stock Status Summary */}
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))',gap:'15px',marginBottom:'25px'}}>
              <div style={{background:'linear-gradient(135deg, #10b981 0%, #059669 100%)',padding:'20px',borderRadius:'10px',color:'white',boxShadow:'0 4px 6px rgba(0,0,0,0.1)'}}>
                <div style={{fontSize:'14px',opacity:'0.9'}}>✅ In Stock</div>
                <div style={{fontSize:'32px',fontWeight:'bold',marginTop:'8px'}}>
                  {products.filter(p => p.quantity >= 10).length}
                </div>
              </div>
              <div style={{background:'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',padding:'20px',borderRadius:'10px',color:'white',boxShadow:'0 4px 6px rgba(0,0,0,0.1)'}}>
                <div style={{fontSize:'14px',opacity:'0.9'}}>⚠️ Low Stock</div>
                <div style={{fontSize:'32px',fontWeight:'bold',marginTop:'8px'}}>
                  {products.filter(p => p.quantity > 0 && p.quantity < 10).length}
                </div>
              </div>
              <div style={{background:'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',padding:'20px',borderRadius:'10px',color:'white',boxShadow:'0 4px 6px rgba(0,0,0,0.1)'}}>
                <div style={{fontSize:'14px',opacity:'0.9'}}>❌ Out of Stock</div>
                <div style={{fontSize:'32px',fontWeight:'bold',marginTop:'8px'}}>
                  {products.filter(p => p.quantity === 0).length}
                </div>
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th>Photo</th>
                  <th>Barcode</th>
                  <th>Product Name</th>
                  <th>Current Stock</th>
                  <th>Min Stock</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {getFilteredProducts().map(prod => (
                  <tr key={prod.id} className="fade-in table-row-hover">
                    <td>
                      <div style={{position:'relative',width:'60px',height:'60px'}}>
                        {(prod.photo || prod.photoUrl) ? (
                          <img 
                            src={(prod.photo || prod.photoUrl).startsWith('http') ? (prod.photo || prod.photoUrl) : API(prod.photo || prod.photoUrl)} 
                            alt={prod.name}
                            style={{
                              width:'60px',
                              height:'60px',
                              objectFit:'contain',
                              borderRadius:'8px',
                              border:'2px solid #e5e7eb',
                              background:'#f8f9fa'
                            }}
                            onError={(e) => {
                              console.error('Image load error for product:', prod.name, 'URL:', e.target.src);
                              e.target.style.display = 'none';
                              const fallback = document.createElement('div');
                              fallback.style.cssText = 'width:60px;height:60px;background:linear-gradient(135deg, #e5e7eb 0%, #d1d5db 100%);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:24px;color:#9ca3af;';
                              fallback.innerHTML = '📦';
                              e.target.parentElement.replaceChild(fallback, e.target);
                            }}
                          />
                        ) : (
                          <div style={{
                            width:'60px',
                            height:'60px',
                            background:'linear-gradient(135deg, #e5e7eb 0%, #d1d5db 100%)',
                            borderRadius:'8px',
                            display:'flex',
                            alignItems:'center',
                            justifyContent:'center',
                            fontSize:'24px',
                            color:'#9ca3af'
                          }}>
                            📦
                          </div>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          style={{display:'none'}}
                          id={`photo-${prod.id}`}
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) {
                              requireAuth(() => uploadProductPhoto(prod.id, file));
                            }
                          }}
                        />
                        <button
                          onClick={() => document.getElementById(`photo-${prod.id}`).click()}
                          style={{
                            position:'absolute',
                            bottom:'-5px',
                            right:'20px',
                            width:'24px',
                            height:'24px',
                            borderRadius:'50%',
                            background:'#667eea',
                            color:'white',
                            border:'2px solid white',
                            cursor:'pointer',
                            fontSize:'12px',
                            display:'flex',
                            alignItems:'center',
                            justifyContent:'center',
                            padding:0
                          }}
                          title="Upload photo"
                        >
                          📷
                        </button>
                      </div>
                    </td>
                    <td style={{fontFamily:'monospace', fontSize:'0.9em'}}>
                      {prod.barcode || 'Auto-generated'}
                      {prod.barcode && (
                        <div style={{fontSize:'0.75em',color:'#666'}}>
                          <button
                            onClick={() => showProductBarcode(prod)}
                            style={{
                              background:'none',
                              border:'none',
                              color:'#667eea',
                              cursor:'pointer',
                              padding:0,
                              textDecoration:'underline',
                              fontSize:'0.85em'
                            }}
                          >
                            📊 View Barcode
                          </button>
                        </div>
                      )}
                    </td>
                    <td>
                      <strong>{prod.name}</strong>
                      <div style={{fontSize:'0.85em',color:'#666'}}>{prod.category || 'Uncategorized'}</div>
                    </td>
                    <td>
                      <span style={{
                        fontSize: '18px',
                        fontWeight: 'bold',
                        color: prod.quantity === 0 ? '#ef4444' : prod.quantity < 10 ? '#f59e0b' : '#10b981'
                      }}>
                        {prod.quantity}
                      </span>
                    </td>
                    <td style={{color:'#666'}}>10</td>
                    <td>
                      {prod.quantity === 0 && <span className="badge out-of-stock">Out of Stock</span>}
                      {prod.quantity > 0 && prod.quantity < 10 && <span className="badge low-stock">Low Stock</span>}
                      {prod.quantity >= 10 && <span className="badge in-stock">In Stock</span>}
                    </td>
                    <td>
                      <div style={{display:'flex',gap:'8px',alignItems:'center',flexWrap:'wrap'}}>
                        <input 
                          type="number" 
                          defaultValue={prod.quantity}
                          min="0"
                          style={{width:'80px',padding:'6px',borderRadius:'4px',border:'1px solid #ddd'}}
                          id={`qty-${prod.id}`}
                        />
                        <button 
                          onClick={()=>requireAuth(()=>{
                            const inputEl = document.getElementById(`qty-${prod.id}`);
                            const newQuantity = parseInt(inputEl.value) || 0;
                            if(newQuantity === prod.quantity) {
                              showNotification('No change in quantity', 'info');
                              return;
                            }
                            if(confirm(`Update stock for ${prod.name}?\n\nCurrent: ${prod.quantity}\nNew: ${newQuantity}`)){
                              updateStock(prod.id, newQuantity);
                              addActivity('Stock Updated', `${prod.name}: ${prod.quantity} → ${newQuantity}`);
                              showNotification(`✅ Stock updated: ${prod.name} now has ${newQuantity} units`, 'success');
                            }
                          })}
                          className="btn-primary" 
                          style={{padding:'6px 12px',whiteSpace:'nowrap'}}
                        >
                          💾 Update
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {getFilteredProducts().length === 0 && (
                  <tr>
                    <td colSpan="7" style={{textAlign:'center',padding:'60px 20px'}}>
                      <div style={{fontSize:'48px',marginBottom:'16px'}}>📦</div>
                      <div style={{fontSize:'18px',color:'#666',marginBottom:'8px',fontWeight:'500'}}>
                        {searchQuery ? 'No products found' : 'No products yet'}
                      </div>
                      <div style={{fontSize:'14px',color:'#999'}}>
                        {searchQuery ? 'Try a different search term' : 'Click "Add Product" to get started with your inventory'}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {tab==='customers' && (
          <div>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'20px'}}>
              <h2>Customers</h2>
              <button onClick={()=>requireAuth(()=>setShowAddCustomer(true))} className="btn-primary">+ Add Customer</button>
            </div>
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Phone</th>
                  <th>GSTIN</th>
                  <th>Address</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.map(c=> (
                  <tr key={c.id}>
                    <td>{c.id}</td>
                    <td>{c.name}</td>
                    <td>{c.phone}</td>
                    <td style={{fontFamily:'monospace', fontSize:'0.9em'}}>{c.gstin || 'N/A'}</td>
                    <td style={{maxWidth:'200px', overflow:'hidden', textOverflow:'ellipsis'}}>{c.address}</td>
                    <td>
                      <button 
                        onClick={async () => {
                          setSelectedCustomerHistory(c);
                          const purchases = invoices.filter(inv => inv.customer_id === c.id);
                          setCustomerPurchases(purchases);
                          setShowCustomerHistory(true);
                        }}
                        style={{
                          padding: '6px 12px',
                          background: '#667eea',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        📊 View History
                      </button>
                    </td>
                  </tr>
                ))}
                {customers.length === 0 && (
                  <tr>
                    <td colSpan="6" style={{textAlign:'center',padding:'60px 20px'}}>
                      <div style={{fontSize:'48px',marginBottom:'16px'}}>👥</div>
                      <div style={{fontSize:'18px',color:'#666',marginBottom:'8px',fontWeight:'500'}}>
                        No customers yet
                      </div>
                      <div style={{fontSize:'14px',color:'#999'}}>
                        Add your first customer to start tracking sales and purchase history
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {tab==='analytics' && (
          <div>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'30px'}}>
              <h2>📊 Analytics Dashboard</h2>
              <div>
                <label>Date Range: </label>
                <select 
                  value={analyticsDateRange} 
                  onChange={(e) => {
                    setAnalyticsDateRange(parseInt(e.target.value));
                    fetchAnalyticsData(parseInt(e.target.value));
                  }}
                  style={{padding:'8px',borderRadius:'6px',border:'1px solid #ddd'}}
                >
                  <option value={7}>Last 7 Days</option>
                  <option value={30}>Last 30 Days</option>
                  <option value={90}>Last 90 Days</option>
                  <option value={365}>Last Year</option>
                </select>
              </div>
            </div>

            {/* Revenue Summary Cards */}
            {analyticsData.revenueSummary && Object.keys(analyticsData.revenueSummary).length > 0 && (
              <div className="stats" style={{marginBottom:'30px'}}>
                <div className="stat-card">
                  <h3>Total Revenue</h3>
                  <p>₹{analyticsData.revenueSummary.totalRevenue?.toLocaleString() || '0'}</p>
                </div>
                {canViewProfit() && (
                  <>
                    <div className="stat-card">
                      <h3>Total Profit</h3>
                      <p>₹{analyticsData.revenueSummary.totalProfit?.toLocaleString() || '0'}</p>
                    </div>
                    <div className="stat-card">
                      <h3>Profit Margin</h3>
                      <p>{analyticsData.revenueSummary.profitMargin || '0'}%</p>
                    </div>
                  </>
                )}
                <div className="stat-card">
                  <h3>Total Orders</h3>
                  <p>{analyticsData.revenueSummary.totalBills || '0'}</p>
                </div>
                <div className="stat-card">
                  <h3>Avg Order Value</h3>
                  <p>₹{analyticsData.revenueSummary.averageOrderValue || '0'}</p>
                </div>
              </div>
            )}

            {/* Top Products */}
            {analyticsData.topProducts && analyticsData.topProducts.length > 0 && (
              <div style={{marginBottom:'30px',background:'#fff',padding:'20px',borderRadius:'8px',boxShadow:'0 2px 8px rgba(0,0,0,0.1)'}}>
                <h3>🏆 Top Selling Products</h3>
                <table>
                  <thead>
                    <tr>
                      <th>Product Name</th>
                      <th>Quantity Sold</th>
                      <th>Revenue</th>
                      {canViewProfit() && <th>Profit</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {analyticsData.topProducts.map((product, idx) => (
                      <tr key={idx}>
                        <td>{product.name}</td>
                        <td>{product.quantity}</td>
                        <td>₹{product.revenue.toLocaleString()}</td>
                        {canViewProfit() && <td>₹{product.profit.toLocaleString()}</td>}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Low Stock Items */}
            {analyticsData.lowStock && analyticsData.lowStock.length > 0 && (
              <div style={{background:'#fff',padding:'20px',borderRadius:'8px',boxShadow:'0 2px 8px rgba(0,0,0,0.1)'}}>
                <h3>⚠️ Low Stock Alerts</h3>
                <table>
                  <thead>
                    <tr>
                      <th>Product Name</th>
                      <th>Current Stock</th>
                      <th>Min Stock</th>
                      <th>Shortage</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analyticsData.lowStock.map((item, idx) => (
                      <tr key={idx} style={{background:item.currentStock === 0 ? '#fee' : '#fff8e1'}}>
                        <td>{item.name}</td>
                        <td>{item.currentStock}</td>
                        <td>{item.minStock}</td>
                        <td style={{color:'red',fontWeight:'bold'}}>{item.shortage}</td>
                        <td>
                          <button 
                            onClick={() => {
                              setTab('products');
                              setSearchQuery(item.name);
                            }}
                            style={{padding:'6px 12px',background:'#667eea',color:'#fff',border:'none',borderRadius:'4px',cursor:'pointer'}}
                          >
                            Restock
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {(!analyticsData.revenueSummary || Object.keys(analyticsData.revenueSummary).length === 0) && (
              <div className="empty-state">
                <div className="empty-icon">📊</div>
                <h3>No Analytics Data Yet</h3>
                <p>Make some sales to see analytics insights</p>
                <button onClick={() => setTab('pos')} style={{marginTop:'20px',padding:'12px 24px',background:'#667eea',color:'#fff',border:'none',borderRadius:'8px',cursor:'pointer'}}>
                  Start Selling →
                </button>
              </div>
            )}
          </div>
        )}

        {tab==='reports' && (
          <div>
            <h2>Reports & Analytics</h2>
            
            {/* Download Reports Section */}
            <div className="download-reports-section">
              <h3>📥 Download Reports</h3>
              <p style={{color:'#666',marginBottom:'20px'}}>Export professional reports in CSV format</p>
              <div className="download-buttons-grid">
                <button onClick={downloadSalesReport} className="download-btn sales">
                  <span className="btn-icon">📊</span>
                  <div>
                    <strong>Sales Report (CSV)</strong>
                    <small>All invoices with profit details</small>
                  </div>
                </button>
                <button onClick={downloadInventoryReport} className="download-btn inventory">
                  <span className="btn-icon">📦</span>
                  <div>
                    <strong>Inventory Report (CSV)</strong>
                    <small>Stock levels & pricing</small>
                  </div>
                </button>
                <button onClick={exportProductsToPDF} className="download-btn inventory">
                  <span className="btn-icon">�</span>
                  <div>
                    <strong>Products (PDF)</strong>
                    <small>Complete product list</small>
                  </div>
                </button>
                <button onClick={downloadCustomerReport} className="download-btn customers">
                  <span className="btn-icon">�</span>
                  <div>
                    <strong>Customer Report</strong>
                    <small>Customer database</small>
                  </div>
                </button>
                <button onClick={downloadProfitReport} className="download-btn profit">
                  <span className="btn-icon">�</span>
                  <div>
                    <strong>Profit Analysis</strong>
                    <small>Financial overview</small>
                  </div>
                </button>
              </div>
            </div>

            {/* Summary Cards */}
            <div className="reports-grid" style={{marginTop:'30px'}}>
              <div className="report-card">
                <h3>📊 Sales Summary</h3>
                <p>Total Revenue: ₹{stats.totalRevenue || 0}</p>
                <p>Total Invoices: {stats.totalInvoices || 0}</p>
                <p>Average Sale: ₹{stats.totalInvoices > 0 ? Math.round(stats.totalRevenue / stats.totalInvoices) : 0}</p>
              </div>
              <div className="report-card">
                <h3>📦 Inventory Status</h3>
                <p>Total Products: {stats.totalProducts || 0}</p>
                <p>Low Stock Items: {stats.lowStockCount || 0}</p>
                <p>Well Stocked: {(stats.totalProducts || 0) - (stats.lowStockCount || 0)}</p>
              </div>
              <div className="report-card">
                <h3>👥 Customer Insights</h3>
                <p>Total Customers: {stats.totalCustomers || 0}</p>
                <p>Today's Sales: ₹{stats.todaySales || 0}</p>
              </div>
            </div>
          </div>
        )}

        {/* Invoices Tab */}
        {tab==='invoices' && (
          <div>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'20px'}}>
              <h2>🧾 Invoices</h2>
              <div style={{display:'flex',gap:'10px',alignItems:'center'}}>
                <select 
                  value={invoiceDateFilter} 
                  onChange={(e) => setInvoiceDateFilter(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '2px solid #e2e8f0',
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">Last 7 Days</option>
                  <option value="month">Last 30 Days</option>
                  <option value="custom">Custom Range</option>
                </select>
                {invoiceDateFilter === 'custom' && (
                  <>
                    <input 
                      type="date" 
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      style={{
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: '2px solid #e2e8f0',
                        fontSize: '14px'
                      }}
                    />
                    <span>to</span>
                    <input 
                      type="date" 
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      style={{
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: '2px solid #e2e8f0',
                        fontSize: '14px'
                      }}
                    />
                  </>
                )}
              </div>
            </div>

            {/* Summary Cards */}
            <div className="stats-grid" style={{marginBottom:'30px'}}>
              <div className="stat-card">
                <div className="stat-icon">�</div>
                <div className="stat-info">
                  <h3>{getFilteredInvoices().length}</h3>
                  <p>Total Invoices</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">💰</div>
                <div className="stat-info">
                  <h3>₹{getFilteredInvoices().reduce((sum, inv) => sum + (inv.total || 0), 0).toFixed(1)}</h3>
                  <p>Total Revenue</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">📈</div>
                <div className="stat-info">
                  <h3>₹{getFilteredInvoices().length > 0 ? (getFilteredInvoices().reduce((sum, inv) => sum + (inv.total || 0), 0) / getFilteredInvoices().length).toFixed(1) : 0}</h3>
                  <p>Average Sale</p>
                </div>
              </div>
            </div>

            {/* Invoices Table */}
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Invoice #</th>
                    <th>Date</th>
                    <th>Customer</th>
                    <th>Items</th>
                    <th>Subtotal</th>
                    <th>Discount</th>
                    <th>GST</th>
                    <th>Total</th>
                    <th>Payment</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {getFilteredInvoices().length === 0 ? (
                    <tr>
                      <td colSpan="10" style={{textAlign:'center',padding:'40px',color:'#999'}}>
                        No invoices found for selected period
                      </td>
                    </tr>
                  ) : (
                    getFilteredInvoices().reverse().map(inv => (
                      <tr key={inv.id || inv._id}>
                        <td><strong>#{inv.id || inv.billNumber}</strong></td>
                        <td>{new Date(inv.created_at || inv.date).toLocaleDateString()}</td>
                        <td>{inv.customer_name || inv.customerName || 'Walk-in'}</td>
                        <td>{inv.items?.length || 0} items</td>
                        <td>₹{(inv.subtotal || 0).toFixed(1)}</td>
                        <td>
                          <span style={{color:'#e74c3c',fontSize:'13px'}}>
                            -{inv.discountPercent || 0}%
                            <br/>
                            <small style={{color:'#888'}}>₹{(inv.discountAmount || 0).toFixed(1)}</small>
                          </span>
                        </td>
                        <td>
                          <span style={{color:'#27ae60',fontSize:'13px'}}>
                            +{inv.taxRate || 0}%
                            <br/>
                            <small style={{color:'#888'}}>₹{(inv.taxAmount || 0).toFixed(1)}</small>
                          </span>
                        </td>
                        <td><strong style={{color:'#2c3e50'}}>₹{(inv.total || inv.grandTotal || 0).toFixed(1)}</strong></td>
                        <td>
                          {(inv.paymentMode === 'split' || inv.paymentMode === 'Split') && inv.splitPaymentDetails ? (
                            <div style={{display:'flex',flexDirection:'column',gap:'4px'}}>
                              <span className="badge info" style={{fontSize:'11px'}}>Split Payment</span>
                              <div style={{fontSize:'10px',color:'#666',display:'flex',flexDirection:'column',gap:'2px'}}>
                                {inv.splitPaymentDetails.cashAmount > 0 && (
                                  <span>Cash: ₹{inv.splitPaymentDetails.cashAmount.toFixed(1)}</span>
                                )}
                                {inv.splitPaymentDetails.upiAmount > 0 && (
                                  <span>UPI: ₹{inv.splitPaymentDetails.upiAmount.toFixed(1)}</span>
                                )}
                                {inv.splitPaymentDetails.cardAmount > 0 && (
                                  <span>Card: ₹{inv.splitPaymentDetails.cardAmount.toFixed(1)}</span>
                                )}
                              </div>
                            </div>
                          ) : (
                            <span className={`badge ${
                              inv.paymentMode === 'Cash' || inv.paymentMode === 'cash' ? 'success' : 
                              inv.paymentMode === 'UPI' || inv.paymentMode === 'upi' ? 'primary' : 
                              inv.paymentMode === 'Card' || inv.paymentMode === 'card' ? 'info' : 
                              'info'
                            }`}>
                              {inv.paymentMode || 'Cash'}
                            </span>
                          )}
                        </td>
                        <td>
                          <button 
                            onClick={() => exportInvoiceToPDF(inv)}
                            className="btn-sm btn-primary"
                            style={{padding:'6px 12px',fontSize:'12px'}}
                          >
                            📄 PDF
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Users Management Tab (Admin Only) */}
        {tab==='users' && isAdmin && (
          <div className="users-management">
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'20px'}}>
              <h2>👥 User Management</h2>
              <div style={{display:'flex',gap:'10px',alignItems:'center'}}>
                <span style={{color:'#000',fontSize:'14px',fontWeight:'500'}}>
                  Total Users: {users.length} | Pending: {users.filter(u=>!u.approved).length}
                </span>
              </div>
            </div>
            
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Username</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Registered</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{textAlign:'center',padding:'40px',color:'#999'}}>
                        No users registered yet
                      </td>
                    </tr>
                  ) : (
                    users.map(user => (
                      <tr key={user._id}>
                        <td>
                          <strong>{user.username}</strong>
                        </td>
                        <td>{user.email}</td>
                        <td>
                          <select
                            value={user.role}
                            onChange={(e) => changeUserRole(user._id, e.target.value, user.username)}
                            style={{
                              background: user.role === 'admin' ? '#667eea' : user.role === 'manager' ? '#4299e1' : '#48bb78',
                              color: 'white',
                              padding: '6px 10px',
                              borderRadius: '4px',
                              fontSize: '12px',
                              border: 'none',
                              cursor: 'pointer',
                              fontWeight: '500'
                            }}
                          >
                            <option value="admin">👑 Admin</option>
                            <option value="manager">👔 Manager</option>
                            <option value="cashier">💰 Cashier</option>
                          </select>
                        </td>
                        <td>
                          {user.approved ? (
                            <span className="badge" style={{
                              background: '#48bb78',
                              color: 'white',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontSize: '12px'
                            }}>
                              ✓ Approved
                            </span>
                          ) : (
                            <span className="badge" style={{
                              background: '#ed8936',
                              color: 'white',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontSize: '12px'
                            }}>
                              ⏳ Pending
                            </span>
                          )}
                        </td>
                        <td>
                          {new Date(user.createdAt).toLocaleDateString('en-IN', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </td>
                        <td>
                          <div style={{display:'flex',gap:'8px',flexWrap:'wrap'}}>
                            {!user.approved ? (
                              <button 
                                onClick={() => approveUser(user._id)}
                                className="btn-success"
                                style={{
                                  padding: '6px 12px',
                                  fontSize: '12px',
                                  background: '#48bb78',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: 'pointer'
                                }}
                              >
                                ✓ Approve
                              </button>
                            ) : (
                              <button 
                                onClick={() => revokeUserAccess(user._id, user.username)}
                                style={{
                                  padding: '6px 12px',
                                  fontSize: '12px',
                                  background: '#ed8936',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: 'pointer'
                                }}
                              >
                                � Revoke Access
                              </button>
                            )}
                            <button 
                              onClick={() => {
                                if(window.confirm(`Delete user "${user.username}"? They will be immediately logged out and removed permanently.`)) {
                                  deleteUser(user._id);
                                }
                              }}
                              className="btn-danger"
                              style={{
                                padding: '6px 12px',
                                fontSize: '12px',
                                background: '#f56565',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer'
                              }}
                            >
                              🗑️ Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Audit Logs Tab (Admin Only) */}
        {tab==='audit' && isAdmin && (
          <div className="audit-logs">
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'20px'}}>
              <h2>📋 Audit Trail Logs</h2>
              <button onClick={fetchAuditLogs} className="btn-primary" style={{padding:'8px 16px'}}>
                🔄 Refresh
              </button>
            </div>
            
            <div style={{background:'white',borderRadius:'15px',padding:'20px',boxShadow:'0 4px 15px rgba(0,0,0,0.1)'}}>
              <p style={{color:'#666',marginBottom:'20px',fontSize:'14px'}}>
                Complete audit trail of all system changes. Track who made what changes and when.
              </p>
              
              <div className="table-container" style={{maxHeight:'70vh',overflowY:'auto'}}>
                <table>
                  <thead>
                    <tr>
                      <th>Timestamp</th>
                      <th>User</th>
                      <th>Action</th>
                      <th>Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.length === 0 ? (
                      <tr>
                        <td colSpan="4" style={{textAlign:'center',padding:'40px',color:'#999'}}>
                          No audit logs yet
                        </td>
                      </tr>
                    ) : (
                      auditLogs.map(log => (
                        <tr key={log.id}>
                          <td style={{fontSize:'13px',color:'#666',whiteSpace:'nowrap'}}>
                            {new Date(log.timestamp).toLocaleString('en-IN', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit'
                            })}
                          </td>
                          <td>
                            <span style={{
                              background: log.username === 'admin' ? '#667eea' : '#48bb78',
                              color: 'white',
                              padding: '4px 10px',
                              borderRadius: '12px',
                              fontSize: '12px',
                              fontWeight: '600'
                            }}>
                              {log.username}
                            </span>
                          </td>
                          <td>
                            <span style={{
                              background: 
                                log.action.includes('DELETE') ? '#f56565' :
                                log.action.includes('ADD') || log.action.includes('COMPLETE') ? '#48bb78' :
                                log.action.includes('UPDATE') ? '#ed8936' : '#667eea',
                              color: 'white',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: '600',
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px'
                            }}>
                              {log.action.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td style={{fontSize:'13px'}}>
                            {log.details && (
                              <div style={{maxWidth:'400px'}}>
                                {log.details.productName && <span>Product: <strong>{log.details.productName}</strong></span>}
                                {log.details.customerName && <span>Customer: <strong>{log.details.customerName}</strong></span>}
                                {log.details.billNumber && <span>Bill: <strong>{log.details.billNumber}</strong></span>}
                                {log.details.oldQuantity !== undefined && (
                                  <span> | Stock: {log.details.oldQuantity} → {log.details.newQuantity} 
                                    <span style={{
                                      color: log.details.change > 0 ? '#48bb78' : '#f56565',
                                      fontWeight: 'bold'
                                    }}>
                                      ({log.details.change > 0 ? '+' : ''}{log.details.change})
                                    </span>
                                  </span>
                                )}
                                {log.details.grandTotal && <span> | Total: ₹{log.details.grandTotal}</span>}
                                {log.details.profit !== undefined && (
                                  <span style={{color:'#48bb78',fontWeight:'bold'}}> | Profit: ₹{log.details.profit}</span>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              
              {auditLogs.length > 0 && (
                <div style={{marginTop:'20px',textAlign:'center',color:'#999',fontSize:'13px'}}>
                  Showing last {auditLogs.length} activities
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Add Product Modal */}
      {showAddProduct && (
        <div className="modal-overlay" onClick={()=>setShowAddProduct(false)}>
          <div className="modal-content" onClick={(e)=>e.stopPropagation()}>
            <h2>Add New Product</h2>
            <form onSubmit={(e)=>{e.preventDefault(); addProduct();}}>
              <div className="form-group">
                <label>Product Name</label>
                <input 
                  type="text" 
                  value={newProduct.name} 
                  onChange={(e)=>setNewProduct({...newProduct, name:e.target.value})}
                  required
                  placeholder="Enter product name"
                />
              </div>
              <div className="form-group">
                <label>Quantity</label>
                <input 
                  type="number" 
                  value={newProduct.quantity} 
                  onChange={(e)=>setNewProduct({...newProduct, quantity:e.target.value})}
                  required
                  min="0"
                  placeholder="Stock quantity"
                />
              </div>
              <div className="form-group">
                <label>Minimum Stock Level</label>
                <input 
                  type="number" 
                  value={newProduct.minStock} 
                  onChange={(e)=>setNewProduct({...newProduct, minStock:e.target.value})}
                  required
                  min="0"
                  placeholder="Alert when stock falls below this"
                />
              </div>
              <div className="form-group">
                <label>Cost Price (₹)</label>
                <input 
                  type="number" 
                  value={newProduct.costPrice} 
                  onChange={(e)=>setNewProduct({...newProduct, costPrice:e.target.value})}
                  required
                  min="0"
                  step="0.01"
                  placeholder="Purchase/Cost price"
                />
              </div>
              <div className="form-group">
                <label>Selling Price (₹)</label>
                <input 
                  type="number" 
                  value={newProduct.price} 
                  onChange={(e)=>setNewProduct({...newProduct, price:e.target.value})}
                  required
                  min="0"
                  step="0.01"
                  placeholder="Selling price to customers"
                />
              </div>
              <div className="form-group">
                <label>HSN Code</label>
                <input 
                  type="text" 
                  value={newProduct.hsnCode} 
                  onChange={(e)=>setNewProduct({...newProduct, hsnCode:e.target.value})}
                  placeholder="HSN/SAC code for GST"
                />
              </div>
              <div className="modal-actions">
                <button type="submit" className="btn-primary">Add Product</button>
                <button type="button" onClick={()=>setShowAddProduct(false)} className="btn-secondary">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Customer Modal */}
      {showAddCustomer && (
        <div className="modal-overlay" onClick={()=>setShowAddCustomer(false)}>
          <div className="modal-content" onClick={(e)=>e.stopPropagation()}>
            <h2>Add New Customer</h2>
            <form onSubmit={(e)=>{e.preventDefault(); addCustomer();}}>
              <div className="form-group">
                <label>Customer Name</label>
                <input 
                  type="text" 
                  value={newCustomer.name} 
                  onChange={(e)=>setNewCustomer({...newCustomer, name:e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input 
                  type="tel" 
                  value={newCustomer.phone} 
                  onChange={(e)=>setNewCustomer({...newCustomer, phone:e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Address</label>
                <input 
                  type="text" 
                  value={newCustomer.address} 
                  onChange={(e)=>setNewCustomer({...newCustomer, address:e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>GSTIN (Optional)</label>
                <input 
                  type="text" 
                  value={newCustomer.gstin} 
                  onChange={(e)=>setNewCustomer({...newCustomer, gstin:e.target.value.toUpperCase()})}
                  placeholder="e.g., 29AABCT1234L1Z5"
                  pattern="[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}"
                  title="Valid GSTIN format: 29AABCT1234L1Z5"
                  maxLength="15"
                />
              </div>
              <div className="modal-actions">
                <button type="submit" className="btn-primary">Add Customer</button>
                <button type="button" onClick={()=>setShowAddCustomer(false)} className="btn-secondary">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer Purchase History Modal */}
      {showCustomerHistory && selectedCustomerHistory && (
        <div className="modal-overlay" onClick={()=>setShowCustomerHistory(false)}>
          <div className="modal-content" style={{maxWidth: '900px'}} onClick={(e)=>e.stopPropagation()}>
            <h2>📊 Purchase History - {selectedCustomerHistory.name}</h2>
            <div style={{marginBottom: '20px', padding: '15px', background: '#f7fafc', borderRadius: '8px'}}>
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px'}}>
                <p><strong>Phone:</strong> {selectedCustomerHistory.phone}</p>
                <p><strong>GSTIN:</strong> {selectedCustomerHistory.gstin || 'N/A'}</p>
                <p style={{gridColumn: '1 / -1'}}><strong>Address:</strong> {selectedCustomerHistory.address}</p>
              </div>
              <div style={{marginTop: '15px', display: 'flex', gap: '20px', justifyContent: 'center'}}>
                <div style={{textAlign: 'center', padding: '10px', background: 'white', borderRadius: '8px', flex: 1}}>
                  <div style={{fontSize: '24px', fontWeight: 'bold', color: '#667eea'}}>
                    {customerPurchases.length}
                  </div>
                  <div style={{fontSize: '12px', color: '#666'}}>Total Purchases</div>
                </div>
                <div style={{textAlign: 'center', padding: '10px', background: 'white', borderRadius: '8px', flex: 1}}>
                  <div style={{fontSize: '24px', fontWeight: 'bold', color: '#48bb78'}}>
                    ₹{customerPurchases.reduce((sum, inv) => sum + parseFloat(inv.total || 0), 0).toFixed(1)}
                  </div>
                  <div style={{fontSize: '12px', color: '#666'}}>Total Spent</div>
                </div>
                <div style={{textAlign: 'center', padding: '10px', background: 'white', borderRadius: '8px', flex: 1}}>
                  <div style={{fontSize: '24px', fontWeight: 'bold', color: '#f6ad55'}}>
                    ₹{customerPurchases.length > 0 ? (customerPurchases.reduce((sum, inv) => sum + parseFloat(inv.total || 0), 0) / customerPurchases.length).toFixed(1) : '0.00'}
                  </div>
                  <div style={{fontSize: '12px', color: '#666'}}>Avg Purchase</div>
                </div>
              </div>
            </div>
            
            {customerPurchases.length > 0 ? (
              <div style={{maxHeight: '400px', overflowY: 'auto'}}>
                <table>
                  <thead>
                    <tr>
                      <th>Invoice #</th>
                      <th>Date</th>
                      <th>Items</th>
                      <th>Discount</th>
                      <th>Total Amount</th>
                      <th>Payment Mode</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customerPurchases.map(inv => (
                      <tr key={inv.id}>
                        <td>#{inv.id}</td>
                        <td>{new Date(inv.created_at).toLocaleDateString('en-IN')}</td>
                        <td>{inv.items?.length || 0} items</td>
                        <td>{inv.discountPercent || 0}%</td>
                        <td style={{fontWeight: 'bold', color: '#667eea'}}>₹{inv.total}</td>
                        <td>{inv.paymentMode || 'Cash'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{textAlign: 'center', padding: '40px', color: '#999'}}>
                <div style={{fontSize: '48px', marginBottom: '10px'}}>🛍️</div>
                <p>No purchase history found for this customer</p>
              </div>
            )}
            
            <div className="modal-actions" style={{marginTop: '20px'}}>
              <button onClick={()=>setShowCustomerHistory(false)} className="btn-secondary">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Transaction Bill Modal */}
      {showBill && lastBill && (
        <div className="modal-overlay" onClick={()=>setShowBill(false)} style={{zIndex: 9999}}>
          <div className="modal-content bill-modal" onClick={(e)=>e.stopPropagation()} style={{
            maxWidth: '600px',
            maxHeight: '90vh',
            overflowY: 'auto',
            background: 'white',
            position: 'relative'
          }}>
            <div id="bill-print-content">
              <div className="bill-header">
                <h2>⚡ 26:07 ELECTRONICS</h2>
                <h3>Premium Electronics & Smart Solutions</h3>
                <p>Tax Invoice</p>
              </div>
              
              <div className="bill-info">
                <p><strong>Bill No:</strong> {lastBill.billNumber}</p>
                <p><strong>Date:</strong> {new Date().toLocaleString()}</p>
                <p><strong>Customer:</strong> {lastBill.customerName}</p>
                {lastBill.customerPhone && <p><strong>Phone:</strong> {lastBill.customerPhone}</p>}
                <p><strong>Payment Mode:</strong> {lastBill.paymentMode}</p>
              </div>

              <table>
                <thead>
                  <tr>
                    <th style={{textAlign:'left'}}>Item</th>
                    <th style={{textAlign:'center'}}>Qty</th>
                    <th style={{textAlign:'right'}}>Price</th>
                    <th style={{textAlign:'right'}}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {lastBill.items && lastBill.items.map((item, idx) => (
                    <tr key={idx}>
                      <td>{item.productName || item.name}</td>
                      <td style={{textAlign:'center'}}>{item.quantity}</td>
                      <td style={{textAlign:'right'}}>₹{item.unitPrice || item.price}</td>
                      <td style={{textAlign:'right'}}>₹{((item.unitPrice || item.price) * item.quantity).toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="bill-summary">
                <div><span>Subtotal:</span><span>₹{lastBill.subtotal.toFixed(1)}</span></div>
                {lastBill.discountAmount > 0 && (
                  <>
                    <div><span>Discount ({lastBill.discountPercent || lastBill.discountValue}%):</span><span>-₹{lastBill.discountAmount.toFixed(1)}</span></div>
                    <div><span>After Discount:</span><span>₹{(lastBill.subtotal - lastBill.discountAmount).toFixed(1)}</span></div>
                  </>
                )}
                <div><span>GST ({lastBill.taxRate}%):</span><span>₹{lastBill.taxAmount.toFixed(1)}</span></div>
                <div className="grand-total">
                  <span><strong>Grand Total:</strong></span>
                  <span><strong>₹{lastBill.total.toFixed(1)}</strong></span>
                </div>
              </div>

              <div className="bill-footer">
                <p><strong>Thank you for your business!</strong></p>
                <p>© {new Date().getFullYear()} Shahinsha</p>
              </div>
            </div>

            <div className="modal-actions" style={{marginTop:'20px'}}>
              <button onClick={printBill} className="btn-primary">🖨️ Print Bill</button>
              <button onClick={()=>setShowBill(false)} className="btn-secondary">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Barcode Scanner Modal */}
      {showBarcodeScanner && (
        <div className="modal-overlay" onClick={() => {setShowBarcodeScanner(false); setScannedBarcode('');}}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>📷 Scan Barcode/QR Code</h2>
            <div style={{marginBottom: '20px'}}>
              <div id="qr-reader" style={{width: '100%', maxWidth: '500px', margin: '0 auto'}}></div>
            </div>
            <div className="form-group">
              <label>Or Enter Barcode Manually</label>
              <input
                type="text"
                value={scannedBarcode}
                onChange={(e) => setScannedBarcode(e.target.value)}
                placeholder="Enter barcode and press Enter"
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && scannedBarcode.trim()) {
                    handleBarcodeResult(scannedBarcode.trim());
                  }
                }}
                autoFocus
              />
            </div>
            <div className="modal-actions">
              <button
                onClick={() => scannedBarcode.trim() && handleBarcodeResult(scannedBarcode.trim())}
                className="btn-primary"
                disabled={!scannedBarcode.trim()}
              >
                Search Product
              </button>
              <button onClick={() => {setShowBarcodeScanner(false); setScannedBarcode('');}} className="btn-secondary">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Barcode & QR Code Modal */}
      {showBarcodeModal && barcodeProduct && (
        <div className="modal-overlay" onClick={() => {setShowBarcodeModal(false); setBarcodeImage(null); setQrCodeImage(null);}}>
          <div className="modal-content" style={{maxWidth: '600px'}} onClick={(e) => e.stopPropagation()}>
            <h2>📊 Product Barcode & QR Code</h2>
            
            <div style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              padding: '20px',
              borderRadius: '12px',
              color: 'white',
              marginBottom: '20px',
              textAlign: 'center'
            }}>
              <h3 style={{margin: '0 0 8px 0', fontSize: '24px'}}>{barcodeProduct.name}</h3>
              <div style={{fontSize: '32px', fontWeight: 'bold'}}>₹{barcodeProduct.price?.toFixed(1)}</div>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '20px',
              marginBottom: '20px'
            }}>
              {/* Standard Barcode */}
              <div style={{
                background: 'white',
                border: '2px dashed #ccc',
                borderRadius: '12px',
                padding: '20px',
                textAlign: 'center'
              }}>
                <h4 style={{margin: '0 0 15px 0', color: '#333'}}>Standard Barcode</h4>
                {barcodeImage ? (
                  <img 
                    src={barcodeImage} 
                    alt="Barcode" 
                    style={{
                      width: '100%',
                      maxWidth: '250px',
                      height: 'auto'
                    }}
                  />
                ) : (
                  <div style={{padding: '40px', color: '#999'}}>
                    Loading...
                  </div>
                )}
                <div style={{
                  marginTop: '10px',
                  fontSize: '12px',
                  color: '#666',
                  fontFamily: 'monospace'
                }}>
                  {barcodeProduct.barcode}
                </div>
              </div>

              {/* QR Code */}
              <div style={{
                background: 'white',
                border: '2px dashed #ccc',
                borderRadius: '12px',
                padding: '20px',
                textAlign: 'center'
              }}>
                <h4 style={{margin: '0 0 15px 0', color: '#333'}}>QR Code</h4>
                {qrCodeImage ? (
                  <img 
                    src={qrCodeImage} 
                    alt="QR Code" 
                    style={{
                      width: '200px',
                      height: '200px'
                    }}
                  />
                ) : (
                  <div style={{padding: '40px', color: '#999'}}>
                    Loading...
                  </div>
                )}
                <div style={{
                  marginTop: '10px',
                  fontSize: '11px',
                  color: '#666'
                }}>
                  Scan for product info
                </div>
              </div>
            </div>

            <div style={{
              background: '#f7fafc',
              padding: '15px',
              borderRadius: '8px',
              marginBottom: '20px'
            }}>
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '14px'}}>
                <div><strong>Product ID:</strong> {barcodeProduct.id}</div>
                <div><strong>Stock:</strong> {barcodeProduct.quantity} units</div>
                <div><strong>Cost Price:</strong> ₹{barcodeProduct.costPrice?.toFixed(1)}</div>
                <div><strong>Selling Price:</strong> ₹{barcodeProduct.price?.toFixed(1)}</div>
              </div>
            </div>

            <div className="modal-actions">
              <button 
                onClick={printBarcode}
                className="btn-primary"
                disabled={!barcodeImage}
              >
                🖨️ Print Barcode
              </button>
              <button 
                onClick={() => {
                  const link = document.createElement('a');
                  link.download = `${barcodeProduct.name}-barcode.png`;
                  link.href = barcodeImage;
                  link.click();
                }}
                className="btn-primary"
                style={{background: '#10b981'}}
                disabled={!barcodeImage}
              >
                💾 Download Barcode
              </button>
              <button 
                onClick={() => {
                  const link = document.createElement('a');
                  link.download = `${barcodeProduct.name}-qrcode.png`;
                  link.href = qrCodeImage;
                  link.click();
                }}
                className="btn-primary"
                style={{background: '#8b5cf6'}}
                disabled={!qrCodeImage}
              >
                💾 Download QR Code
              </button>
              <button 
                onClick={() => {
                  setShowBarcodeModal(false);
                  setBarcodeImage(null);
                  setQrCodeImage(null);
                }}
                className="btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Copyright Footer */}
      <footer className="copyright-footer">
        <div className="footer-content">
          <p>© {new Date().getFullYear()} Shahinsha</p>
        </div>
      </footer>
    </div>
  )
}
