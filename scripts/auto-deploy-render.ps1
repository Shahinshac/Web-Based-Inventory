# Automated Render Deployment Script with API
# This will automatically deploy your backend to Render

$ErrorActionPreference = "Stop"

# Configuration
$RENDER_API_KEY = "rnd_uxeeIdILgzuGM5FQb5PYeUhr0jqv"
$MONGODB_URI = "mongodb+srv://shahinshac123_db_user:3uyicMLnfOJYZUgf@cluster0.majmsqd.mongodb.net/?appName=Cluster0&tlsAllowInvalidCertificates=true"
$GITHUB_REPO = "https://github.com/Shahinshac/Web-Based-Inventory"
$SERVICE_NAME = "inventory-backend"

Write-Host "Starting Automated Render Deployment" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Headers for Render API
$headers = @{
    "Authorization" = "Bearer $RENDER_API_KEY"
    "Content-Type" = "application/json"
    "Accept" = "application/json"
}

# Step 1: Check for existing services and delete if found
Write-Host "Checking for existing services..." -ForegroundColor Yellow
try {
    $existingServices = Invoke-RestMethod -Uri "https://api.render.com/v1/services" -Headers $headers -Method Get
    
    $oldService = $existingServices | Where-Object { $_.service.name -eq $SERVICE_NAME }
    
    if ($oldService) {
        Write-Host "Found existing service. Deleting..." -ForegroundColor Yellow
        $serviceId = $oldService.service.id
        Invoke-RestMethod -Uri "https://api.render.com/v1/services/$serviceId" -Headers $headers -Method Delete
        Write-Host "Old service deleted successfully!" -ForegroundColor Green
        Start-Sleep -Seconds 3
    } else {
        Write-Host "No existing service found. Proceeding with fresh deployment." -ForegroundColor Green
    }
} catch {
    Write-Host "Could not check existing services. Proceeding with deployment..." -ForegroundColor Yellow
}

# Step 2: Create new service
Write-Host ""
Write-Host "Creating new Render service..." -ForegroundColor Yellow

$serviceConfig = @{
    type = "web_service"
    name = $SERVICE_NAME
    repo = $GITHUB_REPO
    autoDeploy = "yes"
    branch = "main"
    rootDir = "web-app/server"
    buildCommand = "npm install"
    startCommand = "node index.js"
    envVars = @(
        @{
            key = "MONGODB_URI"
            value = $MONGODB_URI
        },
        @{
            key = "NODE_ENV"
            value = "production"
        },
        @{
            key = "PORT"
            value = "4000"
        },
        @{
            key = "DB_NAME"
            value = "inventorydb"
        },
        @{
            key = "ADMIN_USERNAME"
            value = "admin"
        },
        @{
            key = "ADMIN_PASSWORD"
            value = "shaahnc"
        }
    )
    serviceDetails = @{
        env = "node"
        plan = "free"
        region = "oregon"
    }
}

$jsonBody = $serviceConfig | ConvertTo-Json -Depth 10

try {
    Write-Host "Sending deployment request to Render..." -ForegroundColor Cyan
    $response = Invoke-RestMethod -Uri "https://api.render.com/v1/services" -Headers $headers -Method Post -Body $jsonBody
    
    Write-Host ""
    Write-Host "Service created successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Service Details:" -ForegroundColor Cyan
    Write-Host "Service ID: $($response.service.id)" -ForegroundColor White
    Write-Host "Service Name: $($response.service.name)" -ForegroundColor White
    
    $backendUrl = "https://$SERVICE_NAME.onrender.com"
    
    Write-Host ""
    Write-Host "Your Backend URL:" -ForegroundColor Green
    Write-Host $backendUrl -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Deployment in progress..." -ForegroundColor Yellow
    Write-Host "This will take 2-3 minutes." -ForegroundColor Gray
    Write-Host ""
    Write-Host "Next Steps:" -ForegroundColor Yellow
    Write-Host "1. Wait 2-3 minutes for deployment to complete" -ForegroundColor White
    Write-Host "2. Go to Vercel Dashboard" -ForegroundColor White
    Write-Host "3. Add environment variable: VITE_API_URL = $backendUrl" -ForegroundColor White
    Write-Host "4. Redeploy your frontend" -ForegroundColor White
    Write-Host ""
    Write-Host "Deployment initiated successfully!" -ForegroundColor Green
    
    # Save backend URL to file
    $backendUrl | Out-File -FilePath "backend-url.txt" -Encoding UTF8
    Write-Host ""
    Write-Host "Backend URL saved to: backend-url.txt" -ForegroundColor Gray
    
} catch {
    Write-Host ""
    Write-Host "Error creating service:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    
    if ($_.Exception.Response) {
        try {
            $reader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
            $responseBody = $reader.ReadToEnd()
            Write-Host ""
            Write-Host "Response details:" -ForegroundColor Yellow
            Write-Host $responseBody -ForegroundColor Gray
        } catch {
            Write-Host "Could not read error response" -ForegroundColor Gray
        }
    }
    
    Write-Host ""
    Write-Host "Alternative: Use the one-click deploy button" -ForegroundColor Yellow
    Write-Host "https://render.com/deploy" -ForegroundColor Cyan
    exit 1
}
