# 🖼️ Automatic Product Image Fetching

Your inventory system now automatically fetches product images from the internet when you add new products!

## ✨ How It Works

### When Adding New Products:
1. **Check the "Auto-fetch image" checkbox** in the add product form (enabled by default)
2. **Enter the product name** (e.g., "iPhone 15", "Samsung Galaxy S23", "Dell Laptop")
3. **Click "Add Product"** - the system will:
   - Create the product with barcode
   - Search for a suitable image online
   - Download and save the image automatically
   - Show success/failure notification

### For Existing Products:
- Click the **🌐 green button** next to the 📷 upload button
- System will search and fetch an image based on the product name
- Image will be downloaded and associated with the product

## 🎯 Benefits

✅ **Save Time**: No need to manually search and upload images  
✅ **Professional Look**: Products get relevant, high-quality images  
✅ **Consistent**: All products have images for better presentation  
✅ **Fallback System**: Generates placeholder if no image found  
✅ **Optional**: Can be disabled if you prefer manual uploads  

## 🔧 Setup (Optional)

### Free Unsplash API (Recommended)
1. Visit https://unsplash.com/developers
2. Create free account and register your app
3. Get your Access Key (50 requests/hour free)
4. Add to server `.env`: `UNSPLASH_ACCESS_KEY=your-key-here`

### Without API Key
- System generates placeholder images with product name
- Still provides consistent visual presentation

## 🎨 User Interface

### Add Product Form
- ✅ **Auto-fetch checkbox**: Enable/disable automatic image fetching
- 💡 **Help text**: Explains what the feature does

### Product List
- 📷 **Upload button**: Manual image upload (blue)
- 🌐 **Auto-fetch button**: Automatic image fetching (green)
- 🖼️ **Image preview**: Shows current product image or "No Image" placeholder

## 🔍 Image Sources

1. **Unsplash API** (if configured): High-quality, professional images
2. **Placeholder Service**: Clean placeholder with product name text
3. **Manual Upload**: Traditional file upload still available

## 📱 Examples

**Electronics**: iPhone, Samsung, laptops, headphones automatically get relevant images  
**Appliances**: Washing machines, refrigerators, TVs get product photos  
**Generic Items**: Get placeholder images with product name for identification  

## 🛠️ Technical Details

- **File Format**: Images saved as .jpg
- **Size**: Optimized for web display (400x400 default)
- **Storage**: Saved in `uploads/products/` directory
- **Naming**: `product-name-timestamp.jpg` format
- **API Limits**: Respects Unsplash rate limits (50/hour free tier)

---

**Note**: This feature enhances your inventory management by making it more visual and professional-looking while saving you time on manual image management!