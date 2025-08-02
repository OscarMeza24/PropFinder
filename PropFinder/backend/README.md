# 🚀 PropFinder Backend API

Backend API para la plataforma inmobiliaria PropFinder, construido con Node.js, Express y PostgreSQL.

## 📋 Características

- **Autenticación JWT** con manejo de sesiones seguras
- **API RESTful** siguiendo las mejores prácticas
- **Base de datos PostgreSQL** para almacenamiento persistente
- **Redis** para caché y manejo de sesiones
- **Validación de datos** con express-validator y Joi
- **Seguridad mejorada** con Helmet, rate limiting y CORS
- **Subida de archivos** con Multer y procesamiento de imágenes con Sharp
- **Sistema de pagos** integrado con Stripe y PayPal
- **Sistema de notificaciones** por correo electrónico con Nodemailer
- **Logging estructurado** con Winston
- **Pruebas unitarias y de integración** con Jest y Supertest

## 🛠️ Stack Tecnológico

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Base de datos**: PostgreSQL
- **Caché**: Redis
- **Autenticación**: JWT (JSON Web Tokens)
- **Validación**: express-validator, Joi
- **Seguridad**: Helmet, express-rate-limit, express-slow-down
- **Pagos**: Stripe, PayPal REST SDK
- **Email**: Nodemailer
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

# PayPal
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
├── database/         # Scripts y migraciones de la base de datos
├── middleware/       # Middlewares personalizados
├── models/           # Modelos de la base de datos
├── routes/           # Rutas de la API
│   ├── auth.js       # Rutas de autenticación
│   ├── properties.js # Rutas de propiedades
│   ├── users.js      # Rutas de usuarios
│   ├── payments.js   # Rutas de pagos
│   └── ...
├── services/         # Lógica de negocio
├── tests/            # Pruebas
├── utils/            # Utilidades
├── .env.example      # Plantilla de variables de entorno
├── .eslintrc.js      # Configuración de ESLint
├── jest.config.js    # Configuración de Jest
└── server.js         # Punto de entrada de la aplicación
```

## 📡 Endpoints de la API

### Autenticación
- `POST /api/auth/register` - Registrar nuevo usuario
- `POST /api/auth/login` - Iniciar sesión
- `GET /api/auth/me` - Obtener perfil del usuario actual
- `POST /api/auth/refresh-token` - Refrescar token de acceso
- `POST /api/auth/forgot-password` - Solicitar recuperación de contraseña
- `POST /api/auth/reset-password` - Restablecer contraseña

### Propiedades
- `GET /api/properties` - Obtener listado de propiedades
- `GET /api/properties/:id` - Obtener propiedad por ID
- `POST /api/properties` - Crear nueva propiedad (requiere autenticación)
- `PUT /api/properties/:id` - Actualizar propiedad (propietario/admin)
- `DELETE /api/properties/:id` - Eliminar propiedad (propietario/admin)

### Usuarios
- `GET /api/users` - Obtener lista de usuarios (admin)
- `GET /api/users/:id` - Obtener perfil de usuario
- `PUT /api/users/:id` - Actualizar perfil de usuario
- `DELETE /api/users/:id` - Eliminar usuario (admin)

### Pagos
- `POST /api/payments/create-payment-intent` - Crear intención de pago (Stripe)
- `POST /api/payments/confirm-payment` - Confirmar pago (Stripe)
- `POST /api/payments/webhook` - Webhook para notificaciones de pago

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
- **Protección contra ataques CSRF**
- **Rate limiting** para prevenir fuerza bruta
- **CORS** configurado para dominios específicos
- **Sanitización de entradas** para prevenir inyecciones
- **Helmet** para cabeceras de seguridad HTTP
- **Validación estricta** de todos los datos de entrada

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
