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
    enableHighAccuracy: false,
    timeout: 5000,
    maximumAge: 0,
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
            errorMessage = 'Permiso de geolocalización denegado';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Información de ubicación no disponible';
            break;
          case error.TIMEOUT:
            errorMessage = 'Tiempo de espera agotado';
            break;
        }

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

  // Función para obtener coordenadas desde dirección (geocoding)
  const getCoordinatesFromAddress = useCallback(
    async (address: string): Promise<{ lat: number; lng: number } | null> => {
      try {
        const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || 'pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw';
        
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
            address
          )}.json?access_token=${MAPBOX_TOKEN}&limit=1`
        );
        
        const data = await response.json();
        
        if (data.features && data.features.length > 0) {
          const [lng, lat] = data.features[0].center;
          return { lat, lng };
        }
        
        return null;
      } catch (error) {
        console.error('Error en geocoding:', error);
        return null;
      }
    },
    []
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
