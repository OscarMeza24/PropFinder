import { createContext, useContext } from "react";

// Adaptar la interfaz de Property del API a la interfaz del frontend
export interface Property {
  id: string;
  title: string;
  price: number;
  type: "apartment" | "house" | "condo" | "townhouse";
  bedrooms: number;
  bathrooms: number;
  area: number;
  location: {
    address: string;
    city: string;
    state: string;
    zipCode: string;
    lat?: number;
    lng?: number;
  };
  images: string[];
  description: string;
  amenities: string[];
  agent: {
    id: string;
    name: string;
    email: string;
    phone: string;
    avatar?: string;
  };
  featured: boolean;
  status?: "active" | "pending" | "sold" | "rented" | "deleted";
  views?: number;
  contacts?: number;
  pendingVisits?: number;
  createdAt: string;
  updatedAt: string;
}

interface PropertyContextType {
  properties: Property[];
  featuredProperties: Property[];
  searchProperties: (query: string) => Property[];
  getPropertyById: (id: string) => Property | undefined;
  createProperty: (propertyData: {
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
  }) => Promise<void>;
  updateProperty: (id: string, updates: Partial<Property>) => Promise<void>;
  deleteProperty: (id: string) => Promise<void>;
  loadProperties: (params?: {
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
  }) => Promise<void>;
  loadMyProperties: (params?: {
    page?: number;
    limit?: number;
  }) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null;
}

export const PropertyContext = createContext<PropertyContextType | undefined>(
  undefined
);

export const useProperty = () => {
  const context = useContext(PropertyContext);
  if (!context) {
    throw new Error("useProperty must be used within a PropertyProvider");
  }
  return context;
};