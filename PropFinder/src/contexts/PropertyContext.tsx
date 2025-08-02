import React, { useState, useEffect } from "react";
import apiService, {
  Property as ApiProperty,
  PropertiesResponse,
} from "../services/api";
import {
  Property,
  PropertyContext,
} from "./property-context-utils";

// Función para convertir Property del API a Property del frontend
const convertApiPropertyToProperty = (apiProperty: ApiProperty): Property => {
  return {
    id: apiProperty.id.toString(),
    title: apiProperty.title,
    price: apiProperty.price,
    type: apiProperty.property_type as
      | "apartment"
      | "house"
      | "condo"
      | "townhouse",
    bedrooms: apiProperty.bedrooms || 0,
    bathrooms: apiProperty.bathrooms || 0,
    area: apiProperty.square_feet || 0,
    location: {
      address: apiProperty.address,
      city: apiProperty.city,
      state: apiProperty.state,
      zipCode: apiProperty.zip_code || "",
      lat: undefined, // TODO: Implementar cuando se añadan coordenadas
      lng: undefined,
    },
    images: apiProperty.images || [],
    description: apiProperty.description || "",
    amenities: apiProperty.features || [],
    agent: {
      id: apiProperty.agent_id.toString(),
      name: apiProperty.agent_name || "Agente",
      email: apiProperty.agent_email || "",
      phone: apiProperty.agent_phone || "",
      avatar: undefined,
    },
    featured: false, // TODO: Implementar cuando se añada campo featured
    createdAt: apiProperty.created_at,
    updatedAt: apiProperty.updated_at,
  };
};

export const useProperty = () => {
  const context = React.useContext(PropertyContext);
  if (!context) {
    throw new Error('useProperty must be used within a PropertyProvider');
  }
  return context;
};

export const PropertyProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<{
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null>(null);

  useEffect(() => {
    // Cargar propiedades al inicializar
    loadProperties();
  }, []);

  const loadProperties = async (params?: {
    page?: number;
    limit?: number;
    minPrice?: number;
    maxPrice?: number;
    bedrooms?: number;
    bathrooms?: number;
    propertyType?: string;
    location?: string;
    sortBy?: string;
    sortOrder?: string;
  }) => {
    setIsLoading(true);
    setError(null);
    try {
      const response: PropertiesResponse = await apiService.getProperties(
        params
      );
      const convertedProperties = response.properties.map(
        convertApiPropertyToProperty
      );
      setProperties(convertedProperties);
      setPagination(response.pagination);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Error al cargar propiedades";
      setError(errorMessage);
      console.error("Error loading properties:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMyProperties = async (params?: {
    page?: number;
    limit?: number;
  }) => {
    setIsLoading(true);
    setError(null);
    try {
      const response: PropertiesResponse = await apiService.getMyProperties(
        params
      );
      const convertedProperties = response.properties.map(
        convertApiPropertyToProperty
      );
      setProperties(convertedProperties);
      setPagination(response.pagination);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Error al cargar mis propiedades";
      setError(errorMessage);
      console.error("Error loading my properties:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const featuredProperties = properties.filter((property) => property.featured);

  const searchProperties = (query: string): Property[] => {
    if (!query.trim()) return properties;

    return properties.filter(
      (property) =>
        property.title.toLowerCase().includes(query.toLowerCase()) ||
        property.location.city.toLowerCase().includes(query.toLowerCase()) ||
        property.location.address.toLowerCase().includes(query.toLowerCase()) ||
        property.description.toLowerCase().includes(query.toLowerCase())
    );
  };

  const getPropertyById = (id: string): Property | undefined => {
    return properties.find((property) => property.id === id);
  };

  const addProperty = async (
    propertyData: Omit<Property, "id" | "createdAt" | "updatedAt">
  ) => {
    setError(null);
    try {
      const apiPropertyData = {
        title: propertyData.title,
        description: propertyData.description,
        price: propertyData.price,
        address: propertyData.location.address,
        city: propertyData.location.city,
        state: propertyData.location.state,
        zip_code: propertyData.location.zipCode,
        bedrooms: propertyData.bedrooms,
        bathrooms: propertyData.bathrooms,
        square_feet: propertyData.area,
        property_type: propertyData.type,
        images: propertyData.images,
        features: propertyData.amenities,
      };

      const response = await apiService.createProperty(apiPropertyData);
      const newProperty = convertApiPropertyToProperty(response.property);
      setProperties((prev) => [...prev, newProperty]);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Error al crear propiedad";
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const updateProperty = async (id: string, updates: Partial<Property>) => {
    setError(null);
    try {
      const apiPropertyData: Partial<ApiProperty> = {};

      if (updates.title) apiPropertyData.title = updates.title;
      if (updates.description)
        apiPropertyData.description = updates.description;
      if (updates.price) apiPropertyData.price = updates.price;
      if (updates.location) {
        apiPropertyData.address = updates.location.address;
        apiPropertyData.city = updates.location.city;
        apiPropertyData.state = updates.location.state;
        apiPropertyData.zip_code = updates.location.zipCode;
      }
      if (updates.bedrooms) apiPropertyData.bedrooms = updates.bedrooms;
      if (updates.bathrooms) apiPropertyData.bathrooms = updates.bathrooms;
      if (updates.area) apiPropertyData.square_feet = updates.area;
      if (updates.type) apiPropertyData.property_type = updates.type;
      if (updates.images) apiPropertyData.images = updates.images;
      if (updates.amenities) apiPropertyData.features = updates.amenities;

      const response = await apiService.updateProperty(
        parseInt(id),
        apiPropertyData
      );
      const updatedProperty = convertApiPropertyToProperty(response.property);

      setProperties((prev) =>
        prev.map((property) =>
          property.id === id ? updatedProperty : property
        )
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Error al actualizar propiedad";
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const deleteProperty = async (id: string) => {
    setError(null);
    try {
      await apiService.deleteProperty(parseInt(id));
      setProperties((prev) => prev.filter((property) => property.id !== id));
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Error al eliminar propiedad";
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const createProperty = async (propertyData: {
    title: string;
    description?: string;
    price: number;
    address: string;
    city: string;
    state: string;
    zip_code?: string;
    bedrooms?: number;
    bathrooms?: number;
    square_feet?: number;
    property_type: string;
    images?: string[];
    features?: string[];
  }): Promise<void> => {
    try {
      setIsLoading(true);
      // TODO: Implement actual API call to create property
      // This is a mock implementation that creates a temporary property
      const tempId = Math.random().toString(36).substr(2, 9);
      const newProperty: Property = {
        id: tempId,
        title: propertyData.title,
        price: propertyData.price,
        type: propertyData.property_type as 'apartment' | 'house' | 'condo' | 'townhouse',
        bedrooms: propertyData.bedrooms || 0,
        bathrooms: propertyData.bathrooms || 0,
        area: propertyData.square_feet || 0,
        location: {
          address: propertyData.address,
          city: propertyData.city,
          state: propertyData.state,
          zipCode: propertyData.zip_code || '',
        },
        images: propertyData.images || [],
        description: propertyData.description || '',
        amenities: propertyData.features || [],
        agent: {
          id: 'temp-agent',
          name: 'Current User',
          email: '',
          phone: '',
        },
        featured: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      setProperties(prev => [newProperty, ...prev]);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to create property';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    properties,
    featuredProperties,
    searchProperties,
    getPropertyById,
    addProperty,
    updateProperty,
    deleteProperty,
    loadProperties,
    loadMyProperties,
    createProperty,
    isLoading,
    error,
    pagination,
  };

  return (
    <PropertyContext.Provider value={value}>
      {children}
    </PropertyContext.Provider>
  );
};
