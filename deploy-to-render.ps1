# Automated Render Deployment - GitHub Integration Method
# This creates a deploy using render.yaml blueprint

$ErrorActionPreference = "Stop"

$RENDER_API_KEY = "rnd_uxeeIdILgzuGM5FQb5PYeUhr0jqv"
$MONGODB_URI = "mongodb+srv://shahinshac123_db_user:3uyicMLnfOJYZUgf@cluster0.majmsqd.mongodb.net/?appName=Cluster0&tlsAllowInvalidCertificates=true"
$GITHUB_REPO = "Shahinshac/Web-Based-Inventory"

Write-Host "Starting Automated Render Deployment via Blueprint" -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host ""

$headers = @{
    "Authorization" = "Bearer $RENDER_API_KEY"
    "Content-Type" = "application/json"
}

# Method 1: Get owner ID first
Write-Host "Getting account information..." -ForegroundColor Yellow
try {
    $owner = Invoke-RestMethod -Uri "https://api.render.com/v1/owners" -Headers $headers -Method Get
    $ownerId = $owner[0].owner.id
    Write-Host "Account ID: $ownerId" -ForegroundColor Green
} catch {
    Write-Host "Error getting account info: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Delete old services if exist
Write-Host ""
Write-Host "Checking for existing services..." -ForegroundColor Yellow
try {
    $services = Invoke-RestMethod -Uri "https://api.render.com/v1/services?name=inventory-backend" -Headers $headers -Method Get
    
    if ($services.Count -gt 0) {
        foreach ($svc in $services) {
            Write-Host "Deleting old service: $($svc.service.name)" -ForegroundColor Yellow
            Invoke-RestMethod -Uri "https://api.render.com/v1/services/$($svc.service.id)" -Headers $headers -Method Delete
            Write-Host "Deleted!" -ForegroundColor Green
        }
        Start-Sleep -Seconds 5
    }
} catch {
    Write-Host "No existing services or error checking: $($_.Exception.Message)" -ForegroundColor Gray
}

# Create service using simplified payload
Write-Host ""
Write-Host "Creating new service..." -ForegroundColor Yellow

$payload = @"
{
  "type": "web_service",
  "name": "inventory-backend",
  "ownerId": "$ownerId",
  "repo": "https://github.com/$GITHUB_REPO",
  "autoDeploy": true,
  "branch": "main",
  "rootDir": "web-app/server",
  "envSpecificDetails": {
    "buildCommand": "npm install",
    "startCommand": "node index.js"
  },
  "serviceDetails": {
    "env": "node",
    "region": "oregon",
    "plan": "free"
  },
  "envVars": [
    {
      "key": "MONGODB_URI",
      "value": "$MONGODB_URI"
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

try {
    $result = Invoke-RestMethod -Uri "https://api.render.com/v1/services" -Headers $headers -Method Post -Body $payload
    
    Write-Host ""
    Write-Host "SUCCESS! Service Created!" -ForegroundColor Green
    Write-Host "=========================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Service Name: $($result.service.name)" -ForegroundColor Cyan
    Write-Host "Service ID: $($result.service.id)" -ForegroundColor Cyan
    Write-Host "Service URL: https://inventory-backend.onrender.com" -ForegroundColor Green
    Write-Host ""
    Write-Host "Deployment Status: IN PROGRESS" -ForegroundColor Yellow
    Write-Host "Expected completion: 2-3 minutes" -ForegroundColor Gray
    Write-Host ""
    Write-Host "==================================" -ForegroundColor Cyan
    Write-Host "NEXT STEPS - UPDATE VERCEL:" -ForegroundColor Cyan
    Write-Host "==================================" -ForegroundColor Cyan
    Write-Host "1. Go to: https://vercel.com/dashboard" -ForegroundColor White
    Write-Host "2. Select your project" -ForegroundColor White
    Write-Host "3. Settings -> Environment Variables" -ForegroundColor White
    Write-Host "4. Add: VITE_API_URL = https://inventory-backend.onrender.com" -ForegroundColor Yellow
    Write-Host "5. Redeploy your frontend" -ForegroundColor White
    Write-Host ""
    
    "https://inventory-backend.onrender.com" | Out-File -FilePath "backend-url.txt" -Encoding UTF8
    Write-Host "Backend URL saved to backend-url.txt" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Deployment Complete!" -ForegroundColor Green
    
} catch {
    Write-Host ""
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $errorBody = $reader.ReadToEnd()
        Write-Host "Details: $errorBody" -ForegroundColor Yellow
    }
    
    Write-Host ""
    Write-Host "Fallback Option:" -ForegroundColor Yellow
    Write-Host "Go to: https://dashboard.render.com" -ForegroundColor Cyan
    Write-Host "1. New + -> Web Service" -ForegroundColor White
    Write-Host "2. Connect: github.com/$GITHUB_REPO" -ForegroundColor White
    Write-Host "3. Click 'Create Web Service'" -ForegroundColor White
    exit 1
}
