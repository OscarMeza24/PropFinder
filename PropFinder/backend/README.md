# 🚀 PropFinder Backend API

Backend API para la plataforma inmobiliaria PropFinder, construido con Node.js, Express y PostgreSQL.

## 📋 Características

- **Autenticación JWT** con manejo de sesiones seguras y separación de roles
- **Sistema de roles avanzado** (Usuario, Agente, Administrador) con funcionalidades específicas
- **API RESTful** siguiendo las mejores prácticas
- **Base de datos PostgreSQL** para almacenamiento persistente
- **Redis** para caché y manejo de sesiones
- **WebSocket** para chat en tiempo real entre usuarios y agentes
- **Dashboard específico para agentes** con estadísticas y gestión de propiedades
- **Validación de datos** con express-validator y Joi
- **Seguridad mejorada** con Helmet, rate limiting y CORS
- **Subida de archivos** con Multer y procesamiento de imágenes con Sharp
- **Sistema de pagos** integrado con MercadoPago y múltiples estrategias
- **Sistema de notificaciones** por correo electrónico con Nodemailer
- **Analytics** para seguimiento de propiedades y comisiones
- **Logging estructurado** con Winston
- **Pruebas unitarias y de integración** con Jest y Supertest

## 🛠️ Stack Tecnológico

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Base de datos**: PostgreSQL
- **Caché**: Redis
- **Autenticación**: JWT (JSON Web Tokens)
- **Roles**: Sistema de roles completo (user, agent, admin)
- **Validación**: express-validator, Joi
- **Seguridad**: Helmet, express-rate-limit, express-slow-down
- **Pagos**: MercadoPago, estrategias de pago modulares
- **Email**: Nodemailer
- **WebSocket**: Socket.io para chat en tiempo real
- **Logging**: Winston
- **Testing**: Jest, Supertest
- **Documentación**: JSDoc

## 🚀 Empezando

### Requisitos Previos

- Node.js 18 o superior
- PostgreSQL 13 o superior
- Redis 6 o superior
- npm o yarn

### Instalación

1. **Clonar el repositorio y acceder al directorio del backend**
   ```bash
   git clone https://github.com/tu-usuario/propfinder.git
   cd propfinder/backend
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   # o
   yarn install
   ```

3. **Configurar variables de entorno**
   ```bash
   cp .env.example .env
   ```
   Editar el archivo `.env` con tus configuraciones.

4. **Configurar la base de datos**
   - Crear una base de datos PostgreSQL
   - Configurar las credenciales en el archivo `.env`
   - Ejecutar el script de inicialización (si existe)

5. **Iniciar el servidor**
   ```bash
   # Modo desarrollo (con recarga automática)
   npm run dev

   # Modo producción
   npm start
   ```

## 🔧 Variables de Entorno

Crea un archivo `.env` en el directorio del backend con las siguientes variables:

```env
# Configuración del servidor
NODE_ENV=development
PORT=5000

# Base de datos
DB_HOST=localhost
DB_PORT=5432
DB_NAME=propfinder
DB_USER=postgres
DB_PASSWORD=tu_contraseña

# JWT
JWT_SECRET=tu_jwt_secreto
JWT_EXPIRES_IN=24h

# Redis
REDIS_URL=redis://localhost:6379

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# MercadoPago
MERCADOPAGO_ACCESS_TOKEN=tu_access_token
MERCADOPAGO_PUBLIC_KEY=tu_public_key

# PayPal (legacy, opcional)
PAYPAL_CLIENT_ID=tu_client_id
PAYPAL_CLIENT_SECRET=tu_client_secret
PAYPAL_MODE=sandbox

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu_correo@gmail.com
SMTP_PASS=tu_contraseña
EMAIL_FROM=no-reply@propfinder.com

# Frontend URL (para CORS)
FRONTEND_URL=http://localhost:5173
```

## 🛣️ Estructura del Proyecto

```
backend/
├── config/           # Configuraciones de la aplicación
│   ├── database.js   # Configuración de PostgreSQL
│   ├── email.js      # Configuración de email
│   └── logger.js     # Configuración de Winston
├── database/         # Scripts y migraciones de la base de datos
│   └── schema.sql    # Esquema de la base de datos
├── middleware/       # Middlewares personalizados
│   ├── auth.js       # Autenticación y autorización por roles
│   ├── errorHandler.js # Manejo de errores
│   └── security.js   # Middleware de seguridad
├── routes/           # Rutas de la API
│   ├── auth.js       # Autenticación y registro por roles
│   ├── properties.js # Gestión de propiedades
│   ├── users.js      # Gestión de usuarios
│   ├── agents.js     # Funcionalidades específicas de agentes
│   ├── payments.js   # Sistema de pagos
│   ├── analytics.js  # Analytics y estadísticas
│   ├── conversations.js # Chat y conversaciones
│   └── notifications.js # Sistema de notificaciones
├── services/         # Lógica de negocio
│   └── payment/      # Estrategias de pago
│       └── MercadoPagoStrategy.js
├── templates/        # Plantillas de email
│   └── emails/
├── tests/            # Pruebas
│   ├── auth.test.js  # Pruebas de autenticación
│   └── setup.js     # Configuración de pruebas
├── utils/            # Utilidades
│   ├── ApiError.js   # Manejo de errores de API
│   └── asyncHandler.js # Wrapper para async/await
├── uploads/          # Archivos subidos
├── logs/            # Archivos de log
├── .env.example      # Plantilla de variables de entorno
├── jest.config.js    # Configuración de Jest
└── server.js         # Punto de entrada de la aplicación
```

## 📡 Endpoints de la API

### Autenticación
- `POST /api/auth/register` - Registrar nuevo usuario (con rol específico)
- `POST /api/auth/login` - Iniciar sesión (retorna datos específicos del rol)
- `GET /api/auth/me` - Obtener perfil del usuario actual
- `GET /api/auth/dashboard` - Obtener datos del dashboard según el rol
- `POST /api/auth/refresh-token` - Refrescar token de acceso
- `POST /api/auth/verify-email` - Verificar correo electrónico
- `POST /api/auth/forgot-password` - Solicitar recuperación de contraseña
- `POST /api/auth/reset-password` - Restablecer contraseña

### Propiedades
- `GET /api/properties` - Obtener listado de propiedades (con filtros)
- `GET /api/properties/:id` - Obtener propiedad por ID
- `POST /api/properties` - Crear nueva propiedad (requiere rol de agente)
- `PUT /api/properties/:id` - Actualizar propiedad (propietario/admin)
- `DELETE /api/properties/:id` - Eliminar propiedad (propietario/admin)
- `POST /api/properties/:id/favorite` - Marcar/desmarcar como favorita

### Usuarios
- `GET /api/users` - Obtener lista de usuarios (admin)
- `GET /api/users/:id` - Obtener perfil de usuario
- `PUT /api/users/:id` - Actualizar perfil de usuario
- `DELETE /api/users/:id` - Eliminar usuario (admin)
- `GET /api/users/:id/favorites` - Obtener propiedades favoritas del usuario

### Agentes (solo para usuarios con rol de agente)
- `GET /api/agents/stats` - Obtener estadísticas del agente
- `GET /api/agents/properties` - Obtener propiedades del agente
- `GET /api/agents/commissions` - Obtener comisiones del agente
- `GET /api/agents/analytics` - Obtener análisis de rendimiento

### Pagos
- `POST /api/payments/create-payment-intent` - Crear intención de pago (MercadoPago)
- `POST /api/payments/confirm-payment` - Confirmar pago
- `POST /api/payments/webhook` - Webhook para notificaciones de pago
- `GET /api/payments/history` - Historial de pagos del usuario

### Conversaciones (Chat)
- `GET /api/conversations` - Obtener conversaciones del usuario
- `POST /api/conversations` - Crear nueva conversación
- `GET /api/conversations/:id/messages` - Obtener mensajes de una conversación
- `POST /api/conversations/:id/messages` - Enviar mensaje

### Analytics (solo para agentes y admin)
- `GET /api/analytics/overview` - Resumen general de métricas
- `GET /api/analytics/properties` - Análisis de propiedades
- `GET /api/analytics/users` - Análisis de usuarios

### Notificaciones
- `GET /api/notifications` - Obtener notificaciones del usuario
- `PUT /api/notifications/:id/read` - Marcar notificación como leída
- `DELETE /api/notifications/:id` - Eliminar notificación

## 🧪 Ejecutando las Pruebas

```bash
# Ejecutar todas las pruebas
npm test

# Ejecutar pruebas en modo watch
npm run test:watch

# Generar cobertura de código
npm run test:coverage

# Ejecutar linting
npm run lint

# Corregir problemas de formato automáticamente
npm run lint:fix
```

## 🐳 Docker

### Construir la imagen
```bash
docker build -t propfinder-backend .
```

### Ejecutar con Docker Compose
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:13-alpine
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
      POSTGRES_DB: propfinder
    ports:
      - '5432:5432'
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:6-alpine
    ports:
      - '6379:6379'
    volumes:
      - redis_data:/data

  app:
    build: .
    ports:
      - '5000:5000'
    environment:
      - NODE_ENV=production
      - DB_HOST=postgres
      - DB_PORT=5432
      - DB_NAME=propfinder
      - DB_USER=user
      - DB_PASSWORD=password
      - REDIS_URL=redis://redis:6379
    depends_on:
      - postgres
      - redis

volumes:
  postgres_data:
  redis_data:
```

## 🔒 Seguridad

- **Autenticación JWT** con expiración configurable
- **Sistema de roles robusto** con permisos granulares (user, agent, admin)
- **Protección contra ataques CSRF**
- **Rate limiting** para prevenir fuerza bruta
- **CORS** configurado para dominios específicos
- **Sanitización de entradas** para prevenir inyecciones
- **Helmet** para cabeceras de seguridad HTTP
- **Validación estricta** de todos los datos de entrada
- **Middleware de autorización** por roles y recursos
- **Tokens de verificación** para correo electrónico
- **Logging de seguridad** para auditoría

## 🏗️ Arquitectura por Roles

### Usuario (user)
- Búsqueda y visualización de propiedades
- Gestión de favoritos
- Chat con agentes
- Historial de interacciones

### Agente (agent)
- Dashboard con estadísticas personalizadas
- Creación y gestión de propiedades
- Chat con usuarios interesados
- Analytics de rendimiento
- Gestión de comisiones
- Reportes de actividad

### Administrador (admin)
- Gestión completa de usuarios y agentes
- Analytics globales de la plataforma
- Configuración del sistema
- Supervisión y auditoría

## 🤝 Contribuir

1. Haz un fork del proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Haz commit de tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Haz push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

---

Desarrollado con ❤️ por el equipo de PropFinder
