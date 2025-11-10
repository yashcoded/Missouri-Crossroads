"use client";

import React, { useEffect, useRef, useState } from "react";

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
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  return (
    <div ref={containerRef} className="absolute left-4 top-4 z-50 w-80">
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          onFocus={() => setExpanded(true)}
          placeholder="🔍 Search by organization, address, tags or categories"
          className="w-full px-4 h-12 text-base text-gray-800 border-2 border-blue-300 rounded-lg focus:ring-4 focus:ring-blue-200 focus:border-blue-500 outline-none transition-all duration-150 shadow-lg bg-white placeholder-gray-500"
        />
      </div>

      {expanded && (
        <div className="mt-3 p-4 bg-white rounded-lg border border-blue-200 shadow-lg">
          <div className="space-y-3">
            <div className="text-sm font-semibold text-gray-700">Filters</div>
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={showMuseums}
                onChange={e => setShowMuseums(e.target.checked)}
              />
              <span>🏛️ Museums, Monuments & Historic Markers</span>
            </label>
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={showLibraries}
                onChange={e => setShowLibraries(e.target.checked)}
              />
              <span>📚 Libraries & Educational</span>
            </label>
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={showOthers}
                onChange={e => setShowOthers(e.target.checked)}
              />
              <span>🏢 Others</span>
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
