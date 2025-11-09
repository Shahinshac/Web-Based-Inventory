// Application-wide constants

// GST Configuration
export const DEFAULT_GST = 0.18; // Fixed 18% GST
export const GST_PERCENT = 18;

// Number Formatting
// Format number to exactly 1 decimal place
export const fmt1 = (n) => Number.isFinite(n) ? parseFloat(n).toFixed(1) : '0.0';

// Format currency with 1 decimal
export const formatCurrency = (n) => `₹${fmt1(n)}`;

// Payment Modes
export const PAYMENT_MODES = {
  CASH: 'cash',
  UPI: 'upi',
  CARD: 'card',
  SPLIT: 'split'
};

export const PAYMENT_MODE_LABELS = {
  [PAYMENT_MODES.CASH]: 'Cash',
  [PAYMENT_MODES.UPI]: 'UPI',
  [PAYMENT_MODES.CARD]: 'Card',
  [PAYMENT_MODES.SPLIT]: 'Split Payment'
};

// Validate split payment amounts
export const validateSplitPayment = (cashAmount, upiAmount, cardAmount, totalAmount) => {
  const cash = parseFloat(cashAmount) || 0;
  const upi = parseFloat(upiAmount) || 0;
  const card = parseFloat(cardAmount) || 0;
  
  // All values must be >= 0
  if (cash < 0 || upi < 0 || card < 0) {
    return { valid: false, error: 'Payment amounts cannot be negative' };
  }
  
  // At least one payment method must be > 0
  if (cash === 0 && upi === 0 && card === 0) {
    return { valid: false, error: 'At least one payment method must be used' };
  }
  
  // Sum must match total (with 0.01 tolerance)
  const sum = cash + upi + card;
  const total = parseFloat(totalAmount) || 0;
  
  if (Math.abs(sum - total) > 0.01) {
    return { 
      valid: false, 
      error: `Payment total (₹${fmt1(sum)}) must match grand total (₹${fmt1(total)})` 
    };
  }
  
  return { valid: true, cash, upi, card };
};
