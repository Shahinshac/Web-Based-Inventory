// Input validation utilities for API endpoints

// Validate email format
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Validate phone number (Indian format)
function isValidPhone(phone) {
  if (!phone) return true; // Phone is optional
  const phoneRegex = /^[6-9]\d{9}$/; // Indian mobile numbers
  return phoneRegex.test(phone.replace(/\s|-/g, ''));
}

// Validate GST number (Indian format)
function isValidGSTIN(gstin) {
  if (!gstin) return true; // GSTIN is optional
  const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  return gstinRegex.test(gstin);
}

// Validate product data
function validateProduct(product) {
  const errors = [];
  
  if (!product.name || product.name.trim().length < 2) {
    errors.push('Product name must be at least 2 characters');
  }
  
  if (product.name && product.name.length > 200) {
    errors.push('Product name must be less than 200 characters');
  }
  
  if (product.price !== undefined && (isNaN(product.price) || product.price < 0)) {
    errors.push('Price must be a non-negative number');
  }
  
  if (product.costPrice !== undefined && (isNaN(product.costPrice) || product.costPrice < 0)) {
    errors.push('Cost price must be a non-negative number');
  }
  
  if (product.quantity !== undefined && (isNaN(product.quantity) || product.quantity < 0 || !Number.isInteger(Number(product.quantity)))) {
    errors.push('Quantity must be a non-negative integer');
  }
  
  if (product.minStock !== undefined && (isNaN(product.minStock) || product.minStock < 0 || !Number.isInteger(Number(product.minStock)))) {
    errors.push('Minimum stock must be a non-negative integer');
  }
  
  if (product.hsnCode && !/^\d{4,8}$/.test(product.hsnCode)) {
    errors.push('HSN code must be 4-8 digits');
  }
  
  if (product.sku && product.sku.length > 50) {
    errors.push('SKU must be less than 50 characters');
  }
  
  return errors;
}

// Validate customer data
function validateCustomer(customer) {
  const errors = [];
  
  if (!customer.name || customer.name.trim().length < 2) {
    errors.push('Customer name must be at least 2 characters');
  }
  
  if (customer.name && customer.name.length > 100) {
    errors.push('Customer name must be less than 100 characters');
  }
  
  if (customer.phone && !isValidPhone(customer.phone)) {
    errors.push('Invalid phone number format (must be 10 digits starting with 6-9)');
  }
  
  if (customer.email && !isValidEmail(customer.email)) {
    errors.push('Invalid email format');
  }
  
  if (customer.gstin && !isValidGSTIN(customer.gstin)) {
    errors.push('Invalid GSTIN format');
  }
  
  if (customer.address && customer.address.length > 500) {
    errors.push('Address must be less than 500 characters');
  }
  
  return errors;
}

// Validate user registration data
function validateUserRegistration(user) {
  const errors = [];
  
  if (!user.username || user.username.trim().length < 3) {
    errors.push('Username must be at least 3 characters');
  }
  
  if (user.username && user.username.length > 50) {
    errors.push('Username must be less than 50 characters');
  }
  
  if (user.username && !/^[a-zA-Z0-9_]+$/.test(user.username)) {
    errors.push('Username can only contain letters, numbers, and underscores');
  }
  
  if (!user.password || user.password.length < 6) {
    errors.push('Password must be at least 6 characters');
  }
  
  if (user.password && user.password.length > 100) {
    errors.push('Password must be less than 100 characters');
  }
  
  if (!user.email || !isValidEmail(user.email)) {
    errors.push('Valid email is required');
  }
  
  return errors;
}

// Validate checkout/invoice data
function validateCheckout(data) {
  const errors = [];
  
  if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
    errors.push('Cart must contain at least one item');
  }
  
  if (data.items) {
    data.items.forEach((item, index) => {
      if (!item.productId) {
        errors.push(`Item ${index + 1}: Product ID is required`);
      }
      if (!item.quantity || item.quantity < 1 || !Number.isInteger(Number(item.quantity))) {
        errors.push(`Item ${index + 1}: Valid quantity is required`);
      }
      if (item.price === undefined || item.price < 0) {
        errors.push(`Item ${index + 1}: Valid price is required`);
      }
    });
  }
  
  if (data.discount !== undefined && (isNaN(data.discount) || data.discount < 0 || data.discount > 100)) {
    errors.push('Discount must be between 0 and 100');
  }
  
  if (data.discountPercent !== undefined && (isNaN(data.discountPercent) || data.discountPercent < 0 || data.discountPercent > 100)) {
    errors.push('Discount percent must be between 0 and 100');
  }
  
  if (data.discountValue !== undefined && (isNaN(data.discountValue) || data.discountValue < 0 || data.discountValue > 100)) {
    errors.push('Discount value must be between 0 and 100');
  }
  
  if (data.taxRate !== undefined && (isNaN(data.taxRate) || data.taxRate < 0 || data.taxRate > 100)) {
    errors.push('Tax rate must be between 0 and 100');
  }
  
  if (data.total !== undefined && (isNaN(data.total) || data.total < 0)) {
    errors.push('Total must be a non-negative number');
  }
  
  // Validate payment mode (accept lowercase: cash, upi, card, split)
  const validPaymentModes = ['cash', 'upi', 'card', 'split', 'Cash', 'UPI', 'Card', 'Split'];
  if (data.paymentMode && !validPaymentModes.includes(data.paymentMode)) {
    errors.push('Invalid payment mode. Must be: cash, upi, card, or split');
  }
  
  // Validate split payment details
  if (data.paymentMode === 'split' || data.paymentMode === 'Split') {
    const cashAmount = parseFloat(data.cashAmount) || 0;
    const upiAmount = parseFloat(data.upiAmount) || 0;
    const cardAmount = parseFloat(data.cardAmount) || 0;
    const totalAmount = parseFloat(data.totalAmount) || parseFloat(data.total) || 0;
    
    // All amounts must be >= 0
    if (cashAmount < 0 || upiAmount < 0 || cardAmount < 0) {
      errors.push('Split payment amounts cannot be negative');
    }
    
    // At least one must be > 0
    if (cashAmount === 0 && upiAmount === 0 && cardAmount === 0) {
      errors.push('At least one payment method must be used in split payment');
    }
    
    // Sum must match total (with 0.01 tolerance)
    const sum = cashAmount + upiAmount + cardAmount;
    if (totalAmount > 0 && Math.abs(sum - totalAmount) > 0.01) {
      errors.push(`Split payment sum (${sum.toFixed(2)}) must match total (${totalAmount.toFixed(2)})`);
    }
  }
  
  return errors;
}

// Sanitize string input (prevent XSS)
function sanitizeString(str) {
  if (typeof str !== 'string') return str;
  return str
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .trim();
}

// Sanitize object recursively
function sanitizeObject(obj) {
  if (typeof obj !== 'object' || obj === null) {
    return typeof obj === 'string' ? sanitizeString(obj) : obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }
  
  const sanitized = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      sanitized[key] = sanitizeObject(obj[key]);
    }
  }
  return sanitized;
}

module.exports = {
  isValidEmail,
  isValidPhone,
  isValidGSTIN,
  validateProduct,
  validateCustomer,
  validateUserRegistration,
  validateCheckout,
  sanitizeString,
  sanitizeObject
};
