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

- **📊 Dashboard Completo**: Panel de control con estadísticas y métricas
- **🏠 Gestión de Propiedades**: Publicar, editar y administrar propiedades con galerías de imágenes
- **📅 Calendario de Visitas**: Programación y gestión de visitas con clientes
- **💬 Chat Integrado**: Comunicación directa con clientes potenciales
- **📈 Analytics**: Seguimiento de visualizaciones, contactos e interacciones
- **💰 Gestión de Pagos**: Integración con Stripe, PayPal y MercadoPago

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
   # Probar conexión a la base de datos
   cd backend
   npm run db:test
   ```

5. **Iniciar todos los servicios:**
   ```bash
   npm run start:all
   ```

### 🌐 URLs de la Aplicación

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **WebSocket**: ws://localhost:5001
- **Health Check**: http://localhost:5000/api/health

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
│   └── 📂 tests/             # Tests del backend
├── 📂 websocket/             # Servidor WebSocket
├── 📂 nginx/                 # Configuración Nginx
├── 📂 database/              # Scripts de base de datos
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

## 📊 Funcionalidades Avanzadas

### 🔐 Autenticación y Seguridad

- Registro y login con JWT
- Verificación de email obligatoria
- Reset de contraseñas seguro
- Rate limiting y protección DDOS
- Validación de entrada con Joi
- Sanitización de datos
- Headers de seguridad con Helmet

### 💬 Sistema de Chat

- Chat en tiempo real con WebSockets
- Notificaciones push
- Historial de mensajes
- Estados de lectura
- Comunicación por propiedades

### 💳 Sistema de Pagos

- Múltiples proveedores (Stripe, PayPal, MercadoPago)
- Webhooks para confirmaciones
- Gestión de reembolsos
- Historial de transacciones

### 📊 Analytics y Métricas

- Dashboard administrativo
- Métricas de uso en tiempo real
- Reportes de propiedades
- Estadísticas de usuarios

## 🔧 Variables de Entorno

### Frontend (.env)

```env
VITE_API_URL=http://localhost:5000/api
VITE_WEBSOCKET_URL=ws://localhost:5001
VITE_MAPBOX_TOKEN=your_mapbox_token
```

### Backend (backend/.env)

```env
DATABASE_URL=postgresql://user:pass@localhost:5432/propfinder_db
JWT_SECRET=your-jwt-secret
STRIPE_SECRET_KEY=sk_test_...
EMAIL_USER=your-email@gmail.com
# Ver backend/env.example para lista completa
```

## 🚀 Deployment

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
