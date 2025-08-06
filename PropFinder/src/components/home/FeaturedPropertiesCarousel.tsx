import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, MapPin, Bed, Bath } from 'lucide-react';
import { Property } from '../../contexts/property-context-utils';
import { Link } from 'react-router-dom';

// --- Subcomponente PropertyCard --- 
// Lo definimos aquí mismo para este ejemplo, pero podría ser un componente separado.
const PropertyCard = ({ property }: { property: Property }) => (
  <div className="flex-shrink-0 w-[300px] bg-white rounded-lg shadow-lg overflow-hidden snap-center">
    <Link to={`/properties/${property.id}`} className="block">
      <img
        src={property.images[0] || 'https://via.placeholder.com/300x200'}
        alt={property.title}
        className="w-full h-48 object-cover"
      />
      <div className="p-4">
        <p className="text-sm text-blue-600 font-semibold">{property.type.charAt(0).toUpperCase() + property.type.slice(1)}</p>
        <h3 className="text-lg font-bold text-gray-800 truncate">{property.title}</h3>
        <p className="text-gray-600 text-sm flex items-center mt-1">
          <MapPin className="w-4 h-4 mr-1" />
          {property.location.city}, {property.location.state}
        </p>
        <div className="flex justify-between items-center mt-4">
          <div className="flex space-x-4 text-sm text-gray-700">
            <span className="flex items-center"><Bed className="w-4 h-4 mr-1" /> {property.bedrooms}</span>
            <span className="flex items-center"><Bath className="w-4 h-4 mr-1" /> {property.bathrooms}</span>
          </div>
          <p className="text-lg font-bold text-blue-700">${property.price.toLocaleString()}</p>
        </div>
      </div>
    </Link>
  </div>
);

// --- Componente Principal del Carrusel ---
interface FeaturedPropertiesCarouselProps {
  properties: Property[];
}

const FeaturedPropertiesCarousel: React.FC<FeaturedPropertiesCarouselProps> = ({ properties }) => {
  const [width, setWidth] = useState(0);
  const carousel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (carousel.current) {
      setWidth(carousel.current.scrollWidth - carousel.current.offsetWidth);
    }
  }, [properties]);

  const scroll = (scrollOffset: number) => {
    if (carousel.current) {
        carousel.current.scrollBy({ left: scrollOffset, behavior: 'smooth' });
    }
  };

  if (!properties || properties.length === 0) {
    return null; // No renderizar nada si no hay propiedades
  }

  return (
    <div className="relative w-full max-w-7xl mx-auto">
        <motion.div ref={carousel} className="cursor-grab overflow-hidden">
            <motion.div 
                drag="x"
                dragConstraints={{ right: 0, left: -width }}
                className="flex space-x-6 p-4"
            >
                {properties.map((property) => (
                    <motion.div key={property.id}>
                        <PropertyCard property={property} />
                    </motion.div>
                ))}
            </motion.div>
        </motion.div>

        <button 
            onClick={() => scroll(-324)} 
            className="absolute top-1/2 left-0 transform -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-md z-10 disabled:opacity-50 disabled:cursor-not-allowed"
        >
            <ChevronLeft className="h-6 w-6 text-gray-700" />
        </button>
        <button 
            onClick={() => scroll(324)} 
            className="absolute top-1/2 right-0 transform -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-md z-10 disabled:opacity-50 disabled:cursor-not-allowed"
        >
            <ChevronRight className="h-6 w-6 text-gray-700" />
        </button>
    </div>
  );
};

export default FeaturedPropertiesCarousel;
