import React, { useState, useEffect } from 'react';
import { MapPin, Target, RefreshCw, ExternalLink, Copy, Check, AlertCircle, Shield } from 'lucide-react';
import { useGeolocation } from '../hooks/useGeolocation';
import PropertyMap from '../components/ui/PropertyMap';

const LocationTestPage: React.FC = () => {
  const geolocation = useGeolocation({
    enableHighAccuracy: true,
    timeout: 15000,
    maximumAge: 30000
  });
  
  const [address, setAddress] = useState<string>('');
  const [copied, setCopied] = useState(false);

  // Obtener dirección cuando cambien las coordenadas
  useEffect(() => {
    if (geolocation.latitude && geolocation.longitude) {
      geolocation.getAddressFromCoordinates(
        geolocation.latitude, 
        geolocation.longitude
      ).then(addr => {
        if (addr) {
          setAddress(addr);
        }
      });
    }
  }, [geolocation.latitude, geolocation.longitude]);

  const handleRefreshLocation = () => {
    setAddress('');
    geolocation.getCurrentPosition();
  };

  const copyCoordinates = () => {
    if (geolocation.latitude && geolocation.longitude) {
      const coords = `${geolocation.latitude}, ${geolocation.longitude}`;
      navigator.clipboard.writeText(coords);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const openInGoogleMaps = () => {
    if (geolocation.latitude && geolocation.longitude) {
      const url = `https://www.google.com/maps?q=${geolocation.latitude},${geolocation.longitude}`;
      window.open(url, '_blank');
    }
  };

  const getAccuracyColor = (accuracy: number | null) => {
    if (!accuracy) return 'text-gray-500';
    if (accuracy <= 10) return 'text-green-600';
    if (accuracy <= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getAccuracyText = (accuracy: number | null) => {
    if (!accuracy) return 'Desconocida';
    if (accuracy <= 10) return 'Excelente';
    if (accuracy <= 50) return 'Buena';
    return 'Pobre';
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            🧪 Prueba de Geolocalización
          </h1>
          <p className="text-gray-600">
            Verifica la precisión de tu ubicación comparándola con Google Maps
          </p>
        </div>

        {/* Instrucciones para habilitar ubicación */}
        {geolocation.error && geolocation.error.includes('denegado') && (
          <div className="mb-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <div className="flex items-start space-x-3">
              <Shield className="h-6 w-6 text-yellow-600 mt-1" />
              <div>
                <h3 className="text-lg font-semibold text-yellow-800 mb-3">
                  🔐 Permisos de Ubicación Bloqueados
                </h3>
                <p className="text-yellow-700 mb-4">
                  Para usar esta función, necesitas habilitar los permisos de ubicación:
                </p>
                
                <div className="space-y-4">
                  <div className="bg-white p-4 rounded border">
                    <h4 className="font-semibold text-gray-900 mb-2">📱 En Chrome/Edge:</h4>
                    <ol className="text-sm text-gray-700 space-y-1 list-decimal list-inside">
                      <li>Haz clic en el ícono 🔒 o 🛡️ junto a la URL</li>
                      <li>Selecciona "Permitir" para Ubicación</li>
                      <li>Recarga la página</li>
                    </ol>
                  </div>
                  
                  <div className="bg-white p-4 rounded border">
                    <h4 className="font-semibold text-gray-900 mb-2">🦊 En Firefox:</h4>
                    <ol className="text-sm text-gray-700 space-y-1 list-decimal list-inside">
                      <li>Haz clic en el ícono 🛡️ en la barra de direcciones</li>
                      <li>Encuentra "Ubicación" y cambia a "Permitir"</li>
                      <li>Recarga la página</li>
                    </ol>
                  </div>
                  
                  <div className="bg-white p-4 rounded border">
                    <h4 className="font-semibold text-gray-900 mb-2">🍎 En Safari:</h4>
                    <ol className="text-sm text-gray-700 space-y-1 list-decimal list-inside">
                      <li>Ve a Safari → Preferencias → Sitios web</li>
                      <li>Selecciona "Ubicación" en la barra lateral</li>
                      <li>Cambia este sitio a "Permitir"</li>
                    </ol>
                  </div>
                </div>
                
                <button
                  onClick={handleRefreshLocation}
                  className="mt-4 flex items-center space-x-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>Intentar Nuevamente</span>
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Panel de información */}
          <div className="space-y-6">
            {/* Estado de geolocalización */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  📍 Tu Ubicación
                </h2>
                <button
                  onClick={handleRefreshLocation}
                  disabled={geolocation.loading}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  <RefreshCw className={`h-4 w-4 ${geolocation.loading ? 'animate-spin' : ''}`} />
                  <span>Actualizar</span>
                </button>
              </div>

              {geolocation.loading && (
                <div className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg">
                  <Target className="h-5 w-5 text-blue-600 animate-pulse" />
                  <span className="text-blue-800">Obteniendo ubicación...</span>
                </div>
              )}

              {geolocation.error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                    <div>
                      <p className="text-red-800 font-semibold">❌ {geolocation.error}</p>
                      <p className="text-red-600 text-sm mt-2">
                        💡 Mira las instrucciones arriba para habilitar la ubicación
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {geolocation.latitude && geolocation.longitude && (
                <div className="space-y-4">
                  {/* Coordenadas */}
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-green-800">📐 Coordenadas</h3>
                      <button
                        onClick={copyCoordinates}
                        className="flex items-center space-x-1 text-green-600 hover:text-green-800 transition-colors"
                      >
                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        <span className="text-sm">{copied ? 'Copiado' : 'Copiar'}</span>
                      </button>
                    </div>
                    <p className="text-green-700 font-mono">
                      Lat: {geolocation.latitude.toFixed(8)}
                    </p>
                    <p className="text-green-700 font-mono">
                      Lng: {geolocation.longitude.toFixed(8)}
                    </p>
                  </div>

                  {/* Precisión */}
                  {geolocation.accuracy && (
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h3 className="font-semibold text-gray-800 mb-2">🎯 Precisión</h3>
                      <div className="flex items-center space-x-2">
                        <span className={`font-semibold ${getAccuracyColor(geolocation.accuracy)}`}>
                          ±{geolocation.accuracy.toFixed(0)} metros
                        </span>
                        <span className={`text-sm ${getAccuracyColor(geolocation.accuracy)}`}>
                          ({getAccuracyText(geolocation.accuracy)})
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Dirección */}
                  {address && (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <h3 className="font-semibold text-blue-800 mb-2">🏠 Dirección</h3>
                      <p className="text-blue-700">{address}</p>
                    </div>
                  )}

                  {/* Botones de acción */}
                  <div className="flex space-x-3">
                    <button
                      onClick={openInGoogleMaps}
                      className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <ExternalLink className="h-4 w-4" />
                      <span>Ver en Google Maps</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Información de comparación */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                🔍 Comparar con Google Maps
              </h2>
              <div className="space-y-3 text-sm text-gray-600">
                <p>
                  <strong>1.</strong> Haz clic en "Ver en Google Maps" arriba
                </p>
                <p>
                  <strong>2.</strong> Compara si la ubicación coincide con donde realmente estás
                </p>
                <p>
                  <strong>3.</strong> Si no coincide, verifica:
                </p>
                <ul className="ml-6 space-y-1">
                  <li>• Que tengas GPS habilitado</li>
                  <li>• Que estés en un lugar con buena señal</li>
                  <li>• Que el navegador tenga permisos de ubicación</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Mapa */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-4 border-b">
              <h2 className="text-xl font-semibold text-gray-900">
                🗺️ Mapa de Ubicación
              </h2>
            </div>
            <div className="h-[600px]">
              {geolocation.latitude && geolocation.longitude ? (
                <PropertyMap
                  properties={[]}
                  interactive={true}
                  showSearch={true}
                  isFullscreen={false}
                  initialCenter={{
                    latitude: geolocation.latitude,
                    longitude: geolocation.longitude,
                    zoom: 18
                  }}
                />
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <MapPin className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>Obteniendo ubicación...</p>
                    {geolocation.error && (
                      <p className="text-red-500 text-sm mt-2">
                        Verifica los permisos de ubicación
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocationTestPage;
