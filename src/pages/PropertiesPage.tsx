import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Layout } from '../components/Layout/Layout';
import { PropertyList } from '../components/Properties/PropertyList';
import { PropertyFilters } from '../components/Properties/PropertyFilters';
import { RepositoryFactory } from '../patterns/RepositoryPattern';
import { PropertySearchContext, StrategyFactory } from '../patterns/StrategyPattern';
import { Property, PropertyFilter } from '../types';
import { SlidersHorizontal, Map, Grid3X3 } from 'lucide-react';
import { motion } from 'framer-motion';

export function PropertiesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [properties, setProperties] = useState<Property[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<PropertyFilter>({});
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  
  const propertyRepository = RepositoryFactory.getPropertyRepository();

  useEffect(() => {
    loadProperties();
    
    // Initialize filters from URL params
    const initialFilters: PropertyFilter = {};
    const search = searchParams.get('search');
    const listingType = searchParams.get('type') as 'sale' | 'rent';
    const propertyType = searchParams.get('property_type');
    
    if (listingType) initialFilters.listing_type = listingType;
    if (propertyType) initialFilters.property_type = [propertyType];
    
    setFilters(initialFilters);
    
    if (search) {
      handleSearch(search);
    }
  }, [searchParams]);

  useEffect(() => {
    applyFilters();
  }, [properties, filters]);

  const loadProperties = async () => {
    try {
      setLoading(true);
      const allProperties = await propertyRepository.findByFilter({}, 100, 0);
      setProperties(allProperties);
    } catch (error) {
      console.error('Failed to load properties:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...properties];

    // Apply basic filters
    if (filters.listing_type) {
      filtered = filtered.filter(p => p.listing_type === filters.listing_type);
    }

    if (filters.property_type?.length) {
      filtered = filtered.filter(p => filters.property_type!.includes(p.property_type));
    }

    if (filters.min_price) {
      filtered = filtered.filter(p => p.price >= filters.min_price!);
    }

    if (filters.max_price) {
      filtered = filtered.filter(p => p.price <= filters.max_price!);
    }

    if (filters.bedrooms?.length) {
      filtered = filtered.filter(p => p.bedrooms && filters.bedrooms!.includes(p.bedrooms));
    }

    if (filters.bathrooms?.length) {
      filtered = filtered.filter(p => p.bathrooms && filters.bathrooms!.includes(p.bathrooms));
    }

    if (filters.min_area) {
      filtered = filtered.filter(p => p.area_sqm >= filters.min_area!);
    }

    if (filters.max_area) {
      filtered = filtered.filter(p => p.area_sqm <= filters.max_area!);
    }

    if (filters.city) {
      filtered = filtered.filter(p => 
        p.city.toLowerCase().includes(filters.city!.toLowerCase())
      );
    }

    if (filters.features?.length) {
      filtered = filtered.filter(p => 
        filters.features!.some(feature => p.features.includes(feature))
      );
    }

    setFilteredProperties(filtered);
  };

  const handleSearch = (query: string) => {
    if (!query.trim()) {
      setFilteredProperties(properties);
      return;
    }

    // Determine search strategy based on query content
    let strategy;
    if (/^\$?\d+/.test(query)) {
      strategy = StrategyFactory.createSearchStrategy('price');
    } else if (/\b(bed|bath|sqm|sq)\b/i.test(query)) {
      strategy = StrategyFactory.createSearchStrategy('feature');
    } else if (/\b(st|street|ave|avenue|rd|road|blvd|boulevard)\b/i.test(query)) {
      strategy = StrategyFactory.createSearchStrategy('location');
    } else {
      strategy = StrategyFactory.createSearchStrategy('text');
    }

    const searchContext = new PropertySearchContext(strategy);
    const results = searchContext.search(properties, query, filters);
    setFilteredProperties(results);
  };

  const handleFiltersChange = (newFilters: PropertyFilter) => {
    setFilters(newFilters);
    
    // Update URL params
    const params = new URLSearchParams();
    if (newFilters.listing_type) params.set('type', newFilters.listing_type);
    if (newFilters.property_type?.length === 1) {
      params.set('property_type', newFilters.property_type[0]);
    }
    setSearchParams(params);
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                  Properties for {filters.listing_type || 'Sale & Rent'}
                </h1>
                <p className="text-gray-600 mt-1">
                  {loading ? 'Loading...' : `${filteredProperties.length} properties found`}
                </p>
              </div>
              
              <div className="flex items-center space-x-4">
                {/* View Mode Toggle */}
                <div className="flex rounded-lg border border-gray-300 overflow-hidden">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 transition-colors ${
                      viewMode === 'grid'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Grid3X3 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setViewMode('map')}
                    className={`p-2 transition-colors ${
                      viewMode === 'map'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Map className="w-5 h-5" />
                  </button>
                </div>

                {/* Filters Toggle */}
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="lg:hidden flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  <span>Filters</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Filters Sidebar */}
            <motion.div
              initial={false}
              animate={{
                x: showFilters ? 0 : -100,
                opacity: showFilters ? 1 : 0
              }}
              className={`lg:w-80 lg:flex-shrink-0 ${
                showFilters ? 'block' : 'hidden lg:block'
              }`}
            >
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-6">
                <PropertyFilters
                  filters={filters}
                  onFiltersChange={handleFiltersChange}
                  onSearch={handleSearch}
                />
              </div>
            </motion.div>

            {/* Properties Content */}
            <div className="flex-1 min-w-0">
              {viewMode === 'grid' ? (
                <PropertyList
                  properties={filteredProperties}
                  loading={loading}
                />
              ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <Map className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">Map view coming soon!</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}