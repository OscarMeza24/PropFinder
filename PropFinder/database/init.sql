-- Crear extensión UUID si no existe
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Crear extensión pg_trgm para búsquedas de texto
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Crear extensión para triggers de updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- El resto del schema se ejecutará desde el archivo schema.sql
-- que será montado como volumen en el contenedor 