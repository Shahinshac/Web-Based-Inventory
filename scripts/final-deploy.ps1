# Final Automated Render Deployment Script
# Using Blueprint Launch API

$ErrorActionPreference = "Continue"

$RENDER_API_KEY = "rnd_uxeeIdILgzuGM5FQb5PYeUhr0jqv"
$MONGODB_URI = "mongodb+srv://shahinshac123_db_user:3uyicMLnfOJYZUgf@cluster0.majmsqd.mongodb.net/?appName=Cluster0&tlsAllowInvalidCertificates=true"

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Automated Render Backend Deployment" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

$headers = @{
    "Authorization" = "Bearer $RENDER_API_KEY"
    "Content-Type" = "application/json"
    "Accept" = "application/json"
}

# Get owner ID
Write-Host "[1/4] Getting account information..." -ForegroundColor Yellow
try {
    $owners = Invoke-RestMethod -Uri "https://api.render.com/v1/owners" -Headers $headers
    $ownerId = $owners[0].owner.id
    Write-Host "      Account ID: $ownerId" -ForegroundColor Green
} catch {
    Write-Host "      ERROR: Could not get account info" -ForegroundColor Red
    Write-Host "      Message: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Create blueprint launch payload
Write-Host ""
Write-Host "[2/4] Preparing deployment configuration..." -ForegroundColor Yellow

$blueprintPayload = @"
{
  "serviceType": "web_service",
  "name": "inventory-backend",  
  "ownerId": "$ownerId",
  "repo": "https://github.com/Shahinshac/Web-Based-Inventory",
  "branch": "main",
  "rootDirectory": "web-app/server",
  "autoDeploy": "yes",
  "buildCommand": "npm install",
  "startCommand": "node index.js",
  "plan": "free",
  "region": "oregon",
  "env": "node",
  "envVars": [
    {
      "key": "MONGODB_URI",
      "value": "$($MONGODB_URI -replace '"','\"')"
    },
    {
      "key": "NODE_ENV",
      "value": "production"
    },
    {
      "key": "PORT",
      "value": "4000"
    },
    {
      "key": "DB_NAME",
      "value": "inventorydb"
    },
    {
      "key": "ADMIN_USERNAME",
      "value": "admin"
    },
    {
      "key": "ADMIN_PASSWORD",
      "value": "shaahnc"
    }
  ]
}
"@

Write-Host "      Configuration ready" -ForegroundColor Green

# Try to create service
Write-Host ""
Write-Host "[3/4] Deploying to Render..." -ForegroundColor Yellow

try {
    $response = Invoke-WebRequest `
        -Uri "https://api.render.com/v1/services" `
        -Headers $headers `
        -Method Post `
        -Body $blueprintPayload `
        -ContentType "application/json"
    
    $result = $response.Content | ConvertFrom-Json
    
    Write-Host ""
    Write-Host "=====================================" -ForegroundColor Green
    Write-Host "DEPLOYMENT SUCCESSFUL!" -ForegroundColor Green  
    Write-Host "=====================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Backend URL: https://inventory-backend.onrender.com" -ForegroundColor Cyan
    Write-Host ""
    
    "https://inventory-backend.onrender.com" | Out-File "backend-url.txt" -Encoding UTF8
    
} catch {
    Write-Host "      API Error occurred" -ForegroundColor Red
    Write-Host ""
    
    # Show detailed error
    if ($_.ErrorDetails.Message) {
        $errorObj = $_.ErrorDetails.Message | ConvertFrom-Json
        Write-Host "Error Details:" -ForegroundColor Yellow
        Write-Host ($errorObj | ConvertTo-Json -Depth 5) -ForegroundColor Gray
    } else {
        Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    Write-Host ""
    Write-Host "=====================================" -ForegroundColor Yellow
    Write-Host "USING MANUAL DEPLOYMENT METHOD" -ForegroundColor Yellow
    Write-Host "=====================================" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Opening Render dashboard..." -ForegroundColor Cyan
    Start-Process "https://dashboard.render.com/select-repo?type=web"
    Start-Sleep -Seconds 2
    Write-Host ""
    Write-Host "Follow these steps:" -ForegroundColor White
    Write-Host "1. Connect to GitHub repository: Shahinshac/Web-Based-Inventory" -ForegroundColor Gray
    Write-Host "2. Render will detect render.yaml and auto-configure" -ForegroundColor Gray
    Write-Host "3. Add environment variable:" -ForegroundColor Gray
    Write-Host "   MONGODB_URI = $MONGODB_URI" -ForegroundColor Cyan
    Write-Host "4. Click 'Create Web Service'" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Your backend URL will be: https://inventory-backend.onrender.com" -ForegroundColor Green
    
    "https://inventory-backend.onrender.com" | Out-File "backend-url.txt" -Encoding UTF8
}

Write-Host ""
Write-Host "[4/4] Next Steps:" -ForegroundColor Yellow
Write-Host "   1. Wait 2-3 minutes for deployment" -ForegroundColor White
Write-Host "   2. Update Vercel environment:" -ForegroundColor White
Write-Host "      VITE_API_URL = https://inventory-backend.onrender.com" -ForegroundColor Cyan
Write-Host "   3. Redeploy frontend" -ForegroundColor White
Write-Host ""
Write-Host "Opening Vercel dashboard..." -ForegroundColor Cyan
Start-Process "https://vercel.com/dashboard"
Write-Host ""
Write-Host "Done!" -ForegroundColor Green
