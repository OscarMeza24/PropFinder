const express = require('express');
const { pool, redisClient } = require('../config/database.js');
const { authenticateAgent } = require('../middleware/auth.js');
const asyncHandler = require('../utils/asyncHandler.js');
const ApiError = require('../utils/ApiError.js');
const fetch = require('node-fetch'); // Necesario para hacer peticiones HTTP

const router = express.Router();

// Obtener todas las propiedades (público)
router.get('/', asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    minPrice,
    maxPrice,
    bedrooms,
    bathrooms,
    propertyType,
    location,
    sortBy = 'created_at',
    sortOrder = 'DESC',
  } = req.query;

  const offset = (page - 1) * limit;

  let query = `
    SELECT p.*, u.name as agent_name, u.phone as agent_phone, u.email as agent_email
    FROM properties p
    LEFT JOIN users u ON p.agent_id = u.id
    WHERE p.status = 'active'
  `;
  const queryParams = [];
  let paramCount = 0;

  if (minPrice) {
    paramCount++;
    query += ` AND p.price >= $${paramCount}`;
    queryParams.push(minPrice);
  }
  if (maxPrice) {
    paramCount++;
    query += ` AND p.price <= $${paramCount}`;
    queryParams.push(maxPrice);
  }
  if (bedrooms) {
    paramCount++;
    query += ` AND p.bedrooms >= $${paramCount}`;
    queryParams.push(bedrooms);
  }
  if (bathrooms) {
    paramCount++;
    query += ` AND p.bathrooms >= $${paramCount}`;
    queryParams.push(bathrooms);
  }
  if (propertyType) {
    paramCount++;
    query += ` AND p.property_type = $${paramCount}`;
    queryParams.push(propertyType);
  }
  if (location) {
    paramCount++;
    query += ` AND (p.address ILIKE $${paramCount} OR p.city ILIKE $${paramCount} OR p.state ILIKE $${paramCount})`;
    queryParams.push(`%${location}%`);
  }

  const validSortFields = ['price', 'bedrooms', 'bathrooms', 'created_at', 'square_feet'];
  const validSortOrders = ['ASC', 'DESC'];
  const sortField = validSortFields.includes(sortBy) ? sortBy : 'created_at';
  const sortDirection = validSortOrders.includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';
  query += ` ORDER BY p.${sortField} ${sortDirection}`;

  paramCount++;
  query += ` LIMIT $${paramCount}`;
  queryParams.push(limit);
  paramCount++;
  query += ` OFFSET $${paramCount}`;
  queryParams.push(offset);

  const properties = await pool.query(query, queryParams);

  let countQuery = `SELECT COUNT(*) as total 
  FROM properties p 
  WHERE p.status = 'active'`;
  const countParams = [];
  paramCount = 0;

  if (minPrice) {
    paramCount++;
    countQuery += ` AND p.price >= $${paramCount}`;
    countParams.push(minPrice);
  }
  if (maxPrice) {
    paramCount++;
    countQuery += ` AND p.price <= $${paramCount}`;
    countParams.push(maxPrice);
  }
  if (bedrooms) {
    paramCount++;
    countQuery += ` AND p.bedrooms >= $${paramCount}`;
    countParams.push(bedrooms);
  }
  if (bathrooms) {
    paramCount++;
    countQuery += ` AND p.bathrooms >= $${paramCount}`;
    countParams.push(bathrooms);
  }
  if (propertyType) {
    paramCount++;
    countQuery += ` AND p.property_type = $${paramCount}`;
    countParams.push(propertyType);
  }
  if (location) {
    paramCount++;
    countQuery += ` AND (p.address ILIKE $${paramCount}
    OR p.city ILIKE $${paramCount}
    OR p.state ILIKE $${paramCount})`;
    countParams.push(`%${location}%`);
  }

  const totalResult = await pool.query(countQuery, countParams);
  const total = parseInt(totalResult.rows[0].total, 10);

  res.json({
    properties: properties.rows,
    pagination: {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}));

// Obtener una propiedad específica
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const property = await pool.query(`
    SELECT p.*, u.name as agent_name, u.phone as agent_phone, u.email as agent_email
    FROM properties p
    LEFT JOIN users u ON p.agent_id = u.id
    WHERE p.id = $1 AND p.status = 'active'
  `, [id]);

  if (property.rows.length === 0) {
    throw new ApiError(404, 'Propiedad no encontrada o no está activa');
  }

  res.json({ property: property.rows[0] });
}));

// Función para normalizar direcciones ecuatorianas
const normalizeEcuadorianAddress = (address) => {
  if (!address) return '';
  
  let normalized = address.toLowerCase();
  
  // Reemplazos comunes para direcciones ecuatorianas
  const replacements = {
    'calle': 'calle',
    'avenida': 'av',
    'av.': 'av',
    'av ': 'av ',
    'callejon': 'callejón',
    'pasaje': 'pasaje',
    'sector': 'sector',
    'urbanizacion': 'urbanización',
    'urb': 'urbanización',
    'ciudadela': 'ciudadela',
    'villa': 'villa',
    'barrio': 'barrio',
    'conjunto': 'conjunto',
    'mz': 'manzana',
    'manzana': 'manzana',
    'lote': 'lote',
    'casa': 'casa',
    'edificio': 'edificio',
    'piso': 'piso',
    'depto': 'departamento',
    'apt': 'apartamento',
    '#': 'numero',
    'no.': 'numero',
    'num.': 'numero'
  };
  
  // Aplicar reemplazos
  Object.entries(replacements).forEach(([key, value]) => {
    const regex = new RegExp(`\\b${key}\\b`, 'gi');
    normalized = normalized.replace(regex, value);
  });
  
  // Normalizar números de calles (ej: "calle 7" -> "calle 7")
  normalized = normalized.replace(/(\d+)(st|nd|rd|th)?/g, '$1');
  
  return normalized.trim();
};

// Función para geocodificar dirección usando Mapbox con múltiples estrategias
const geocodeAddress = async (address, city, state, country = 'Ecuador') => {
  try {
    const MAPBOX_TOKEN = process.env.MAPBOX_TOKEN || 'pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw';
    
    // Normalizar la dirección
    const normalizedAddress = normalizeEcuadorianAddress(address);
    
    // Construir múltiples variaciones de búsqueda
    const searchQueries = [];
    
    if (address && address.trim()) {
      // Estrategia 1: Dirección completa original
      searchQueries.push(`${address}, ${city}, ${state}, ${country}`);
      
      // Estrategia 2: Dirección normalizada
      if (normalizedAddress && normalizedAddress !== address.toLowerCase()) {
        searchQueries.push(`${normalizedAddress}, ${city}, ${state}, ${country}`);
      }
      
      // Estrategia 3: Solo dirección y ciudad
      searchQueries.push(`${address}, ${city}, ${country}`);
      
      // Estrategia 4: Dirección con formato de calle específico
      if (address.toLowerCase().includes('calle') && address.toLowerCase().includes('avenida')) {
        // Para casos como "calle 7 avenida 11"
        const parts = address.toLowerCase().split(/\s+/);
        const streetParts = [];
        
        for (let i = 0; i < parts.length; i++) {
          if (parts[i] === 'calle' && parts[i + 1]) {
            streetParts.push(`calle ${parts[i + 1]}`);
          }
          if (parts[i] === 'avenida' && parts[i + 1]) {
            streetParts.push(`avenida ${parts[i + 1]}`);
          }
        }
        
        if (streetParts.length > 0) {
          searchQueries.push(`${streetParts.join(' y ')}, ${city}, ${state}, ${country}`);
          searchQueries.push(`${streetParts.join(' esquina ')}, ${city}, ${state}, ${country}`);
        }
      }
      
      // Estrategia 5: Búsqueda más genérica por zona/sector
      const zonalTerms = ['sector', 'urbanización', 'ciudadela', 'barrio', 'zona'];
      for (const term of zonalTerms) {
        if (address.toLowerCase().includes(term)) {
          const zoneMatch = address.match(new RegExp(`${term}\\s+([^,]+)`, 'i'));
          if (zoneMatch) {
            searchQueries.push(`${zoneMatch[0]}, ${city}, ${state}, ${country}`);
          }
        }
      }
    }
    
    // Estrategias de respaldo
    searchQueries.push(`${city}, ${state}, ${country}`);
    searchQueries.push(`${city}, ${country}`);
    searchQueries.push(`centro, ${city}, ${country}`);
    
    console.log(`🗺️ Geocodificando para: "${address}" en ${city}, ${state}`);
    console.log(`📋 Intentando ${searchQueries.length} estrategias de búsqueda...`);
    
    for (let i = 0; i < searchQueries.length; i++) {
      const query = searchQueries[i];
      try {
        console.log(`🔍 Estrategia ${i + 1}: ${query}`);
        
        // Configuraciones específicas para diferentes tipos de búsqueda
        const params = new URLSearchParams({
          access_token: MAPBOX_TOKEN,
          country: 'EC',
          limit: '5',
          language: 'es'
        });
        
        // Para direcciones específicas, usar tipos de lugares más específicos
        if (i < 3 && address && address.trim()) {
          params.append('types', 'address,poi');
        } else {
          params.append('types', 'place,locality,neighborhood,address');
        }
        
        // Añadir proximity para mejorar resultados locales
        if (city.toLowerCase() === 'manta') {
          params.append('proximity', '-80.7090,-0.9548'); // Centro de Manta
        } else if (city.toLowerCase() === 'quito') {
          params.append('proximity', '-78.4678,-0.1807'); // Centro de Quito
        } else if (city.toLowerCase() === 'guayaquil') {
          params.append('proximity', '-79.8862,-2.1894'); // Centro de Guayaquil
        }
        
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?${params.toString()}`;
        const response = await fetch(url);
        
        if (!response.ok) {
          console.log(`❌ Error HTTP ${response.status} para: ${query}`);
          continue;
        }
        
        const data = await response.json();
        
        if (data.features && data.features.length > 0) {
          // Verificar que el resultado esté en Ecuador
          const feature = data.features[0];
          const [lng, lat] = feature.center;
          
          // Validar que las coordenadas estén dentro de Ecuador (aproximadamente)
          const isInEcuador = lat >= -5 && lat <= 2 && lng >= -82 && lng <= -75;
          
          if (isInEcuador) {
            console.log(`✅ Coordenadas obtenidas: ${lat}, ${lng} para "${query}"`);
            console.log(`📍 Lugar encontrado: ${feature.place_name}`);
            
            return { 
              latitude: lat, 
              longitude: lng,
              place_name: feature.place_name,
              accuracy: feature.properties?.accuracy || 'unknown',
              match_type: i < 3 ? 'exact' : 'approximate'
            };
          } else {
            console.log(`⚠️ Coordenadas fuera de Ecuador: ${lat}, ${lng}`);
          }
        }
        
      } catch (err) {
        console.log(`❌ Error con query "${query}":`, err.message);
        continue;
      }
      
      // Pausa entre intentos para respetar límites de API
      if (i < searchQueries.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }
    
    console.log(`❌ No se pudieron obtener coordenadas válidas para "${address}" en ${city}, ${state}`);
    return null;
  } catch (error) {
    console.error('Error en geocodificación:', error);
    return null;
  }
};

// Crear nueva propiedad (solo agentes)
router.post('/', authenticateAgent, asyncHandler(async (req, res) => {
  const {
    title, description, price, address, city, state, zip_code,
    bedrooms, bathrooms, square_feet, property_type, images, features,
    latitude, longitude
  } = req.body;

  if (!title || !price || !address || !city || !state) {
    throw new ApiError(400, 'Título, precio, dirección, ciudad y estado son campos requeridos');
  }

  // Intentar geocodificar si no se proporcionaron coordenadas
  let finalLatitude = latitude;
  let finalLongitude = longitude;
  
  if (!latitude || !longitude) {
    const coords = await geocodeAddress(address, city, state);
    if (coords) {
      finalLatitude = coords.latitude;
      finalLongitude = coords.longitude;
    }
  }

  const newProperty = await pool.query(`
    INSERT INTO properties (
      agent_id, title, description, price, address, city, state, zip_code,
      bedrooms, bathrooms, square_feet, property_type, images, features,
      latitude, longitude, status, created_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, 'active', NOW())
    RETURNING *
  `, [
    req.user.userId, title, description, price, address, city, state, zip_code,
    bedrooms, bathrooms, square_feet, property_type,
    images ? JSON.stringify(images) : null,
    features ? JSON.stringify(features) : null,
    finalLatitude, finalLongitude
  ]);

  // Solo limpiar caché si Redis está disponible
  if (redisClient) {
    await redisClient.del('properties_cache');
  }

  res.status(201).json({
    message: 'Propiedad creada exitosamente',
    property: newProperty.rows[0],
  });
}));

// Actualizar propiedad (solo el agente propietario)
router.put('/:id', authenticateAgent, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    title, description, price, address, city, state, zip_code,
    bedrooms, bathrooms, square_feet, property_type, images, features, status,
  } = req.body;

  const existingProperty = await pool.query(
    'SELECT id FROM properties WHERE id = $1 AND agent_id = $2',
    [id, req.user.userId],
  );

  if (existingProperty.rows.length === 0) {
    throw new ApiError(404, 'Propiedad no encontrada o no tienes permisos para editarla');
  }

  const updatedProperty = await pool.query(`
    UPDATE properties SET
      title = COALESCE($1, title),
      description = COALESCE($2, description),
      price = COALESCE($3, price),
      address = COALESCE($4, address),
      city = COALESCE($5, city),
      state = COALESCE($6, state),
      zip_code = COALESCE($7, zip_code),
      bedrooms = COALESCE($8, bedrooms),
      bathrooms = COALESCE($9, bathrooms),
      square_feet = COALESCE($10, square_feet),
      property_type = COALESCE($11, property_type),
      images = COALESCE($12, images),
      features = COALESCE($13, features),
      status = COALESCE($14, status),
      updated_at = NOW()
    WHERE id = $15 AND agent_id = $16
    RETURNING *
  `, [
    title, description, price, address, city, state, zip_code,
    bedrooms, bathrooms, square_feet, property_type,
    images ? JSON.stringify(images) : null,
    features ? JSON.stringify(features) : null,
    status, id, req.user.userId,
  ]);

  // Solo limpiar caché si Redis está disponible
  if (redisClient) {
    await redisClient.del('properties_cache');
  }

  res.json({
    message: 'Propiedad actualizada exitosamente',
    property: updatedProperty.rows[0],
  });
}));

// Eliminar propiedad (solo el agente propietario)
router.delete('/:id', authenticateAgent, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const existingProperty = await pool.query(
    'SELECT id FROM properties WHERE id = $1 AND agent_id = $2',
    [id, req.user.userId],
  );

  if (existingProperty.rows.length === 0) {
    throw new ApiError(404, 'Propiedad no encontrada o no tienes permisos para eliminarla');
  }

  await pool.query(
    'UPDATE properties SET status = $1, updated_at = NOW() WHERE id = $2',
    ['deleted', id],
  );

  // Solo limpiar caché si Redis está disponible
  if (redisClient) {
    await redisClient.del('properties_cache');
  }

  res.status(200).json({ message: 'Propiedad eliminada exitosamente' });
}));

// Obtener propiedades del agente actual
router.get('/agent/my-properties', authenticateAgent, asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const offset = (page - 1) * limit;

  const propertiesPromise = pool.query(`
    SELECT * FROM properties 
    WHERE agent_id = $1 AND status != 'deleted'
    ORDER BY created_at DESC 
    LIMIT $2 OFFSET $3
  `, [req.user.userId, limit, offset]);

  const totalPromise = pool.query(
    'SELECT COUNT(*) as total FROM properties WHERE agent_id = $1 AND status != \'deleted\'',
    [req.user.userId],
  );

  const [propertiesResult, totalResult] = await Promise.all([propertiesPromise, totalPromise]);

  const total = parseInt(totalResult.rows[0].total, 10);

  res.json({
    properties: propertiesResult.rows,
    pagination: {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}));

module.exports = router;
