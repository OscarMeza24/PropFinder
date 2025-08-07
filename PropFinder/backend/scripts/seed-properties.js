const { pool } = require('../config/database.js');

// Propiedades de ejemplo con coordenadas reales de Ecuador
const sampleProperties = [
  {
    title: 'Departamento Moderno en Manta',
    description: 'Hermoso departamento con vista al mar en el corazón de Manta',
    price: 85000,
    address: 'Malecon de Manta y calle 23',
    city: 'Manta',
    state: 'Manabi',
    zip_code: '130213',
    latitude: -0.9677,
    longitude: -80.7090,
    bedrooms: 2,
    bathrooms: 2,
    square_feet: 85,
    property_type: 'apartment',
    images: JSON.stringify([
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800'
    ]),
    features: JSON.stringify(['Vista al mar', 'Balcón', 'Cocina equipada', 'Seguridad 24/7'])
  },
  {
    title: 'Casa Familiar en Quito Norte',
    description: 'Amplia casa familiar en zona residencial exclusiva',
    price: 180000,
    address: 'Av. de los Shyris N34-123',
    city: 'Quito',
    state: 'Pichincha',
    zip_code: '170135',
    latitude: -0.1807,
    longitude: -78.4678,
    bedrooms: 4,
    bathrooms: 3,
    square_feet: 220,
    property_type: 'house',
    images: JSON.stringify([
      'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=800',
      'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800'
    ]),
    features: JSON.stringify(['Jardín', 'Garaje doble', 'Estudio', 'Chimenea'])
  },
  {
    title: 'Oficina Comercial en Guayaquil',
    description: 'Oficina moderna en el centro financiero de Guayaquil',
    price: 95000,
    address: 'Av. 9 de Octubre 1234',
    city: 'Guayaquil',
    state: 'Guayas',
    zip_code: '090313',
    latitude: -2.1894,
    longitude: -79.8890,
    bedrooms: 0,
    bathrooms: 2,
    square_feet: 120,
    property_type: 'commercial',
    images: JSON.stringify([
      'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800',
      'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800'
    ]),
    features: JSON.stringify(['Aire acondicionado', 'Internet fibra óptica', 'Recepción', 'Estacionamiento'])
  },
  {
    title: 'Penthouse en Cuenca',
    description: 'Lujoso penthouse con vista panorámica de la ciudad colonial',
    price: 145000,
    address: 'Calle Larga 456',
    city: 'Cuenca',
    state: 'Azuay',
    zip_code: '010150',
    latitude: -2.9001,
    longitude: -79.0059,
    bedrooms: 3,
    bathrooms: 3,
    square_feet: 180,
    property_type: 'apartment',
    images: JSON.stringify([
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800'
    ]),
    features: JSON.stringify(['Terraza', 'Vista panorámica', 'Jacuzzi', 'Ascensor privado'])
  }
];

const insertSampleProperties = async () => {
  try {
    console.log('🏠 Insertando propiedades de ejemplo...');
    
    // Verificar que existan agentes (usar el agente con ID 2 que existe en el schema)
    const agentCheck = await pool.query('SELECT id FROM users WHERE role = $1 LIMIT 1', ['agent']);
    
    if (agentCheck.rows.length === 0) {
      console.log('❌ No hay agentes en la base de datos. Ejecuta primero el schema.sql');
      return;
    }
    
    const agentId = agentCheck.rows[0].id;
    console.log(`✅ Usando agente ID: ${agentId}`);
    
    for (let i = 0; i < sampleProperties.length; i++) {
      const property = sampleProperties[i];
      console.log(`📍 Insertando: ${property.title}`);
      
      const result = await pool.query(`
        INSERT INTO properties (
          agent_id, title, description, price, address, city, state, zip_code,
          latitude, longitude, bedrooms, bathrooms, square_feet, property_type,
          images, features, status, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, 'active', NOW())
        RETURNING id, title
      `, [
        agentId,
        property.title,
        property.description,
        property.price,
        property.address,
        property.city,
        property.state,
        property.zip_code,
        property.latitude,
        property.longitude,
        property.bedrooms,
        property.bathrooms,
        property.square_feet,
        property.property_type,
        property.images,
        property.features
      ]);
      
      console.log(`✅ Propiedad creada: ID ${result.rows[0].id} - ${result.rows[0].title}`);
    }
    
    console.log('🎉 ¡Todas las propiedades han sido insertadas exitosamente!');
    console.log('\n📊 Resumen:');
    console.log(`- ${sampleProperties.length} propiedades creadas`);
    console.log('- Todas con coordenadas GPS válidas');
    console.log('- Ubicadas en ciudades principales de Ecuador');
    
  } catch (error) {
    console.error('❌ Error insertando propiedades:', error);
  } finally {
    await pool.end();
  }
};

// Ejecutar si se llama directamente
if (require.main === module) {
  insertSampleProperties();
}

module.exports = { insertSampleProperties };
