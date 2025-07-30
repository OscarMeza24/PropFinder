# Guías de Contribución

¡Gracias por tu interés en contribuir a PropFinder! Este documento proporciona las guías para contribuir al proyecto.

## Tabla de Contenidos

- [Cómo Contribuir](#cómo-contribuir)
- [Configuración del Entorno de Desarrollo](#configuración-del-entorno-de-desarrollo)
- [Flujo de Trabajo](#flujo-de-trabajo)
- [Estándares de Código](#estándares-de-código)
- [Pruebas](#pruebas)
- [Documentación](#documentación)
- [Reportando Bugs](#reportando-bugs)
- [Solicitando Características](#solicitando-características)

## Cómo Contribuir

### Tipos de Contribuciones

Aceptamos varios tipos de contribuciones:

- 🐛 **Reportes de Bugs**: Ayúdanos a identificar y arreglar problemas
- 💡 **Solicitudes de Características**: Sugiere nuevas funcionalidades
- 📝 **Documentación**: Mejora la documentación existente
- 🔧 **Mejoras de Código**: Optimiza el código existente
- 🧪 **Pruebas**: Agrega o mejora las pruebas

### Antes de Contribuir

1. **Revisa los Issues Existentes**: Busca si tu problema o característica ya ha sido reportada
2. **Lee la Documentación**: Familiarízate con el proyecto leyendo el README y la documentación
3. **Únete a la Comunidad**: Participa en las discusiones existentes

## Configuración del Entorno de Desarrollo

### Prerrequisitos

- Node.js 18+ y npm
- Git
- Un editor de código (VS Code recomendado)

### Pasos de Configuración

1. **Fork el Repositorio**
   ```bash
   # Ve a GitHub y haz fork del repositorio
   # Luego clona tu fork
   git clone https://github.com/tu-usuario/propfinder.git
   cd propfinder
   ```

2. **Instala Dependencias**
   ```bash
   npm install
   ```

3. **Configura Variables de Entorno**
   ```bash
   cp .env.example .env
   # Edita .env con tus credenciales
   ```

4. **Verifica la Instalación**
   ```bash
   npm run dev
   # Visita http://localhost:5173
   ```

## Flujo de Trabajo

### 1. Crear una Rama

```bash
# Asegúrate de estar en la rama main y actualizada
git checkout main
git pull origin main

# Crea una nueva rama para tu trabajo
git checkout -b feature/nombre-de-tu-caracteristica
# o
git checkout -b fix/nombre-del-bug
```

### 2. Hacer Cambios

- Escribe tu código siguiendo los estándares del proyecto
- Agrega pruebas para nuevas funcionalidades
- Actualiza la documentación según sea necesario

### 3. Commit y Push

```bash
# Agrega tus cambios
git add .

# Haz commit con un mensaje descriptivo
git commit -m "feat: agregar nueva funcionalidad de búsqueda"

# Sube tu rama
git push origin feature/nombre-de-tu-caracteristica
```

### 4. Crear Pull Request

1. Ve a GitHub y crea un Pull Request desde tu rama
2. Completa la plantilla de PR
3. Asigna revisores si es necesario
4. Espera la revisión y feedback

## Estándares de Código

### Convenciones de Nomenclatura

- **Archivos**: `camelCase` para componentes, `kebab-case` para archivos de configuración
- **Variables**: `camelCase`
- **Constantes**: `UPPER_SNAKE_CASE`
- **Componentes**: `PascalCase`
- **Funciones**: `camelCase`

### Estructura de Archivos

```
src/
├── components/          # Componentes reutilizables
├── pages/              # Páginas de la aplicación
├── hooks/              # Custom hooks
├── services/           # Servicios y lógica de negocio
├── types/              # Definiciones de TypeScript
├── utils/              # Utilidades y helpers
└── config/             # Configuraciones
```

### Formato de Código

Usamos Prettier y ESLint para mantener la consistencia:

```bash
# Formatear código
npm run format

# Verificar formato
npm run format:check

# Lint
npm run lint

# Lint con auto-fix
npm run lint:fix
```

### Mensajes de Commit

Seguimos [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: agregar nueva funcionalidad
fix: corregir bug
docs: actualizar documentación
style: cambios de formato
refactor: refactorizar código
test: agregar o corregir pruebas
chore: cambios en build o herramientas
```

## Pruebas

### Ejecutar Pruebas

```bash
# Ejecutar todas las pruebas
npm test

# Ejecutar pruebas en modo watch
npm run test:watch

# Ejecutar pruebas con cobertura
npm run test:coverage
```

### Escribir Pruebas

- Agrega pruebas para nuevas funcionalidades
- Mantén una cobertura de código alta (>80%)
- Usa nombres descriptivos para las pruebas
- Agrupa pruebas relacionadas en describe blocks

### Ejemplo de Prueba

```typescript
import { render, screen } from '@testing-library/react';
import { PropertyCard } from '../PropertyCard';

describe('PropertyCard', () => {
  it('should render property information correctly', () => {
    const property = {
      id: '1',
      title: 'Casa en venta',
      price: 250000,
      location: 'Madrid'
    };

    render(<PropertyCard property={property} />);

    expect(screen.getByText('Casa en venta')).toBeInTheDocument();
    expect(screen.getByText('€250,000')).toBeInTheDocument();
    expect(screen.getByText('Madrid')).toBeInTheDocument();
  });
});
```

## Documentación

### Actualizar Documentación

- Mantén el README actualizado
- Documenta nuevas características
- Agrega ejemplos de uso
- Actualiza la documentación de la API

### Estilo de Documentación

- Usa un tono claro y directo
- Incluye ejemplos prácticos
- Mantén la documentación actualizada
- Usa Markdown apropiadamente

## Reportando Bugs

### Antes de Reportar

1. Verifica que el bug no haya sido reportado ya
2. Intenta reproducir el bug en la última versión
3. Revisa la documentación y issues existentes

### Información a Incluir

- Descripción clara del problema
- Pasos para reproducir
- Comportamiento esperado vs actual
- Información del entorno (OS, navegador, versión)
- Capturas de pantalla si es aplicable
- Logs de error si están disponibles

## Solicitando Características

### Antes de Solicitar

1. Verifica que la característica no haya sido solicitada
2. Considera si la característica se alinea con los objetivos del proyecto
3. Piensa en la implementación y el impacto

### Información a Incluir

- Descripción clara de la característica
- Casos de uso y beneficios
- Alternativas consideradas
- Impacto en el proyecto
- Propuesta de implementación (opcional)

## Proceso de Revisión

### Criterios de Aceptación

- El código sigue los estándares del proyecto
- Las pruebas pasan y la cobertura es adecuada
- La documentación está actualizada
- El código es mantenible y legible
- No introduce regresiones

### Feedback y Iteración

- Los revisores pueden solicitar cambios
- Responde constructivamente al feedback
- Haz las correcciones necesarias
- Mantén la comunicación abierta

## Reconocimiento

Todas las contribuciones son valiosas y serán reconocidas en:

- El archivo CHANGELOG
- La sección de contribuidores del README
- Los releases de GitHub

## Contacto

Si tienes preguntas sobre cómo contribuir:

- Abre un issue en GitHub
- Únete a nuestras discusiones
- Revisa la documentación existente

¡Gracias por contribuir a PropFinder! 🎉 