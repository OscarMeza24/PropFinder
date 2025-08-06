import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bed, Bath, Square, Heart, ArrowRight } from 'lucide-react';
import { useProperty } from '../contexts/PropertyContext';
import { Property } from '../contexts/property-context-utils';
import AdvancedSearch from '../components/ui/AdvancedSearch';
import PropertyCardSkeleton from '../components/skeletons/PropertyCardSkeleton';

const Properties: React.FC = () => {
  const { properties, isLoading } = useProperty();
  
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const savedFavorites = localStorage.getItem('favorites');
      return savedFavorites ? JSON.parse(savedFavorites) : [];
    } catch (error) {
      console.error('Error reading favorites from localStorage', error);
      return [];
    }
  });
  
  const [filteredProperties, setFilteredProperties] = useState<Property[]>(properties);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);

  // Sync initial properties
  useEffect(() => {
    setFilteredProperties(properties);
  }, [properties]);

  const handleFilteredPropertiesChange = (filtered: Property[]) => {
    setFilteredProperties(filtered);
  };

  const handlePropertySelect = (property: Property | null) => {
    setSelectedProperty(property);
  };

  const toggleFavorite = (propertyId: string) => {
    const isFavorite = favorites.includes(propertyId);
    let updatedFavorites;

    if (isFavorite) {
      updatedFavorites = favorites.filter(id => id !== propertyId);
    } else {
      updatedFavorites = [...favorites, propertyId];
    }

    setFavorites(updatedFavorites);
    try {
      localStorage.setItem('favorites', JSON.stringify(updatedFavorites));
    } catch (error) {
      console.error('Error saving favorites to localStorage', error);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header Skeleton */}
          <div className="mb-8 animate-pulse">
            <div className="h-9 bg-gray-300 rounded w-1/3 mb-4"></div>
            <div className="h-5 bg-gray-300 rounded w-1/4"></div>
          </div>

          {/* Filters Skeleton */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8 animate-pulse">
             <div className="h-12 bg-gray-300 rounded-lg"></div>
          </div>

          {/* Property Grid Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 6 }).map((_, index) => (
              <PropertyCardSkeleton key={index} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Búsqueda Avanzada de Propiedades
          </h1>
          <p className="text-gray-600">
            Encuentra tu hogar ideal entre {properties.length} propiedades disponibles con búsqueda geolocalizada
          </p>
        </div>

        {/* Advanced Search Component */}
        <div className="mb-8">
          <AdvancedSearch
            properties={properties}
            onFilteredPropertiesChange={handleFilteredPropertiesChange}
            onPropertySelect={handlePropertySelect}
          />
        </div>

        {/* Results Summary */}
        <div className="mb-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">
              {filteredProperties.length === properties.length
                ? `Todas las propiedades (${filteredProperties.length})`
                : `${filteredProperties.length} de ${properties.length} propiedades`}
            </h2>
            {selectedProperty && (
              <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg text-sm">
                Propiedad seleccionada: {selectedProperty.title}
              </div>
            )}
          </div>
        </div>

        {/* Properties Grid */}
        {filteredProperties.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">🏠</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No se encontraron propiedades
            </h3>
            <p className="text-gray-600 mb-6">
              Intenta ajustar tus filtros de búsqueda o ampliar el área de búsqueda
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProperties.map((property) => (
              <div
                key={property.id}
                className={`bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 ${
                  selectedProperty?.id === property.id ? 'ring-2 ring-blue-500 shadow-lg' : ''
                }`}
              >
                <div className="relative">
                  <img
                    src={property.images?.[0] || '/placeholder-property.jpg'}
                    alt={property.title}
                    className="w-full h-48 object-cover"
                  />
                  <button
                    onClick={() => toggleFavorite(property.id)}
                    className={`absolute top-4 right-4 p-2 rounded-full transition-colors ${
                      favorites.includes(property.id)
                        ? 'bg-red-500 text-white'
                        : 'bg-white/80 text-gray-600 hover:bg-white'
                    }`}
                  >
                    <Heart className={`h-5 w-5 ${favorites.includes(property.id) ? 'fill-current' : ''}`} />
                  </button>
                  
                  {property.featured && (
                    <div className="absolute top-4 left-4 bg-yellow-400 text-black px-2 py-1 rounded text-xs font-semibold">
                      Destacada
                    </div>
                  )}

                  {property.distance && (
                    <div className="absolute bottom-4 left-4 bg-blue-600 text-white px-2 py-1 rounded text-xs font-semibold">
                      📍 {property.distance.toFixed(1)} km
                    </div>
                  )}
                </div>

                <div className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 truncate">
                      {property.title}
                    </h3>
                    <span className="text-xl font-bold text-blue-600">
                      {formatPrice(property.price)}
                    </span>
                  </div>

                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {property.description}
                  </p>

                  <div className="flex items-center text-gray-500 text-sm mb-4">
                    <div className="flex items-center mr-4">
                      <Bed className="h-4 w-4 mr-1" />
                      <span>{property.bedrooms}</span>
                    </div>
                    <div className="flex items-center mr-4">
                      <Bath className="h-4 w-4 mr-1" />
                      <span>{property.bathrooms}</span>
                    </div>
                    <div className="flex items-center">
                      <Square className="h-4 w-4 mr-1" />
                      <span>{property.area} m²</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                      📍 {property.location.city}, {property.location.state}
                    </div>
                    <Link
                      to={`/properties/${property.id}`}
                      className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium text-sm group"
                    >
                      Ver detalles
                      <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Properties;
