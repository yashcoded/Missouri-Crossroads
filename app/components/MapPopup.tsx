'use client';

import React from 'react';

export interface LocationData {
  id: string;
  organizationName: string;
  yearEstablished?: string;
  builtPlaced?: string;
  address?: string;
  siteTypeCategory?: string;
  tertiaryCategories?: string;
  lat?: number;
  lng?: number;
}

interface MapPopupProps {
  location: LocationData | null;
  onClose?: () => void;
}

export default function MapPopup({ location, onClose }: MapPopupProps) {
  if (!location) return null;

  // Render as an absolutely positioned panel inside the map wrapper.
  // The parent map container should be position:relative so this places correctly.
  return (
    <div className="absolute left-4 bottom-4 z-50">
      <div className="relative p-4 w-80 bg-gradient-to-br from-blue-50 to-green-50 border-2 border-blue-300 rounded-lg shadow-lg">
        <button
          aria-label="Close popup"
          onClick={onClose}
          className="absolute -top-3 -right-3 bg-white rounded-full p-1 shadow-md hover:bg-gray-50"
        >
          <svg
            className="w-4 h-4 text-slate-700"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        <h3 className="font-bold text-xl mb-3 text-blue-800">{location.organizationName}</h3>
        <div className="space-y-2 text-sm">
          {location.yearEstablished && (
            <p className="bg-white px-3 py-1 rounded border border-blue-200">
              <span className="font-bold text-green-700">Established:</span>
              <span className="text-gray-800 ml-2">{location.yearEstablished}</span>
            </p>
          )}
          {location.builtPlaced && (
            <p className="bg-white px-3 py-1 rounded border border-blue-200">
              <span className="font-bold text-green-700">Built/Placed:</span>
              <span className="text-gray-800 ml-2">{location.builtPlaced}</span>
            </p>
          )}
          <p className="bg-white px-3 py-1 rounded border border-blue-200">
            <span className="font-bold text-green-700">Address:</span>
            <span className="text-gray-800 ml-2">{location.address}</span>
          </p>
          <p className="bg-white px-3 py-1 rounded border border-blue-200">
            <span className="font-bold text-green-700">Category:</span>
            <span className="text-gray-800 ml-2">{location.siteTypeCategory}</span>
          </p>
          {location.tertiaryCategories && (
            <p className="bg-white px-3 py-1 rounded border border-blue-200">
              <span className="font-bold text-green-700">Tags:</span>
              <span className="text-gray-800 ml-2">{location.tertiaryCategories}</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
