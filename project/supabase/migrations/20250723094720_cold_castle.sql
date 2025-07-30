/*
  # PropFinder Real Estate Portal Database Schema

  This migration sets up the complete database schema for the PropFinder real estate platform.

  ## 1. New Tables
    - `users` - User accounts with role-based access
    - `agents` - Extended agent profiles with subscription info
    - `properties` - Property listings with geospatial data
    - `property_images` - Property image management
    - `visits` - Visit scheduling system
    - `chat_rooms` - Real-time chat rooms
    - `chat_messages` - Chat message storage
    - `payments` - Payment transaction records
    - `subscriptions` - Agent subscription management
    - `notifications` - User notification system
    - `property_views` - Property view tracking
    - `property_favorites` - User favorites system

  ## 2. Security
    - Enable RLS on all tables
    - Implement role-based access policies
    - Secure agent and admin operations

  ## 3. Features
    - Geospatial search capabilities
    - Real-time chat support
    - Payment processing integration
    - Analytics and reporting
*/

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Users table (base for all user types)
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  full_name text NOT NULL,
  phone text,
  role text NOT NULL DEFAULT 'buyer' CHECK (role IN ('buyer', 'seller', 'agent', 'admin')),
  avatar_url text,
  email_verified boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Agents table (extended profile for real estate agents)
CREATE TABLE IF NOT EXISTS agents (
  id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  license_number text UNIQUE NOT NULL,
  agency text NOT NULL,
  bio text,
  specializations text[] DEFAULT '{}',
  rating numeric(3,2) DEFAULT 0,
  total_sales integer DEFAULT 0,
  subscription_plan text DEFAULT 'basic' CHECK (subscription_plan IN ('basic', 'premium', 'enterprise')),
  subscription_expires_at timestamptz DEFAULT (now() + interval '30 days'),
  is_verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Properties table with geospatial support
CREATE TABLE IF NOT EXISTS properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  price numeric(12,2) NOT NULL,
  currency text DEFAULT 'USD',
  property_type text NOT NULL CHECK (property_type IN ('house', 'apartment', 'condo', 'villa', 'commercial', 'land')),
  listing_type text NOT NULL CHECK (listing_type IN ('sale', 'rent')),
  bedrooms integer,
  bathrooms numeric(3,1),
  area_sqm numeric(10,2) NOT NULL,
  address text NOT NULL,
  city text NOT NULL,
  state text NOT NULL,
  country text NOT NULL DEFAULT 'USA',
  postal_code text,
  location geography(POINT, 4326) NOT NULL,
  features text[] DEFAULT '{}',
  agent_id uuid NOT NULL REFERENCES agents(id),
  owner_id uuid NOT NULL REFERENCES users(id),
  status text DEFAULT 'active' CHECK (status IN ('active', 'pending', 'sold', 'rented', 'inactive')),
  views_count integer DEFAULT 0,
  favorites_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Property images
CREATE TABLE IF NOT EXISTS property_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  url text NOT NULL,
  caption text,
  is_primary boolean DEFAULT false,
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Visits scheduling
CREATE TABLE IF NOT EXISTS visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  visitor_id uuid NOT NULL REFERENCES users(id),
  agent_id uuid NOT NULL REFERENCES agents(id),
  scheduled_date timestamptz NOT NULL,
  duration_minutes integer DEFAULT 60,
  status text DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled')),
  notes text,
  visitor_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Chat rooms for property inquiries
CREATE TABLE IF NOT EXISTS chat_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id),
  agent_id uuid NOT NULL REFERENCES agents(id),
  last_message_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(property_id, user_id, agent_id)
);

-- Chat messages
CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES users(id),
  message text NOT NULL,
  message_type text DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file')),
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Payments tracking
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id),
  agent_id uuid REFERENCES agents(id),
  amount numeric(10,2) NOT NULL,
  currency text DEFAULT 'USD',
  payment_type text NOT NULL CHECK (payment_type IN ('subscription', 'listing_fee', 'premium_feature')),
  payment_method text NOT NULL CHECK (payment_method IN ('stripe', 'paypal', 'mercadopago')),
  payment_intent_id text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Agent subscriptions
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  plan text NOT NULL CHECK (plan IN ('basic', 'premium', 'enterprise')),
  status text DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired')),
  starts_at timestamptz DEFAULT now(),
  expires_at timestamptz NOT NULL,
  auto_renew boolean DEFAULT true,
  payment_method text NOT NULL CHECK (payment_method IN ('stripe', 'paypal', 'mercadopago')),
  subscription_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('visit_scheduled', 'visit_reminder', 'message', 'property_update', 'payment')),
  title text NOT NULL,
  message text NOT NULL,
  is_read boolean DEFAULT false,
  data jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Property views tracking
CREATE TABLE IF NOT EXISTS property_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id),
  ip_address inet,
  user_agent text,
  viewed_at timestamptz DEFAULT now()
);

-- Property favorites
CREATE TABLE IF NOT EXISTS property_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(property_id, user_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_properties_location ON properties USING GIST (location);
CREATE INDEX IF NOT EXISTS idx_properties_price ON properties (price);
CREATE INDEX IF NOT EXISTS idx_properties_type ON properties (property_type, listing_type);
CREATE INDEX IF NOT EXISTS idx_properties_agent ON properties (agent_id);
CREATE INDEX IF NOT EXISTS idx_properties_status ON properties (status);
CREATE INDEX IF NOT EXISTS idx_visits_date ON visits (scheduled_date);
CREATE INDEX IF NOT EXISTS idx_chat_messages_room ON chat_messages (room_id, created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications (user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_property_views_property ON property_views (property_id, viewed_at);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_favorites ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users: can read own data, admins can read all
CREATE POLICY "Users can read own data" ON users
  FOR SELECT USING (auth.uid() = id OR EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Agents: public read, own data write
CREATE POLICY "Agents are publicly readable" ON agents
  FOR SELECT USING (true);

CREATE POLICY "Agents can update own data" ON agents
  FOR UPDATE USING (auth.uid() = id);

-- Properties: public read for active, full access for owners/agents
CREATE POLICY "Active properties are publicly readable" ON properties
  FOR SELECT USING (status = 'active' OR auth.uid() = owner_id OR auth.uid() = agent_id);

CREATE POLICY "Property owners and agents can update" ON properties
  FOR UPDATE USING (auth.uid() = owner_id OR auth.uid() = agent_id);

CREATE POLICY "Agents can create properties" ON properties
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM agents WHERE id = auth.uid()
  ));

-- Property images: follow property permissions
CREATE POLICY "Property images follow property access" ON property_images
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM properties p 
    WHERE p.id = property_id 
    AND (p.status = 'active' OR auth.uid() = p.owner_id OR auth.uid() = p.agent_id)
  ));

-- Visits: users can read own visits, agents can read their property visits
CREATE POLICY "Users can read own visits" ON visits
  FOR SELECT USING (auth.uid() = visitor_id OR auth.uid() = agent_id);

CREATE POLICY "Users can create visits" ON visits
  FOR INSERT WITH CHECK (auth.uid() = visitor_id);

-- Chat rooms and messages: participants only
CREATE POLICY "Chat participants can access rooms" ON chat_rooms
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() = agent_id);

CREATE POLICY "Chat participants can access messages" ON chat_messages
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM chat_rooms cr 
    WHERE cr.id = room_id 
    AND (auth.uid() = cr.user_id OR auth.uid() = cr.agent_id)
  ));

-- Payments: users can read own payments
CREATE POLICY "Users can read own payments" ON payments
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() = agent_id);

-- Subscriptions: agents can read own subscriptions
CREATE POLICY "Agents can read own subscriptions" ON subscriptions
  FOR SELECT USING (auth.uid() = agent_id);

-- Notifications: users can read own notifications
CREATE POLICY "Users can read own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

-- Property views: allow insert for tracking
CREATE POLICY "Anyone can record property views" ON property_views
  FOR INSERT WITH CHECK (true);

-- Property favorites: users can manage own favorites
CREATE POLICY "Users can manage own favorites" ON property_favorites
  FOR ALL USING (auth.uid() = user_id);

-- Functions for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agents_updated_at BEFORE UPDATE ON agents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON properties
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_visits_updated_at BEFORE UPDATE ON visits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();