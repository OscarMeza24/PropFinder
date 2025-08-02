const express = require('express');
const { pool, redisClient } = require('../config/database.js');
const { authenticateAgent } = require('../middleware/auth.js');
const asyncHandler = require('../utils/asyncHandler.js');
const ApiError = require('../utils/ApiError.js');

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

// Crear nueva propiedad (solo agentes)
router.post('/', authenticateAgent, asyncHandler(async (req, res) => {
  const {
    title, description, price, address, city, state, zip_code,
    bedrooms, bathrooms, square_feet, property_type, images, features,
  } = req.body;

  if (!title || !price || !address || !city || !state) {
    throw new ApiError(400, 'Título, precio, dirección, ciudad y estado son campos requeridos');
  }

  const newProperty = await pool.query(`
    INSERT INTO properties (
      agent_id, title, description, price, address, city, state, zip_code,
      bedrooms, bathrooms, square_feet, property_type, images, features,
      status, created_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 'active', NOW())
    RETURNING *
  `, [
    req.user.userId, title, description, price, address, city, state, zip_code,
    bedrooms, bathrooms, square_feet, property_type,
    images ? JSON.stringify(images) : null,
    features ? JSON.stringify(features) : null,
  ]);

  await redisClient.del('properties_cache');

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

  await redisClient.del('properties_cache');

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

  await redisClient.del('properties_cache');

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
