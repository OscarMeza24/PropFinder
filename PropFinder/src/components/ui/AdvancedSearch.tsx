import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  MapPin, 
  Target, 
  X,
  Map as MapIcon,
  List,
  Navigation,
  Maximize,
  Minimize
} from 'lucide-react';
import { useProximitySearch } from '../../hooks/useGeolocation';
import PropertyMap from './PropertyMap';
import { Property } from '../../contexts/property-context-utils';

interface AdvancedSearchProps {
  properties: Property[];
  onFilteredPropertiesChange: (properties: Property[]) => void;
  onPropertySelect?: (property: Property | null) => void;
}

interface SearchFilters {
  query: string;
  type: string;
  minPrice: string;
  maxPrice: string;
  bedrooms: string;
  bathrooms: string;
  location: string;
  radius: string;
  useGeolocation: boolean;
  sortBy: string;
}

const AdvancedSearch: React.FC<AdvancedSearchProps> = ({
  properties,
  onFilteredPropertiesChange,
  onPropertySelect
}) => {
  const geolocation = useProximitySearch();
  const location = useLocation();
  const [showFilters, setShowFilters] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [isFullscreenMap, setIsFullscreenMap] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    type: '',
    minPrice: '',
    maxPrice: '',
    bedrooms: '',
    bathrooms: '',
    location: '',
    radius: '10',
    useGeolocation: false,
    sortBy: 'price-asc'
  });

  // Estado para la ubicación personalizada
  const [customLocation, setCustomLocation] = useState<{
    lat: number;
    lng: number;
    address?: string;
  } | null>(null);

  // Manejar tecla ESC para salir de pantalla completa
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isFullscreenMap) {
        setIsFullscreenMap(false);
      }
    };

    if (isFullscreenMap) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isFullscreenMap]);

  // Cerrar modo pantalla completa al cambiar de ruta
  useEffect(() => {
    setIsFullscreenMap(false);
    setShowMap(false);
    setShowFilters(false);
    setSelectedProperty(null);
    // Resetear filtros cuando cambies de página
    setFilters({
      query: '',
      type: '',
      minPrice: '',
      maxPrice: '',
      bedrooms: '',
      bathrooms: '',
      location: '',
      radius: '10',
      useGeolocation: false,
      sortBy: 'price-asc'
    });
    setCustomLocation(null);
  }, [location.pathname]);

  // Aplicar filtros
  useEffect(() => {
    let filtered = [...properties];

    // Filtro de búsqueda por texto
    if (filters.query.trim()) {
      const query = filters.query.toLowerCase();
      filtered = filtered.filter(property =>
        property.title.toLowerCase().includes(query) ||
        property.description.toLowerCase().includes(query) ||
        property.location.address.toLowerCase().includes(query) ||
        property.location.city.toLowerCase().includes(query) ||
        property.location.state.toLowerCase().includes(query)
      );
    }

    // Filtro por tipo de propiedad
    if (filters.type) {
      filtered = filtered.filter(property => property.type === filters.type);
    }

    // Filtro por rango de precios
    if (filters.minPrice) {
      filtered = filtered.filter(property => property.price >= parseInt(filters.minPrice));
    }
    if (filters.maxPrice) {
      filtered = filtered.filter(property => property.price <= parseInt(filters.maxPrice));
    }

    // Filtro por habitaciones
    if (filters.bedrooms) {
      filtered = filtered.filter(property => property.bedrooms >= parseInt(filters.bedrooms));
    }

    // Filtro por baños
    if (filters.bathrooms) {
      filtered = filtered.filter(property => property.bathrooms >= parseInt(filters.bathrooms));
    }

    // Filtro por ubicación específica
    if (filters.location.trim() && !filters.useGeolocation) {
      const location = filters.location.toLowerCase();
      filtered = filtered.filter(property =>
        property.location.city.toLowerCase().includes(location) ||
        property.location.address.toLowerCase().includes(location) ||
        property.location.state.toLowerCase().includes(location)
      );
    }

    // Filtro por proximidad (geolocalización)
    if (filters.useGeolocation) {
      const radius = parseInt(filters.radius) || 10;
      
      if (geolocation.latitude && geolocation.longitude) {
        // Usar ubicación del usuario
        filtered = geolocation.searchNearby(filtered, radius);
      } else if (customLocation) {
        // Usar ubicación personalizada
        filtered = filtered
          .map(property => {
            if (!property.latitude || !property.longitude) {
              return { ...property, distance: null };
            }

            const distance = calculateDistance(
              customLocation.lat,
              customLocation.lng,
              property.latitude,
              property.longitude
            );

            return { ...property, distance };
          })
          .filter(property => property.distance === null || property.distance <= radius)
          .sort((a, b) => {
            if (a.distance === null) return 1;
            if (b.distance === null) return -1;
            return a.distance - b.distance;
          });
      }
    }

    // Ordenamiento
    switch (filters.sortBy) {
      case 'price-asc':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'bedrooms-desc':
        filtered.sort((a, b) => b.bedrooms - a.bedrooms);
        break;
      case 'newest':
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'distance':
        if (filters.useGeolocation) {
          filtered.sort((a, b) => {
            if (!a.distance) return 1;
            if (!b.distance) return -1;
            return a.distance - b.distance;
          });
        }
        break;
    }

    onFilteredPropertiesChange(filtered);
  }, [filters, properties, geolocation, customLocation, onFilteredPropertiesChange]);

  // Función para calcular distancia
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Radio de la Tierra en km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const lat1Rad = toRad(lat1);
    const lat2Rad = toRad(lat2);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1Rad) * Math.cos(lat2Rad);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c;

    return d;
  };

  const toRad = (value: number): number => {
    return (value * Math.PI) / 180;
  };

  const handleFilterChange = (key: keyof SearchFilters, value: string | boolean) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleLocationSelect = async (lng: number, lat: number, address?: string) => {
    setCustomLocation({ lat, lng, address });
    
    if (address) {
      handleFilterChange('location', address);
    } else {
      // Obtener dirección usando geocoding inverso
      const addressFromCoords = await geolocation.getAddressFromCoordinates(lat, lng);
      if (addressFromCoords) {
        handleFilterChange('location', addressFromCoords);
      }
    }
    
    handleFilterChange('useGeolocation', true);
  };

  const handleUseCurrentLocation = () => {
    if (geolocation.latitude && geolocation.longitude) {
      setCustomLocation(null);
      handleFilterChange('useGeolocation', true);
      handleFilterChange('location', 'Ubicación actual');
    } else {
      geolocation.getCurrentPosition();
    }
  };

  const clearFilters = () => {
    setFilters({
      query: '',
      type: '',
      minPrice: '',
      maxPrice: '',
      bedrooms: '',
      bathrooms: '',
      location: '',
      radius: '10',
      useGeolocation: false,
      sortBy: 'price-asc'
    });
    setCustomLocation(null);
  };

  const handlePropertyMapSelect = (property: Property | null) => {
    setSelectedProperty(property);
    onPropertySelect?.(property);
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden relative z-10">
      {/* Barra de búsqueda principal */}
      <div className="p-6 border-b">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por título, ubicación, descripción..."
              value={filters.query}
              onChange={(e) => handleFilterChange('query', e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-6 py-3 rounded-lg transition-colors flex items-center space-x-2 ${
                showFilters 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Filter className="h-5 w-5" />
              <span>Filtros</span>
            </button>
            
            <button
              onClick={() => setShowMap(!showMap)}
              className={`px-6 py-3 rounded-lg transition-colors flex items-center space-x-2 ${
                showMap
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {showMap ? <List className="h-5 w-5" /> : <MapIcon className="h-5 w-5" />}
              <span>{showMap ? 'Lista' : 'Mapa'}</span>
            </button>

            {showMap && (
              <button
                onClick={() => setIsFullscreenMap(!isFullscreenMap)}
                className="px-6 py-3 rounded-lg transition-colors flex items-center space-x-2 bg-gray-100 text-gray-700 hover:bg-gray-200"
                title={isFullscreenMap ? 'Salir de pantalla completa' : 'Pantalla completa'}
              >
                {isFullscreenMap ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
                <span className="hidden md:inline">
                  {isFullscreenMap ? 'Minimizar' : 'Expandir'}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Panel de filtros avanzados */}
      {showFilters && (
        <div className="p-6 bg-gray-50 border-b">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {/* Tipo de propiedad */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de Propiedad
              </label>
              <select
                value={filters.type}
                onChange={(e) => handleFilterChange('type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Todos</option>
                <option value="house">Casa</option>
                <option value="apartment">Apartamento</option>
                <option value="condo">Condominio</option>
                <option value="townhouse">Casa Adosada</option>
                <option value="land">Terreno</option>
              </select>
            </div>

            {/* Precio mínimo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Precio Mínimo
              </label>
              <input
                type="number"
                placeholder="0"
                value={filters.minPrice}
                onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Precio máximo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Precio Máximo
              </label>
              <input
                type="number"
                placeholder="Sin límite"
                value={filters.maxPrice}
                onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Habitaciones */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Habitaciones mín.
              </label>
              <select
                value={filters.bedrooms}
                onChange={(e) => handleFilterChange('bedrooms', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Cualquiera</option>
                <option value="1">1+</option>
                <option value="2">2+</option>
                <option value="3">3+</option>
                <option value="4">4+</option>
                <option value="5">5+</option>
              </select>
            </div>

            {/* Baños */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Baños mín.
              </label>
              <select
                value={filters.bathrooms}
                onChange={(e) => handleFilterChange('bathrooms', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Cualquiera</option>
                <option value="1">1+</option>
                <option value="2">2+</option>
                <option value="3">3+</option>
                <option value="4">4+</option>
              </select>
            </div>

            {/* Ubicación */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ubicación
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Ciudad o dirección"
                  value={filters.location}
                  onChange={(e) => handleFilterChange('location', e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Radio de búsqueda */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Radio (km)
              </label>
              <select
                value={filters.radius}
                onChange={(e) => handleFilterChange('radius', e.target.value)}
                disabled={!filters.useGeolocation}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
              >
                <option value="5">5 km</option>
                <option value="10">10 km</option>
                <option value="15">15 km</option>
                <option value="25">25 km</option>
                <option value="50">50 km</option>
              </select>
            </div>

            {/* Ordenar por */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ordenar por
              </label>
              <select
                value={filters.sortBy}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="price-asc">Precio: Menor a Mayor</option>
                <option value="price-desc">Precio: Mayor a Menor</option>
                <option value="bedrooms-desc">Más Habitaciones</option>
                <option value="newest">Más Reciente</option>
                {filters.useGeolocation && (
                  <option value="distance">Distancia</option>
                )}
              </select>
            </div>
          </div>

          {/* Controles de geolocalización */}
          <div className="flex flex-wrap gap-3 pt-4 border-t">
            <button
              onClick={handleUseCurrentLocation}
              disabled={geolocation.loading}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {geolocation.loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Target className="h-4 w-4" />
              )}
              <span>Usar Mi Ubicación</span>
            </button>

            {filters.useGeolocation && (
              <div className="flex items-center space-x-2 px-3 py-2 bg-green-100 text-green-700 rounded-lg">
                <Navigation className="h-4 w-4" />
                <span className="text-sm">
                  Búsqueda por proximidad activa
                </span>
              </div>
            )}

            {geolocation.error && (
              <div className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">
                {geolocation.error}
              </div>
            )}

            <button
              onClick={clearFilters}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              <X className="h-4 w-4" />
              <span>Limpiar Filtros</span>
            </button>
          </div>
        </div>
      )}

      {/* Mapa */}
      {showMap && (
        <div 
          className={`${
            isFullscreenMap 
              ? 'fixed inset-0 z-50 bg-white' 
              : 'h-[600px] md:h-[700px] lg:h-[800px] xl:h-[900px] min-h-[500px]'
          }`}
          style={isFullscreenMap ? { height: '100vh', width: '100vw' } : {}}
        >
          {isFullscreenMap && (
            <>
              <button
                onClick={() => setIsFullscreenMap(false)}
                className="absolute top-20 right-4 z-[75] p-3 bg-white rounded-lg shadow-lg hover:bg-gray-50 border-2 border-gray-200"
                title="Salir de pantalla completa"
              >
                <X className="h-6 w-6" />
              </button>
              
              <div className="absolute top-20 left-4 z-[75] bg-black/70 text-white px-3 py-2 rounded-lg text-sm">
                Modo Pantalla Completa - Presiona ESC o click en ✕ para salir
              </div>
            </>
          )}
          <PropertyMap
            properties={properties}
            selectedProperty={selectedProperty}
            onPropertySelect={handlePropertyMapSelect}
            onLocationSelect={handleLocationSelect}
            showSearch={true}
            isFullscreen={isFullscreenMap}
          />
        </div>
      )}
    </div>
  );
};

export default AdvancedSearch;
