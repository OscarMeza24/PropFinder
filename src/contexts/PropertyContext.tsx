import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

export interface Property {
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
  agent?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    avatar_url?: string;
  };
}

interface PropertyFilters {
  type?: string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  bathrooms?: number;
  city?: string;
  status?: string;
}

interface PropertyContextType {
  properties: Property[];
  loading: boolean;
  searchProperties: (query: string, filters?: PropertyFilters) => Promise<Property[]>;
  getPropertyById: (id: string) => Promise<Property | null>;
  createProperty: (property: Omit<Property, 'id' | 'created_at' | 'updated_at' | 'agent_id'>) => Promise<void>;
  updateProperty: (id: string, updates: Partial<Property>) => Promise<void>;
  deleteProperty: (id: string) => Promise<void>;
  getFeaturedProperties: () => Promise<Property[]>;
  getPropertiesByAgent: (agentId: string) => Promise<Property[]>;
  refreshProperties: () => Promise<void>;
}

const PropertyContext = createContext<PropertyContextType | undefined>(undefined);

export const useProperty = () => {
  const context = useContext(PropertyContext);
  if (!context) {
    throw new Error('useProperty must be used within a PropertyProvider');
  }
  return context;
};

export const PropertyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    refreshProperties();
  }, []);

  const refreshProperties = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('properties')
        .select(`
          *,
          agent:users!properties_agent_id_fkey (
            id,
            name,
            email,
            phone,
            avatar_url
          )
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setProperties(data || []);
    } catch (error: any) {
      console.error('Error fetching properties:', error);
      toast.error('Error al cargar las propiedades');
    } finally {
      setLoading(false);
    }
  };

  const searchProperties = async (query: string, filters?: PropertyFilters): Promise<Property[]> => {
    try {
      let queryBuilder = supabase
        .from('properties')
        .select(`
          *,
          agent:users!properties_agent_id_fkey (
            id,
            name,
            email,
            phone,
            avatar_url
          )
        `)
        .eq('status', 'active');

      // Apply text search
      if (query.trim()) {
        queryBuilder = queryBuilder.or(`title.ilike.%${query}%,description.ilike.%${query}%,city.ilike.%${query}%,address.ilike.%${query}%`);
      }

      // Apply filters
      if (filters) {
        if (filters.type) {
          queryBuilder = queryBuilder.eq('type', filters.type);
        }
        if (filters.minPrice) {
          queryBuilder = queryBuilder.gte('price', filters.minPrice);
        }
        if (filters.maxPrice) {
          queryBuilder = queryBuilder.lte('price', filters.maxPrice);
        }
        if (filters.bedrooms) {
          queryBuilder = queryBuilder.gte('bedrooms', filters.bedrooms);
        }
        if (filters.bathrooms) {
          queryBuilder = queryBuilder.gte('bathrooms', filters.bathrooms);
        }
        if (filters.city) {
          queryBuilder = queryBuilder.ilike('city', `%${filters.city}%`);
        }
      }

      const { data, error } = await queryBuilder.order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error: any) {
      console.error('Error searching properties:', error);
      toast.error('Error en la búsqueda');
      return [];
    }
  };

  const getPropertyById = async (id: string): Promise<Property | null> => {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select(`
          *,
          agent:users!properties_agent_id_fkey (
            id,
            name,
            email,
            phone,
            avatar_url
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error: any) {
      console.error('Error fetching property:', error);
      return null;
    }
  };

  const createProperty = async (propertyData: Omit<Property, 'id' | 'created_at' | 'updated_at' | 'agent_id'>) => {
    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    try {
      const { error } = await supabase
        .from('properties')
        .insert({
          ...propertyData,
          agent_id: user.id,
          status: 'active'
        });

      if (error) {
        throw error;
      }

      toast.success('Propiedad creada exitosamente');
      await refreshProperties();
    } catch (error: any) {
      console.error('Error creating property:', error);
      toast.error(error.message || 'Error al crear la propiedad');
      throw error;
    }
  };

  const updateProperty = async (id: string, updates: Partial<Property>) => {
    try {
      const { error } = await supabase
        .from('properties')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) {
        throw error;
      }

      toast.success('Propiedad actualizada correctamente');
      await refreshProperties();
    } catch (error: any) {
      console.error('Error updating property:', error);
      toast.error(error.message || 'Error al actualizar la propiedad');
      throw error;
    }
  };

  const deleteProperty = async (id: string) => {
    try {
      const { error } = await supabase
        .from('properties')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      toast.success('Propiedad eliminada correctamente');
      await refreshProperties();
    } catch (error: any) {
      console.error('Error deleting property:', error);
      toast.error(error.message || 'Error al eliminar la propiedad');
      throw error;
    }
  };

  const getFeaturedProperties = async (): Promise<Property[]> => {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select(`
          *,
          agent:users!properties_agent_id_fkey (
            id,
            name,
            email,
            phone,
            avatar_url
          )
        `)
        .eq('featured', true)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(6);

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error: any) {
      console.error('Error fetching featured properties:', error);
      return [];
    }
  };

  const getPropertiesByAgent = async (agentId: string): Promise<Property[]> => {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select(`
          *,
          agent:users!properties_agent_id_fkey (
            id,
            name,
            email,
            phone,
            avatar_url
          )
        `)
        .eq('agent_id', agentId)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error: any) {
      console.error('Error fetching agent properties:', error);
      return [];
    }
  };

  const value = {
    properties,
    loading,
    searchProperties,
    getPropertyById,
    createProperty,
    updateProperty,
    deleteProperty,
    getFeaturedProperties,
    getPropertiesByAgent,
    refreshProperties
  };

  return (
    <PropertyContext.Provider value={value}>
      {children}
    </PropertyContext.Provider>
  );
};