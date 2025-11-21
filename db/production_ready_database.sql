-- ============================================================================
-- PRODUCTION READY BILLING SYSTEM DATABASE - SALES VERSION
-- Professional GST Billing System for Commercial Use
-- Version: 4.0 - Production Ready Edition
-- Date: October 19, 2025
-- Features: Simplified GST (18% standard), Professional Billing, Multi-Payment
-- ============================================================================

DROP DATABASE IF EXISTS inventorydb;
CREATE DATABASE inventorydb CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE inventorydb;

-- ============================================================================
-- TABLE: product
-- Professional product management with GST and inventory tracking
-- ============================================================================
CREATE TABLE product (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(200) NOT NULL,
    hsn_code VARCHAR(20) DEFAULT '9999' COMMENT 'HSN/SAC code for GST',
    quantity INT NOT NULL DEFAULT 0 COMMENT 'Current stock',
    cost_price DECIMAL(12,2) NOT NULL DEFAULT 0.00 COMMENT 'Purchase cost',
    price DECIMAL(12,2) NOT NULL DEFAULT 0.00 COMMENT 'Selling price (MRP)',
    profit_margin DECIMAL(5,2) DEFAULT 0.00 COMMENT 'Profit %',
    gst_rate DECIMAL(5,2) DEFAULT 18.00 COMMENT 'GST rate (simplified)',
    category VARCHAR(50) DEFAULT 'General' COMMENT 'Product category',
    barcode VARCHAR(50) DEFAULT NULL COMMENT 'Product barcode',
    description TEXT DEFAULT NULL COMMENT 'Product description',
    min_stock INT DEFAULT 5 COMMENT 'Minimum stock alert level',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_name (name),
    INDEX idx_category (category),
    INDEX idx_barcode (barcode),
    INDEX idx_hsn (hsn_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Product master - production ready';

-- ============================================================================
-- TABLE: customer
-- Simplified customer management (removed state_code)
-- ============================================================================
CREATE TABLE customer (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) DEFAULT NULL,
    phone VARCHAR(20) DEFAULT NULL,
    address TEXT DEFAULT NULL,
    gstin VARCHAR(15) DEFAULT NULL COMMENT 'Customer GSTIN (optional)',
    customer_type ENUM('B2C', 'B2B') DEFAULT 'B2C' COMMENT 'Business type',
    is_active BOOLEAN DEFAULT TRUE COMMENT 'Customer status',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_name (name),
    INDEX idx_phone (phone),
    INDEX idx_type (customer_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Customer master - simplified';

-- ============================================================================
-- TABLE: supplier
-- Supplier management
-- ============================================================================
CREATE TABLE supplier (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) DEFAULT NULL,
    phone VARCHAR(20) DEFAULT NULL,
    address TEXT DEFAULT NULL,
    gstin VARCHAR(15) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Supplier master';

-- ============================================================================
-- TABLE: bill
-- Professional billing with simplified GST (no state dependency)
-- ============================================================================
CREATE TABLE bill (
    id INT PRIMARY KEY AUTO_INCREMENT,
    bill_number VARCHAR(20) NOT NULL UNIQUE,
    bill_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    customer_id INT NOT NULL,
    customer_name VARCHAR(100) NOT NULL,
    customer_phone VARCHAR(20) DEFAULT NULL,
    customer_gstin VARCHAR(15) DEFAULT NULL COMMENT 'Customer GSTIN if B2B',
    
    -- Financial calculations
    subtotal DECIMAL(12,2) NOT NULL DEFAULT 0.00 COMMENT 'Before discount & tax',
    discount_percent DECIMAL(5,2) DEFAULT 0.00 COMMENT 'Discount percentage',
    discount_amount DECIMAL(12,2) DEFAULT 0.00 COMMENT 'Discount amount',
    taxable_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00 COMMENT 'After discount',
    gst_amount DECIMAL(12,2) DEFAULT 0.00 COMMENT 'Total GST (simplified)',
    round_off DECIMAL(5,2) DEFAULT 0.00 COMMENT 'Rounding adjustment',
    grand_total DECIMAL(12,2) NOT NULL DEFAULT 0.00 COMMENT 'Final payable amount',
    
    -- Payment information
    payment_mode ENUM('Cash', 'Card', 'UPI', 'Net Banking', 'Credit') DEFAULT 'Cash',
    payment_status ENUM('Paid', 'Pending', 'Partial', 'Cancelled') DEFAULT 'Paid',
    payment_reference VARCHAR(100) DEFAULT NULL COMMENT 'Transaction/Reference ID',
    
    -- Additional fields
    notes TEXT DEFAULT NULL,
    created_by VARCHAR(50) DEFAULT 'System' COMMENT 'User who created bill',
    total_profit DECIMAL(12,2) DEFAULT 0.00 COMMENT 'Total profit on this bill',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (customer_id) REFERENCES customer(id),
    INDEX idx_bill_number (bill_number),
    INDEX idx_bill_date (bill_date),
    INDEX idx_customer (customer_id),
    INDEX idx_payment_status (payment_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Bill master - production ready';

-- ============================================================================
-- TABLE: transaction
-- Bill line items with simplified GST
-- ============================================================================
CREATE TABLE transaction (
    id INT PRIMARY KEY AUTO_INCREMENT,
    bill_id INT NOT NULL,
    bill_number VARCHAR(20) NOT NULL,
    product_id INT NOT NULL,
    product_name VARCHAR(200) NOT NULL,
    hsn_code VARCHAR(20) DEFAULT '9999',
    
    -- Quantity and pricing
    quantity INT NOT NULL DEFAULT 1,
    cost_price DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    unit_price DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    subtotal DECIMAL(12,2) NOT NULL DEFAULT 0.00 COMMENT 'qty * unit_price',
    
    -- Discount and tax
    discount_percent DECIMAL(5,2) DEFAULT 0.00,
    discount_amount DECIMAL(12,2) DEFAULT 0.00,
    taxable_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    gst_rate DECIMAL(5,2) DEFAULT 18.00,
    gst_amount DECIMAL(12,2) DEFAULT 0.00 COMMENT 'Simplified GST',
    line_total DECIMAL(12,2) NOT NULL DEFAULT 0.00 COMMENT 'Final line amount',
    
    -- Profit tracking
    line_profit DECIMAL(12,2) DEFAULT 0.00 COMMENT 'Profit on this line',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (bill_id) REFERENCES bill(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES product(id),
    INDEX idx_bill (bill_id),
    INDEX idx_product (product_id),
    INDEX idx_bill_number (bill_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Transaction details - production ready';

-- ============================================================================
-- SAMPLE DATA - PRODUCTION READY
-- ============================================================================

-- Insert sample products
INSERT INTO product (id, name, hsn_code, quantity, cost_price, price, profit_margin, gst_rate, category, barcode, description) VALUES
(1, 'Samsung Galaxy S24', '85171200', 25, 85000.00, 119999.00, 41.18, 18.00, 'Mobile', 'SG24001', 'Latest Samsung flagship smartphone'),
(2, 'Apple iPhone 15', '85171200', 15, 65000.00, 99999.00, 53.85, 18.00, 'Mobile', 'IP15001', 'Latest Apple iPhone with USB-C'),
(3, 'OnePlus 12', '85171200', 30, 45000.00, 69999.00, 55.56, 18.00, 'Mobile', 'OP12001', 'OnePlus flagship with Snapdragon 8 Gen 3'),
(4, 'Dell XPS 13 Laptop', '84713000', 10, 75000.00, 124999.00, 66.67, 18.00, 'Laptop', 'DL13001', 'Premium ultrabook laptop'),
(5, 'HP Pavilion 15', '84713000', 20, 45000.00, 64999.00, 44.44, 18.00, 'Laptop', 'HP15001', 'Mid-range laptop for professionals'),
(6, 'Sony WH-1000XM5 Headphones', '85183000', 50, 18000.00, 29999.00, 66.67, 18.00, 'Audio', 'WH1000XM5', 'Premium noise-canceling headphones'),
(7, 'Samsung 55" 4K Smart TV', '85287200', 8, 35000.00, 54999.00, 57.14, 18.00, 'Electronics', 'SS55TV001', '4K UHD Smart TV with HDR'),
(8, 'Canon EOS R6 Camera', '90065300', 5, 135000.00, 189999.00, 40.74, 18.00, 'Camera', 'CR6001', 'Professional mirrorless camera'),
(9, 'Apple AirPods Pro', '85183000', 40, 15000.00, 24900.00, 66.00, 18.00, 'Audio', 'APP001', 'Wireless earbuds with ANC'),
(10, 'Gaming Chair Pro', '94036000', 15, 8000.00, 15999.00, 100.00, 18.00, 'Furniture', 'GC001', 'Ergonomic gaming chair'),
(11, 'Wireless Mouse', '84716070', 100, 800.00, 1999.00, 149.88, 18.00, 'Accessories', 'WM001', 'Wireless optical mouse'),
(12, 'Mechanical Keyboard', '84716070', 60, 3500.00, 6999.00, 100.00, 18.00, 'Accessories', 'MK001', 'RGB mechanical keyboard'),
(13, 'Portable Power Bank', '85076000', 75, 1200.00, 2499.00, 108.25, 18.00, 'Accessories', 'PB001', '20000mAh power bank with fast charging'),
(14, 'Bluetooth Speaker', '85183000', 45, 2500.00, 4999.00, 99.96, 18.00, 'Audio', 'BS001', 'Portable Bluetooth speaker with bass'),
(15, 'Smart Watch Series 8', '91021100', 25, 12000.00, 24999.00, 108.33, 18.00, 'Wearables', 'SW8001', 'Fitness and health tracking smartwatch'),
(16, 'USB-C Hub 7-in-1', '84733080', 80, 1500.00, 3499.00, 133.27, 18.00, 'Accessories', 'UCH001', 'Multi-port USB-C hub for laptops'),
(17, 'Wireless Charger Pad', '85044030', 65, 800.00, 1899.00, 137.38, 18.00, 'Accessories', 'WC001', 'Fast wireless charging pad'),
(18, '4K Webcam', '85258100', 35, 6000.00, 11999.00, 99.98, 18.00, 'Camera', 'WC4K001', '4K webcam for streaming and meetings'),
(19, 'Tablet 10.5 inch', '84713000', 20, 18000.00, 29999.00, 66.66, 18.00, 'Tablet', 'TB105001', 'Android tablet with stylus support'),
(20, 'Smart Home Hub', '85176990', 30, 4500.00, 8999.00, 99.98, 18.00, 'Smart Home', 'SH001', 'Voice-controlled smart home hub');

-- Insert sample customers (without state_code)
INSERT INTO customer (id, name, email, phone, address, gstin, customer_type) VALUES
(1, 'Rajesh Kumar', 'rajesh.kumar@email.com', '9876543210', '123 MG Road, Bangalore', '29ABCDE1234F1Z5', 'B2B'),
(2, 'Priya Sharma', 'priya.sharma@gmail.com', '9876543211', '456 Brigade Road, Bangalore', NULL, 'B2C'),
(3, 'Tech Solutions Pvt Ltd', 'info@techsolutions.com', '9876543212', '789 Whitefield, Bangalore', '29FGHIJ5678K2L6', 'B2B'),
(4, 'Amit Patel', 'amit.patel@yahoo.com', '9876543213', '321 Koramangala, Bangalore', NULL, 'B2C'),
(5, 'Digital Dreams Corp', 'sales@digitaldreams.com', '9876543214', '654 Electronic City, Bangalore', '29KLMNO9012P3Q7', 'B2B'),
(6, 'Sneha Reddy', 'sneha.reddy@hotmail.com', '9876543215', '987 Indiranagar, Bangalore', NULL, 'B2C'),
(7, 'Innovative Systems', 'contact@innovativesys.com', '9876543216', '147 Hebbal, Bangalore', '29RSTUV3456W4X8', 'B2B'),
(8, 'Walk-in Customer', NULL, NULL, 'Counter Sale', NULL, 'B2C');

-- Insert sample suppliers
INSERT INTO supplier (id, name, email, phone, address, gstin) VALUES
(1, 'Electronics Wholesale Hub', 'sales@electronicshub.com', '9999888777', 'SP Road, Bangalore', '29SUPPLIER001'),
(2, 'Mobile Distribution Center', 'orders@mobiledc.com', '9999888778', 'National Market, Bangalore', '29SUPPLIER002'),
(3, 'Tech Components Pvt Ltd', 'purchase@techcomponents.com', '9999888779', 'Peenya Industrial Area, Bangalore', '29SUPPLIER003');

-- ============================================================================
-- SAMPLE BILLS - PRODUCTION READY
-- ============================================================================

-- Sample Bill 1: B2B Customer with GST
INSERT INTO bill (
    bill_number, bill_date, customer_id, customer_name, customer_phone, customer_gstin,
    subtotal, discount_percent, discount_amount, taxable_amount, gst_amount, 
    round_off, grand_total, payment_mode, payment_status, total_profit
) VALUES (
    'INV-2025-0001', '2025-10-19 10:30:00', 1, 'Rajesh Kumar', '9876543210', '29ABCDE1234F1Z5',
    142998.00, 5.00, 7149.90, 135848.10, 24452.66, 0.24, 160301.00, 'UPI', 'Paid', 45848.10
);

-- Sample Bill 2: B2C Customer
INSERT INTO bill (
    bill_number, bill_date, customer_id, customer_name, customer_phone, customer_gstin,
    subtotal, discount_percent, discount_amount, taxable_amount, gst_amount, 
    round_off, grand_total, payment_mode, payment_status, total_profit
) VALUES (
    'INV-2025-0002', '2025-10-19 14:15:00', 2, 'Priya Sharma', '9876543211', NULL,
    34998.00, 2.00, 699.96, 34298.04, 6173.65, 0.31, 40472.00, 'Card', 'Paid', 16298.04
);

-- Sample Bill 3: Recent transaction
INSERT INTO bill (
    bill_number, bill_date, customer_id, customer_name, customer_phone, customer_gstin,
    subtotal, discount_percent, discount_amount, taxable_amount, gst_amount, 
    round_off, grand_total, payment_mode, payment_status, total_profit
) VALUES (
    'INV-2025-0003', '2025-10-19 16:45:00', 4, 'Amit Patel', '9876543213', NULL,
    51997.00, 0.00, 0.00, 51997.00, 9359.46, 0.54, 61357.00, 'Cash', 'Paid', 23997.00
);

-- Sample transactions for Bill 1
INSERT INTO transaction (bill_id, bill_number, product_id, product_name, hsn_code, quantity, cost_price, unit_price, subtotal, taxable_amount, gst_rate, gst_amount, line_total, line_profit) VALUES
(1, 'INV-2025-0001', 1, 'Samsung Galaxy S24', '85171200', 1, 85000.00, 119999.00, 119999.00, 113999.05, 18.00, 20519.83, 134518.88, 28999.05),
(1, 'INV-2025-0001', 11, 'Wireless Mouse', '84716070', 5, 800.00, 1999.00, 9995.00, 9495.25, 18.00, 1709.15, 11204.40, 5995.25),
(1, 'INV-2025-0001', 13, 'Portable Power Bank', '85076000', 1, 1200.00, 2499.00, 2499.00, 2374.05, 18.00, 427.33, 2801.38, 1174.05),
(1, 'INV-2025-0001', 17, 'Wireless Charger Pad', '85044030', 2, 800.00, 1899.00, 3798.00, 3608.10, 18.00, 649.46, 4257.56, 2208.10);

-- Sample transactions for Bill 2
INSERT INTO transaction (bill_id, bill_number, product_id, product_name, hsn_code, quantity, cost_price, unit_price, subtotal, taxable_amount, gst_rate, gst_amount, line_total, line_profit) VALUES
(2, 'INV-2025-0002', 6, 'Sony WH-1000XM5 Headphones', '85183000', 1, 18000.00, 29999.00, 29999.00, 29399.02, 18.00, 5291.82, 34690.84, 11399.02),
(2, 'INV-2025-0002', 12, 'Mechanical Keyboard', '84716070', 1, 3500.00, 4999.00, 4999.00, 4899.02, 18.00, 881.82, 5780.84, 1399.02);

-- Sample transactions for Bill 3
INSERT INTO transaction (bill_id, bill_number, product_id, product_name, hsn_code, quantity, cost_price, unit_price, subtotal, taxable_amount, gst_rate, gst_amount, line_total, line_profit) VALUES
(3, 'INV-2025-0003', 9, 'Apple AirPods Pro', '85183000', 2, 15000.00, 24900.00, 49800.00, 49800.00, 18.00, 8964.00, 58764.00, 19800.00),
(3, 'INV-2025-0003', 14, 'Bluetooth Speaker', '85183000', 1, 2500.00, 4999.00, 4999.00, 4999.00, 18.00, 899.82, 5898.82, 2499.00),
(3, 'INV-2025-0003', 16, 'USB-C Hub 7-in-1', '84733080', 2, 1500.00, 3499.00, 6998.00, 6998.00, 18.00, 1259.64, 8257.64, 3998.00);

-- ============================================================================
-- STORED PROCEDURES - PRODUCTION READY
-- ============================================================================

DELIMITER //

-- Generate professional bill numbers
CREATE PROCEDURE sp_generate_bill_number(OUT new_bill_number VARCHAR(20))
BEGIN
    DECLARE bill_count INT DEFAULT 0;
    DECLARE date_prefix VARCHAR(10);
    
    -- Get current date prefix (YYYY-MM format)
    SET date_prefix = DATE_FORMAT(NOW(), 'INV-%Y-');
    
    -- Get count of bills for current month
    SELECT COUNT(*) INTO bill_count 
    FROM bill 
    WHERE bill_number LIKE CONCAT(date_prefix, '%');
    
    -- Generate new bill number
    SET new_bill_number = CONCAT(date_prefix, LPAD(bill_count + 1, 4, '0'));
END //

-- Calculate profit for a bill
CREATE PROCEDURE sp_calculate_bill_profit(IN bill_id INT, OUT total_profit DECIMAL(12,2))
BEGIN
    SELECT SUM((unit_price - cost_price) * quantity) INTO total_profit
    FROM transaction 
    WHERE bill_id = bill_id;
END //

DELIMITER ;

-- ============================================================================
-- VIEWS - PRODUCTION READY REPORTS
-- ============================================================================

-- Daily sales summary
CREATE VIEW v_daily_sales AS
SELECT 
    DATE(bill_date) as sale_date,
    COUNT(*) as total_bills,
    SUM(subtotal) as total_sales,
    SUM(gst_amount) as total_gst,
    SUM(grand_total) as total_revenue,
    SUM(total_profit) as total_profit,
    AVG(grand_total) as avg_bill_value
FROM bill 
WHERE payment_status = 'Paid'
GROUP BY DATE(bill_date)
ORDER BY sale_date DESC;

-- Product performance
CREATE VIEW v_product_performance AS
SELECT 
    p.id,
    p.name,
    p.category,
    p.quantity as current_stock,
    COALESCE(SUM(t.quantity), 0) as total_sold,
    COALESCE(SUM(t.line_total), 0) as total_revenue,
    COALESCE(SUM(t.line_profit), 0) as total_profit,
    COALESCE(AVG(t.unit_price), 0) as avg_selling_price
FROM product p
LEFT JOIN transaction t ON p.id = t.product_id
LEFT JOIN bill b ON t.bill_id = b.id AND b.payment_status = 'Paid'
GROUP BY p.id, p.name, p.category, p.quantity
ORDER BY total_revenue DESC;

-- Customer analysis
CREATE VIEW v_customer_analysis AS
SELECT 
    c.id,
    c.name,
    c.customer_type,
    c.phone,
    COUNT(b.id) as total_bills,
    SUM(b.grand_total) as total_spent,
    AVG(b.grand_total) as avg_bill_value,
    MAX(b.bill_date) as last_purchase_date
FROM customer c
LEFT JOIN bill b ON c.id = b.customer_id AND b.payment_status = 'Paid'
GROUP BY c.id, c.name, c.customer_type, c.phone
HAVING total_bills > 0
ORDER BY total_spent DESC;

-- Payment method analysis
CREATE VIEW v_payment_summary AS
SELECT 
    payment_mode,
    COUNT(*) as transaction_count,
    SUM(grand_total) as total_amount,
    AVG(grand_total) as avg_amount,
    (COUNT(*) * 100.0 / (SELECT COUNT(*) FROM bill WHERE payment_status = 'Paid')) as percentage
FROM bill 
WHERE payment_status = 'Paid'
GROUP BY payment_mode
ORDER BY total_amount DESC;

-- Low stock alert
CREATE VIEW v_low_stock_alert AS
SELECT 
    id,
    name,
    category,
    quantity as current_stock,
    min_stock as minimum_required,
    (min_stock - quantity) as shortage,
    CASE 
        WHEN quantity <= 0 THEN 'OUT OF STOCK'
        WHEN quantity <= min_stock THEN 'LOW STOCK'
        ELSE 'SUFFICIENT'
    END as stock_status
FROM product
WHERE quantity <= min_stock
ORDER BY quantity ASC;

-- ============================================================================
-- TRIGGERS - PRODUCTION READY
-- ============================================================================

DELIMITER //

-- Update profit when transaction is inserted
CREATE TRIGGER tr_calculate_transaction_profit
    BEFORE INSERT ON transaction
    FOR EACH ROW
BEGIN
    SET NEW.line_profit = (NEW.unit_price - NEW.cost_price) * NEW.quantity;
END //

-- Update bill profit when transaction changes
CREATE TRIGGER tr_update_bill_profit
    AFTER INSERT ON transaction
    FOR EACH ROW
BEGIN
    UPDATE bill 
    SET total_profit = (
        SELECT SUM(line_profit) 
        FROM transaction 
        WHERE bill_id = NEW.bill_id
    )
    WHERE id = NEW.bill_id;
END //

DELIMITER ;

-- ============================================================================
-- INDEXES FOR PERFORMANCE - PRODUCTION READY
-- ============================================================================

-- Additional performance indexes
CREATE INDEX idx_bill_date_status ON bill(bill_date, payment_status);
CREATE INDEX idx_transaction_bill_product ON transaction(bill_id, product_id);
CREATE INDEX idx_product_category_stock ON product(category, quantity);
CREATE INDEX idx_customer_type_active ON customer(customer_type, is_active);

-- ============================================================================
-- PRODUCTION READY DATABASE COMPLETE
-- Ready for commercial deployment with professional features:
-- ✅ Simplified GST (no state dependency)
-- ✅ Professional bill numbering
-- ✅ Comprehensive reporting views
-- ✅ Profit tracking
-- ✅ Low stock management
-- ✅ Multiple payment modes
-- ✅ B2B/B2C customer types
-- ✅ Performance optimized
-- ============================================================================