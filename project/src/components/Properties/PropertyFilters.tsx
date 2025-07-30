import React, { useState } from 'react';
import { PropertyFilter } from '../../types';
import { 
  Search, 
  Filter, 
  X, 
  Home, 
  Building, 
  MapPin,
  DollarSign,
  Bed,
  Bath,
  Square
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PropertyFiltersProps {
  filters: PropertyFilter;
  onFiltersChange: (filters: PropertyFilter) => void;
  onSearch: (query: string) => void;
}

export function PropertyFilters({ filters, onFiltersChange, onSearch }: PropertyFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const propertyTypes = [
    { value: 'house', label: 'House', icon: Home },
    { value: 'apartment', label: 'Apartment', icon: Building },
    { value: 'condo', label: 'Condo', icon: Building },
    { value: 'villa', label: 'Villa', icon: Home },
    { value: 'commercial', label: 'Commercial', icon: Building },
    { value: 'land', label: 'Land', icon: Square }
  ];

  const bedroomOptions = [1, 2, 3, 4, 5];
  const bathroomOptions = [1, 1.5, 2, 2.5, 3, 3.5, 4];

  const features = [
    'Parking', 'Garden', 'Pool', 'Gym', 'Security', 'Elevator',
    'Balcony', 'Terrace', 'Fireplace', 'Air Conditioning', 
    'Furnished', 'Pet Friendly'
  ];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchQuery);
  };

  const handleFilterChange = (key: keyof PropertyFilter, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const clearFilters = () => {
    onFiltersChange({});
    setSearchQuery('');
  };

  const activeFiltersCount = Object.keys(filters).filter(key => {
    const value = filters[key as keyof PropertyFilter];
    return value !== undefined && value !== null && 
           (Array.isArray(value) ? value.length > 0 : true);
  }).length;

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <form onSubmit={handleSearchSubmit} className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by location, property type, or keywords..."
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
          />
        </div>
      </form>

      {/* Quick Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-gray-700">For:</label>
          <div className="flex rounded-lg border border-gray-300 overflow-hidden">
            <button
              type="button"
              onClick={() => handleFilterChange('listing_type', 'sale')}
              className={`px-4 py-2 text-sm transition-colors ${
                filters.listing_type === 'sale'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Sale
            </button>
            <button
              type="button"
              onClick={() => handleFilterChange('listing_type', 'rent')}
              className={`px-4 py-2 text-sm transition-colors ${
                filters.listing_type === 'rent'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Rent
            </button>
          </div>
        </div>

        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Filter className="w-4 h-4" />
          <span className="text-sm font-medium">Filters</span>
          {activeFiltersCount > 0 && (
            <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
              {activeFiltersCount}
            </span>
          )}
        </button>

        {activeFiltersCount > 0 && (
          <button
            onClick={clearFilters}
            className="flex items-center space-x-1 text-sm text-red-600 hover:text-red-700"
          >
            <X className="w-4 h-4" />
            <span>Clear all</span>
          </button>
        )}
      </div>

      {/* Advanced Filters */}
      <AnimatePresence>
        {showAdvanced && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white border border-gray-200 rounded-xl p-6 space-y-6"
          >
            {/* Property Types */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Property Type
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
                {propertyTypes.map((type) => {
                  const Icon = type.icon;
                  const isSelected = filters.property_type?.includes(type.value);
                  
                  return (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => {
                        const currentTypes = filters.property_type || [];
                        const newTypes = isSelected
                          ? currentTypes.filter(t => t !== type.value)
                          : [...currentTypes, type.value];
                        handleFilterChange('property_type', newTypes);
                      }}
                      className={`p-3 rounded-lg border transition-all ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50 text-blue-700'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <Icon className="w-5 h-5 mx-auto mb-1" />
                      <span className="text-xs font-medium">{type.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Price Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Min Price
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="number"
                    value={filters.min_price || ''}
                    onChange={(e) => handleFilterChange('min_price', e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="0"
                    className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Price
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="number"
                    value={filters.max_price || ''}
                    onChange={(e) => handleFilterChange('max_price', e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="No limit"
                    className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Bedrooms and Bathrooms */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Bedrooms
                </label>
                <div className="flex flex-wrap gap-2">
                  {bedroomOptions.map((num) => {
                    const isSelected = filters.bedrooms?.includes(num);
                    return (
                      <button
                        key={num}
                        type="button"
                        onClick={() => {
                          const current = filters.bedrooms || [];
                          const updated = isSelected
                            ? current.filter(b => b !== num)
                            : [...current, num];
                          handleFilterChange('bedrooms', updated);
                        }}
                        className={`flex items-center space-x-1 px-3 py-2 rounded-lg border transition-all ${
                          isSelected
                            ? 'border-blue-600 bg-blue-50 text-blue-700'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <Bed className="w-4 h-4" />
                        <span className="text-sm font-medium">{num}+</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Bathrooms
                </label>
                <div className="flex flex-wrap gap-2">
                  {bathroomOptions.map((num) => {
                    const isSelected = filters.bathrooms?.includes(num);
                    return (
                      <button
                        key={num}
                        type="button"
                        onClick={() => {
                          const current = filters.bathrooms || [];
                          const updated = isSelected
                            ? current.filter(b => b !== num)
                            : [...current, num];
                          handleFilterChange('bathrooms', updated);
                        }}
                        className={`flex items-center space-x-1 px-3 py-2 rounded-lg border transition-all ${
                          isSelected
                            ? 'border-blue-600 bg-blue-50 text-blue-700'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <Bath className="w-4 h-4" />
                        <span className="text-sm font-medium">{num}+</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Area Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Min Area (sqm)
                </label>
                <div className="relative">
                  <Square className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="number"
                    value={filters.min_area || ''}
                    onChange={(e) => handleFilterChange('min_area', e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="0"
                    className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Area (sqm)
                </label>
                <div className="relative">
                  <Square className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="number"
                    value={filters.max_area || ''}
                    onChange={(e) => handleFilterChange('max_area', e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="No limit"
                    className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Features */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Features
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {features.map((feature) => {
                  const isSelected = filters.features?.includes(feature);
                  return (
                    <button
                      key={feature}
                      type="button"
                      onClick={() => {
                        const current = filters.features || [];
                        const updated = isSelected
                          ? current.filter(f => f !== feature)
                          : [...current, feature];
                        handleFilterChange('features', updated);
                      }}
                      className={`px-3 py-2 text-sm rounded-lg border transition-all ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50 text-blue-700'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      {feature}
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}