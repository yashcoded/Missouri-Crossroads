'use client';

import React, { useState } from 'react';
import MissouriMap from '../components/MissouriMap';

export default function MapPage() {
  const [selectedFile] = useState('metadata-1759267238657.csv');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* full-width map area; remove centered container so the map can span the viewport width */}
      <div className="py-8 px-0">
        <div className="w-full">
          <div className="bg-white rounded-none shadow-none border-0 p-0">
            <MissouriMap fileName={selectedFile} />
          </div>
        </div>
      </div>
    </div>
  );
}
