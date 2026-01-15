'use client';

import React, { useEffect, useRef, useState } from 'react';

interface Props {
  value: string;
  onChange: (v: string) => void;
  showMuseums: boolean;
  setShowMuseums: (v: boolean) => void;
  showLibraries: boolean;
  setShowLibraries: (v: boolean) => void;
  showOthers: boolean;
  setShowOthers: (v: boolean) => void;
}

export default function SearchOverlay({
  value,
  onChange,
  showMuseums,
  setShowMuseums,
  showLibraries,
  setShowLibraries,
  showOthers,
  setShowOthers,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) {
        setExpanded(false);
      }
    }
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  return (
    <div ref={containerRef} className="map-search-overlay fixed sm:absolute left-2 sm:left-4 top-[64px] sm:top-4 z-40 w-[calc(100%-1rem)] sm:w-80 max-w-[calc(100vw-1rem)] sm:max-w-none">
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          onFocus={() => setExpanded(true)}
          placeholder="🔍 Search by organization, address, tags or categories"
          className="w-full px-3 sm:px-4 h-11 sm:h-12 text-sm sm:text-base text-gray-800 border-2 border-blue-300 rounded-lg focus:ring-4 focus:ring-blue-200 focus:border-blue-500 outline-none transition-all duration-150 shadow-lg bg-white placeholder-gray-500 touch-manipulation"
        />
      </div>

      {expanded && (
        <div className="mt-2 sm:mt-3 p-3 sm:p-4 bg-white rounded-lg border border-blue-200 shadow-lg max-h-[60vh] sm:max-h-none overflow-y-auto">
          <div className="space-y-3">
            <div className="text-sm font-semibold text-gray-700">Filters</div>
            <label className="flex items-center space-x-3 min-h-[44px] cursor-pointer touch-manipulation">
              <input
                type="checkbox"
                checked={showMuseums}
                onChange={e => setShowMuseums(e.target.checked)}
                className="w-5 h-5 sm:w-4 sm:h-4 cursor-pointer"
              />
              <span className="inline-flex items-center gap-2 text-sm sm:text-base">
                <span aria-hidden>🏛️</span>
                <span className="text-red-500">
                  Museums, Monuments & Historic Markers
                </span>
              </span>
            </label>
            <label className="flex items-center space-x-3 min-h-[44px] cursor-pointer touch-manipulation">
              <input
                type="checkbox"
                checked={showLibraries}
                onChange={e => setShowLibraries(e.target.checked)}
                className="w-5 h-5 sm:w-4 sm:h-4 cursor-pointer"
              />
              <span className="inline-flex items-center gap-2 text-sm sm:text-base">
                <span aria-hidden>📚</span>
                <span className="text-blue-600">Libraries & Educational</span>
              </span>
            </label>
            <label className="flex items-center space-x-3 min-h-[44px] cursor-pointer touch-manipulation">
              <input
                type="checkbox"
                checked={showOthers}
                onChange={e => setShowOthers(e.target.checked)}
                className="w-5 h-5 sm:w-4 sm:h-4 cursor-pointer"
              />
              <span className="inline-flex items-center gap-2 text-sm sm:text-base">
                <span aria-hidden>🏢</span>
                <span className="text-green-600">Others</span>
              </span>
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
