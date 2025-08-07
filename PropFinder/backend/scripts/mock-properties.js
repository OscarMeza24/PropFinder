// Mock data con coordenadas reales de Ecuador para probar el mapa
// Este script simula propiedades con coordenadas para poder probar la funcionalidad del mapa

const mockProperties = [
  {
    id: 1,
    title: 'Departamento Moderno en Manta',
    description: 'Hermoso departamento con vista al mar en el corazón de Manta',
    price: 85000,
    address: 'Malecón de Manta',
    city: 'Manta',
    state: 'Manabí',
    zip_code: '130213',
    latitude: -0.9677,
    longitude: -80.7090,
    bedrooms: 2,
    bathrooms: 2,
    square_feet: 85,
    property_type: 'apartment',
    images: [
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800'
    ],
    features: ['Vista al mar', 'Balcón', 'Cocina equipada', 'Seguridad 24/7'],
    agent_name: 'María González',
    agent_email: 'maria@propfinder.com',
    agent_phone: '+593 99 123 4567',
    status: 'active',
    created_at: new Date().toISOString()
  },
  {
    id: 2,
    title: 'Casa Familiar en Quito Norte',
    description: 'Amplia casa familiar en zona residencial exclusiva',
    price: 180000,
    address: 'La Mariscal',
    city: 'Quito',
    state: 'Pichincha',
    zip_code: '170135',
    latitude: -0.1807,
    longitude: -78.4678,
    bedrooms: 4,
    bathrooms: 3,
    square_feet: 220,
    property_type: 'house',
    images: [
      'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=800',
      'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800'
    ],
    features: ['Jardín', 'Garaje doble', 'Estudio', 'Chimenea'],
    agent_name: 'Carlos Rodríguez',
    agent_email: 'carlos@propfinder.com',
    agent_phone: '+593 99 765 4321',
    status: 'active',
    created_at: new Date().toISOString()
  },
  {
    id: 3,
    title: 'Oficina Comercial en Guayaquil',
    description: 'Oficina moderna en el centro financiero de Guayaquil',
    price: 95000,
    address: 'Malecón 2000',
    city: 'Guayaquil',
    state: 'Guayas',
    zip_code: '090313',
    latitude: -2.1894,
    longitude: -79.8890,
    bedrooms: 0,
    bathrooms: 2,
    square_feet: 120,
    property_type: 'commercial',
    images: [
      'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800',
      'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800'
    ],
    features: ['Aire acondicionado', 'Internet fibra óptica', 'Recepción', 'Estacionamiento'],
    agent_name: 'Ana Martínez',
    agent_email: 'ana@propfinder.com',
    agent_phone: '+593 99 555 1234',
    status: 'active',
    created_at: new Date().toISOString()
  },
  {
    id: 4,
    title: 'Penthouse en Cuenca',
    description: 'Lujoso penthouse con vista panorámica de la ciudad colonial',
    price: 145000,
    address: 'Centro Histórico',
    city: 'Cuenca',
    state: 'Azuay',
    zip_code: '010150',
    latitude: -2.9001,
    longitude: -79.0059,
    bedrooms: 3,
    bathrooms: 3,
    square_feet: 180,
    property_type: 'apartment',
    images: [
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800'
    ],
    features: ['Terraza', 'Vista panorámica', 'Jacuzzi', 'Ascensor privado'],
    agent_name: 'Luis Pérez',
    agent_email: 'luis@propfinder.com',
    agent_phone: '+593 99 888 9999',
    status: 'active',
    created_at: new Date().toISOString()
  }
];

// Función para generar JSON que se puede usar en el frontend
const generateMockData = () => {
  console.log('🏠 Generando datos de prueba para el mapa...\n');
  
  console.log('📊 Propiedades disponibles:');
  mockProperties.forEach((property, index) => {
    console.log(`\n${index + 1}. ${property.title}`);
    console.log(`   📍 Ubicación: ${property.city}, ${property.state}`);
    console.log(`   🗺️  Coordenadas: ${property.latitude}, ${property.longitude}`);
    console.log(`   💰 Precio: $${property.price.toLocaleString()}`);
    console.log(`   🏠 Tipo: ${property.property_type}`);
  });

  console.log('\n🗺️ Resumen para el mapa:');
  const coordinates = mockProperties.map(p => ({
    id: p.id,
    title: p.title,
    city: p.city,
    lat: p.latitude,
    lng: p.longitude,
    price: p.price
  }));
  
  console.log(JSON.stringify(coordinates, null, 2));
  
  console.log('\n💡 Instrucciones:');
  console.log('1. Estas coordenadas están listas para usar en el mapa');
  console.log('2. Puedes copiar este JSON y usarlo en el frontend para probar');
  console.log('3. El mapa debería mostrar 4 marcadores en Ecuador:');
  console.log('   - Manta (costa)');
  console.log('   - Quito (sierra norte)');
  console.log('   - Guayaquil (costa sur)');
  console.log('   - Cuenca (sierra sur)');
  
  return mockProperties;
};

// Función para crear un endpoint temporal de API
const createMockAPI = () => {
  const express = require('express');
  const app = express();
  const port = 3001;
  
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', '*');
    next();
  });
  
  app.get('/api/properties', (req, res) => {
    res.json({
      properties: mockProperties,
      pagination: {
        page: 1,
        limit: 10,
        total: mockProperties.length,
        totalPages: 1
      }
    });
  });
  
  app.listen(port, () => {
    console.log(`\n🚀 API de prueba iniciada en http://localhost:${port}`);
    console.log(`📡 Endpoint: http://localhost:${port}/api/properties`);
    console.log('\n💡 Puedes usar esta URL en tu frontend para probar el mapa');
    console.log('   Cambia la URL del API temporalmente a este endpoint');
  });
};

// Ejecutar función principal
if (require.main === module) {
  const properties = generateMockData();
  
  console.log('\n🎯 ¿Quieres iniciar un servidor de API temporal? (Ctrl+C para cancelar)');
  setTimeout(() => {
    createMockAPI();
  }, 3000);
}

module.exports = { mockProperties, generateMockData };
