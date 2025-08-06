import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useProperty } from '../contexts/PropertyContext';
import { Property } from '../contexts/property-context-utils';
import { MapPin, Bed, Bath, Square, Heart, ArrowRight } from 'lucide-react';

const FavoritesPage: React.FC = () => {
  const { properties, isLoading } = useProperty();
  const [favoriteProperties, setFavoriteProperties] = useState<Property[]>([]);
  const [localFavorites, setLocalFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('favorites');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Error reading favorites from localStorage', error);
      return [];
    }
  });

  useEffect(() => {
    if (properties.length > 0) {
      const filtered = properties.filter(p => localFavorites.includes(String(p.id)));
      setFavoriteProperties(filtered);
    }
  }, [properties, localFavorites]);

  const toggleFavorite = (propertyId: string) => {
    const isFavorite = localFavorites.includes(propertyId);
    let updatedFavorites;

    if (isFavorite) {
      updatedFavorites = localFavorites.filter(id => id !== propertyId);
    } else {
      updatedFavorites = [...localFavorites, propertyId];
    }

    setLocalFavorites(updatedFavorites);
    try {
      localStorage.setItem('favorites', JSON.stringify(updatedFavorites));
    } catch (error) {
      console.error('Error saving favorites to localStorage', error);
    }
  };

  if (isLoading) {
    return <div className="text-center p-10">Cargando propiedades favoritas...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Mis Favoritos</h1>
        {favoriteProperties.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {favoriteProperties.map((property) => (
              <div key={property.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                <div className="relative">
                  <img
                    src={property.images?.[0] || 'https://via.placeholder.com/400x250'}
                    alt={property.title}
                    className="w-full h-56 object-cover"
                  />
                  <button
                    onClick={() => toggleFavorite(String(property.id))}
                    className="absolute top-3 right-3 bg-white p-2 rounded-full shadow-md hover:bg-red-100 transition-colors"
                  >
                    <Heart className="h-6 w-6 text-red-500" fill="currentColor" />
                  </button>
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-800 truncate">{property.title}</h3>
                  <div className="flex items-center text-gray-600 mt-1">
                    <MapPin className="h-4 w-4 mr-1" />
                    <span className="truncate">{property.location.address}, {property.location.city}</span>
                  </div>
                  <div className="flex items-center justify-between mt-4 text-sm text-gray-700">
                    <div className="flex items-center"><Bed className="h-4 w-4 mr-1" /> {property.bedrooms}</div>
                    <div className="flex items-center"><Bath className="h-4 w-4 mr-1" /> {property.bathrooms}</div>
                    <div className="flex items-center"><Square className="h-4 w-4 mr-1" /> {property.area} m²</div>
                  </div>
                  <div className="mt-4 flex justify-between items-center">
                    <p className="text-xl font-bold text-blue-600">${property.price.toLocaleString()}</p>
                    <Link to={`/properties/${property.id}`} className="text-blue-600 hover:text-blue-800 font-semibold flex items-center">
                      Ver Más <ArrowRight className="h-4 w-4 ml-1" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold text-gray-800">Aún no tienes favoritos</h2>
            <p className="text-gray-600 mt-2">¡Explora las propiedades y guarda las que más te gusten!</p>
            <Link to="/properties" className="mt-6 inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-transform transform hover:scale-105">
              Buscar Propiedades
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default FavoritesPage;
