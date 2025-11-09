# Automated Render Deployment Script
# This script will guide you through deploying to Render

Write-Host "🚀 Inventory Backend Deployment Script" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host ""

# Check if Render CLI is installed
Write-Host "📦 Checking Render CLI..." -ForegroundColor Yellow
$renderInstalled = Get-Command render -ErrorAction SilentlyContinue

if (-not $renderInstalled) {
    Write-Host "❌ Render CLI not found. Installing..." -ForegroundColor Red
    npm install -g render-cli
    Write-Host "✅ Render CLI installed!" -ForegroundColor Green
}

Write-Host ""
Write-Host "🔐 Please login to Render..." -ForegroundColor Yellow
Write-Host "A browser window will open. Please login and return here." -ForegroundColor Gray
render login

Write-Host ""
Write-Host "📝 Enter your MongoDB connection string:" -ForegroundColor Yellow
Write-Host "(Example: mongodb+srv://user:pass@cluster.mongodb.net/inventory)" -ForegroundColor Gray
$mongoUri = Read-Host "MONGODB_URI"

Write-Host ""
Write-Host "🏗️  Creating Render service..." -ForegroundColor Yellow

# Create service using render.yaml
Set-Location "C:\Users\Shahinsha\.vscode\Inventory-Web-App"
render services create --yaml render.yaml

Write-Host ""
Write-Host "⚙️  Setting environment variables..." -ForegroundColor Yellow
render env set MONGODB_URI="$mongoUri"
render env set NODE_ENV="production"
render env set PORT="4000"

Write-Host ""
Write-Host "🚀 Deploying to Render..." -ForegroundColor Yellow
render deploy

Write-Host ""
Write-Host "✅ Deployment initiated!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Wait 2-3 minutes for deployment to complete" -ForegroundColor White
Write-Host "2. Get your backend URL from Render Dashboard" -ForegroundColor White
Write-Host "3. Update VITE_API_URL in Vercel to your backend URL" -ForegroundColor White
Write-Host "4. Redeploy frontend in Vercel" -ForegroundColor White
Write-Host ""
Write-Host "🎉 Done! Your backend will be live shortly." -ForegroundColor Green
