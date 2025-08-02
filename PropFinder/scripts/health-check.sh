#!/bin/bash

# Script de verificación de salud para PropFinder
# Verifica que todos los servicios estén funcionando correctamente

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🔍 Verificando estado de servicios PropFinder..."

# Función para verificar endpoint
check_endpoint() {
    local url=$1
    local service=$2
    local timeout=${3:-5}
    
    if curl -f -s --max-time $timeout "$url" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ $service: OK${NC}"
        return 0
    else
        echo -e "${RED}❌ $service: ERROR${NC}"
        return 1
    fi
}

# Función para verificar puerto
check_port() {
    local port=$1
    local service=$2
    
    if nc -z localhost $port 2>/dev/null; then
        echo -e "${GREEN}✅ $service (puerto $port): OK${NC}"
        return 0
    else
        echo -e "${RED}❌ $service (puerto $port): ERROR${NC}"
        return 1
    fi
}

# Contador de errores
errors=0

# Verificar servicios principales
echo "📡 Verificando servicios web..."
check_endpoint "http://localhost:3000" "Frontend" || ((errors++))
check_endpoint "http://localhost:5000/api/health" "Backend API" || ((errors++))
check_endpoint "http://localhost:5001/health" "WebSocket" || ((errors++))
check_endpoint "http://localhost:9000" "SonarQube" || ((errors++))

echo ""
echo "🗄️ Verificando bases de datos..."
check_port 5432 "PostgreSQL" || ((errors++))
check_port 6379 "Redis" || ((errors++))

echo ""
echo "🔧 Verificando conectividad de red..."
check_endpoint "http://localhost:5000/api/metrics" "Métricas del Backend" || ((errors++))

echo ""
if [ $errors -eq 0 ]; then
    echo -e "${GREEN}🎉 Todos los servicios están funcionando correctamente!${NC}"
    echo ""
    echo "📊 URLs de acceso:"
    echo "   Frontend: http://localhost:3000"
    echo "   Backend API: http://localhost:5000"
    echo "   WebSocket: ws://localhost:5001"
    echo "   SonarQube: http://localhost:9000"
    echo "   PostgreSQL: localhost:5432"
    echo "   Redis: localhost:6379"
    exit 0
else
    echo -e "${RED}⚠️  Se encontraron $errors error(es). Revisa los servicios fallidos.${NC}"
    echo ""
    echo "💡 Comandos útiles para debugging:"
    echo "   docker-compose logs -f [servicio]"
    echo "   docker-compose ps"
    echo "   docker-compose restart [servicio]"
    exit 1
fi 