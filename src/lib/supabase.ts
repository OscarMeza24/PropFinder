import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string;
          role: 'user' | 'agent' | 'admin';
          avatar_url?: string;
          phone?: string;
          subscription_plan?: string;
          subscription_status?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          name: string;
          role?: 'user' | 'agent' | 'admin';
          avatar_url?: string;
          phone?: string;
          subscription_plan?: string;
          subscription_status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          role?: 'user' | 'agent' | 'admin';
          avatar_url?: string;
          phone?: string;
          subscription_plan?: string;
          subscription_status?: string;
          updated_at?: string;
        };
      };
      properties: {
        Row: {
          id: string;
          title: string;
          description: string;
          price: number;
          type: 'apartment' | 'house' | 'condo' | 'townhouse';
          bedrooms: number;
          bathrooms: number;
          area: number;
          address: string;
          city: string;
          state: string;
          zip_code: string;
          latitude: number;
          longitude: number;
          images: string[];
          amenities: string[];
          agent_id: string;
          featured: boolean;
          status: 'active' | 'sold' | 'rented' | 'inactive';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description: string;
          price: number;
          type: 'apartment' | 'house' | 'condo' | 'townhouse';
          bedrooms: number;
          bathrooms: number;
          area: number;
          address: string;
          city: string;
          state: string;
          zip_code: string;
          latitude: number;
          longitude: number;
          images?: string[];
          amenities?: string[];
          agent_id: string;
          featured?: boolean;
          status?: 'active' | 'sold' | 'rented' | 'inactive';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          description?: string;
          price?: number;
          type?: 'apartment' | 'house' | 'condo' | 'townhouse';
          bedrooms?: number;
          bathrooms?: number;
          area?: number;
          address?: string;
          city?: string;
          state?: string;
          zip_code?: string;
          latitude?: number;
          longitude?: number;
          images?: string[];
          amenities?: string[];
          featured?: boolean;
          status?: 'active' | 'sold' | 'rented' | 'inactive';
          updated_at?: string;
        };
      };
      chat_rooms: {
        Row: {
          id: string;
          name: string;
          property_id?: string;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          property_id?: string;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          property_id?: string;
          updated_at?: string;
        };
      };
      chat_messages: {
        Row: {
          id: string;
          room_id: string;
          sender_id: string;
          content: string;
          message_type: 'text' | 'image' | 'file';
          created_at: string;
        };
        Insert: {
          id?: string;
          room_id: string;
          sender_id: string;
          content: string;
          message_type?: 'text' | 'image' | 'file';
          created_at?: string;
        };
        Update: {
          content?: string;
          message_type?: 'text' | 'image' | 'file';
        };
      };
      room_participants: {
        Row: {
          id: string;
          room_id: string;
          user_id: string;
          joined_at: string;
        };
        Insert: {
          id?: string;
          room_id: string;
          user_id: string;
          joined_at?: string;
        };
        Update: {};
      };
    };
  };
}