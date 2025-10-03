'use client';

import React, { useState } from 'react';
import MissouriMap from '../components/MissouriMap';

export default function MapPage() {
  const [selectedFile] = useState('metadata-1759267238657.csv');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="container mx-auto py-8 px-4">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent mb-4">
            Missouri Crossroads Interactive Map
          </h1>
          <p className="text-xl text-gray-700 font-medium">
            Explore {selectedFile ? '1041' : '15'} Missouri Historical Locations
          </p>
        </div>
        
        <div className="max-w-7xl mx-auto">
          {/* Map Display */}
          <div className="bg-white rounded-2xl shadow-2xl border-4 border-blue-200 p-6">
            <MissouriMap fileName={selectedFile} />
          </div>
        </div>
      </div>
    </div>
  );
}
