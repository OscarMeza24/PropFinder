# 🏠 PropFinder - Plataforma Inmobiliaria Moderna

[![Licencia: MIT](https://img.shields.io/badge/Licencia-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-4.9.5-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.2.0-61DAFB.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-4.0.0-646CFF.svg)](https://vitejs.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-2.0.0-3ECF8E.svg)](https://supabase.com/)

PropFinder es una plataforma inmobiliaria de vanguardia que conecta a compradores, vendedores y agentes en una experiencia digital fluida. Desarrollada con tecnologías web modernas y patrones arquitectónicos robustos, PropFinder ofrece una solución integral para la búsqueda, gestión y transacciones de propiedades.

## ✨ Características Principales

### 🏡 Gestión de Propiedades
- Listados avanzados con imágenes de alta calidad y recorridos virtuales
- Búsqueda interactiva en mapa con geolocalización
- Páginas detalladas con recorridos 3D e información del vecindario
- Búsquedas guardadas y propiedades favoritas

### 🤝 Experiencia de Usuario
- Control de acceso basado en roles (Compradores, Vendedores, Agentes, Administradores)
- Chat en tiempo real entre usuarios y agentes inmobiliarios
- Agendamiento de visitas desde la aplicación
- Recomendaciones personalizadas de propiedades

### 💳 Transacciones y Pagos
- Procesamiento seguro de pagos a través de múltiples pasarelas
- Planes de suscripción para agentes inmobiliarios
- Facturación e historial de pagos
- Gestión de comisiones

### 📱 Optimizado para Móviles
- Diseño completamente adaptable a todos los tamaños de pantalla
- Soporte para Aplicación Web Progresiva (PWA)
- Interfaz optimizada para pantallas táctiles
- Funcionalidad sin conexión para navegación de propiedades

## 🛠 Tecnologías Utilizadas

### Frontend
- **Framework**: React 18 con TypeScript
- **Herramienta de Construcción**: Vite 4.x
- **Gestión de Estado**: React Query + Context API
- **Estilos**: Tailwind CSS 3.x con temas personalizados
- **Componentes UI**: Headless UI + Radix UI
- **Animaciones**: Framer Motion
- **Iconos**: Lucide React Icons
- **Manejo de Formularios**: React Hook Form con validación Zod

### Backend
- **Base de Datos**: Supabase (PostgreSQL 15)
- **Autenticación**: Supabase Auth con JWT
- **Tiempo Real**: Supabase Realtime
- **Almacenamiento**: Supabase Storage

### Integraciones
- **Mapas**: Leaflet + OpenStreetMap
- **Pagos**: Stripe, PayPal, MercadoPago
- **Analíticas**: PostHog
- **Correo Electrónico**: Resend
- **Monitoreo**: Sentry

## 🚀 Comenzando

### Requisitos Previos

- Node.js 18.0.0 o superior
- npm 9.0.0 o superior
- Cuenta en Supabase (disponible en versión gratuita)
- Claves API para proveedores de pago (modo prueba)

### Instalación

1. **Clonar el repositorio**
   ```bash
   git clone https://github.com/tuusuario/propfinder.git
   cd propfinder
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno**
   ```bash
   cp .env.example .env
   ```
   Actualiza el archivo `.env` con tu configuración:
   ```env
   # Supabase
   VITE_SUPABASE_URL=tu_url_de_proyecto_supabase
   VITE_SUPABASE_ANON_KEY=tu_clave_anonima_supabase
   VITE_SUPABASE_SERVICE_ROLE_KEY=tu_clave_de_servicio_supabase

   # Pasarelas de Pago
   VITE_STRIPE_PUBLIC_KEY=tu_clave_publica_stripe
   VITE_PAYPAL_CLIENT_ID=tu_id_de_cliente_paypal
   VITE_MERCADOPAGO_PUBLIC_KEY=tu_clave_publica_mercadopago

   # Mapas
   VITE_MAPBOX_API_KEY=tu_clave_api_mapbox

   # Analíticas
   VITE_POSTHOG_KEY=tu_clave_posthog
   VITE_POSTHOG_HOST=tu_host_posthog
   ```

4. **Configurar la base de datos**
   - Crea un nuevo proyecto en Supabase
   - Ejecuta las migraciones SQL desde `supabase/migrations/`
   - Configura las políticas de Seguridad a Nivel de Fila (RLS)

5. **Iniciar el servidor de desarrollo**
   ```bash
   npm run dev
   ```
   La aplicación estará disponible en `http://localhost:5173`

## 🏗 Estructura del Proyecto

```
propfinder/
├── public/                 # Archivos estáticos
├── src/
│   ├── assets/            # Imágenes, fuentes y recursos estáticos
│   ├── components/        # Componentes UI reutilizables
│   │   ├── common/       # Componentes comunes (botones, modales, etc.)
│   │   ├── layout/       # Componentes de diseño (encabezado, pie de página, etc.)
│   │   └── properties/   # Componentes relacionados con propiedades
│   ├── config/           # Configuración de la aplicación
│   ├── contexts/         # Contextos de React
│   ├── hooks/            # Hooks personalizados de React
│   ├── lib/              # Funciones y ayudantes de utilidad
│   ├── pages/            # Componentes de páginas
│   ├── services/         # Servicios de API y lógica de negocio
│   ├── store/            # Gestión del estado
│   ├── styles/           # Estilos globales y configuración de Tailwind
│   ├── types/            # Definiciones de tipos TypeScript
│   └── utils/            # Funciones de utilidad
├── .env.example          # Ejemplo de variables de entorno
├── .eslintrc.json        # Configuración de ESLint
├── .prettierrc          # Configuración de Prettier
├── index.html            # Archivo HTML principal
├── package.json          # Dependencias del proyecto
├── postcss.config.js     # Configuración de PostCSS
├── tailwind.config.js    # Configuración de Tailwind CSS
└── tsconfig.json        # Configuración de TypeScript
```

## 🎨 Sistema de Diseño

PropFinder utiliza un sistema de diseño consistente construido con Tailwind CSS. La paleta de colores, tipografía y estilos de componentes están definidos en el archivo `tailwind.config.js`.

### Colores
- Primario: `#2563eb` (Azul 600)
- Secundario: `#7c3aed` (Violeta 600)
- Éxito: `#059669` (Esmeralda 600)
- Advertencia: `#d97706` (Ámbar 600)
- Peligro: `#dc2626` (Rojo 600)
- Claro: `#f8fafc` (Pizarra 50)
- Oscuro: `#0f172a` (Pizarra 900)

### Tipografía
- **Títulos**: Inter (SemiNegrita 600)
- **Cuerpo**: Inter (Normal 400)
- **Monospace**: JetBrains Mono

## 🧪 Pruebas

### Ejecutando Pruebas
```bash
# Pruebas unitarias
npm test

# Pruebas de integración
npm run test:integration

# Pruebas de extremo a extremo
npm run test:e2e

# Cobertura de pruebas
npm run test:coverage
```

### Estrategia de Pruebas
- **Pruebas Unitarias**: Prueban funciones y componentes individuales de forma aislada
- **Pruebas de Integración**: Prueban la interacción entre componentes
- **Pruebas E2E**: Prueban flujos completos de usuario
- **Pruebas de Regresión Visual**: Aseguran la consistencia de la interfaz

## 🚀 Despliegue

### Construcción para Producción
```bash
npm run build
```

Los archivos generados se guardarán en el directorio `dist/`.

### Opciones de Despliegue

#### Vercel (Recomendado)
1. Conecta tu repositorio de GitHub a Vercel
2. Configura las variables de entorno en el panel de Vercel
3. ¡Despliega!

#### Netlify
1. Conecta tu repositorio de GitHub a Netlify
2. Configura las variables de entorno
3. Establece el comando de construcción a `npm run build`
4. Establece el directorio de publicación a `dist`

## 📚 Documentación

- [Documentación de la API](docs/API.md)
- [Esquema de la Base de Datos](docs/DATABASE.md)
- [Flujo de Autenticación](docs/AUTHENTICATION.md)
- [Integración de Pagos](docs/PAYMENTS.md)
- [Guía de Despliegue](docs/DEPLOYMENT.md)

## 🤝 Contribuciones

¡Las contribuciones son bienvenidas! Por favor, lee nuestra [Guía de Contribución](CONTRIBUTING.md) para conocer nuestro código de conducta y el proceso para enviar pull requests.

## 📄 Licencia

Este proyecto está licenciado bajo la Licencia MIT - consulta el archivo [LICENSE](LICENSE) para más detalles.

## 🙏 Agradecimientos

- [Supabase](https://supabase.com/) por el increíble backend de código abierto
- [Tailwind CSS](https://tailwindcss.com/) por el framework CSS utility-first
- [Vite](https://vitejs.dev/) por las herramientas de construcción rápidas
- A toda la comunidad de código abierto por las increíbles bibliotecas y herramientas

---

Hecho con ❤️ por el Equipo de PropFinder

## Despliegue en la Nube
La aplicación está lista para desplegarse en:
- **Vercel** (Recommended for frontend)
- **Netlify**
- **AWS S3 + CloudFront**
- **Google Cloud Storage**

## 📊 Analytics & Monitoring

- **Property view tracking**
- **User behavior analytics**
- **Payment transaction monitoring**
- **Performance metrics**
- **Error tracking and logging**

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- 📧 Email: support@propfinder.com
- 📚 Documentation: [PropFinder Docs](https://docs.propfinder.com)
- 🐛 Issues: [GitHub Issues](https://github.com/propfinder/issues)

## 🏆 Credits

Built with ❤️ by the PropFinder team using modern web technologies and best practices in software architecture.