import React from 'react';

const PropertyCardSkeleton: React.FC = () => {
  return (
    <div className="border rounded-lg overflow-hidden shadow-lg bg-white animate-pulse">
      <div className="w-full h-48 bg-gray-300"></div>
      <div className="p-4">
        <div className="h-6 bg-gray-300 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-300 rounded w-1/2 mb-4"></div>
        <div className="h-4 bg-gray-300 rounded w-full mb-2"></div>
        <div className="h-4 bg-gray-300 rounded w-5/6"></div>
      </div>
      <div className="p-4 border-t border-gray-200 mt-4">
        <div className="flex justify-between items-center">
          <div className="h-8 bg-gray-300 rounded w-1/3"></div>
          <div className="h-8 w-8 bg-gray-300 rounded-full"></div>
        </div>
      </div>
    </div>
  );
};

export default PropertyCardSkeleton;
