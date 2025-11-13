'use client';
import React, { useState, useEffect } from 'react';

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

interface LocationListProps {
  locations: LocationData[];
  selectedId?: string | null;
  onSelect?: (loc: LocationData) => void;
  // position and width allow small customizations when embedding
  position?: 'left' | 'right';
  width?: string; // tailwind width class or css value (e.g. 'w-80' or '320px')
  /**
   * When `inline` is true the list will be positioned absolutely (not fixed)
   * so it can be rendered inside a container (for example, inside the map viewport).
   */
  inline?: boolean;
  /**
   * Enable collapse/expand UI
   */
  collapsible?: boolean;
  /**
   * Start collapsed when true
   */
  defaultCollapsed?: boolean;
}

/**
 * LocationList
 * A scrollable sidebar overlay that lists locations and allows selecting one.
 * - Pass `locations` to render
 * - `onSelect` is called with the LocationData when an item is clicked
 */
export default function LocationList({
  locations,
  selectedId = null,
  onSelect,
  position = 'right',
  width = 'w-80',
  inline = false,
  collapsible = true,
  defaultCollapsed = true,
}: LocationListProps) {
  const isRight = position === 'right';
  const [collapsed, setCollapsed] = useState<boolean>(defaultCollapsed);

  // Collapse the location list when a details view is opened elsewhere (for example
  // when the map popup dispatches a global event). This lets the details overlay
  // take focus without the list overlapping it.
  useEffect(() => {
    const handler = (e: Event) => {
      // only collapse if currently expanded
      setCollapsed(prev => {
        if (!prev) return true;
        return prev;
      });
    };

    // Common event names we might listen for from the popup/details button.
    window.addEventListener('open-location-details', handler);
    window.addEventListener('location-details-opened', handler);

    return () => {
      window.removeEventListener('open-location-details', handler);
      window.removeEventListener('location-details-opened', handler);
    };
  }, []);

  // Choose positioning: fixed (default) or absolute when inline inside a container
  const posClass = inline
    ? `absolute ${isRight ? 'top-4 right-4' : 'top-4 left-4'}`
    : `fixed top-20 ${isRight ? 'right-4' : 'left-4'}`;

  // When collapsed, override width so the handle is wide enough to show the label
  const asideWidthClass = collapsed ? 'w-40' : width;

  return (
    <>
      {/* Overlay to slightly darken the map when expanded. Clicking it collapses the list. */}
      {!collapsed && (
        <div
          className="fixed inset-0 bg-black/25 z-40"
          onClick={() => setCollapsed(true)}
          aria-hidden="true"
        />
      )}

      <aside
        aria-label="Location list"
        className={`${posClass} ${asideWidthClass} max-h-[75vh] bg-white/95 backdrop-blur-sm ${collapsed ? 'border-0' : 'border border-gray-200'} rounded-lg shadow-xl z-50 overflow-hidden`}
      >
        {/* Header with collapse control */}
        <div
          className={
            collapsed
              ? 'flex items-center justify-between px-0 py-0'
              : 'flex items-center justify-between px-3 py-2 border-b border-gray-100 bg-gradient-to-r from-white to-slate-50'
          }
        >
          {!collapsed ? (
            <div>
              <h4 className="text-sm font-semibold text-slate-700">
                Locations
              </h4>
              <p className="text-xs text-slate-500">
                {locations.length} results
              </p>
            </div>
          ) : (
            <div className="w-full">
              {/* Put the View List button and the chevron inside a single bordered container */}
              <div className="flex items-stretch border-2 border-blue-300 rounded-lg overflow-hidden">
                <button
                  onClick={() => setCollapsed(false)}
                  aria-label="Open location list"
                  className="flex-1 text-left px-4 h-12 text-base font-medium text-gray-800 bg-white focus:ring-4 focus:ring-blue-200 focus:border-blue-500 outline-none transition-all duration-150 hover:bg-gray-50 flex items-center"
                >
                  <span className="mx-auto">View List</span>
                </button>

                {/* Chevron stays inside the same bordered container so the border surrounds both */}
                <button
                  aria-expanded={!collapsed}
                  title={collapsed ? 'Expand locations' : 'Collapse locations'}
                  onClick={() => setCollapsed(s => !s)}
                  className="w-12 h-12 flex items-center justify-center bg-white hover:bg-gray-50"
                >
                  {isRight ? (
                    <svg
                      className="w-4 h-4 text-slate-700"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-4 h-4 text-slate-700"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M12.707 14.707a1 1 0 01-1.414-1.414L13.586 10l-2.293-2.293a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          )}

          {collapsible && !collapsed && (
            <button
              aria-expanded={!collapsed}
              title={collapsed ? 'Expand locations' : 'Collapse locations'}
              onClick={() => setCollapsed(s => !s)}
              className="ml-2 p-1 rounded-md hover:bg-gray-100"
            >
              {/* Chevron direction depends on position and collapsed state */}
              {isRight ? (
                collapsed ? (
                  <svg
                    className="w-4 h-4 text-slate-700"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-4 h-4 text-slate-700"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )
              ) : collapsed ? (
                <svg
                  className="w-4 h-4 text-slate-700"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M12.707 14.707a1 1 0 01-1.414-1.414L13.586 10l-2.293-2.293a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                <svg
                  className="w-4 h-4 text-slate-700"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M7.293 5.293a1 1 0 011.414 0L8 5.586 11.293 9 8 12.414a1 1 0 01-1.414-1.414L9.586 9 7.293 6.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </button>
          )}
        </div>

        {/* Collapsed state: hide the list body */}
        {!collapsed && (
          <div className="px-2 py-2 overflow-y-auto max-h-[68vh]">
            <ul className="divide-y divide-gray-100">
              {locations.length === 0 && (
                <li className="p-4 text-sm text-slate-500">
                  No locations to show.
                </li>
              )}

              {locations.map(loc => {
                const isSelected = selectedId && selectedId === loc.id;
                return (
                  <li key={loc.id} className={`p-2`}>
                    <button
                      onClick={() => onSelect?.(loc)}
                      className={`w-full text-left rounded-lg p-3 transition-colors flex flex-col items-start ${isSelected ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50'}`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="font-medium text-slate-800">
                          {loc.organizationName || 'Unnamed location'}
                        </span>
                        {loc.yearEstablished && (
                          <span className="text-xs text-slate-500">
                            {loc.yearEstablished}
                          </span>
                        )}
                      </div>
                      {loc.siteTypeCategory && (
                        <div className="text-xs text-slate-500 mt-1">
                          {loc.siteTypeCategory}
                        </div>
                      )}
                      {loc.address && (
                        <div className="text-xs text-slate-600 mt-2 truncate w-full">
                          {loc.address}
                        </div>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </aside>
    </>
  );
}
