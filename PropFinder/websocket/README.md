# 🔌 PropFinder WebSocket Server

Servidor WebSocket dedicado para PropFinder que maneja comunicación en tiempo real, chat entre usuarios y agentes, y notificaciones push.

## 🚀 Características

### 💬 Chat en Tiempo Real
- **Mensajes Instantáneos**: Comunicación bidireccional entre usuarios y agentes
- **Salas de Chat**: Sistema de rooms para conversaciones privadas
- **Historial de Mensajes**: Persistencia y recuperación de conversaciones
- **Estados de Lectura**: Tracking de mensajes leídos/no leídos
- **Indicadores de Escritura**: Notificaciones cuando alguien está escribiendo

### 🔐 Autenticación y Seguridad
- **Autenticación JWT**: Verificación de tokens en cada conexión
- **Validación de Tokens**: Prevención de conexiones con tokens expirados
- **Manejo de Errores Específicos**: Códigos de error diferenciados (4001 para tokens expirados)
- **Logging Avanzado**: Sistema de logs detallado para debugging

### 📡 Gestión de Conexiones
- **Auto-reconexión Inteligente**: Evita bucles infinitos con tokens inválidos
- **Limpieza de Conexiones**: Gestión automática de desconexiones
- **Escalabilidad**: Soporte para múltiples conexiones concurrentes

### 🔔 Sistema de Notificaciones
- **Notificaciones Push**: Alertas en tiempo real
- **Integración Redis**: Distribución de notificaciones en múltiples instancias
- **Modo Local**: Funcionamiento sin Redis para desarrollo

## 🛠️ Configuración

### Requisitos Previos
- Node.js 18+
- PostgreSQL (para almacenamiento de mensajes)
- Redis (opcional, para escalabilidad)

### Variables de Entorno

Crea un archivo `.env` en el directorio `websocket/` o usa las variables del backend:

```env
# Base de datos
DATABASE_URL=postgresql://user:pass@localhost:5432/propfinder_db

# JWT
JWT_SECRET=your-jwt-secret-key

# Redis (opcional)
REDIS_URL=redis://localhost:6379
USE_REDIS=false

# Puerto WebSocket
WEBSOCKET_PORT=5001

# Modo de desarrollo
NODE_ENV=development
```

### 🚀 Instalación y Ejecución

```bash
# Navegar al directorio websocket
cd websocket

# Instalar dependencias
npm install

# Modo desarrollo (con auto-reload)
npm run dev

# Modo producción
npm start

# Servidor simple para testing
npm run simple
```

## 📁 Estructura de Archivos

```
websocket/
├── 📄 server.js              # Servidor principal con todas las funcionalidades
├── 📄 server-simple.js       # Servidor simplificado para testing
├── 📄 package.json           # Dependencias y scripts
├── 📄 README.md             # Esta documentación
└── 📂 node_modules/         # Dependencias instaladas
```

## 🔧 API WebSocket

### Conexión

```javascript
// Frontend - Conectar con token JWT
const token = localStorage.getItem('token');
const ws = new WebSocket(`ws://localhost:5001?token=${token}`);
```

### Eventos de Conexión

#### Cliente → Servidor

```javascript
// Unirse a una sala de chat
ws.send(JSON.stringify({
  type: 'join_room',
  roomId: 'user_123_agent_456'
}));

// Enviar mensaje
ws.send(JSON.stringify({
  type: 'send_message',
  receiverId: 456,
  content: 'Hola, estoy interesado en la propiedad',
  messageType: 'text'
}));

// Marcar mensajes como leídos
ws.send(JSON.stringify({
  type: 'mark_as_read',
  senderId: 456
}));

// Indicador de escritura
ws.send(JSON.stringify({
  type: 'typing',
  isTyping: true,
  roomId: 'user_123_agent_456'
}));
```

#### Servidor → Cliente

```javascript
// Confirmación de conexión
{
  type: 'connection_established',
  userId: 123
}

// Nuevo mensaje recibido
{
  type: 'new_message',
  message: {
    id: 789,
    sender_id: 456,
    content: 'Hola! Con gusto te ayudo',
    created_at: '2025-08-06T10:30:00Z',
    sender_name: 'Agente Juan'
  }
}

// Historial de mensajes
{
  type: 'message_history',
  messages: [/* array de mensajes */]
}

// Notificación general
{
  type: 'notification',
  notification: {
    title: 'Nueva consulta',
    message: 'Tienes un nuevo mensaje',
    type: 'message'
  }
}
```

### Códigos de Error

| Código | Descripción |
|--------|-------------|
| 4001   | Token JWT expirado o inválido |
| 1008   | Error general de autenticación |
| 1000   | Desconexión normal |

## 🔄 Integración con Frontend

### React Context Hook

```javascript
// En ChatContext.tsx
const connectWebSocket = useCallback(() => {
  const token = apiService.getToken();
  
  // Verificar token antes de conectar
  if (apiService.isTokenExpired()) {
    setError('Sesión expirada');
    return;
  }

  const ws = new WebSocket(`ws://localhost:5001?token=${token}`);
  
  ws.onopen = () => setIsConnected(true);
  
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    handleWebSocketMessage(data);
  };
  
  ws.onclose = (event) => {
    setIsConnected(false);
    
    // No reconectar si token expirado
    if (event.code === 4001) {
      setError('Sesión expirada');
      return;
    }
    
    // Reconectar después de 5 segundos
    setTimeout(connectWebSocket, 5000);
  };
}, []);
```

## 🐳 Docker

### Dockerfile

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5001
CMD ["npm", "start"]
```

### Docker Compose

```yaml
services:
  websocket:
    build: ./websocket
    ports:
      - "5001:5001"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - JWT_SECRET=${JWT_SECRET}
      - REDIS_URL=${REDIS_URL}
    depends_on:
      - postgres
      - redis
```

## 📊 Monitoreo y Logs

### Logs Disponibles

```bash
# Ver logs en tiempo real
npm start | grep "WebSocket"

# Tipos de logs:
# ✅ Conexiones exitosas
# ❌ Errores de autenticación
# 💬 Mensajes enviados/recibidos
# 🔌 Conexiones/desconexiones
# 📊 Estadísticas de uso
```

### Métricas

El servidor registra:
- Número de conexiones activas
- Mensajes por minuto
- Errores de autenticación
- Tiempo de respuesta promedio

## 🧪 Testing

### Servidor Simple

Para testing rápido sin autenticación:

```bash
npm run simple
```

### Testing Manual

```javascript
// Conectar sin autenticación (solo en servidor simple)
const ws = new WebSocket('ws://localhost:5002');

ws.onopen = () => {
  console.log('Conectado al servidor simple');
};

ws.onmessage = (event) => {
  console.log('Mensaje recibido:', event.data);
};
```

### Unit Tests

```bash
# Ejecutar tests (cuando estén implementados)
npm test

# Tests de integración
npm run test:integration
```

## 🚀 Deployment

### Desarrollo

```bash
# Con auto-reload
npm run dev
```

### Producción

```bash
# Con optimizaciones
NODE_ENV=production npm start
```

### Environment Variables en Producción

```env
NODE_ENV=production
DATABASE_URL=postgresql://prod_user:pass@prod_host:5432/propfinder_prod
JWT_SECRET=super-secure-production-secret
REDIS_URL=redis://prod-redis:6379
USE_REDIS=true
WEBSOCKET_PORT=5001
```

## 🔧 Troubleshooting

### Problemas Comunes

#### 1. Token Expirado - Bucle Infinito
**Síntoma**: Reconexiones constantes con error 4001
```
Error de autenticación WebSocket: TokenExpiredError: jwt expired
```

**Solución**: El frontend ahora maneja esto correctamente y no intenta reconectar con tokens expirados.

#### 2. Puerto en Uso
**Síntoma**: `EADDRINUSE: address already in use :::5001`

**Solución**:
```bash
# Windows
netstat -ano | findstr :5001
taskkill /f /pid <PID>

# Linux/Mac
lsof -ti:5001 | xargs kill -9
```

#### 3. Error de Base de Datos
**Síntoma**: Cannot connect to PostgreSQL

**Solución**:
1. Verificar que PostgreSQL esté corriendo
2. Comprobar DATABASE_URL
3. Verificar que las tablas existan

#### 4. Redis No Disponible
**Síntoma**: Redis connection failed

**Solución**: El servidor funciona sin Redis, simplemente sin distribución de notificaciones.

### Debug Mode

```bash
# Habilitar logs verbosos
DEBUG=websocket:* npm start
```

## 🤝 Contribuir

1. Crear tests para nuevas funcionalidades
2. Mantener compatibilidad con el protocolo existente
3. Actualizar documentación
4. Seguir las convenciones de naming

## 📄 Licencia

Este módulo es parte del proyecto PropFinder y está bajo la misma licencia MIT.

---

💡 **Tip**: Para desarrollo, usa el servidor simple (`npm run simple`) cuando no necesites autenticación JWT.
