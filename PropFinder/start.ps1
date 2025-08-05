#!/usr/bin/env powershell

# ==============================================
# PROPFINDER - SCRIPT DE INICIO COMPLETO
# ==============================================

param(
    [string]$Mode = "dev",
    [switch]$Help
)

if ($Help) {
    Write-Host "🚀 PropFinder - Script de Inicio" -ForegroundColor Green
    Write-Host ""
    Write-Host "Uso:" -ForegroundColor Cyan
    Write-Host "  .\start.ps1 [modo]" -ForegroundColor White
    Write-Host ""
    Write-Host "Modos disponibles:" -ForegroundColor Cyan
    Write-Host "  dev        - Modo desarrollo (por defecto)" -ForegroundColor White
    Write-Host "  frontend   - Solo frontend" -ForegroundColor White
    Write-Host "  backend    - Solo backend" -ForegroundColor White
    Write-Host "  websocket  - Solo WebSocket" -ForegroundColor White
    Write-Host "  docker     - Usar Docker" -ForegroundColor White
    Write-Host "  test       - Ejecutar tests" -ForegroundColor White
    Write-Host ""
    Write-Host "Ejemplos:" -ForegroundColor Cyan
    Write-Host "  .\start.ps1" -ForegroundColor White
    Write-Host "  .\start.ps1 frontend" -ForegroundColor White
    Write-Host "  .\start.ps1 docker" -ForegroundColor White
    exit 0
}

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

function Test-Prerequisites {
    Write-Step "Verificando requisitos..."
    
    # Verificar Node.js
    try {
        $nodeVersion = node --version
        Write-Success "Node.js: $nodeVersion"
    } catch {
        Write-Error "Node.js no está instalado"
        return $false
    }
    
    # Verificar npm
    try {
        $npmVersion = npm --version
        Write-Success "npm: $npmVersion"
    } catch {
        Write-Error "npm no está instalado"
        return $false
    }
    
    # Verificar archivos .env
    if (!(Test-Path ".env")) {
        Write-Warning "Archivo .env no encontrado. Copiando desde .env.example..."
        Copy-Item ".env.example" ".env"
    }
    
    if (!(Test-Path "backend\.env")) {
        Write-Warning "Archivo backend\.env no encontrado. Copiando desde env.example..."
        Copy-Item "backend\env.example" "backend\.env"
    }
    
    return $true
}

function Start-Development {
    Write-Step "Iniciando PropFinder en modo desarrollo..."
    
    # Verificar conexión a base de datos
    Write-Step "Verificando conexión a base de datos..."
    Set-Location backend
    $dbTest = npm run db:test 2>&1
    Set-Location ..
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Conexión a base de datos exitosa"
    } else {
        Write-Warning "Problema con la conexión a base de datos. Continuando..."
    }
    
    Write-Step "Iniciando todos los servicios..."
    Write-Host ""
    Write-Host "🌐 URLs de la aplicación:" -ForegroundColor Green
    Write-Host "  Frontend:  http://localhost:3000" -ForegroundColor White
    Write-Host "  Backend:   http://localhost:5000" -ForegroundColor White
    Write-Host "  WebSocket: ws://localhost:5001" -ForegroundColor White
    Write-Host "  Health:    http://localhost:5000/api/health" -ForegroundColor White
    Write-Host ""
    Write-Host "Presiona Ctrl+C para detener todos los servicios" -ForegroundColor Yellow
    Write-Host ""
    
    # Usar npm run start:all si existe
    if ((Get-Content package.json | ConvertFrom-Json).scripts.'start:all') {
        npm run start:all
    } else {
        # Iniciar servicios manualmente con concurrently
        npx concurrently --kill-others-on-fail --prefix "[{name}]" --names "FRONTEND,BACKEND,WEBSOCKET" --prefix-colors "cyan,green,magenta" "npm run dev" "cd backend && npm run dev" "cd websocket && npm run dev"
    }
}

function Start-Frontend {
    Write-Step "Iniciando solo el frontend..."
    Write-Host "🌐 Frontend: http://localhost:3000" -ForegroundColor Green
    npm run dev
}

function Start-Backend {
    Write-Step "Iniciando solo el backend..."
    Write-Host "🌐 Backend: http://localhost:5000" -ForegroundColor Green
    Set-Location backend
    npm run dev
}

function Start-WebSocket {
    Write-Step "Iniciando solo el WebSocket..."
    Write-Host "🌐 WebSocket: ws://localhost:5001" -ForegroundColor Green
    Set-Location websocket
    npm run dev
}

function Start-Docker {
    Write-Step "Iniciando con Docker..."
    
    # Verificar si Docker está instalado
    try {
        $dockerVersion = docker --version
        Write-Success "Docker: $dockerVersion"
    } catch {
        Write-Error "Docker no está instalado"
        return
    }
    
    Write-Step "Construyendo e iniciando contenedores..."
    docker-compose up --build
}

function Run-Tests {
    Write-Step "Ejecutando tests..."
    
    Write-Step "Tests del frontend..."
    npm test
    
    Write-Step "Tests del backend..."
    Set-Location backend
    npm test
    Set-Location ..
    
    Write-Success "Tests completados"
}

# Verificar requisitos
if (!(Test-Prerequisites)) {
    exit 1
}

# Ejecutar según el modo
switch ($Mode.ToLower()) {
    "dev" { Start-Development }
    "frontend" { Start-Frontend }
    "backend" { Start-Backend }
    "websocket" { Start-WebSocket }
    "docker" { Start-Docker }
    "test" { Run-Tests }
    default {
        Write-Error "Modo '$Mode' no reconocido"
        Write-Host "Usa '.\start.ps1 -Help' para ver los modos disponibles" -ForegroundColor Yellow
        exit 1
    }
}
