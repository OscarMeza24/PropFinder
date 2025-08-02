# 🏠 PropFinder - Plataforma Inmobiliaria Completa

PropFinder es una plataforma inmobiliaria moderna construida con React, TypeScript y Node.js que conecta compradores/inquilinos con agentes inmobiliarios, ofreciendo herramientas avanzadas para la búsqueda y gestión de propiedades.

## 🚀 Características Principales

### 👥 Para Usuarios
- **🔍 Búsqueda Avanzada**: Filtros por precio, ubicación, habitaciones y tipo de propiedad
- **�️ Mapas Interactivos**: Visualización de propiedades en mapas con React Map GL
- **❤️ Favoritos**: Guardar y gestionar propiedades de interés
- **� Diseño Responsive**: Experiencia óptima en todos los dispositivos
- **⚡ Carga Rápida**: Optimizado con Vite para un rendimiento excepcional

### 🏢 Para Agentes Inmobiliarios
- **📊 Dashboard**: Panel de control con propiedades gestionadas
- **🏠 Gestión de Propiedades**: Publicar y administrar propiedades con imágenes
- **� Calendario de Visitas**: Programación y gestión de visitas
- **� Estadísticas**: Seguimiento de visualizaciones e interacciones

## 🛠️ Stack Tecnológico

### Frontend
- **React 18** con TypeScript
- **Vite** para desarrollo y build
- **TailwindCSS** para estilos
- **React Router** para navegación
- **React Query** para gestión de datos
- **React Hook Form** para formularios
- **Framer Motion** para animaciones
- **Socket.io Client** para comunicación en tiempo real

### Backend
- **Node.js** con Express
- **PostgreSQL** como base de datos
- **JWT** para autenticación
- **Socket.io** para WebSockets
- **Jest** para testing

## 🚀 Empezando

### Requisitos Previos
- Node.js 16+ y npm
- PostgreSQL 13+
- Docker (opcional, para desarrollo con contenedores)

### Instalación

1. Clonar el repositorio:
   ```bash
   git clone https://github.com/tu-usuario/propfinder.git
   cd propfinder
   ```

2. Instalar dependencias del frontend y backend:
   ```bash
   # Instalar dependencias del frontend
   cd PropFinder
   npm install
   
   # Instalar dependencias del backend
   cd ../backend
   npm install
   ```

3. Configuración del entorno:
   - Copiar `.env.example` a `.env` en el directorio raíz y en el directorio backend
   - Configurar las variables de entorno necesarias (base de datos, claves API, etc.)

4. Iniciar la aplicación en modo desarrollo:
   ```bash
   # En el directorio raíz
   npm run dev
   ```
   Esto iniciará tanto el frontend (en http://localhost:5173) como el backend (en http://localhost:3000)

## 🐳 Docker Compose

Para desarrollo con Docker:

```bash
# Construir y levantar los contenedores
docker-compose up --build

# Detener los contenedores
docker-compose down
```

## 🧪 Testing

Ejecutar los tests con:

```bash
# Tests unitarios
npm test

# Tests con cobertura
npm run test:coverage

# Tests en modo UI
npm run test:ui
```

## 🌐 Despliegue

### Producción con Docker

```bash
# Construir imágenes
docker-compose -f docker-compose.prod.yml build

# Iniciar servicios
docker-compose -f docker-compose.prod.yml up -d
```

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor, lee nuestras [guías de contribución](CONTRIBUTING.md) para más detalles.

## 📧 Contacto

Para más información, por favor contacta a [tu-email@ejemplo.com](mailto:tu-email@ejemplo.com)