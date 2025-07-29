// Core Types for PropFinder Real Estate Portal

export interface User {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  role: 'buyer' | 'seller' | 'agent' | 'admin';
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Agent extends User {
  license_number: string;
  agency: string;
  bio?: string;
  specializations: string[];
  rating: number;
  total_sales: number;
  subscription_plan: 'basic' | 'premium' | 'enterprise';
  subscription_expires_at: string;
  is_verified: boolean;
}

export interface Property {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  property_type: 'house' | 'apartment' | 'condo' | 'villa' | 'commercial' | 'land';
  listing_type: 'sale' | 'rent';
  bedrooms?: number;
  bathrooms?: number;
  area_sqm: number;
  address: string;
  city: string;
  state: string;
  country: string;
  postal_code: string;
  latitude: number;
  longitude: number;
  features: string[];
  images: PropertyImage[];
  agent_id: string;
  agent?: Agent;
  owner_id: string;
  status: 'active' | 'pending' | 'sold' | 'rented' | 'inactive';
  views_count: number;
  favorites_count: number;
  created_at: string;
  updated_at: string;
}

export interface PropertyImage {
  id: string;
  property_id: string;
  url: string;
  caption?: string;
  is_primary: boolean;
  order_index: number;
}

export interface PropertyFilter {
  property_type?: string[];
  listing_type?: 'sale' | 'rent';
  min_price?: number;
  max_price?: number;
  bedrooms?: number[];
  bathrooms?: number[];
  min_area?: number;
  max_area?: number;
  city?: string;
  state?: string;
  features?: string[];
  search_radius?: number;
  center_lat?: number;
  center_lng?: number;
}

export interface Visit {
  id: string;
  property_id: string;
  property?: Property;
  visitor_id: string;
  visitor?: User;
  agent_id: string;
  agent?: Agent;
  scheduled_date: string;
  duration_minutes: number;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
  visitor_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ChatRoom {
  id: string;
  property_id: string;
  property?: Property;
  user_id: string;
  user?: User;
  agent_id: string;
  agent?: Agent;
  last_message_at: string;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  room_id: string;
  sender_id: string;
  sender?: User;
  message: string;
  message_type: 'text' | 'image' | 'file';
  is_read: boolean;
  created_at: string;
}

export interface Payment {
  id: string;
  user_id: string;
  agent_id?: string;
  amount: number;
  currency: string;
  payment_type: 'subscription' | 'listing_fee' | 'premium_feature';
  payment_method: 'stripe' | 'paypal' | 'mercadopago';
  payment_intent_id?: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: string;
  agent_id: string;
  plan: 'basic' | 'premium' | 'enterprise';
  status: 'active' | 'cancelled' | 'expired';
  starts_at: string;
  expires_at: string;
  auto_renew: boolean;
  payment_method: 'stripe' | 'paypal' | 'mercadopago';
  subscription_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Analytics {
  property_id: string;
  views_today: number;
  views_week: number;
  views_month: number;
  favorites_count: number;
  inquiries_count: number;
  visits_scheduled: number;
  visits_completed: number;
  conversion_rate: number;
}

export interface Notification {
  id: string;
  user_id: string;
  type: 'visit_scheduled' | 'visit_reminder' | 'message' | 'property_update' | 'payment';
  title: string;
  message: string;
  is_read: boolean;
  data?: Record<string, any>;
  created_at: string;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
  status: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}