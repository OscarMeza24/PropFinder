import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/auth-context-utils';
import { useProperty } from '../contexts/PropertyContext';
import { Plus, X, MapPin, Target } from 'lucide-react';
import PropertyMap from '../components/ui/PropertyMap';
import { useGeolocation } from '../hooks/useGeolocation';

interface PropertyFormData {
  title: string;
  description: string;
  price: number;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  bedrooms: number;
  bathrooms: number;
  square_feet: number;
  property_type: 'house' | 'apartment' | 'condo' | 'townhouse' | 'land' | 'commercial';
  images: string[];
  features: string[];
  latitude?: number;
  longitude?: number;
}

const CreateProperty: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { createProperty } = useProperty();
  const { getCoordinatesFromAddress } = useGeolocation();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showMap, setShowMap] = useState(false);
  const [isGeolocating, setIsGeolocating] = useState(false);

  const [formData, setFormData] = useState<PropertyFormData>({
    title: '',
    description: '',
    price: 0,
    address: '',
    city: '',
    state: '',
    zip_code: '',
    bedrooms: 1,
    bathrooms: 1,
    square_feet: 0,
    property_type: 'house',
    images: [],
    features: [],
    latitude: undefined,
    longitude: undefined,
  });

  const [newFeature, setNewFeature] = useState('');
  const [newImage, setNewImage] = useState('');

  const addFeature = () => {
    if (newFeature.trim() && !formData.features.includes(newFeature.trim())) {
      setFormData(prev => ({
        ...prev,
        features: [...prev.features, newFeature.trim()]
      }));
      setNewFeature('');
    }
  };

  const removeFeature = (featureToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter(feature => feature !== featureToRemove)
    }));
  };

  const addImage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newImage.trim() && !formData.images.includes(newImage.trim())) {
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, newImage.trim()]
      }));
      setNewImage('');
    }
  };

  const removeImage = (imageUrl: string) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter(img => img !== imageUrl)
    }));
  };

  // Función para geocodificar la dirección automáticamente con mejoras
  const handleGeocodeAddress = async () => {
    if (!formData.address || !formData.city) {
      setError('Completa al menos la dirección y la ciudad antes de geocodificar');
      return;
    }

    setIsGeolocating(true);
    setError('');
    
    try {
      // Función para normalizar direcciones ecuatorianas
      function normalizeEcuadorianAddress(address: string): string {
        let normalized = address.toLowerCase().trim();
        
        // Expandir abreviaciones específicas de Ecuador
        normalized = normalized.replace(/\bc\.\s*(\d+)/g, 'calle $1'); // C. 7 → calle 7
        normalized = normalized.replace(/\bc(\d+)/g, 'calle $1'); // C7 → calle 7
        normalized = normalized.replace(/\bclle\b/g, 'calle');
        normalized = normalized.replace(/\bav\.\s*/g, 'avenida '); // Av. → avenida
        normalized = normalized.replace(/\bavda\b/g, 'avenida');
        
        // Manejar nombres específicos de calles
        normalized = normalized.replace(/24 de mayo/g, 'veinticuatro de mayo');
        normalized = normalized.replace(/13 de abril/g, 'trece de abril');
        normalized = normalized.replace(/4 de noviembre/g, 'cuatro de noviembre');
        
        // Normalizar conectores de intersección
        normalized = normalized.replace(/\s+(y|esquina|con|intersección|entre)\s+/g, ' y ');
        
        return normalized.trim();
      }
      
      const baseAddress = `${formData.address}, ${formData.city}`;
      const normalized = normalizeEcuadorianAddress(baseAddress);
      
      // SOLO BUSCAR EN MANTA - Construir búsquedas que SIEMPRE incluyan Manta
      const addressVariations = [];
      
      console.log(`🗺️ Geocodificando SOLO EN MANTA: "${formData.address}" en ${formData.city}`);
      console.log(`🔄 Normalizada: "${normalized}"`);
      
      // Estrategia 1: Con Manta explícito desde el inicio
      addressVariations.push(`${normalized} manta manabí ecuador`);
      addressVariations.push(`${normalized} manta ecuador`);
      addressVariations.push(`${formData.address} centro manta`);
      
      // Estrategia 2: Para intersecciones, formatos específicos CON MANTA
      if (normalized.includes(' y ')) {
        const parts = normalized.split(' y ');
        if (parts.length === 2) {
          const street1 = parts[0].trim();
          const street2 = parts[1].trim();
          
          addressVariations.push(`${street1} esquina ${street2} manta`);
          addressVariations.push(`${street1} con ${street2} manta manabí`);
          addressVariations.push(`intersección ${street1} ${street2} manta`);
        }
      }
      
      // Estrategia 3: Para calles numéricas específicas de Manta
      const streetNumberMatch = normalized.match(/calle (\d+)/);
      if (streetNumberMatch) {
        const streetNum = streetNumberMatch[1];
        addressVariations.push(`c ${streetNum} manta manabí`);
        addressVariations.push(`calle numero ${streetNum} manta`);
      }
      
      // Remover duplicados manteniendo orden
      const uniqueVariations = [...new Set(addressVariations)];
      
      console.log(`📋 Probando ${uniqueVariations.length} variaciones SOLO EN MANTA...`);
      
      let coords = null;
      let successfulQuery = '';
      
      for (let i = 0; i < uniqueVariations.length; i++) {
        const addressVariation = uniqueVariations[i];
        console.log(`🔍 Intento ${i + 1}: "${addressVariation}"`);
        
        // Usar la función mejorada de geolocalización
        coords = await getCoordinatesFromAddress(addressVariation);
        
        if (coords) {
          // Verificar que las coordenadas estén realmente en Manta
          const mantaLat = -0.9548;
          const mantaLng = -80.7090;
          const distance = Math.sqrt(
            Math.pow(coords.lat - mantaLat, 2) + Math.pow(coords.lng - mantaLng, 2)
          );
          
          // Solo aceptar coordenadas dentro de un radio de 30km de Manta
          if (distance < 0.3) {
            successfulQuery = addressVariation;
            console.log(`✅ Éxito EN MANTA con: "${addressVariation}"`);
            break;
          } else {
            console.log(`❌ Coordenadas fuera de Manta: ${coords.lat}, ${coords.lng}`);
            coords = null; // Descartar resultado fuera de Manta
          }
        }
      }
      
      if (coords) {
        setFormData(prev => ({
          ...prev,
          latitude: coords.lat,
          longitude: coords.lng
        }));
        setShowMap(true);
        
        // Mostrar mensaje de éxito con información detallada
        const successMessage = coords.place_name 
          ? `✅ Ubicación encontrada: ${coords.place_name}`
          : `✅ Coordenadas obtenidas: ${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`;
        
        console.log(successMessage);
        console.log(`🎯 Query exitosa: "${successfulQuery}"`);
        
      } else {
        setError(`❌ No se pudo geocodificar "${formData.address}, ${formData.city}". 
                 Verifica la dirección o usa el mapa para seleccionar manualmente la ubicación.
                 💡 Tip: Intenta con una dirección más específica como "calle 7 y avenida 24 de mayo"`);
      }
    } catch (error) {
      console.error('❌ Error geocodificando:', error);
      setError('Error al obtener coordenadas. Verifica tu conexión e intenta nuevamente.');
    } finally {
      setIsGeolocating(false);
    }
  };

  // Función para manejar selección manual en el mapa
  const handleMapLocationSelect = (lng: number, lat: number, placeName?: string) => {
    setFormData(prev => ({
      ...prev,
      latitude: lat,
      longitude: lng
    }));
    
    if (placeName && !formData.address) {
      // Si no hay dirección, intentar usar el nombre del lugar
      const addressParts = placeName.split(', ');
      if (addressParts.length >= 3) {
        setFormData(prev => ({
          ...prev,
          address: addressParts[0] || '',
          city: addressParts[1] || prev.city,
          state: addressParts[2] || prev.state
        }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Validaciones básicas
    if (!formData.title || formData.title.length < 5) {
      setError('El título debe tener al menos 5 caracteres');
      setIsLoading(false);
      return;
    }

    if (!formData.description || formData.description.length < 20) {
      setError('La descripción debe tener al menos 20 caracteres');
      setIsLoading(false);
      return;
    }

    if (formData.price <= 0) {
      setError('El precio debe ser mayor a 0');
      setIsLoading(false);
      return;
    }

    if (formData.images.length === 0) {
      setError('Debes agregar al menos una imagen');
      setIsLoading(false);
      return;
    }

    try {
      await createProperty({
        ...formData,
        property_type: formData.property_type,
        latitude: formData.latitude,
        longitude: formData.longitude
      });
      navigate('/agent/dashboard');
    } catch (error) {
      console.error('Error creating property:', error);
      setError('Error al crear la propiedad. Intenta nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  // Verificar si el usuario es un agente
  console.log('🔍 Debug - User object:', user);
  console.log('🔍 Debug - User role:', user?.role);
  console.log('🔍 Debug - Is agent?:', user?.role === 'agent');
  
  if (user?.role !== 'agent') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Acceso no autorizado</h2>
          <p className="text-gray-600 mb-6">Solo los agentes pueden crear propiedades.</p>
          <button
            onClick={() => navigate('/')}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Nueva Propiedad</h1>
          <p className="text-gray-600 mt-2">
            Agrega una nueva propiedad a tu catálogo
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Información Básica</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Título de la Propiedad *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ej: Casa moderna con jardín en zona residencial"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Describe detalladamente la propiedad..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Precio *
                </label>
                <input
                  type="number"
                  value={formData.price || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: Number(e.target.value) }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="150000"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Propiedad *
                </label>
                <select
                  value={formData.property_type}
                  onChange={(e) => setFormData(prev => ({ ...prev, property_type: e.target.value as PropertyFormData['property_type'] }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="house">Casa</option>
                  <option value="apartment">Apartamento</option>
                  <option value="condo">Condominio</option>
                  <option value="townhouse">Casa Adosada</option>
                  <option value="land">Terreno</option>
                  <option value="commercial">Comercial</option>
                </select>
              </div>
            </div>
          </div>

          {/* Ubicación */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Ubicación</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dirección *
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ej: Calle 7 Avenida 11, Sector Centro, Av. 4 de Noviembre"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  💡 Ejemplos: "Calle 7 Avenida 11", "Av. 4 de Noviembre", "Malecón de Manta", "Sector Los Esteros"
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ciudad *
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ej: Manta, Quito, Guayaquil"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estado/Departamento *
                </label>
                <input
                  type="text"
                  value={formData.state}
                  onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ej: Manabí, Pichincha, Guayas"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Código Postal
                </label>
                <input
                  type="text"
                  value={formData.zip_code || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, zip_code: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="110111"
                />
              </div>

              {/* Botones de geocodificación */}
              <div className="md:col-span-2 pt-4 border-t">
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={handleGeocodeAddress}
                    disabled={isGeolocating || !formData.address || !formData.city}
                    className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isGeolocating ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <Target className="h-4 w-4" />
                    )}
                    <span>Obtener Coordenadas</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowMap(!showMap)}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <MapPin className="h-4 w-4" />
                    <span>{showMap ? 'Ocultar Mapa' : 'Mostrar Mapa'}</span>
                  </button>

                  {formData.latitude && formData.longitude && (
                    <div className="flex items-center space-x-2 px-3 py-2 bg-green-100 text-green-700 rounded-lg">
                      <MapPin className="h-4 w-4" />
                      <span className="text-sm">
                        Coordenadas: {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}
                      </span>
                    </div>
                  )}
                </div>

                {showMap && (
                  <div className="mt-4 rounded-lg overflow-hidden border border-gray-200" style={{ height: '400px' }}>
                    <PropertyMap
                      properties={formData.latitude && formData.longitude ? [{
                        id: 'temp',
                        title: formData.title || 'Nueva Propiedad',
                        price: formData.price || 0,
                        type: formData.property_type as any,
                        bedrooms: formData.bedrooms,
                        bathrooms: formData.bathrooms,
                        area: formData.square_feet,
                        location: {
                          address: formData.address,
                          city: formData.city,
                          state: formData.state,
                          zipCode: formData.zip_code,
                          lat: formData.latitude,
                          lng: formData.longitude
                        },
                        images: formData.images,
                        description: formData.description,
                        features: formData.features,
                        amenities: formData.features,
                        agent: {
                          id: user?.id?.toString() || '',
                          name: user?.name || '',
                          email: user?.email || '',
                          phone: user?.phone || ''
                        },
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                        latitude: formData.latitude,
                        longitude: formData.longitude
                      }] : []}
                      onLocationSelect={handleMapLocationSelect}
                      interactive={true}
                      showSearch={true}
                      isFullscreen={false}
                      initialCenter={formData.latitude && formData.longitude ? {
                        latitude: formData.latitude,
                        longitude: formData.longitude,
                        zoom: 18
                      } : undefined}
                    />
                  </div>
                )}

                <p className="text-sm text-gray-500 mt-2">
                  💡 <strong>Consejos para mejores resultados:</strong><br/>
                  • Para intersecciones: "Calle 7 Avenida 11"<br/>
                  • Para avenidas principales: "Av. 4 de Noviembre"<br/>
                  • Para sectores: "Sector Los Esteros", "Urbanización El Bosque"<br/>
                  • Si no encuentra la dirección exacta, selecciona manualmente en el mapa
                </p>
              </div>
            </div>
          </div>

          {/* Detalles */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Detalles</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Habitaciones *
                </label>
                <input
                  type="number"
                  value={formData.bedrooms}
                  onChange={(e) => setFormData(prev => ({ ...prev, bedrooms: Number(e.target.value) }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="0"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Baños *
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={formData.bathrooms}
                  onChange={(e) => setFormData(prev => ({ ...prev, bathrooms: Number(e.target.value) }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="0"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Área (m²) *
                </label>
                <input
                  type="number"
                  value={formData.square_feet || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, square_feet: Number(e.target.value) }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="1"
                  required
                />
              </div>
            </div>
          </div>

          {/* Características */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Características</h2>
            
            <div className="mb-4">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newFeature}
                  onChange={(e) => setNewFeature(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ej: Piscina, Gimnasio, Balcón..."
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
                />
                <button
                  type="button"
                  onClick={addFeature}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {formData.features.map((feature, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                >
                  {feature}
                  <button
                    type="button"
                    onClick={() => removeFeature(feature)}
                    className="ml-2 text-blue-600 hover:text-blue-800"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Imágenes */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Imágenes</h2>
            
            <div className="mb-4">
              <div className="flex space-x-2">
                <input
                  type="url"
                  value={newImage}
                  onChange={(e) => setNewImage(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="URL de la imagen..."
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addImage(e))}
                />
                <button
                  type="button"
                  onClick={(e) => addImage(e)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {formData.images.map((image, index) => (
                <div key={index} className="relative group">
                  <img
                    src={image}
                    alt={`Imagen ${index + 1}`}
                    className="w-full h-24 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeImage(image);
                    }}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Botones */}
          <div className="flex space-x-4">
            <button
              type="button"
              onClick={() => navigate('/agent/dashboard')}
              className="flex-1 bg-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-400 transition-colors font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {isLoading ? 'Creando...' : 'Crear Propiedad'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateProperty;