import React, { createContext, useContext, useState, useEffect } from 'react';

export interface Property {
  id: string;
  title: string;
  price: number;
  type: 'apartment' | 'house' | 'condo' | 'townhouse';
  bedrooms: number;
  bathrooms: number;
  area: number;
  location: {
    address: string;
    city: string;
    state: string;
    zipCode: string;
    lat: number;
    lng: number;
  };
  images: string[];
  description: string;
  amenities: string[];
  agent: {
    id: string;
    name: string;
    email: string;
    phone: string;
    avatar: string;
  };
  featured: boolean;
  createdAt: string;
  updatedAt: string;
}

interface PropertyContextType {
  properties: Property[];
  featuredProperties: Property[];
  searchProperties: (query: string) => Property[];
  getPropertyById: (id: string) => Property | undefined;
  addProperty: (property: Omit<Property, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateProperty: (id: string, updates: Partial<Property>) => void;
  deleteProperty: (id: string) => void;
  isLoading: boolean;
}

const PropertyContext = createContext<PropertyContextType | undefined>(undefined);

export const useProperty = () => {
  const context = useContext(PropertyContext);
  if (!context) {
    throw new Error('useProperty must be used within a PropertyProvider');
  }
  return context;
};

// Mock data
const mockProperties: Property[] = [
  {
    id: '1',
    title: 'Luxury Downtown Apartment',
    price: 2500000,
    type: 'apartment',
    bedrooms: 3,
    bathrooms: 2,
    area: 120,
    location: {
      address: '123 Main Street',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
      lat: 40.7128,
      lng: -74.0060
    },
    images: [
      'https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/1571468/pexels-photo-1571468.jpeg?auto=compress&cs=tinysrgb&w=800'
    ],
    description: 'Beautiful luxury apartment in the heart of downtown with stunning city views.',
    amenities: ['Gym', 'Pool', 'Concierge', 'Parking', 'Balcony'],
    agent: {
      id: '1',
      name: 'Sarah Johnson',
      email: 'sarah@propfinder.com',
      phone: '+1 (555) 123-4567',
      avatar: 'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=150'
    },
    featured: true,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z'
  },
  {
    id: '2',
    title: 'Modern Family House',
    price: 1800000,
    type: 'house',
    bedrooms: 4,
    bathrooms: 3,
    area: 200,
    location: {
      address: '456 Oak Avenue',
      city: 'Los Angeles',
      state: 'CA',
      zipCode: '90210',
      lat: 34.0522,
      lng: -118.2437
    },
    images: [
      'https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/1396132/pexels-photo-1396132.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/1454806/pexels-photo-1454806.jpeg?auto=compress&cs=tinysrgb&w=800'
    ],
    description: 'Spacious modern house perfect for families with a beautiful garden.',
    amenities: ['Garden', 'Garage', 'Swimming Pool', 'Fireplace'],
    agent: {
      id: '2',
      name: 'Mike Chen',
      email: 'mike@propfinder.com',
      phone: '+1 (555) 234-5678',
      avatar: 'https://images.pexels.com/photos/91227/pexels-photo-91227.jpeg?auto=compress&cs=tinysrgb&w=150'
    },
    featured: true,
    createdAt: '2024-01-16T14:30:00Z',
    updatedAt: '2024-01-16T14:30:00Z'
  },
  {
    id: '3',
    title: 'Cozy Studio Apartment',
    price: 800000,
    type: 'apartment',
    bedrooms: 1,
    bathrooms: 1,
    area: 45,
    location: {
      address: '789 Pine Street',
      city: 'San Francisco',
      state: 'CA',
      zipCode: '94102',
      lat: 37.7749,
      lng: -122.4194
    },
    images: [
      'https://images.pexels.com/photos/1571453/pexels-photo-1571453.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/1329711/pexels-photo-1329711.jpeg?auto=compress&cs=tinysrgb&w=800'
    ],
    description: 'Perfect studio apartment for young professionals in a prime location.',
    amenities: ['Elevator', 'Laundry', 'Internet'],
    agent: {
      id: '3',
      name: 'Emma Davis',
      email: 'emma@propfinder.com',
      phone: '+1 (555) 345-6789',
      avatar: 'https://images.pexels.com/photos/712513/pexels-photo-712513.jpeg?auto=compress&cs=tinysrgb&w=150'
    },
    featured: false,
    createdAt: '2024-01-17T09:15:00Z',
    updatedAt: '2024-01-17T09:15:00Z'
  }
];

export const PropertyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simular carga de propiedades
    setTimeout(() => {
      setProperties(mockProperties);
      setIsLoading(false);
    }, 1000);
  }, []);

  const featuredProperties = properties.filter(property => property.featured);

  const searchProperties = (query: string): Property[] => {
    if (!query.trim()) return properties;
    
    return properties.filter(property =>
      property.title.toLowerCase().includes(query.toLowerCase()) ||
      property.location.city.toLowerCase().includes(query.toLowerCase()) ||
      property.location.address.toLowerCase().includes(query.toLowerCase()) ||
      property.description.toLowerCase().includes(query.toLowerCase())
    );
  };

  const getPropertyById = (id: string): Property | undefined => {
    return properties.find(property => property.id === id);
  };

  const addProperty = (propertyData: Omit<Property, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newProperty: Property = {
      ...propertyData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setProperties(prev => [...prev, newProperty]);
  };

  const updateProperty = (id: string, updates: Partial<Property>) => {
    setProperties(prev => prev.map(property => 
      property.id === id 
        ? { ...property, ...updates, updatedAt: new Date().toISOString() }
        : property
    ));
  };

  const deleteProperty = (id: string) => {
    setProperties(prev => prev.filter(property => property.id !== id));
  };

  const value = {
    properties,
    featuredProperties,
    searchProperties,
    getPropertyById,
    addProperty,
    updateProperty,
    deleteProperty,
    isLoading
  };

  return (
    <PropertyContext.Provider value={value}>
      {children}
    </PropertyContext.Provider>
  );
};