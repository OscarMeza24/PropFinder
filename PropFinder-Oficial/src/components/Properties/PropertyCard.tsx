import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Property } from '../../types';
import { 
  MapPin, 
  Bed, 
  Bath, 
  Square, 
  Heart, 
  Share2, 
  Camera,
  Star,
  Clock
} from 'lucide-react';
import { motion } from 'framer-motion';

interface PropertyCardProps {
  property: Property;
  onFavorite?: (propertyId: string) => void;
  isFavorited?: boolean;
}

export function PropertyCard({ property, onFavorite, isFavorited = false }: PropertyCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageError, setImageError] = useState(false);
  
  const primaryImage = property.images?.find(img => img.is_primary) || property.images?.[0];
  const displayPrice = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: property.currency || 'USD',
    minimumFractionDigits: 0
  }).format(property.price);

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: property.title,
          text: `Check out this ${property.property_type} for ${property.listing_type}`,
          url: `${window.location.origin}/properties/${property.id}`
        });
      } catch (err) {
        // Fallback to clipboard
        navigator.clipboard.writeText(`${window.location.origin}/properties/${property.id}`);
      }
    } else {
      navigator.clipboard.writeText(`${window.location.origin}/properties/${property.id}`);
    }
  };

  const handleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onFavorite?.(property.id);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -4 }}
      className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group"
    >
      <Link to={`/properties/${property.id}`} className="block">
        {/* Image Section */}
        <div className="relative h-48 overflow-hidden">
          {primaryImage && !imageError ? (
            <img
              src={primaryImage.url}
              alt={property.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
              <Camera className="w-12 h-12 text-gray-400" />
            </div>
          )}

          {/* Image Counter */}
          {property.images && property.images.length > 1 && (
            <div className="absolute top-3 left-3 bg-black/70 text-white px-2 py-1 rounded-lg text-xs font-medium flex items-center space-x-1">
              <Camera className="w-3 h-3" />
              <span>{property.images.length}</span>
            </div>
          )}

          {/* Status Badge */}
          <div className="absolute top-3 right-3">
            <span className={`px-2 py-1 rounded-lg text-xs font-semibold uppercase tracking-wide ${
              property.listing_type === 'sale' 
                ? 'bg-emerald-500 text-white' 
                : 'bg-blue-500 text-white'
            }`}>
              For {property.listing_type}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="absolute bottom-3 right-3 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <button
              onClick={handleFavorite}
              className={`p-2 rounded-full backdrop-blur-sm transition-colors ${
                isFavorited 
                  ? 'bg-red-500 text-white' 
                  : 'bg-white/90 text-gray-700 hover:bg-red-500 hover:text-white'
              }`}
            >
              <Heart className={`w-4 h-4 ${isFavorited ? 'fill-current' : ''}`} />
            </button>
            <button
              onClick={handleShare}
              className="p-2 bg-white/90 backdrop-blur-sm rounded-full text-gray-700 hover:bg-blue-500 hover:text-white transition-colors"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-5">
          {/* Price and Type */}
          <div className="flex items-center justify-between mb-2">
            <div className="text-2xl font-bold text-gray-900">
              {displayPrice}
              {property.listing_type === 'rent' && (
                <span className="text-sm font-normal text-gray-500">/month</span>
              )}
            </div>
            <span className="text-sm font-medium text-gray-500 capitalize">
              {property.property_type}
            </span>
          </div>

          {/* Title */}
          <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
            {property.title}
          </h3>

          {/* Location */}
          <div className="flex items-center text-gray-600 mb-3">
            <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
            <span className="text-sm truncate">
              {property.address}, {property.city}, {property.state}
            </span>
          </div>

          {/* Property Details */}
          <div className="flex items-center space-x-4 mb-4 text-sm text-gray-600">
            {property.bedrooms && (
              <div className="flex items-center space-x-1">
                <Bed className="w-4 h-4" />
                <span>{property.bedrooms} bed{property.bedrooms !== 1 ? 's' : ''}</span>
              </div>
            )}
            {property.bathrooms && (
              <div className="flex items-center space-x-1">
                <Bath className="w-4 h-4" />
                <span>{property.bathrooms} bath{property.bathrooms !== 1 ? 's' : ''}</span>
              </div>
            )}
            <div className="flex items-center space-x-1">
              <Square className="w-4 h-4" />
              <span>{property.area_sqm.toLocaleString()} sqm</span>
            </div>
          </div>

          {/* Agent Info */}
          {property.agent && (
            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full flex items-center justify-center">
                  <span className="text-xs font-medium text-white">
                    {property.agent.full_name.charAt(0)}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {property.agent.full_name}
                  </p>
                  <div className="flex items-center space-x-1">
                    <Star className="w-3 h-3 text-yellow-400 fill-current" />
                    <span className="text-xs text-gray-500">
                      {property.agent.rating?.toFixed(1) || '0.0'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-xs text-gray-500 flex items-center space-x-1">
                <Clock className="w-3 h-3" />
                <span>
                  {new Date(property.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  );
}