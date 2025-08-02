# PropFinder - Script de Instalación Automatizada para Windows
# Este script configura todo el entorno de desarrollo para PropFinder

param(
    [switch]$SkipDatabase,
    [string]$DatabaseName = "propfinder",
    [string]$DatabaseUser = "propfinder_user",
    [string]$DatabasePassword,
    [string]$DatabaseHost = "localhost",
    [string]$DatabasePort = "5432"
)

# Configurar para salir en caso de error
$ErrorActionPreference = "Stop"

Write-Host "🏠 PropFinder - Instalación Automatizada" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Función para imprimir mensajes con colores
function Write-Status {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# Verificar requisitos previos
function Test-Requirements {
    Write-Status "Verificando requisitos previos..."
    
    # Verificar Node.js
    try {
        $nodeVersion = node --version
        $nodeMajor = [int]($nodeVersion -replace 'v(\d+)\.\d+\.\d+', '$1')
        if ($nodeMajor -lt 18) {
            Write-Error "Node.js versión 18+ es requerida. Versión actual: $nodeVersion"
            exit 1
        }
        Write-Success "Node.js $nodeVersion ✓"
    }
    catch {
        Write-Error "Node.js no está instalado. Por favor instala Node.js 18+"
        exit 1
    }
    
    # Verificar npm
    try {
        $npmVersion = npm --version
        Write-Success "npm $npmVersion ✓"
    }
    catch {
        Write-Error "npm no está instalado"
        exit 1
    }
    
    # Verificar Git
    try {
        $gitVersion = git --version
        Write-Success "Git $gitVersion ✓"
    }
    catch {
        Write-Warning "Git no está instalado o no está en PATH"
    }
    
    # Verificar PostgreSQL
    try {
        $psqlVersion = psql --version
        Write-Success "PostgreSQL ✓"
    }
    catch {
        Write-Warning "PostgreSQL no está instalado o no está en PATH"
        Write-Warning "Por favor instala PostgreSQL 14+ y asegúrate de que psql esté disponible"
    }
    
    # Verificar Redis
    try {
        $redisVersion = redis-cli --version
        Write-Success "Redis ✓"
    }
    catch {
        Write-Warning "Redis no está instalado o no está en PATH"
        Write-Warning "Por favor instala Redis 6+ y asegúrate de que redis-cli esté disponible"
    }
}

# Configurar base de datos
function Setup-Database {
    if ($SkipDatabase) {
        Write-Warning "Saltando configuración de base de datos"
        $script:DATABASE_URL = "postgresql://username:password@localhost:5432/propfinder"
        return
    }
    
    Write-Status "Configurando base de datos..."
    
    $setupDB = Read-Host "¿Quieres configurar la base de datos PostgreSQL ahora? (y/n)"
    if ($setupDB -notmatch '^[Yy]$') {
        Write-Warning "Saltando configuración de base de datos"
        $script:DATABASE_URL = "postgresql://username:password@localhost:5432/propfinder"
        return
    }
    
    if (-not $DatabasePassword) {
        $DatabasePassword = Read-Host "Contraseña del usuario" -AsSecureString
        $DatabasePassword = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($DatabasePassword))
    }
    
    # Crear base de datos y usuario
    Write-Status "Creando base de datos y usuario..."
    
    try {
        # Intentar crear usuario
        $createUserCmd = "CREATE USER $DatabaseUser WITH PASSWORD '$DatabasePassword';"
        psql -h $DatabaseHost -p $DatabasePort -U postgres -c $createUserCmd 2>$null
        Write-Success "Usuario creado ✓"
    }
    catch {
        Write-Warning "Usuario ya existe o error al crear"
    }
    
    try {
        # Intentar crear base de datos
        $createDBCmd = "CREATE DATABASE $DatabaseName OWNER $DatabaseUser;"
        psql -h $DatabaseHost -p $DatabasePort -U postgres -c $createDBCmd 2>$null
        Write-Success "Base de datos creada ✓"
    }
    catch {
        Write-Warning "Base de datos ya existe o error al crear"
    }
    
    # Ejecutar esquema
    Write-Status "Ejecutando esquema de base de datos..."
    try {
        $env:PGPASSWORD = $DatabasePassword
        psql -h $DatabaseHost -p $DatabasePort -U $DatabaseUser -d $DatabaseName -f "backend/database/schema.sql"
        Write-Success "Esquema ejecutado ✓"
    }
    catch {
        Write-Error "Error al ejecutar el esquema"
        exit 1
    }
    
    # Guardar configuración para .env
    $script:DATABASE_URL = "postgresql://$DatabaseUser`:$DatabasePassword@$DatabaseHost`:$DatabasePort/$DatabaseName"
}

# Instalar dependencias
function Install-Dependencies {
    Write-Status "Instalando dependencias..."
    
    # Backend
    Write-Status "Instalando dependencias del backend..."
    Set-Location backend
    npm install
    Set-Location ..
    Write-Success "Dependencias del backend instaladas ✓"
    
    # WebSocket
    Write-Status "Instalando dependencias del WebSocket..."
    Set-Location websocket
    npm install
    Set-Location ..
    Write-Success "Dependencias del WebSocket instaladas ✓"
    
    # Frontend
    Write-Status "Instalando dependencias del frontend..."
    npm install
    Write-Success "Dependencias del frontend instaladas ✓"
}

# Configurar variables de entorno
function Setup-Environment {
    Write-Status "Configurando variables de entorno..."
    
    # Generar JWT secret
    $JWT_SECRET = [System.Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
    
    # Backend .env
    if (-not (Test-Path "backend/.env")) {
        $backendEnvContent = @"
# Configuración del servidor
NODE_ENV=development
PORT=5000

# Base de datos PostgreSQL
DATABASE_URL=$DATABASE_URL

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=$JWT_SECRET

# Stripe (para pagos)
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_stripe_webhook_secret

# PayPal (para pagos)
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret
PAYPAL_MODE=sandbox

# Frontend URL (para redirecciones)
FRONTEND_URL=http://localhost:3000

# WebSocket
WEBSOCKET_PORT=5001
"@
        $backendEnvContent | Out-File -FilePath "backend/.env" -Encoding UTF8
        Write-Success "Archivo backend/.env creado ✓"
    }
    else {
        Write-Warning "Archivo backend/.env ya existe"
    }
    
    # Frontend .env
    if (-not (Test-Path ".env")) {
        $frontendEnvContent = @"
VITE_API_URL=http://localhost:5000/api
VITE_WEBSOCKET_URL=ws://localhost:5001
"@
        $frontendEnvContent | Out-File -FilePath ".env" -Encoding UTF8
        Write-Success "Archivo .env creado ✓"
    }
    else {
        Write-Warning "Archivo .env ya existe"
    }
}

# Crear scripts de inicio
function Create-StartScripts {
    Write-Status "Creando scripts de inicio..."
    
    # Script para iniciar todos los servicios (PowerShell)
    $startDevContent = @'
# PropFinder - Script de inicio para desarrollo
Write-Host "🚀 Iniciando PropFinder en modo desarrollo..." -ForegroundColor Cyan

# Función para manejar la salida
function Cleanup {
    Write-Host "🛑 Deteniendo servicios..." -ForegroundColor Yellow
    if ($BackendJob) { Stop-Job $BackendJob; Remove-Job $BackendJob }
    if ($WebSocketJob) { Stop-Job $WebSocketJob; Remove-Job $WebSocketJob }
    if ($FrontendJob) { Stop-Job $FrontendJob; Remove-Job $FrontendJob }
    exit 0
}

# Capturar Ctrl+C
Register-EngineEvent PowerShell.Exiting -Action { Cleanup }

# Iniciar backend
Write-Host "📡 Iniciando backend API..." -ForegroundColor Blue
$BackendJob = Start-Job -ScriptBlock { 
    Set-Location backend
    npm run dev
}

# Esperar un poco para que el backend se inicie
Start-Sleep -Seconds 3

# Iniciar WebSocket
Write-Host "💬 Iniciando servidor WebSocket..." -ForegroundColor Blue
$WebSocketJob = Start-Job -ScriptBlock {
    Set-Location websocket
    npm run dev
}

# Esperar un poco para que el WebSocket se inicie
Start-Sleep -Seconds 2

# Iniciar frontend
Write-Host "🌐 Iniciando frontend..." -ForegroundColor Blue
$FrontendJob = Start-Job -ScriptBlock {
    npm run dev
}

Write-Host "✅ Todos los servicios iniciados!" -ForegroundColor Green
Write-Host "📱 Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "🔌 Backend API: http://localhost:5000" -ForegroundColor Cyan
Write-Host "💬 WebSocket: ws://localhost:5001" -ForegroundColor Cyan
Write-Host ""
Write-Host "Presiona Ctrl+C para detener todos los servicios" -ForegroundColor Yellow

# Esperar a que todos los jobs terminen
try {
    Wait-Job $BackendJob, $WebSocketJob, $FrontendJob
}
catch {
    Cleanup
}
'@
    
    $startDevContent | Out-File -FilePath "start-dev.ps1" -Encoding UTF8
    Write-Success "Script start-dev.ps1 creado ✓"
    
    # Script para detener servicios
    $stopDevContent = @'
# PropFinder - Script para detener servicios
Write-Host "🛑 Deteniendo servicios de PropFinder..." -ForegroundColor Yellow

# Buscar y matar procesos
Get-Process | Where-Object { $_.ProcessName -eq "node" -and $_.CommandLine -like "*npm run dev*" } | Stop-Process -Force
Get-Process | Where-Object { $_.ProcessName -eq "node" -and $_.CommandLine -like "*server.js*" } | Stop-Process -Force

Write-Host "✅ Servicios detenidos" -ForegroundColor Green
'@
    
    $stopDevContent | Out-File -FilePath "stop-dev.ps1" -Encoding UTF8
    Write-Success "Script stop-dev.ps1 creado ✓"
}

# Mostrar información final
function Show-FinalInfo {
    Write-Host ""
    Write-Host "🎉 ¡Instalación completada!" -ForegroundColor Green
    Write-Host "==========================" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Próximos pasos:" -ForegroundColor Cyan
    Write-Host "1. Configura las claves de Stripe y PayPal en backend/.env"
    Write-Host "2. Asegúrate de que PostgreSQL y Redis estén ejecutándose"
    Write-Host "3. Ejecuta '.\start-dev.ps1' para iniciar todos los servicios"
    Write-Host ""
    Write-Host "🔗 URLs de la aplicación:" -ForegroundColor Cyan
    Write-Host "   Frontend: http://localhost:3000"
    Write-Host "   Backend API: http://localhost:5000"
    Write-Host "   WebSocket: ws://localhost:5001"
    Write-Host ""
    Write-Host "👤 Usuarios de prueba:" -ForegroundColor Cyan
    Write-Host "   Agente: agent1@propfinder.com / password123"
    Write-Host "   Usuario: user1@example.com / password123"
    Write-Host "   Admin: admin@propfinder.com / password123"
    Write-Host ""
    Write-Host "📚 Documentación: README.md"
    Write-Host ""
    Write-Success "¡PropFinder está listo para usar!"
}

# Función principal
function Main {
    Test-Requirements
    Setup-Database
    Install-Dependencies
    Setup-Environment
    Create-StartScripts
    Show-FinalInfo
}

# Ejecutar función principal
Main 