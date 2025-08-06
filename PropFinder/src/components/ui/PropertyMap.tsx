import React, { useState, useEffect, useCallback } from 'react';
import Map, { Marker, Popup, NavigationControl, GeolocateControl } from 'react-map-gl';
import { MapPin, X } from 'lucide-react';
import { Property } from '../../contexts/property-context-utils';

// Configuración de Mapbox (puedes usar tu propia API key)
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || 'pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw';

interface PropertyMapProps {
  properties: Property[];
  selectedProperty?: Property | null;
  onPropertySelect?: (property: Property | null) => void;
  onLocationSelect?: (lng: number, lat: number, address?: string) => void;
  interactive?: boolean;
  showSearch?: boolean;
  isFullscreen?: boolean;
}

interface ViewState {
  longitude: number;
  latitude: number;
  zoom: number;
}

const PropertyMap: React.FC<PropertyMapProps> = ({
  properties,
  selectedProperty,
  onPropertySelect,
  onLocationSelect,
  interactive = true,
  showSearch = false,
  isFullscreen = false
}) => {
  const [viewState, setViewState] = useState<ViewState>({
    longitude: -74.006, // Nueva York por defecto
    latitude: 40.7128,
    zoom: 12
  });
  
  const [popupInfo, setPopupInfo] = useState<Property | null>(null);
  const [searchAddress, setSearchAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Obtener ubicación del usuario
  useEffect(() => {
    // Si hay una propiedad seleccionada, centrar el mapa en ella
    if (selectedProperty) {
      const latitude = selectedProperty.latitude || selectedProperty.location.lat;
      const longitude = selectedProperty.longitude || selectedProperty.location.lng;
      
      if (latitude && longitude) {
        setViewState({
          longitude,
          latitude,
          zoom: 15
        });
        return;
      }
    }

    // Si no hay propiedad seleccionada, intentar geolocalización
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setViewState(prev => ({
            ...prev,
            longitude: position.coords.longitude,
            latitude: position.coords.latitude
          }));
        },
        (error) => {
          console.log('Error obteniendo geolocalización:', error);
        }
      );
    }
  }, [selectedProperty]); // Agregar selectedProperty como dependencia

  // Ajustar vista cuando cambian las propiedades
  useEffect(() => {
    if (properties.length > 0) {
      const validProperties = properties.filter(p => p.latitude && p.longitude);
      
      if (validProperties.length > 0) {
        // Calcular bounds para mostrar todas las propiedades
        const bounds = validProperties.reduce(
          (acc, property) => {
            return {
              minLng: Math.min(acc.minLng, property.longitude!),
              maxLng: Math.max(acc.maxLng, property.longitude!),
              minLat: Math.min(acc.minLat, property.latitude!),
              maxLat: Math.max(acc.maxLat, property.latitude!)
            };
          },
          {
            minLng: validProperties[0].longitude!,
            maxLng: validProperties[0].longitude!,
            minLat: validProperties[0].latitude!,
            maxLat: validProperties[0].latitude!
          }
        );

        // Calcular centro
        const centerLng = (bounds.minLng + bounds.maxLng) / 2;
        const centerLat = (bounds.minLat + bounds.maxLat) / 2;

        setViewState(prev => ({
          ...prev,
          longitude: centerLng,
          latitude: centerLat
        }));
      }
    }
  }, [properties]);

  // Función para buscar dirección usando geocoding
  const searchLocation = async () => {
    if (!searchAddress.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          searchAddress
        )}.json?access_token=${MAPBOX_TOKEN}&limit=1`
      );
      
      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        const [longitude, latitude] = data.features[0].center;
        const placeName = data.features[0].place_name;
        
        setViewState({
          longitude,
          latitude,
          zoom: 14
        });
        
        // Notificar selección de ubicación
        onLocationSelect?.(longitude, latitude, placeName);
      }
    } catch (error) {
      console.error('Error en geocoding:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Manejar clic en el mapa
  const handleMapClick = useCallback((event: any) => {
    if (onLocationSelect) {
      const { lng, lat } = event.lngLat;
      onLocationSelect(lng, lat);
    }
  }, [onLocationSelect]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className={`relative ${isFullscreen ? 'w-screen h-screen' : 'w-full h-full'}`}>
      {showSearch && (
        <div className={`absolute top-4 left-4 z-10 bg-white rounded-lg shadow-lg ${
          isFullscreen ? 'p-2 max-w-xs' : 'p-3 max-w-sm'
        }`}>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Buscar ubicación..."
              value={searchAddress}
              onChange={(e) => setSearchAddress(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && searchLocation()}
              className={`flex-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                isFullscreen ? 'px-2 py-1 text-sm' : 'px-3 py-2'
              }`}
              disabled={isLoading}
            />
            <button
              onClick={searchLocation}
              disabled={isLoading}
              className={`bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 ${
                isFullscreen ? 'px-3 py-1 text-sm' : 'px-4 py-2'
              }`}
            >
              {isLoading ? '...' : 'Buscar'}
            </button>
          </div>
        </div>
      )}

      <div className="w-full h-full">
        <Map
          {...viewState}
          onMove={evt => setViewState(evt.viewState)}
          onClick={interactive ? handleMapClick : undefined}
          style={{ 
            width: '100%', 
            height: '100%',
            minHeight: isFullscreen ? '100vh' : '400px'
          }}
          mapStyle="mapbox://styles/mapbox/streets-v12"
          mapboxAccessToken={MAPBOX_TOKEN}
          interactive={interactive}
        >
        {/* Control de navegación */}
        <NavigationControl position="top-right" />
        
        {/* Control de geolocalización */}
        <GeolocateControl
          position="top-right"
          trackUserLocation
          showUserHeading
        />

        {/* Marcadores de propiedades */}
        {properties.map((property) => {
          // Usar coordenadas de latitude/longitude o location.lat/lng
          const latitude = property.latitude || property.location.lat;
          const longitude = property.longitude || property.location.lng;
          
          if (!latitude || !longitude) return null;
          
          return (
            <Marker
              key={property.id}
              longitude={longitude}
              latitude={latitude}
              anchor="bottom"
              onClick={e => {
                e.originalEvent.stopPropagation();
                setPopupInfo(property);
                onPropertySelect?.(property);
              }}
            >
              <div 
                className={`cursor-pointer transform transition-transform hover:scale-110 ${
                  selectedProperty?.id === property.id 
                    ? 'scale-125' 
                    : ''
                }`}
              >
                <div className="bg-blue-600 text-white px-2 py-1 rounded-full text-xs font-semibold shadow-lg">
                  {formatPrice(property.price)}
                </div>
                <MapPin 
                  className={`h-6 w-6 ${
                    selectedProperty?.id === property.id 
                      ? 'text-red-600' 
                      : 'text-blue-600'
                  }`} 
                />
              </div>
            </Marker>
          );
        })}

        {/* Popup de información */}
        {popupInfo && (
          <Popup
            longitude={popupInfo.longitude || popupInfo.location.lng!}
            latitude={popupInfo.latitude || popupInfo.location.lat!}
            anchor="top"
            onClose={() => {
              setPopupInfo(null);
              onPropertySelect?.(null);
            }}
            closeButton={false}
            className="property-popup"
          >
            <div className="p-3 max-w-xs">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-gray-900 text-sm">
                  {popupInfo.title}
                </h3>
                <button
                  onClick={() => {
                    setPopupInfo(null);
                    onPropertySelect?.(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              
              {popupInfo.images && popupInfo.images[0] && (
                <img
                  src={popupInfo.images[0]}
                  alt={popupInfo.title}
                  className="w-full h-24 object-cover rounded mb-2"
                />
              )}
              
              <div className="space-y-1 text-sm">
                <p className="font-semibold text-blue-600">
                  {formatPrice(popupInfo.price)}
                </p>
                <p className="text-gray-600">
                  {popupInfo.bedrooms} hab • {popupInfo.bathrooms} baños
                </p>
                <p className="text-gray-500 text-xs">
                  {popupInfo.location.address}
                </p>
              </div>
              
              <button 
                onClick={() => window.open(`/properties/${popupInfo.id}`, '_blank')}
                className="w-full mt-2 px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
              >
                Ver detalles
              </button>
            </div>
          </Popup>
        )}
        </Map>
      </div>
    </div>
  );
};

export default PropertyMap;
