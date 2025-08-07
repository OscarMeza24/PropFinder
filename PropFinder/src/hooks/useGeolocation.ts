import { useState, useEffect, useCallback } from 'react';

interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  error: string | null;
  loading: boolean;
}

interface GeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}

export const useGeolocation = (options: GeolocationOptions = {}) => {
  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    accuracy: null,
    error: null,
    loading: false,
  });

  const defaultOptions = {
    enableHighAccuracy: true,
    timeout: 15000,
    maximumAge: 60000,
    ...options,
  };

  const getCurrentPosition = useCallback(() => {
    if (!navigator.geolocation) {
      setState(prev => ({
        ...prev,
        error: 'Geolocalización no soportada por este navegador',
        loading: false,
      }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log('🎯 UBICACIÓN OBTENIDA:');
        console.log(`📍 Latitud: ${position.coords.latitude}`);
        console.log(`📍 Longitud: ${position.coords.longitude}`);
        console.log(`🎯 Precisión: ${position.coords.accuracy} metros`);
        console.log(`⏰ Timestamp: ${new Date(position.timestamp).toLocaleString()}`);
        
        setState({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          error: null,
          loading: false,
        });
      },
      (error) => {
        let errorMessage = 'Error al obtener ubicación';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Permiso de geolocalización denegado. Habilita la ubicación en tu navegador.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Información de ubicación no disponible. Verifica tu conexión GPS.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Tiempo de espera agotado. Intenta nuevamente.';
            break;
        }

        console.error('❌ Error de geolocalización:', errorMessage);
        console.error('🔧 Detalles del error:', error);

        setState(prev => ({
          ...prev,
          error: errorMessage,
          loading: false,
        }));
      },
      defaultOptions
    );
  }, [defaultOptions.enableHighAccuracy, defaultOptions.timeout, defaultOptions.maximumAge]);

  // Función para calcular distancia entre dos puntos (en km)
  const calculateDistance = useCallback(
    (lat2: number, lon2: number): number | null => {
      if (state.latitude === null || state.longitude === null) {
        return null;
      }

      const R = 6371; // Radio de la Tierra en km
      const dLat = toRad(lat2 - state.latitude);
      const dLon = toRad(lon2 - state.longitude);
      const lat1Rad = toRad(state.latitude);
      const lat2Rad = toRad(lat2);

      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.sin(dLon / 2) *
          Math.sin(dLon / 2) *
          Math.cos(lat1Rad) *
          Math.cos(lat2Rad);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const d = R * c;

      return d;
    },
    [state.latitude, state.longitude]
  );

  // Función para obtener dirección desde coordenadas (geocoding inverso)
  const getAddressFromCoordinates = useCallback(
    async (lat: number, lng: number): Promise<string | null> => {
      try {
        const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || 'pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw';
        
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}`
        );
        
        const data = await response.json();
        
        if (data.features && data.features.length > 0) {
          return data.features[0].place_name;
        }
        
        return null;
      } catch (error) {
        console.error('Error en geocoding inverso:', error);
        return null;
      }
    },
    []
  );

  // Función para normalizar direcciones ecuatorianas
  const normalizeEcuadorianAddress = useCallback((address: string): string => {
    if (!address) return '';
    
    let normalized = address.toLowerCase();
    
    // Normalizar abreviaciones de calles específicas ANTES de otros reemplazos
    normalized = normalized.replace(/\bc\.\s*(\d+)/g, 'calle $1'); // C. 7 → calle 7
    normalized = normalized.replace(/\bc(\d+)/g, 'calle $1'); // C7 → calle 7
    
    // Reemplazos comunes para direcciones ecuatorianas
    const replacements: Record<string, string> = {
      'calle': 'calle',
      'avenida': 'avenida',
      'av.': 'avenida',
      'av ': 'avenida ',
      'avda': 'avenida',
      'callejon': 'callejón',
      'pasaje': 'pasaje',
      'sector': 'sector',
      'urbanizacion': 'urbanización',
      'urb': 'urbanización',
      'ciudadela': 'ciudadela',
      'villa': 'villa',
      'barrio': 'barrio',
      'conjunto': 'conjunto',
      'mz': 'manzana',
      'manzana': 'manzana',
      'lote': 'lote',
      'casa': 'casa',
      'edificio': 'edificio',
      'piso': 'piso',
      'depto': 'departamento',
      'apt': 'apartamento',
      '#': 'numero',
      'no.': 'numero',
      'num.': 'numero'
    };
    
    // Aplicar reemplazos
    Object.entries(replacements).forEach(([key, value]) => {
      const regex = new RegExp(`\\b${key}\\b`, 'gi');
      normalized = normalized.replace(regex, value);
    });
    
    // Normalizar números de calles
    normalized = normalized.replace(/(\d+)(st|nd|rd|th)?/g, '$1');
    
    return normalized.trim();
  }, []);

  // Función para obtener coordenadas desde dirección (geocoding mejorado)
  const getCoordinatesFromAddress = useCallback(
    async (address: string): Promise<{ lat: number; lng: number; place_name?: string; accuracy?: string } | null> => {
      try {
        const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || 'pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw';
        
        // Separar la dirección en componentes
        const addressParts = address.split(',').map(part => part.trim());
        const fullAddress = addressParts[0] || '';
        const city = addressParts[1] || 'Manta';
        const state = addressParts[2] || 'Manabí';
        const country = addressParts[3] || 'Ecuador';
        
        // Normalizar la dirección
        const normalizedAddress = normalizeEcuadorianAddress(fullAddress);
        
        // Construir múltiples estrategias de búsqueda
        const searchQueries: string[] = [];
        
        if (fullAddress) {
          // Estrategia 1: Dirección completa original
          searchQueries.push(`${fullAddress}, ${city}, ${state}, ${country}`);
          
          // Estrategia 2: Dirección normalizada
          if (normalizedAddress && normalizedAddress !== fullAddress.toLowerCase()) {
            searchQueries.push(`${normalizedAddress}, ${city}, ${state}, ${country}`);
          }
          
          // Estrategia 3: Solo dirección y ciudad
          searchQueries.push(`${fullAddress}, ${city}, ${country}`);
          
          // Estrategia 4: Manejo especial para intersecciones
          if (fullAddress.toLowerCase().includes('calle') && fullAddress.toLowerCase().includes('avenida')) {
            const parts = fullAddress.toLowerCase().split(/\s+/);
            const streetParts: string[] = [];
            
            for (let i = 0; i < parts.length; i++) {
              if (parts[i] === 'calle' && parts[i + 1]) {
                streetParts.push(`calle ${parts[i + 1]}`);
              }
              if (parts[i] === 'avenida' && parts[i + 1]) {
                streetParts.push(`avenida ${parts[i + 1]}`);
              }
            }
            
            if (streetParts.length > 0) {
              searchQueries.push(`${streetParts.join(' y ')}, ${city}, ${state}, ${country}`);
              searchQueries.push(`${streetParts.join(' esquina ')}, ${city}, ${state}, ${country}`);
            }
          }
        }
        
        // Estrategias de respaldo
        searchQueries.push(`${city}, ${state}, ${country}`);
        searchQueries.push(`${city}, ${country}`);
        
        console.log(`🗺️ Geocodificando: "${address}"`);
        console.log(`📋 Intentando ${searchQueries.length} estrategias...`);
        
        for (let i = 0; i < searchQueries.length; i++) {
          const query = searchQueries[i];
          
          try {
            console.log(`🔍 Estrategia ${i + 1}: ${query}`);
            
            // Configurar parámetros de búsqueda
            const params = new URLSearchParams({
              access_token: MAPBOX_TOKEN,
              country: 'EC',
              limit: '5',
              language: 'es'
            });
            
            // Tipos de lugares según la estrategia
            if (i < 3 && fullAddress) {
              params.append('types', 'address,poi');
            } else {
              params.append('types', 'place,locality,neighborhood,address');
            }
            
            // Añadir proximidad para ciudades conocidas
            if (city.toLowerCase().includes('manta')) {
              params.append('proximity', '-80.7090,-0.9548');
            } else if (city.toLowerCase().includes('quito')) {
              params.append('proximity', '-78.4678,-0.1807');
            } else if (city.toLowerCase().includes('guayaquil')) {
              params.append('proximity', '-79.8862,-2.1894');
            }
            
            const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?${params.toString()}`;
            const response = await fetch(url);
            
            if (!response.ok) {
              console.log(`❌ Error HTTP ${response.status}`);
              continue;
            }
            
            const data = await response.json();
            
            if (data.features && data.features.length > 0) {
              const feature = data.features[0];
              const [lng, lat] = feature.center;
              
              // Validar que esté en Ecuador
              const isInEcuador = lat >= -5 && lat <= 2 && lng >= -82 && lng <= -75;
              
              if (isInEcuador) {
                console.log(`✅ Coordenadas encontradas: ${lat}, ${lng}`);
                console.log(`📍 Lugar: ${feature.place_name}`);
                
                return { 
                  lat, 
                  lng,
                  place_name: feature.place_name,
                  accuracy: feature.properties?.accuracy || 'unknown'
                };
              } else {
                console.log(`⚠️ Coordenadas fuera de Ecuador: ${lat}, ${lng}`);
              }
            }
            
          } catch (err) {
            console.error(`❌ Error con query "${query}":`, err);
            continue;
          }
          
          // Pausa entre intentos
          if (i < searchQueries.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 300));
          }
        }
        
        console.log('❌ No se encontraron coordenadas válidas');
        return null;
      } catch (error) {
        console.error('Error en geocoding:', error);
        return null;
      }
    },
    [normalizeEcuadorianAddress]
  );

  useEffect(() => {
    getCurrentPosition();
  }, [getCurrentPosition]);

  return {
    ...state,
    getCurrentPosition,
    calculateDistance,
    getAddressFromCoordinates,
    getCoordinatesFromAddress,
    normalizeEcuadorianAddress,
  };
};

// Función auxiliar para convertir grados a radianes
const toRad = (value: number): number => {
  return (value * Math.PI) / 180;
};

// Hook personalizado para búsqueda por proximidad
export const useProximitySearch = () => {
  const geolocation = useGeolocation();

  const searchNearby = useCallback(
    (properties: any[], radiusKm: number = 10) => {
      if (!geolocation.latitude || !geolocation.longitude) {
        return properties;
      }

      return properties
        .map(property => {
          if (!property.latitude || !property.longitude) {
            return { ...property, distance: null };
          }

          const distance = geolocation.calculateDistance(
            property.latitude,
            property.longitude
          );

          return { ...property, distance };
        })
        .filter(property => property.distance === null || property.distance <= radiusKm)
        .sort((a, b) => {
          if (a.distance === null) return 1;
          if (b.distance === null) return -1;
          return a.distance - b.distance;
        });
    },
    [geolocation]
  );

  return {
    ...geolocation,
    searchNearby,
  };
};
