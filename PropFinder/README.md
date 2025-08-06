# 🏠 PropFinder - Plataforma Inmobiliaria Completa

PropFinder es una plataforma inmobiliaria moderna y completa construida con React, TypeScript, Node.js y PostgreSQL que conecta compradores/inquilinos con agentes inmobiliarios, ofreciendo herramientas avanzadas para la búsqueda, gestión y venta de propiedades.

## ✨ Características Principales

### 👥 Para Usuarios

- **🔍 Búsqueda Avanzada**: Filtros por precio, ubicación, habitaciones, tipo de propiedad y más
- **🗺️ Mapas Interactivos**: Visualización de propiedades en mapas con Mapbox GL
- **❤️ Favoritos**: Guardar y gestionar propiedades de interés
- **💬 Chat en Tiempo Real**: Comunicación directa con agentes inmobiliarios
- **📅 Programar Visitas**: Agendar visitas a propiedades
- **📱 Diseño Responsive**: Experiencia óptima en todos los dispositivos
- **🔔 Notificaciones**: Sistema de notificaciones en tiempo real
- **📧 Verificación de Email**: Proceso de verificación seguro

### 🏢 Para Agentes Inmobiliarios

- **�‍💼 Registro Diferenciado**: Registro específico como agente con validaciones adicionales
- **�📊 Dashboard Específico**: Panel de control exclusivo para agentes con estadísticas avanzadas
- **🏠 Gestión Completa de Propiedades**: Crear, editar y administrar propiedades con galerías de imágenes
- **� Analytics en Tiempo Real**: Métricas de vistas, contactos, visitas pendientes y comisiones estimadas
- **📅 Gestión de Visitas**: Sistema completo de programación y confirmación de visitas
- **💬 CRM Integrado**: Herramientas de gestión de clientes y seguimiento de leads
- **� Lista de Propiedades**: Vista detallada de todas las propiedades con acciones rápidas
- **🎯 Control de Acceso**: Funciones exclusivas protegidas por rol de usuario
- **📱 Interfaz Intuitiva**: Diseño optimizado para flujo de trabajo de agentes

### � Para Administradores

- **👨‍💼 Gestión de Usuarios**: Control completo de usuarios y agentes
- **📊 Analytics Avanzado**: Estadísticas detalladas de la plataforma
- **⚙️ Configuración**: Control de configuraciones del sistema
- **💳 Gestión de Pagos**: Control de transacciones y comisiones

## �🛠️ Stack Tecnológico

### Frontend

- **React 18** con TypeScript y JSX
- **Vite** para desarrollo ultra-rápido y build optimizado
- **TailwindCSS** para estilos utilitarios
- **React Router DOM v7** para navegación SPA
- **React Query** para gestión de estado del servidor
- **React Hook Form** con validación Zod
- **Framer Motion** para animaciones fluidas
- **Socket.io Client** para comunicación en tiempo real
- **Mapbox GL** para mapas interactivos
- **React Dropzone** para subida de archivos
- **Recharts** para gráficos y analytics

### Backend

- **Node.js** con Express.js
- **PostgreSQL** con extensiones avanzadas (pg_trgm, uuid-ossp)
- **Redis** para caché y sesiones
- **JWT** para autenticación segura
- **Socket.io** para WebSockets
- **Multer** para manejo de archivos
- **Sharp** para procesamiento de imágenes
- **Nodemailer** para envío de emails
- **Jest** y Supertest para testing
- **Winston** para logging avanzado
- **Scripts de verificación de base de datos**
- **Rutas de conversación y mensajes con autenticación**

### Pagos y Servicios

- **Stripe** para pagos con tarjeta
- **PayPal** para pagos alternativos
- **MercadoPago** para mercados latinoamericanos

### DevOps y Deployment

- **Docker** y Docker Compose
- **Nginx** como reverse proxy
- **PostgreSQL** y Redis en contenedores
- **Health checks** y monitoring
- **ESLint** y Prettier para calidad de código
- **Vite** con proxy de servidor configurado y optimizaciones de build
- **Scripts de PowerShell** para configuración y inicio mejorados

## 🚀 Configuración e Instalación

### Requisitos Previos

- **Node.js 18+** y npm
- **PostgreSQL 15+**
- **Redis 7+** (opcional, para caché)
- **Docker** (opcional, para contenedores)

### 🔧 Instalación Rápida

1. **Clonar el repositorio:**

   ```bash
   git clone https://github.com/tu-usuario/propfinder.git
   cd propfinder
   ```

2. **Ejecutar script de configuración (Windows):**

   ```powershell
   .\setup.ps1
   ```

   **O usar el script de inicio para diferentes modos:**

   ```powershell
   # Modo desarrollo completo
   .\start.ps1

   # Solo frontend
   .\start.ps1 -Mode frontend

   # Solo backend
   .\start.ps1 -Mode backend

   # Con Docker
   .\start.ps1 -Mode docker
   ```

3. **O instalar manualmente:**

   ```bash
   # Instalar todas las dependencias
   npm run install:all

   # Configurar variables de entorno
   cp .env.example .env
   cp backend/env.example backend/.env
   ```

4. **Configurar base de datos:**

   ```bash
   # Verificar y crear tablas necesarias
   cd backend
   npm run db:check

   # Verificar tablas de chat
   npm run check:chat

   # Verificar tablas de pagos
   npm run check:payments

   # Probar conexión a la base de datos
   npm run db:test

   # Verificar usuario específico
   npm run verify:user
   ```

5. **Iniciar todos los servicios:**
   ```bash
   npm run start:all
   ```

### 🌐 URLs de la Aplicación

- **Frontend**: http://localhost:3001 (puerto automático si 3000 está ocupado)
- **Backend API**: http://localhost:5000
- **WebSocket**: ws://localhost:5001
- **WebSocket Simple**: ws://localhost:5002 (para testing)
- **Health Check**: http://localhost:5000/api/health

### 🚪 Rutas Específicas por Rol

#### Para Usuarios
- **Dashboard**: http://localhost:3001/dashboard
- **Propiedades**: http://localhost:3001/properties
- **Favoritos**: http://localhost:3001/favorites
- **Chat**: http://localhost:3001/chat

#### Para Agentes
- **Dashboard de Agente**: http://localhost:3001/agent/dashboard
- **Crear Propiedad**: http://localhost:3001/properties/new
- **Gestión de Visitas**: http://localhost:3001/agent/visits
- **Gestión de Contactos**: http://localhost:3001/agent/contacts

## 📁 Estructura del Proyecto

```
PropFinder/
├── 📂 src/                    # Frontend React + TypeScript
│   ├── 📂 components/         # Componentes reutilizables
│   ├── 📂 pages/             # Páginas de la aplicación
│   ├── 📂 contexts/          # Context API para estado global
│   ├── 📂 hooks/             # Custom hooks
│   ├── 📂 services/          # APIs y servicios
│   └── 📂 types/             # Definiciones de TypeScript
├── 📂 backend/               # Backend Node.js + Express
│   ├── 📂 routes/            # Rutas de la API
│   ├── 📂 middleware/        # Middlewares personalizados
│   ├── 📂 services/          # Lógica de negocio
│   ├── 📂 config/            # Configuraciones
│   ├── 📂 database/          # Schema y migraciones
│   ├── 📂 scripts/           # Scripts de verificación (chat, pagos, usuarios)
│   └── 📂 tests/             # Tests del backend
├── 📂 websocket/             # Servidor WebSocket
│   ├── server.js             # Servidor principal con autenticación
│   └── server-simple.js     # Servidor simplificado para testing
├── 📂 nginx/                 # Configuración Nginx
├── 📂 database/              # Scripts de base de datos
├── 📂 scripts/               # Scripts de utilidades (health-check, etc.)
└── 📂 public/                # Archivos estáticos
```

## 🐳 Docker y Contenedores

### Desarrollo con Docker

```bash
# Iniciar todos los servicios
npm run docker:up

# Ver logs
docker-compose logs -f

# Detener servicios
npm run docker:down
```

### Producción

```bash
# Build para producción
docker-compose -f docker-compose.prod.yml up --build -d
```

## 🧪 Testing y Calidad

```bash
# Tests unitarios
npm test

# Tests con cobertura
npm run test:coverage

# Tests en modo UI
npm run test:ui

# Linting
npm run lint

# Type checking
npm run type-check
```

## 🆕 Nuevas Funcionalidades y Mejoras

### ✨ Mejoras Recientes

#### 🆕 Sistema de Roles y Agentes
- **👨‍💼 Separación Completa de Roles**: Sistema diferenciado entre usuarios y agentes inmobiliarios
- **🔐 Registro por Rol**: Proceso de registro específico para usuarios y agentes con validaciones únicas
- **📊 Dashboard de Agentes**: Panel exclusivo para agentes con métricas avanzadas y gestión de propiedades
- **🏠 Creación de Propiedades**: Formulario completo y profesional para que agentes publiquen propiedades
- **🧭 Navegación Inteligente**: Redirección automática al dashboard correcto según el rol del usuario
- **🛡️ Control de Acceso**: Protección de rutas y funcionalidades específicas por rol

#### 🔌 WebSocket y Conectividad
- **🚫 Eliminación de Bucles Infinitos**: Solución definitiva al problema de reconexiones por tokens expirados
- **🔑 Validación de Tokens**: Sistema mejorado de verificación antes de establecer conexiones WebSocket
- **📡 Manejo de Errores Específicos**: Códigos de error diferenciados para mejor debugging y UX
- **🔄 Reconexión Inteligente**: Sistema que evita intentos de reconexión con credenciales inválidas
- **📝 Logging Mejorado**: Mensajes de error más descriptivos para facilitar el desarrollo

#### API y Backend
- **🔄 Refactorización de recuperación de perfiles**: Optimización del sistema de perfiles de usuario
- **🏠 Obtención pública de propiedades**: Nueva funcionalidad para acceder a propiedades sin autenticación
- **💳 Métodos de pago unificados**: Integración mejorada de múltiples proveedores de pago
- **💬 Conversaciones mejoradas**: Respuestas con estado de éxito opcional para mejor UX

#### WebSocket y Chat
- **🔌 Manejo mejorado de Redis**: Optimización de conexiones y rendimiento
- **🔐 Autenticación local**: Sistema de autenticación local para desarrollo
- **📡 Servidor WebSocket simplificado**: Versión ligera para testing y debugging

#### Scripts y Herramientas
- **🛠️ Scripts de verificación de BD**: Automatización para verificar tablas de chat y pagos
- **👥 Script de verificación de usuarios**: Herramienta para testing de usuarios
- **⚡ Scripts PowerShell mejorados**: Mejor experiencia de configuración e inicio

#### Configuración y Build
- **🎯 Proxy de servidor Vite**: Configuración optimizada para desarrollo
- **🏗️ Optimizaciones de build**: Mejoras en el proceso de compilación
- **🔧 Aliasing mejorado**: Mejor resolución de rutas en el proyecto

## 📊 Funcionalidades Avanzadas

### 🔐 Autenticación y Seguridad

- Registro y login con JWT
- Verificación de email obligatoria
- Reset de contraseñas seguro
- Rate limiting y protección DDOS
- Validación de entrada con Joi
- Sanitización de datos
- Headers de seguridad con Helmet
- Autenticación WebSocket con JWT
- Scripts de verificación de usuarios para testing

### 💬 Sistema de Chat

- Chat en tiempo real con WebSockets
- Notificaciones push
- Historial de mensajes
- Estados de lectura
- Comunicación por propiedades
- Servidor WebSocket simplificado para testing
- Manejo mejorado de conexiones Redis
- Autenticación local para desarrollo

### 💳 Sistema de Pagos

- Múltiples proveedores (Stripe, PayPal, MercadoPago)
- Webhooks para confirmaciones
- Gestión de reembolsos
- Historial de transacciones
- Métodos de pago unificados
- Recuperación de proveedores de pago
- Scripts de verificación de tablas de pagos

### 📊 Analytics y Métricas

- Dashboard administrativo
- Métricas de uso en tiempo real
- Reportes de propiedades
- Estadísticas de usuarios
- Recuperación de perfiles refactorizada
- Obtención pública de propiedades
- Respuestas de conversaciones mejoradas con estado de éxito

## 🔧 Variables de Entorno

### Frontend (.env)

```env
VITE_API_URL=http://localhost:5000/api
VITE_WEBSOCKET_URL=ws://localhost:5001
VITE_WEBSOCKET_SIMPLE_URL=ws://localhost:5002
VITE_MAPBOX_TOKEN=your_mapbox_token
VITE_STRIPE_PUBLIC_KEY=pk_test_...
VITE_PAYPAL_CLIENT_ID=your_paypal_client_id
```

### Backend (backend/.env)

```env
# Base de datos
DATABASE_URL=postgresql://user:pass@localhost:5432/propfinder_db

# Autenticación
JWT_SECRET=your-jwt-secret
JWT_EXPIRES_IN=30d

# Pagos
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_secret
MERCADOPAGO_ACCESS_TOKEN=your_mp_token

# Email
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-email-password

# Redis (opcional)
REDIS_URL=redis://localhost:6379

# WebSocket
WEBSOCKET_PORT=5001
WEBSOCKET_SIMPLE_PORT=5002

# Ver backend/env.example para lista completa
```

## 🚀 Deployment

### Scripts Disponibles

#### Desarrollo
```bash
# Instalar todas las dependencias
npm run install:all

# Iniciar modo desarrollo completo
npm run start:all

# Solo frontend
npm run dev

# Solo backend
npm run server

# Solo WebSocket
npm run websocket

# WebSocket simple para testing
npm run websocket:simple
```

#### Scripts de Base de Datos
```bash
# Verificar conexión
npm run db:test

# Verificar tablas de chat
npm run check:chat

# Verificar tablas de pagos
npm run check:payments

# Verificar usuario específico
npm run verify:user <email>
```

#### Scripts PowerShell (Windows)
```powershell
# Configuración inicial
.\setup.ps1

# Inicio con opciones
.\start.ps1 -Mode [frontend|backend|websocket|docker|all]

# Health check
.\scripts\health-check.ps1
```

### Preparación para Producción

1. Configurar variables de entorno de producción
2. Generar nuevas claves JWT y secrets
3. Configurar dominio y SSL
4. Setup de base de datos de producción
5. Configurar servicios de email

### Providers Recomendados

- **Frontend**: Vercel, Netlify
- **Backend**: Railway, Heroku, DigitalOcean
- **Base de datos**: Supabase, Neon, AWS RDS
- **Files**: Cloudinary, AWS S3

## 📚 Documentación Adicional

- [📖 Documentación del Backend](backend/README.md)
- [🎨 Guía de Componentes](docs/components.md)
- [🔐 Guía de Seguridad](docs/security.md)
- [🐳 Guía de Docker](docs/docker.md)

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

## 🆘 Soporte

Si tienes problemas:

1. Revisa la [documentación](docs/)
2. Busca en [Issues](https://github.com/tu-usuario/propfinder/issues)
3. Crea un nuevo issue con detalles del problema

## 📧 Contacto

Para más información:

- 📧 Email: support@propfinder.com
- 🐙 GitHub: [@tu-usuario](https://github.com/tu-usuario)
- 🌐 Website: [propfinder.com](https://propfinder.com)

---

⭐ **¡Dale una estrella al proyecto si te parece útil!**
