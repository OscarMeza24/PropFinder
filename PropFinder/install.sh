#!/bin/bash

# PropFinder - Script de Instalación Automatizada
# Este script configura todo el entorno de desarrollo para PropFinder

set -e  # Salir si hay algún error

echo "🏠 PropFinder - Instalación Automatizada"
echo "========================================"

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para imprimir mensajes con colores
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar requisitos previos
check_requirements() {
    print_status "Verificando requisitos previos..."
    
    # Verificar Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js no está instalado. Por favor instala Node.js 18+"
        exit 1
    fi
    
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        print_error "Node.js versión 18+ es requerida. Versión actual: $(node -v)"
        exit 1
    fi
    
    print_success "Node.js $(node -v) ✓"
    
    # Verificar npm
    if ! command -v npm &> /dev/null; then
        print_error "npm no está instalado"
        exit 1
    fi
    
    print_success "npm $(npm -v) ✓"
    
    # Verificar PostgreSQL
    if ! command -v psql &> /dev/null; then
        print_warning "PostgreSQL no está instalado o no está en PATH"
        print_warning "Por favor instala PostgreSQL 14+ y asegúrate de que psql esté disponible"
    else
        print_success "PostgreSQL ✓"
    fi
    
    # Verificar Redis
    if ! command -v redis-cli &> /dev/null; then
        print_warning "Redis no está instalado o no está en PATH"
        print_warning "Por favor instala Redis 6+ y asegúrate de que redis-cli esté disponible"
    else
        print_success "Redis ✓"
    fi
}

# Configurar base de datos
setup_database() {
    print_status "Configurando base de datos..."
    
    read -p "¿Quieres configurar la base de datos PostgreSQL ahora? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        read -p "Nombre de la base de datos [propfinder]: " DB_NAME
        DB_NAME=${DB_NAME:-propfinder}
        
        read -p "Usuario de la base de datos [propfinder_user]: " DB_USER
        DB_USER=${DB_USER:-propfinder_user}
        
        read -s -p "Contraseña del usuario: " DB_PASSWORD
        echo
        
        read -p "Host de PostgreSQL [localhost]: " DB_HOST
        DB_HOST=${DB_HOST:-localhost}
        
        read -p "Puerto de PostgreSQL [5432]: " DB_PORT
        DB_PORT=${DB_PORT:-5432}
        
        # Crear base de datos y usuario
        print_status "Creando base de datos y usuario..."
        
        # Intentar crear usuario y base de datos
        if psql -h "$DB_HOST" -p "$DB_PORT" -U postgres -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';" 2>/dev/null; then
            print_success "Usuario creado ✓"
        else
            print_warning "Usuario ya existe o error al crear"
        fi
        
        if psql -h "$DB_HOST" -p "$DB_PORT" -U postgres -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;" 2>/dev/null; then
            print_success "Base de datos creada ✓"
        else
            print_warning "Base de datos ya existe o error al crear"
        fi
        
        # Ejecutar esquema
        print_status "Ejecutando esquema de base de datos..."
        if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f backend/database/schema.sql; then
            print_success "Esquema ejecutado ✓"
        else
            print_error "Error al ejecutar el esquema"
            exit 1
        fi
        
        # Guardar configuración para .env
        DATABASE_URL="postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME"
    else
        print_warning "Saltando configuración de base de datos"
        DATABASE_URL="postgresql://username:password@localhost:5432/propfinder"
    fi
}

# Instalar dependencias
install_dependencies() {
    print_status "Instalando dependencias..."
    
    # Backend
    print_status "Instalando dependencias del backend..."
    cd backend
    npm install
    cd ..
    print_success "Dependencias del backend instaladas ✓"
    
    # WebSocket
    print_status "Instalando dependencias del WebSocket..."
    cd websocket
    npm install
    cd ..
    print_success "Dependencias del WebSocket instaladas ✓"
    
    # Frontend
    print_status "Instalando dependencias del frontend..."
    npm install
    print_success "Dependencias del frontend instaladas ✓"
}

# Configurar variables de entorno
setup_environment() {
    print_status "Configurando variables de entorno..."
    
    # Generar JWT secret
    JWT_SECRET=$(openssl rand -base64 32)
    
    # Backend .env
    if [ ! -f backend/.env ]; then
        cat > backend/.env << EOF
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
EOF
        print_success "Archivo backend/.env creado ✓"
    else
        print_warning "Archivo backend/.env ya existe"
    fi
    
    # Frontend .env
    if [ ! -f .env ]; then
        cat > .env << EOF
VITE_API_URL=http://localhost:5000/api
VITE_WEBSOCKET_URL=ws://localhost:5001
EOF
        print_success "Archivo .env creado ✓"
    else
        print_warning "Archivo .env ya existe"
    fi
}

# Crear scripts de inicio
create_start_scripts() {
    print_status "Creando scripts de inicio..."
    
    # Script para iniciar todos los servicios
    cat > start-dev.sh << 'EOF'
#!/bin/bash

echo "🚀 Iniciando PropFinder en modo desarrollo..."

# Función para manejar la salida
cleanup() {
    echo "🛑 Deteniendo servicios..."
    kill $BACKEND_PID $WEBSOCKET_PID $FRONTEND_PID 2>/dev/null
    exit 0
}

# Capturar Ctrl+C
trap cleanup SIGINT

# Iniciar backend
echo "📡 Iniciando backend API..."
cd backend && npm run dev &
BACKEND_PID=$!

# Esperar un poco para que el backend se inicie
sleep 3

# Iniciar WebSocket
echo "💬 Iniciando servidor WebSocket..."
cd ../websocket && npm run dev &
WEBSOCKET_PID=$!

# Esperar un poco para que el WebSocket se inicie
sleep 2

# Iniciar frontend
echo "🌐 Iniciando frontend..."
npm run dev &
FRONTEND_PID=$!

echo "✅ Todos los servicios iniciados!"
echo "📱 Frontend: http://localhost:3000"
echo "🔌 Backend API: http://localhost:5000"
echo "💬 WebSocket: ws://localhost:5001"
echo ""
echo "Presiona Ctrl+C para detener todos los servicios"

# Esperar a que todos los procesos terminen
wait
EOF
    
    chmod +x start-dev.sh
    print_success "Script start-dev.sh creado ✓"
    
    # Script para detener servicios
    cat > stop-dev.sh << 'EOF'
#!/bin/bash

echo "🛑 Deteniendo servicios de PropFinder..."

# Buscar y matar procesos
pkill -f "npm run dev" 2>/dev/null || true
pkill -f "node.*server.js" 2>/dev/null || true

echo "✅ Servicios detenidos"
EOF
    
    chmod +x stop-dev.sh
    print_success "Script stop-dev.sh creado ✓"
}

# Mostrar información final
show_final_info() {
    echo ""
    echo "🎉 ¡Instalación completada!"
    echo "=========================="
    echo ""
    echo "📋 Próximos pasos:"
    echo "1. Configura las claves de Stripe y PayPal en backend/.env"
    echo "2. Asegúrate de que PostgreSQL y Redis estén ejecutándose"
    echo "3. Ejecuta './start-dev.sh' para iniciar todos los servicios"
    echo "4. Ejecuta './scripts/health-check.sh' para verificar el estado"
    echo ""
    echo "🔗 URLs de la aplicación:"
    echo "   Frontend: http://localhost:3000"
    echo "   Backend API: http://localhost:5000"
    echo "   WebSocket: ws://localhost:5001"
    echo "   PostgreSQL: localhost:5432"
    echo "   Redis: localhost:6379"
    echo ""
    echo "👤 Usuarios de prueba:"
    echo "   Agente: agent1@propfinder.com / password123"
    echo "   Usuario: user1@example.com / password123"
    echo "   Admin: admin@propfinder.com / password123"
    echo ""
    echo "📚 Documentación: README.md"
    echo "🔧 Scripts útiles:"
    echo "   ./scripts/health-check.sh - Verificar estado de servicios"
    echo "   ./start-dev.sh - Iniciar todos los servicios"
    echo "   ./stop-dev.sh - Detener todos los servicios"
    echo ""
    print_success "¡PropFinder está listo para usar!"
}

# Función principal
main() {
    check_requirements
    setup_database
    install_dependencies
    setup_environment
    create_start_scripts
    show_final_info
}

# Ejecutar función principal
main "$@" 