# Deployment Verification Script

Write-Host "Testing Backend Deployment..." -ForegroundColor Cyan
Write-Host ""

# Test backend
try {
    Write-Host "1. Testing backend health..." -ForegroundColor Yellow
    $backend = Invoke-RestMethod -Uri "https://inventory-backend.onrender.com/" -Method Get -TimeoutSec 10
    Write-Host "   Backend Status: ONLINE" -ForegroundColor Green
    Write-Host "   Response: $backend" -ForegroundColor Gray
} catch {
    Write-Host "   Backend Status: OFFLINE or DEPLOYING" -ForegroundColor Yellow
    Write-Host "   (This is normal if deployment just started)" -ForegroundColor Gray
}

Write-Host ""
Write-Host "2. Backend URL saved to backend-url.txt" -ForegroundColor Yellow
Write-Host "   https://inventory-backend.onrender.com" -ForegroundColor Cyan

Write-Host ""
Write-Host "3. Next: Update Vercel with this URL" -ForegroundColor Yellow
Write-Host "   Variable: VITE_API_URL" -ForegroundColor White
Write-Host "   Value: https://inventory-backend.onrender.com" -ForegroundColor Cyan

Write-Host ""
Write-Host "4. Then redeploy your frontend" -ForegroundColor Yellow

Write-Host ""
Write-Host "Deployment Checklist:" -ForegroundColor Green
Write-Host "[ ] Backend deployed to Render" -ForegroundColor White
Write-Host "[ ] MONGODB_URI added in Render" -ForegroundColor White
Write-Host "[ ] Backend is Live (shows 'Live' status)" -ForegroundColor White
Write-Host "[ ] VITE_API_URL added in Vercel" -ForegroundColor White
Write-Host "[ ] Frontend redeployed" -ForegroundColor White
Write-Host "[ ] Test: Add a product in your app" -ForegroundColor White

Write-Host ""
Write-Host "Dashboard Links:" -ForegroundColor Cyan
Write-Host "Render: https://dashboard.render.com" -ForegroundColor Gray
Write-Host "Vercel: https://vercel.com/dashboard" -ForegroundColor Gray
