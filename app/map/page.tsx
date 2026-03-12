'use client';

import React, { useState } from 'react';
import MissouriMap from '../components/MissouriMap';

export default function MapPage() {
  // Default to the newer metadata file that includes categoryPairs
  const [selectedFile] = useState('metadata-1759267238658.csv');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* make the map area exactly viewport minus navbar height so map+stats fit */}
      <div className="h-[calc(100vh-60px)] flex flex-col py-0 px-0">
        <div className="w-full flex-1 min-h-0">
          <div className="bg-white rounded-none shadow-none border-0 p-0 h-full">
            <MissouriMap fileName={selectedFile} />
          </div>
        </div>
      </div>
    </div>
  );
}
