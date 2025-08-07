import React, { useState } from 'react';
import Map, { Marker, Popup, NavigationControl, GeolocateControl } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
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
  initialCenter?: {
    latitude: number;
    longitude: number;
    zoom: number;
  };
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
  isFullscreen = false,
  initialCenter
}) => {
  const [viewState, setViewState] = useState<ViewState>({
    longitude: initialCenter?.longitude || -80.7090, // Centro de Manta, Ecuador
    latitude: initialCenter?.latitude || -0.9548,    // Centro de Manta, Ecuador  
    zoom: initialCenter?.zoom || 13
  });
  
  const [popupInfo, setPopupInfo] = useState<Property | null>(null);
  const [searchAddress, setSearchAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchedLocation, setSearchedLocation] = useState<{
    latitude: number;
    longitude: number;
    address: string;
    success: boolean;
  } | null>(null);
  const [searchError, setSearchError] = useState<string>('');

  // Función para formatear precios
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-EC', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  // Función SIMPLE y DIRECTA para buscar SOLO EN MANTA
  const searchLocation = async () => {
    if (!searchAddress.trim()) return;

    setIsLoading(true);
    setSearchError('');
    
    try {
      console.log(`🔍 BUSCANDO EN MANTA: "${searchAddress}"`);
      
      // Crear consulta simple y directa
      const query = `${searchAddress} manta manabí ecuador`;
      
      const params = new URLSearchParams({
        access_token: MAPBOX_TOKEN,
        country: 'EC',
        limit: '5',
        proximity: '-80.7090,-0.9548',
        types: 'address,poi,place'
      });
      
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?${params.toString()}`;
      
      console.log(`🌐 URL: ${url}`);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      console.log(`📊 Resultados obtenidos:`, data);
      
      if (data.features && data.features.length > 0) {
        // Filtrar SOLO resultados que contengan "manta" en el nombre
        const mantaResults = data.features.filter((feature: any) => {
          const placeName = feature.place_name.toLowerCase();
          return placeName.includes('manta');
        });
        
        console.log(`🎯 Resultados en Manta encontrados:`, mantaResults.length);
        
        if (mantaResults.length > 0) {
          const feature = mantaResults[0];
          const [longitude, latitude] = feature.center;
          const placeName = feature.place_name;
          
          console.log(`✅ UBICACIÓN: ${latitude}, ${longitude}`);
          console.log(`📍 DIRECCIÓN: ${placeName}`);
          
          // Centrar el mapa
          setViewState(prev => ({
            ...prev,
            longitude,
            latitude,
            zoom: 17,
            transitionDuration: 1000
          }));
          
          // Marcar la ubicación
          setSearchedLocation({
            latitude,
            longitude,
            address: placeName,
            success: true
          });
          
          setSearchError('');
          onLocationSelect?.(longitude, latitude, placeName);
          return;
        }
      }
      
      // No se encontró nada
      setSearchError(`❌ No se encontró "${searchAddress}" en Manta`);
      setSearchedLocation({
        latitude: 0,
        longitude: 0,
        address: searchAddress,
        success: false
      });
      
    } catch (error) {
      console.error('❌ Error:', error);
      setSearchError('Error de conexión');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`relative ${isFullscreen ? 'h-screen' : 'w-full h-full min-h-[400px]'}`}>
      {/* Barra de búsqueda */}
      {showSearch && (
        <div className="absolute top-4 left-4 z-10 flex items-center space-x-2">
          <div className="bg-white rounded-lg shadow-lg p-2 flex items-center space-x-2 min-w-80">
            <input
              type="text"
              value={searchAddress}
              onChange={(e) => setSearchAddress(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && searchLocation()}
              placeholder="Buscar en Manta (ej: calle 7 avenida 11)"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            />
            <button
              onClick={searchLocation}
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md transition-colors"
            >
              {isLoading ? '🔄' : '🔍'}
            </button>
          </div>
          
          {/* Resultado de búsqueda */}
          {searchedLocation && searchedLocation.success && (
            <div className="bg-green-100 border border-green-300 text-green-800 px-3 py-2 rounded-lg text-sm">
              ✅ Encontrado: {searchedLocation.address}
            </div>
          )}
          
          {/* Botón para limpiar resultado */}
          {(searchedLocation || searchError) && (
            <button
              onClick={() => {
                setSearchedLocation(null);
                setSearchError('');
              }}
              className="bg-gray-100 hover:bg-gray-200 text-gray-600 p-2 rounded-md transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      )}

      {/* Error de búsqueda */}
      {searchError && (
        <div className="absolute top-20 left-4 z-10 bg-red-100 border border-red-300 text-red-800 px-4 py-3 rounded-lg max-w-md text-sm">
          {searchError}
        </div>
      )}

      {/* Mapa */}
      <Map
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        style={{ width: '100%', height: '100%' }}
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
          showAccuracyCircle={true}
        />

        {/* Marcador para ubicación buscada */}
        {searchedLocation && searchedLocation.success && (
          <Marker
            longitude={searchedLocation.longitude}
            latitude={searchedLocation.latitude}
            anchor="bottom"
          >
            <div className="flex flex-col items-center">
              {/* Efecto de pulso en el fondo */}
              <div className="absolute inset-0 bg-green-400 rounded-full animate-ping opacity-50 scale-150 -z-10"></div>
              
              {/* Etiqueta principal */}
              <div className="bg-green-600 text-white px-4 py-2 rounded-full text-sm font-bold shadow-xl mb-2 relative border-2 border-green-700 animate-pulse">
                🎯 Resultado de búsqueda
                {/* Flecha apuntando hacia abajo */}
                <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-green-600 border-r border-b border-green-700 rotate-45"></div>
              </div>
              
              {/* Ícono del marcador más grande y prominente */}
              <div className="relative">
                <MapPin className="h-12 w-12 text-green-600 drop-shadow-2xl filter animate-bounce" />
                {/* Sombra del marcador */}
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-6 h-2 bg-black opacity-20 rounded-full blur-sm"></div>
              </div>
            </div>
          </Marker>
        )}

        {/* Popup para ubicación buscada */}
        {searchedLocation && searchedLocation.success && (
          <Popup
            longitude={searchedLocation.longitude}
            latitude={searchedLocation.latitude}
            anchor="top"
            onClose={() => setSearchedLocation(null)}
            closeButton={true}
            className="search-result-popup"
          >
            <div className="p-3 max-w-xs">
              <div className="flex items-start space-x-2">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    🎯
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 text-sm mb-1">
                    Resultado de búsqueda
                  </h3>
                  <p className="text-xs text-gray-600 break-words">
                    {searchedLocation.address}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Lat: {searchedLocation.latitude.toFixed(6)}<br/>
                    Lng: {searchedLocation.longitude.toFixed(6)}
                  </p>
                </div>
              </div>
            </div>
          </Popup>
        )}

        {/* Marcadores de propiedades */}
        {properties.map((property) => {
          const latitude = property.latitude || property.location.lat;
          const longitude = property.longitude || property.location.lng;
          
          if (!latitude || !longitude) {
            return null;
          }
          
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
                className={`cursor-pointer transform transition-all duration-200 hover:scale-110 ${
                  selectedProperty?.id === property.id 
                    ? 'scale-125 z-10' 
                    : 'hover:z-10'
                }`}
                style={{ zIndex: selectedProperty?.id === property.id ? 1000 : 1 }}
              >
                {/* Precio como etiqueta */}
                <div className={`px-3 py-1 rounded-full text-xs font-bold shadow-xl border-2 transition-all duration-200 ${
                  selectedProperty?.id === property.id 
                    ? 'bg-red-600 text-white border-red-800 animate-pulse' 
                    : 'bg-blue-600 text-white border-blue-800 hover:bg-blue-700'
                }`}>
                  {formatPrice(property.price)}
                  {/* Pequeña flecha apuntando hacia abajo */}
                  <div className={`absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 rotate-45 ${
                    selectedProperty?.id === property.id ? 'bg-red-600' : 'bg-blue-600'
                  }`}></div>
                </div>
                
                {/* Ícono del marcador */}
                <div className="flex justify-center mt-1">
                  <MapPin 
                    className={`h-7 w-7 drop-shadow-lg transition-colors duration-200 ${
                      selectedProperty?.id === property.id 
                        ? 'text-red-600' 
                        : 'text-blue-600 hover:text-blue-700'
                    }`} 
                  />
                </div>
              </div>
            </Marker>
          );
        })}

        {/* Popup para propiedades */}
        {popupInfo && (
          <Popup
            anchor="top"
            longitude={Number(popupInfo.longitude || popupInfo.location.lng)}
            latitude={Number(popupInfo.latitude || popupInfo.location.lat)}
            onClose={() => setPopupInfo(null)}
          >
            <div className="p-2 max-w-xs">
              <h3 className="font-semibold text-gray-900 mb-1">{popupInfo.title}</h3>
              <p className="text-sm text-gray-600 mb-2">{formatPrice(popupInfo.price)}</p>
              <p className="text-xs text-gray-500">
                {popupInfo.bedrooms} hab • {popupInfo.bathrooms} baños • {popupInfo.area}m²
              </p>
            </div>
          </Popup>
        )}
      </Map>
    </div>
  );
};

export default PropertyMap;
