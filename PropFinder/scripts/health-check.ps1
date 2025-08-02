# Script de verificación de salud para PropFinder (PowerShell)
# Verifica que todos los servicios estén funcionando correctamente

param(
    [switch]$Verbose
)

# Colores para output
$Red = "Red"
$Green = "Green"
$Yellow = "Yellow"
$White = "White"

Write-Host "🔍 Verificando estado de servicios PropFinder..." -ForegroundColor $White

# Función para verificar endpoint
function Test-Endpoint {
    param(
        [string]$Url,
        [string]$Service,
        [int]$Timeout = 5
    )
    
    try {
        $response = Invoke-WebRequest -Uri $Url -TimeoutSec $Timeout -UseBasicParsing -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ $Service`: OK" -ForegroundColor $Green
            return $true
        } else {
            Write-Host "❌ $Service`: ERROR (Status: $($response.StatusCode))" -ForegroundColor $Red
            return $false
        }
    } catch {
        Write-Host "❌ $Service`: ERROR" -ForegroundColor $Red
        if ($Verbose) {
            Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor $Yellow
        }
        return $false
    }
}

# Función para verificar puerto
function Test-Port {
    param(
        [int]$Port,
        [string]$Service
    )
    
    try {
        $connection = Test-NetConnection -ComputerName localhost -Port $Port -InformationLevel Quiet -WarningAction SilentlyContinue
        if ($connection) {
            Write-Host "✅ $Service (puerto $Port): OK" -ForegroundColor $Green
            return $true
        } else {
            Write-Host "❌ $Service (puerto $Port): ERROR" -ForegroundColor $Red
            return $false
        }
    } catch {
        Write-Host "❌ $Service (puerto $Port): ERROR" -ForegroundColor $Red
        return $false
    }
}

# Contador de errores
$errors = 0

# Verificar servicios principales
Write-Host "📡 Verificando servicios web..." -ForegroundColor $White
if (-not (Test-Endpoint "http://localhost:3000" "Frontend")) { $errors++ }
if (-not (Test-Endpoint "http://localhost:5000/api/health" "Backend API")) { $errors++ }
if (-not (Test-Endpoint "http://localhost:5001/health" "WebSocket")) { $errors++ }
if (-not (Test-Endpoint "http://localhost:9000" "SonarQube")) { $errors++ }

Write-Host ""
Write-Host "🗄️ Verificando bases de datos..." -ForegroundColor $White
if (-not (Test-Port 5432 "PostgreSQL")) { $errors++ }
if (-not (Test-Port 6379 "Redis")) { $errors++ }

Write-Host ""
Write-Host "🔧 Verificando conectividad de red..." -ForegroundColor $White
if (-not (Test-Endpoint "http://localhost:5000/api/health" "Métricas del Backend")) { $errors++ }

Write-Host ""
if ($errors -eq 0) {
    Write-Host "🎉 Todos los servicios están funcionando correctamente!" -ForegroundColor $Green
    Write-Host ""
    Write-Host "📊 URLs de acceso:" -ForegroundColor $White
    Write-Host "   Frontend: http://localhost:3000" -ForegroundColor $White
    Write-Host "   Backend API: http://localhost:5000" -ForegroundColor $White
    Write-Host "   WebSocket: ws://localhost:5001" -ForegroundColor $White
    Write-Host "   SonarQube: http://localhost:9000" -ForegroundColor $White
    Write-Host "   PostgreSQL: localhost:5432" -ForegroundColor $White
    Write-Host "   Redis: localhost:6379" -ForegroundColor $White
    exit 0
} else {
    Write-Host "⚠️  Se encontraron $errors error(es). Revisa los servicios fallidos." -ForegroundColor $Red
    Write-Host ""
    Write-Host "💡 Comandos útiles para debugging:" -ForegroundColor $Yellow
    Write-Host "   docker-compose logs -f [servicio]" -ForegroundColor $White
    Write-Host "   docker-compose ps" -ForegroundColor $White
    Write-Host "   docker-compose restart [servicio]" -ForegroundColor $White
    exit 1
} 