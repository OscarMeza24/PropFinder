#!/usr/bin/env powershell

# ==============================================
# PROPFINDER - SCRIPT DE CONFIGURACIÓN INICIAL
# ==============================================

Write-Host "🚀 Configurando proyecto PropFinder..." -ForegroundColor Green

# Función para imprimir mensajes con colores
function Write-Step {
    param($Message)
    Write-Host "📋 $Message" -ForegroundColor Cyan
}

function Write-Success {
    param($Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Write-Warning {
    param($Message)
    Write-Host "⚠️  $Message" -ForegroundColor Yellow
}

function Write-Error {
    param($Message)
    Write-Host "❌ $Message" -ForegroundColor Red
}

# Verificar si Node.js está instalado
Write-Step "Verificando Node.js..."
try {
    $nodeVersion = node --version
    Write-Success "Node.js encontrado: $nodeVersion"
} catch {
    Write-Error "Node.js no está instalado. Por favor instala Node.js desde https://nodejs.org"
    exit 1
}

# Verificar si npm está instalado
Write-Step "Verificando npm..."
try {
    $npmVersion = npm --version
    Write-Success "npm encontrado: $npmVersion"
} catch {
    Write-Error "npm no está instalado."
    exit 1
}

# Instalar dependencias del frontend
Write-Step "Instalando dependencias del frontend..."
try {
    npm install
    Write-Success "Dependencias del frontend instaladas ✓"
} catch {
    Write-Error "Error instalando dependencias del frontend"
    exit 1
}

# Instalar dependencias del backend
Write-Step "Instalando dependencias del backend..."
try {
    Set-Location backend
    npm install
    Set-Location ..
    Write-Success "Dependencias del backend instaladas ✓"
} catch {
    Write-Error "Error instalando dependencias del backend"
    exit 1
}

# Instalar dependencias del WebSocket
Write-Step "Instalando dependencias del WebSocket..."
try {
    Set-Location websocket
    npm install
    Set-Location ..
    Write-Success "Dependencias del WebSocket instaladas ✓"
} catch {
    Write-Error "Error instalando dependencias del WebSocket"
    exit 1
}

# Verificar archivos de configuración
Write-Step "Verificando archivos de configuración..."

if (Test-Path ".env") {
    Write-Success "Archivo .env del frontend encontrado ✓"
} else {
    Write-Warning "Archivo .env del frontend no encontrado. Copiando desde .env.example..."
    Copy-Item ".env.example" ".env"
}

if (Test-Path "backend/.env") {
    Write-Success "Archivo .env del backend encontrado ✓"
} else {
    Write-Warning "Archivo .env del backend no encontrado. Copiando desde env.example..."
    Copy-Item "backend/env.example" "backend/.env"
}

if (Test-Path "websocket/.env") {
    Write-Success "Archivo .env del WebSocket encontrado ✓"
} else {
    Write-Warning "Archivo .env del WebSocket no encontrado. Se creó uno básico."
}

# Crear directorios necesarios
Write-Step "Creando directorios necesarios..."
$directories = @(
    "backend/logs",
    "backend/uploads",
    "public/uploads"
)

foreach ($dir in $directories) {
    if (!(Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
        Write-Success "Directorio creado: $dir ✓"
    }
}

# Mostrar información importante
Write-Host ""
Write-Host "🎉 ¡Configuración completada!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 IMPORTANTE:" -ForegroundColor Yellow
Write-Host "1. Configura tus variables de entorno en los archivos .env" -ForegroundColor White
Write-Host "2. Asegúrate de tener PostgreSQL ejecutándose" -ForegroundColor White
Write-Host "3. Asegúrate de tener Redis ejecutándose (opcional)" -ForegroundColor White
Write-Host ""
Write-Host "🚀 Para iniciar el proyecto:" -ForegroundColor Cyan
Write-Host "   npm run start:all    # Inicia todos los servicios" -ForegroundColor White
Write-Host ""
Write-Host "🚀 Para iniciar servicios individualmente:" -ForegroundColor Cyan
Write-Host "   npm run dev          # Solo frontend" -ForegroundColor White
Write-Host "   npm run backend:dev  # Solo backend" -ForegroundColor White
Write-Host "   npm run websocket:dev # Solo WebSocket" -ForegroundColor White
Write-Host ""
Write-Host "🐳 Para usar Docker:" -ForegroundColor Cyan
Write-Host "   npm run docker:up    # Inicia todos los servicios con Docker" -ForegroundColor White
Write-Host ""
Write-Host "🧪 Para probar la conexión a la base de datos:" -ForegroundColor Cyan
Write-Host "   cd backend && npm run db:test" -ForegroundColor White
Write-Host ""

# Verificar si Docker está instalado
Write-Step "Verificando Docker..."
try {
    $dockerVersion = docker --version
    Write-Success "Docker encontrado: $dockerVersion"
    Write-Host "💡 Puedes usar Docker con: npm run docker:up" -ForegroundColor Blue
} catch {
    Write-Warning "Docker no está instalado. Instálalo desde https://www.docker.com si quieres usar contenedores."
}

Write-Host ""
Write-Host "✨ PropFinder está listo para ser usado!" -ForegroundColor Green
