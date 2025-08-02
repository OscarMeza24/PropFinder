-- Crear extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Tabla de usuarios
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('user', 'agent', 'admin')),
    phone VARCHAR(20),
    avatar_url TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    email_verification_token VARCHAR(255),
    password_reset_token VARCHAR(255),
    password_reset_expires TIMESTAMP,
    last_login TIMESTAMP,
    login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP,
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de propiedades
CREATE TABLE properties (
    id SERIAL PRIMARY KEY,
    agent_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(12,2) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    zip_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'USA',
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    bedrooms INTEGER,
    bathrooms INTEGER,
    square_feet INTEGER,
    property_type VARCHAR(50) CHECK (property_type IN ('house', 'apartment', 'condo', 'townhouse', 'land', 'commercial')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'pending', 'sold', 'rented', 'deleted')),
    images JSONB,
    features JSONB,
    amenities JSONB,
    year_built INTEGER,
    parking_spaces INTEGER,
    lot_size DECIMAL(10,2),
    hoa_fees DECIMAL(8,2),
    property_tax DECIMAL(8,2),
    views_count INTEGER DEFAULT 0,
    featured BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de mensajes para el chat
CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    sender_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    receiver_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    room_id VARCHAR(255),
    content TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'location')),
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP,
    property_id INTEGER REFERENCES properties(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de pagos
CREATE TABLE payments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    property_id INTEGER REFERENCES properties(id) ON DELETE SET NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('stripe', 'paypal')),
    stripe_payment_intent_id VARCHAR(255),
    paypal_payment_id VARCHAR(255),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled', 'refunded')),
    refund_amount DECIMAL(10,2),
    refund_reason TEXT,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de favoritos
CREATE TABLE favorites (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    property_id INTEGER REFERENCES properties(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, property_id)
);

-- Tabla de visitas programadas
CREATE TABLE scheduled_visits (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    property_id INTEGER REFERENCES properties(id) ON DELETE CASCADE,
    agent_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    visit_date TIMESTAMP NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
    notes TEXT,
    reminder_sent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de notificaciones
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error', 'message', 'visit', 'payment', 'favorite')),
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP,
    data JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de búsquedas guardadas
CREATE TABLE saved_searches (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    filters JSONB NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de vistas de propiedades
CREATE TABLE property_views (
    id SERIAL PRIMARY KEY,
    property_id INTEGER REFERENCES properties(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    ip_address INET,
    user_agent TEXT,
    viewed_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de contactos de propiedades
CREATE TABLE property_contacts (
    id SERIAL PRIMARY KEY,
    property_id INTEGER REFERENCES properties(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    message TEXT,
    contact_type VARCHAR(50) DEFAULT 'general' CHECK (contact_type IN ('general', 'visit', 'offer', 'question')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'closed')),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de reseñas
CREATE TABLE reviews (
    id SERIAL PRIMARY KEY,
    property_id INTEGER REFERENCES properties(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    agent_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, property_id)
);

-- Tabla de documentos
CREATE TABLE documents (
    id SERIAL PRIMARY KEY,
    property_id INTEGER REFERENCES properties(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_type VARCHAR(50),
    file_size INTEGER,
    document_type VARCHAR(50) DEFAULT 'general' CHECK (document_type IN ('general', 'contract', 'inspection', 'appraisal', 'title')),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de eventos del sistema
CREATE TABLE system_events (
    id SERIAL PRIMARY KEY,
    event_type VARCHAR(100) NOT NULL,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    data JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Índices para mejorar performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_verification_token ON users(email_verification_token);
CREATE INDEX idx_users_reset_token ON users(password_reset_token);

CREATE INDEX idx_properties_agent_id ON properties(agent_id);
CREATE INDEX idx_properties_status ON properties(status);
CREATE INDEX idx_properties_city ON properties(city);
CREATE INDEX idx_properties_price ON properties(price);
CREATE INDEX idx_properties_location ON properties(latitude, longitude);
CREATE INDEX idx_properties_search ON properties USING gin(to_tsvector('english', title || ' ' || COALESCE(description, '')));
CREATE INDEX idx_properties_featured ON properties(featured);
CREATE INDEX idx_properties_type ON properties(property_type);

CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX idx_messages_room_id ON messages(room_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
CREATE INDEX idx_messages_property_id ON messages(property_id);

CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_created_at ON payments(created_at);

CREATE INDEX idx_favorites_user_id ON favorites(user_id);
CREATE INDEX idx_favorites_property_id ON favorites(property_id);

CREATE INDEX idx_scheduled_visits_user_id ON scheduled_visits(user_id);
CREATE INDEX idx_scheduled_visits_property_id ON scheduled_visits(property_id);
CREATE INDEX idx_scheduled_visits_agent_id ON scheduled_visits(agent_id);
CREATE INDEX idx_scheduled_visits_date ON scheduled_visits(visit_date);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

CREATE INDEX idx_saved_searches_user_id ON saved_searches(user_id);

CREATE INDEX idx_property_views_property_id ON property_views(property_id);
CREATE INDEX idx_property_views_user_id ON property_views(user_id);
CREATE INDEX idx_property_views_viewed_at ON property_views(viewed_at);

CREATE INDEX idx_property_contacts_property_id ON property_contacts(property_id);
CREATE INDEX idx_property_contacts_user_id ON property_contacts(user_id);

CREATE INDEX idx_reviews_property_id ON reviews(property_id);
CREATE INDEX idx_reviews_user_id ON reviews(user_id);
CREATE INDEX idx_reviews_agent_id ON reviews(agent_id);

CREATE INDEX idx_documents_property_id ON documents(property_id);
CREATE INDEX idx_documents_user_id ON documents(user_id);

CREATE INDEX idx_system_events_type ON system_events(event_type);
CREATE INDEX idx_system_events_user_id ON system_events(user_id);
CREATE INDEX idx_system_events_created_at ON system_events(created_at);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON properties FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_scheduled_visits_updated_at BEFORE UPDATE ON scheduled_visits FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON notifications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_saved_searches_updated_at BEFORE UPDATE ON saved_searches FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_property_contacts_updated_at BEFORE UPDATE ON property_contacts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Función para búsqueda avanzada de propiedades
CREATE OR REPLACE FUNCTION search_properties(
    search_term TEXT DEFAULT NULL,
    min_price DECIMAL DEFAULT NULL,
    max_price DECIMAL DEFAULT NULL,
    property_types TEXT[] DEFAULT NULL,
    min_bedrooms INTEGER DEFAULT NULL,
    max_bedrooms INTEGER DEFAULT NULL,
    min_bathrooms INTEGER DEFAULT NULL,
    max_bathrooms INTEGER DEFAULT NULL,
    cities TEXT[] DEFAULT NULL,
    states TEXT[] DEFAULT NULL,
    featured_only BOOLEAN DEFAULT FALSE
)
RETURNS TABLE (
    id INTEGER,
    title VARCHAR(255),
    price DECIMAL(12,2),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    bedrooms INTEGER,
    bathrooms INTEGER,
    property_type VARCHAR(50),
    images JSONB,
    agent_name VARCHAR(255),
    similarity REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.title,
        p.price,
        p.address,
        p.city,
        p.state,
        p.bedrooms,
        p.bathrooms,
        p.property_type,
        p.images,
        u.name as agent_name,
        CASE 
            WHEN search_term IS NOT NULL THEN similarity(p.title || ' ' || COALESCE(p.description, ''), search_term)
            ELSE 0
        END as similarity
    FROM properties p
    JOIN users u ON p.agent_id = u.id
    WHERE p.status = 'active'
        AND (search_term IS NULL OR 
             p.title ILIKE '%' || search_term || '%' OR 
             p.description ILIKE '%' || search_term || '%' OR
             p.address ILIKE '%' || search_term || '%')
        AND (min_price IS NULL OR p.price >= min_price)
        AND (max_price IS NULL OR p.price <= max_price)
        AND (property_types IS NULL OR p.property_type = ANY(property_types))
        AND (min_bedrooms IS NULL OR p.bedrooms >= min_bedrooms)
        AND (max_bedrooms IS NULL OR p.bedrooms <= max_bedrooms)
        AND (min_bathrooms IS NULL OR p.bathrooms >= min_bathrooms)
        AND (max_bathrooms IS NULL OR p.bathrooms <= max_bathrooms)
        AND (cities IS NULL OR p.city = ANY(cities))
        AND (states IS NULL OR p.state = ANY(states))
        AND (NOT featured_only OR p.featured = TRUE)
    ORDER BY 
        CASE WHEN search_term IS NOT NULL THEN similarity(p.title || ' ' || COALESCE(p.description, ''), search_term) END DESC,
        p.featured DESC,
        p.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Función para incrementar contador de vistas
CREATE OR REPLACE FUNCTION increment_property_views(property_id_param INTEGER, user_id_param INTEGER DEFAULT NULL, ip_address_param INET DEFAULT NULL, user_agent_param TEXT DEFAULT NULL)
RETURNS VOID AS $$
BEGIN
    -- Insertar vista
    INSERT INTO property_views (property_id, user_id, ip_address, user_agent)
    VALUES (property_id_param, user_id_param, ip_address_param, user_agent_param);
    
    -- Incrementar contador en propiedades
    UPDATE properties 
    SET views_count = views_count + 1 
    WHERE id = property_id_param;
END;
$$ LANGUAGE plpgsql;

-- Datos de ejemplo
INSERT INTO users (email, password, name, role, is_verified) VALUES
('admin@propfinder.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/HS.iK8.', 'Administrador', 'admin', TRUE),
('agent1@propfinder.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/HS.iK8.', 'María González', 'agent', TRUE),
('agent2@propfinder.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/HS.iK8.', 'Carlos Rodríguez', 'agent', TRUE),
('user1@propfinder.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/HS.iK8.', 'Ana Martínez', 'user', TRUE),
('user2@propfinder.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/HS.iK8.', 'Luis Pérez', 'user', TRUE);

INSERT INTO properties (agent_id, title, description, price, address, city, state, zip_code, bedrooms, bathrooms, square_feet, property_type, images, features) VALUES
(2, 'Casa Moderna en el Centro', 'Hermosa casa moderna con acabados de lujo en el corazón de la ciudad', 450000.00, '123 Calle Principal', 'Ciudad de México', 'CDMX', '01000', 3, 2, 1800, 'house', '["https://example.com/image1.jpg", "https://example.com/image2.jpg"]', '["Estacionamiento", "Jardín", "Cocina equipada"]'),
(2, 'Departamento de Lujo', 'Departamento de lujo con vista panorámica y amenidades exclusivas', 280000.00, '456 Avenida Reforma', 'Ciudad de México', 'CDMX', '06500', 2, 2, 1200, 'apartment', '["https://example.com/image3.jpg"]', '["Gimnasio", "Piscina", "Seguridad 24/7"]'),
(3, 'Casa Familiar Espaciosa', 'Casa familiar perfecta para crecer, con jardín y garaje para 2 autos', 520000.00, '789 Calle Residencial', 'Guadalajara', 'Jalisco', '44100', 4, 3, 2200, 'house', '["https://example.com/image4.jpg"]', '["Jardín grande", "Garaje doble", "Sótano"]'),
(3, 'Oficina Comercial', 'Oficina comercial en zona de alto tráfico, ideal para negocios', 180000.00, '321 Calle Comercial', 'Guadalajara', 'Jalisco', '44150', 0, 1, 800, 'commercial', '["https://example.com/image5.jpg"]', '["Recepción", "Sala de juntas", "Estacionamiento"]'); 