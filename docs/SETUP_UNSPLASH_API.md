# 🖼️ Setting Up Unsplash API for Automatic Image Fetching

## Overview
The automatic image fetching feature uses Unsplash API to download high-quality product images based on product names. This guide shows you how to set up a free Unsplash API key.

## 🚀 Quick Setup (5 minutes)

### Step 1: Create Unsplash Developer Account
1. Go to [Unsplash Developers](https://unsplash.com/developers)
2. Click **"Register as a developer"**
3. Sign up with your email or use GitHub/Google login
4. Accept the API Terms of Service

### Step 2: Create a New Application
1. After logging in, go to [Your Apps](https://unsplash.com/oauth/applications)
2. Click **"New Application"**
3. Fill in the details:
   - **Application name**: `Inventory Management System`
   - **Description**: `Product image fetching for inventory management`
   - **Website**: `http://localhost:3000` (or your domain)
4. Accept the API Terms
5. Click **"Create application"**

### Step 3: Get Your Access Key
1. In your new application page, you'll see:
   - **Application ID**
   - **Access Key** ← This is what you need!
   - **Secret Key** (not needed for this app)
2. Copy the **Access Key**

### Step 4: Add API Key to Environment
1. Open your `.env` file: `web-app/server/.env`
2. Replace this line:
   ```
   UNSPLASH_ACCESS_KEY=your-unsplash-access-key-here
   ```
   With your actual key:
   ```
   UNSPLASH_ACCESS_KEY=your_actual_key_here
   ```
3. Save the file
4. Restart your backend server

## 🎯 Testing the Feature

### Test 1: Add New Product with Auto-Image
1. Login to your app
2. Go to **Products** tab
3. Click **"Add Product"**
4. Check the **"Auto-fetch image"** checkbox
5. Add a product like "iPhone 15" or "Samsung Galaxy"
6. Submit - image should be fetched automatically!

### Test 2: Auto-Fetch for Existing Products
1. Go to any existing product
2. Click the **🌐** button next to the product
3. Image should be automatically downloaded and assigned

## 📊 API Limits (Free Tier)

### Unsplash Free Tier Includes:
- **50 requests per hour** (plenty for most inventory needs)
- **5,000 requests per month**
- High-quality images from professional photographers
- No watermarks
- Commercial use allowed with attribution

### Rate Limit Handling:
- App automatically falls back to placeholder images if API limit is reached
- Placeholder images are generated with product name text
- No interruption to your workflow!

## 🔧 Troubleshooting

### Problem: Images not fetching
**Solutions:**
1. Check your API key is correct in `.env` file
2. Restart the backend server after adding the key
3. Check browser console for any error messages
4. Verify you haven't exceeded the 50/hour rate limit

### Problem: "Failed to fetch image" message
**Causes:**
- Invalid or expired API key
- Network connectivity issues
- Rate limit exceeded
- Product name too generic (try more specific names)

### Problem: Only placeholder images
**Normal behavior when:**
- No suitable image found for product name
- API rate limit reached
- Network issues
- API key not configured

## 💡 Tips for Better Image Results

### Use Specific Product Names:
- ✅ "iPhone 15 Pro Max"
- ✅ "Samsung 65-inch QLED TV"
- ✅ "MacBook Air M2"
- ❌ "Phone"
- ❌ "TV"
- ❌ "Laptop"

### Product Categories That Work Well:
- Electronics and gadgets
- Appliances
- Tools and equipment
- Fashion items
- Furniture
- Books and media

## 🎨 Customizing Image Fetching

### Modify Search Query (Optional)
In `web-app/server/index.js`, you can customize the search logic:
```javascript
// Add product category to search
const searchQuery = `${productName} electronics`;

// Or use different image orientations
orientation: 'landscape' // or 'portrait', 'squarish'
```

## 🆓 Alternative Free Image Services

If you prefer not to use Unsplash, you can modify the code to use:

1. **Pixabay API** (free tier: 20,000 requests/month)
2. **Pexels API** (free tier: 200 requests/hour)
3. **Lorem Picsum** (no API key needed, but generic images)

## 📈 Upgrading for High Volume

### If you need more than 5,000 requests/month:
1. **Unsplash+ Plan**: $9/month for 100,000 requests
2. **Enterprise Plan**: Custom pricing for unlimited usage
3. Contact Unsplash sales for volume discounts

## ✅ Verification Checklist

After setup, verify everything works:

- [ ] API key added to `.env` file
- [ ] Backend server restarted
- [ ] Can add new products with auto-fetch enabled
- [ ] 🌐 button works on existing products
- [ ] Images appear in product listings
- [ ] Placeholder images work when real images not found

## 🎉 Success!

Once configured, your inventory system will automatically:
- Fetch professional product images
- Save them locally for fast loading
- Fall back gracefully when needed
- Enhance your product catalog visually

**Enjoy your enhanced inventory management system!** 🚀