'use client';

import React, { useEffect, useRef, useState } from 'react';
import LocationList, { LocationData } from './LocationList';

interface Props {
  value: string;
  onChange: (v: string) => void;
  showMuseums: boolean;
  setShowMuseums: (v: boolean) => void;
  showLibraries: boolean;
  setShowLibraries: (v: boolean) => void;
  showOthers: boolean;
  setShowOthers: (v: boolean) => void;
  // New: accept locations and selection handler via props (refactor away from global events)
  locations?: LocationData[];
  onSelect?: (loc: LocationData) => void;
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
  locations = [],
  onSelect,
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

  // Now receives `locations` and `onSelect` via props from the parent map component.

  return (
    <div
      ref={containerRef}
      className="map-search-overlay fixed sm:absolute left-2 sm:left-4 top-[64px] sm:top-4 z-40 w-[calc(100%-1rem)] sm:w-80 max-w-[calc(100vw-1rem)] sm:max-w-none"
    >
      <div className="relative">
        {/* Search input with icon */}
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
            🔎
          </span>
          <input
            type="text"
            value={value}
            onChange={e => onChange(e.target.value)}
            onFocus={() => setExpanded(true)}
            placeholder="Search by name, address or tags"
            className="w-full pl-10 pr-3 sm:pl-12 sm:pr-3 h-11 sm:h-12 text-sm sm:text-base text-gray-800 border border-transparent rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-300 outline-none transition-all duration-150 shadow-md bg-white placeholder-gray-400 touch-manipulation"
          />
        </div>
      </div>

      {expanded && (
        <div className="mt-2 sm:mt-3 bg-white rounded-lg shadow-2xl ring-1 ring-black/5 overflow-hidden max-h-[65vh] sm:max-h-[70vh] transition ease-out duration-150">
          <div className="p-3 sm:p-4 border-b border-gray-100 bg-white">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-gray-700">Filters</div>
              <div className="text-xs text-slate-500">
                {locations?.length ?? 0} results
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <label className="flex items-center space-x-2 min-h-[40px] cursor-pointer touch-manipulation">
                <input
                  type="checkbox"
                  checked={showMuseums}
                  onChange={e => setShowMuseums(e.target.checked)}
                  className="w-4 h-4 sm:w-4 sm:h-4 cursor-pointer"
                />
                <span className="inline-flex items-center gap-2 text-sm sm:text-base">
                  <span aria-hidden>🏛️</span>
                  <span className="text-red-500">Museums & Historic</span>
                </span>
              </label>

              <label className="flex items-center space-x-2 min-h-[40px] cursor-pointer touch-manipulation">
                <input
                  type="checkbox"
                  checked={showLibraries}
                  onChange={e => setShowLibraries(e.target.checked)}
                  className="w-4 h-4 sm:w-4 sm:h-4 cursor-pointer"
                />
                <span className="inline-flex items-center gap-2 text-sm sm:text-base">
                  <span aria-hidden>📚</span>
                  <span className="text-blue-600">Libraries & Educational</span>
                </span>
              </label>

              <label className="flex items-center space-x-2 min-h-[40px] cursor-pointer touch-manipulation">
                <input
                  type="checkbox"
                  checked={showOthers}
                  onChange={e => setShowOthers(e.target.checked)}
                  className="w-4 h-4 sm:w-4 sm:h-4 cursor-pointer"
                />
                <span className="inline-flex items-center gap-2 text-sm sm:text-base">
                  <span aria-hidden>🏢</span>
                  <span className="text-green-600">Others</span>
                </span>
              </label>
            </div>
          </div>

          {/* Results area - scroll only this region so it doesn't overlap the header/input */}
          <div className="p-2 sm:p-3 overflow-y-auto max-h-[52vh]">
            <LocationList
              locations={locations}
              selectedId={null}
              onSelect={(loc: LocationData) => {
                if (onSelect) onSelect(loc);
              }}
              inline={true}
              collapsible={false}
              defaultCollapsed={false}
            />
          </div>
        </div>
      )}
    </div>
  );
}
