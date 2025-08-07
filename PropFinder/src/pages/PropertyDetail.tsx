import React, { useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { MapPin, Bed, Bath, Square, Heart, Share2, Calendar, MessageCircle, Phone } from 'lucide-react';
import { useProperty } from '../contexts/PropertyContext';
import { useChat } from '../contexts/ChatContext';
import { useAuth } from '../contexts/auth-context-utils';
import PropertyMap from '../components/ui/PropertyMap';
import QuickReviewButton from '../components/ui/QuickReviewButton';

const PropertyDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { getPropertyById } = useProperty();
  const { createRoom } = useChat();
  const { user } = useAuth();
  
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');

  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const savedFavorites = localStorage.getItem('favorites');
      return savedFavorites ? JSON.parse(savedFavorites) : [];
    } catch (error) {
      console.error('Error reading favorites from localStorage', error);
      return [];
    }
  });

  const property = id ? getPropertyById(id) : null;

  const toggleFavorite = (propertyId: string) => {
    if (!propertyId) return;
    const isFavorite = favorites.includes(propertyId);
    let updatedFavorites;

    if (isFavorite) {
      updatedFavorites = favorites.filter(favId => favId !== propertyId);
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

  if (!property) {
    return <Navigate to="/properties" replace />;
  }

  const safeImages = property.images || [];
  const safeAmenities = property.amenities || [];
  const safeCurrentImageIndex = Math.max(0, Math.min(currentImageIndex, safeImages.length - 1));
  const currentImageSrc = safeImages.length > 0 ? safeImages[safeCurrentImageIndex] : null;

  const handleContactAgent = async () => {
    if (!user || !property.agent) {
      return;
    }
    try {
      await createRoom(
        parseInt(property.agent.id),
        `Hola, estoy interesado en la propiedad: ${property.title}`
      );
    } catch (error) {
      console.error('Error creating conversation:', error);
    }
  };

  const handleScheduleVisit = () => {
    setShowScheduleModal(true);
  };

  const handleScheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Scheduling visit for:', scheduleDate, scheduleTime);
    setShowScheduleModal(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
          <div className="relative h-96 md:h-[500px]">
            {currentImageSrc ? (
              <img src={currentImageSrc} alt={property.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                <p className="text-gray-500">No hay imágenes disponibles</p>
              </div>
            )}
            <div className="absolute top-4 right-4 flex space-x-2">
              <button 
                onClick={() => toggleFavorite(property.id)}
                className="bg-white p-2 rounded-full shadow-md hover:bg-gray-100 transition-colors"
                aria-label="Añadir a favoritos"
              >
                <Heart className={`h-5 w-5 ${favorites.includes(property.id) ? 'text-red-500 fill-current' : 'text-gray-600'}`} />
              </button>
              <button className="bg-white p-2 rounded-full shadow-md hover:bg-gray-100 transition-colors">
                <Share2 className="h-5 w-5 text-gray-600" />
              </button>
            </div>
            {safeImages.length > 1 && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                {safeImages.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`w-3 h-3 rounded-full ${index === safeCurrentImageIndex ? 'bg-white' : 'bg-white opacity-50'}`}
                  />
                ))}
              </div>
            )}
          </div>
          {safeImages.length > 1 && (
            <div className="p-4">
              <div className="flex space-x-2 overflow-x-auto">
                {safeImages.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden ${index === safeCurrentImageIndex ? 'ring-2 ring-blue-500' : ''}`}
                  >
                    <img src={image} alt={`${property.title} ${index + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-gray-900">{property.title}</h1>
                  <div className="flex items-center text-gray-600 mt-2">
                    <MapPin className="h-5 w-5 mr-2" />
                    <span>{property.location.address}, {property.location.city}, {property.location.state}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end ml-4">
                    <span className="text-3xl font-bold text-blue-600 mb-2">${property.price.toLocaleString()}</span>
                    <button 
                        onClick={() => toggleFavorite(property.id)}
                        className="p-2 rounded-full bg-white shadow-md hover:bg-red-50 transition-colors duration-200"
                        aria-label="Añadir a favoritos"
                    >
                        <Heart className={`h-7 w-7 ${favorites.includes(property.id) ? 'text-red-500 fill-current' : 'text-gray-600'}`} />
                    </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-6 border-t pt-6">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <Bed className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-900">{property.bedrooms}</div>
                  <div className="text-sm text-gray-600">Habitaciones</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <Bath className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-900">{property.bathrooms}</div>
                  <div className="text-sm text-gray-600">Baños</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <Square className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-900">{property.area}</div>
                  <div className="text-sm text-gray-600">m²</div>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-xl font-bold text-gray-900 mb-3">Descripción</h3>
                <p className="text-gray-600 leading-relaxed">{property.description}</p>
              </div>

              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Características</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {safeAmenities.length > 0 ? (
                    safeAmenities.map((feature, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                        <span className="text-gray-600">{feature}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 col-span-full">No hay características disponibles</p>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Ubicación</h3>
              <div className="rounded-lg overflow-hidden" style={{ height: '400px' }}>
                {(property.latitude && property.longitude) || (property.location.lat && property.location.lng) ? (
                  <PropertyMap
                    properties={[property]}
                    selectedProperty={property}
                    interactive={true}
                    showSearch={false}
                    isFullscreen={false}
                  />
                ) : (
                  <div className="w-full h-full bg-gray-100 flex flex-col items-center justify-center text-gray-500">
                    <MapPin className="h-12 w-12 mb-4" />
                    <p className="text-lg font-medium mb-2">Ubicación aproximada</p>
                    <p className="text-sm text-center px-4">
                      Las coordenadas exactas no están disponibles, pero la propiedad se encuentra en:
                    </p>
                    <p className="text-sm font-medium mt-2 text-center">
                      {property.location.city}, {property.location.state}
                    </p>
                  </div>
                )}
              </div>
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center text-gray-600">
                  <MapPin className="h-5 w-5 mr-2" />
                  <span>{property.location.address}, {property.location.city}, {property.location.state}</span>
                </div>
                {property.location.zipCode && (
                  <p className="text-sm text-gray-500 mt-1">Código postal: {property.location.zipCode}</p>
                )}
                {!(property.latitude && property.longitude) && !(property.location.lat && property.location.lng) && (
                  <p className="text-xs text-yellow-600 mt-2 italic">
                    📍 Las coordenadas exactas se actualizarán próximamente
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {property.agent && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Agente Inmobiliario</h3>
                <div className="text-center mb-4">
                  <img
                    src={property.agent.avatar || '/default-avatar.png'}
                    alt={property.agent.name}
                    className="w-20 h-20 rounded-full mx-auto mb-3 object-cover"
                  />
                  <h4 className="font-bold text-gray-900">{property.agent.name}</h4>
                  <p className="text-gray-600 text-sm">{property.agent.email}</p>
                </div>
                <div className="space-y-3">
                  <button onClick={handleContactAgent} className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2">
                    <MessageCircle className="h-5 w-5" />
                    <span>Contactar Agente</span>
                  </button>
                  <button onClick={handleScheduleVisit} className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2">
                    <Calendar className="h-5 w-5" />
                    <span>Agendar Visita</span>
                  </button>
                  <a href={`tel:${property.agent.phone}`} className="w-full bg-gray-600 text-white py-3 rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center space-x-2">
                    <Phone className="h-5 w-5" />
                    <span>Llamar Ahora</span>
                  </a>
                  <div className="pt-2">
                    <div className="w-full">
                      <QuickReviewButton
                        targetId={property.agent.id}
                        targetName={property.agent.name}
                        targetType="agent"
                        propertyId={property.id}
                        propertyTitle={property.title}
                        buttonText="Evaluar Agente"
                        buttonSize="md"
                        variant="outline"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Información Adicional</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Tipo de Propiedad</span>
                  <span className="font-semibold capitalize">{property.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Publicado</span>
                  <span className="font-semibold">{new Date(property.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Código</span>
                  <span className="font-semibold">#{property.id}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showScheduleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Agendar Visita</h3>
            <form onSubmit={handleScheduleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
                <input type="date" value={scheduleDate} onChange={(e) => setScheduleDate(e.target.value)} min={new Date().toISOString().split('T')[0]} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hora</label>
                <select value={scheduleTime} onChange={(e) => setScheduleTime(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent" required>
                  <option value="">Seleccionar hora</option>
                  <option value="09:00">9:00 AM</option>
                  <option value="10:00">10:00 AM</option>
                  <option value="11:00">11:00 AM</option>
                  <option value="14:00">2:00 PM</option>
                  <option value="15:00">3:00 PM</option>
                  <option value="16:00">4:00 PM</option>
                  <option value="17:00">5:00 PM</option>
                </select>
              </div>
              <div className="flex space-x-3">
                <button type="button" onClick={() => setShowScheduleModal(false)} className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-md hover:bg-gray-400 transition-colors">Cancelar</button>
                <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition-colors">Confirmar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertyDetail;