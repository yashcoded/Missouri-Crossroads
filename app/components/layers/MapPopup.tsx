"use client";

import React from "react";
import { getLocUrlForCategory } from "../../lib/locCategoryMap";

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
import { InfoWindow } from "@react-google-maps/api";

// Friendly labels for detailed view keys
const LABELS: Record<string, string> = {
  organizationName: "Organization",
  yearEstablished: "Year Established",
  builtPlaced: "Built / Placed",
  address: "Address",
  siteTypeCategory: "Category",
  tertiaryCategories: "Tags",
  id: "ID",
};

export default function MapPopup(props: any) {
  const { location, detailed = false, onClose, onDetails } = props;
  if (!location || location.lat == null || location.lng == null) return null;

  const basicContent = (
    <div className="p-3 max-w-sm bg-white rounded shadow">
      <h3 className="font-bold text-lg mb-2">
        {location.organizationName || "Unknown"}
      </h3>
      {/* categories as badges */}
      <div className="flex flex-wrap gap-2 mb-3">
        {(() => {
          const catsRaw = [location.siteTypeCategory, location.tertiaryCategories]
            .filter(Boolean)
            .join(", ");
          const cats = catsRaw
            .split(/[,;/|]+/)
            .map(s => s.trim())
            .filter(Boolean);
          return cats.length > 0
            ? cats.map((c, i) => {
                const locUrl = getLocUrlForCategory(c);
                return locUrl ? (
                  <a
                    key={i}
                    href={locUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200 hover:underline"
                    title={`Look up ${c} on LOC`}
                  >
                    {c}
                  </a>
                ) : (
                  <span
                    key={i}
                    className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200"
                  >
                    {c}
                  </span>
                );
              })
            : null;
        })()}
      </div>
      <div className="text-sm text-gray-700 space-y-1">
        <div>
          <span className="font-semibold">{LABELS.address || "Address"}:</span>
          <span className="ml-2">{location.address || "—"}</span>
        </div>
      </div>
      <div className="mt-3 flex justify-start">
        <button
          onClick={() => {
            try {
              window.dispatchEvent(
                new CustomEvent("open-location-details", { detail: { id: location.id } })
              );
            } catch (e) {
              // no-op
            }
            onDetails?.();
          }}
          className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Details
        </button>
      </div>
    </div>
  );

  const detailedContent = (
    <div className="p-3 max-w-md bg-white rounded shadow">
      <h3 className="font-bold text-lg mb-2">
        {location.organizationName || "Unknown"}
      </h3>
      {/* categories as badges */}
      <div className="flex flex-wrap gap-2 mb-3">
        {(() => {
          const catsRaw = [location.siteTypeCategory, location.tertiaryCategories]
            .filter(Boolean)
            .join(", ");
          const cats = catsRaw
            .split(/[,;/|]+/)
            .map(s => s.trim())
            .filter(Boolean);
          return cats.length > 0
            ? cats.map((c, i) => (
                <span
                  key={i}
                  className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200"
                >
                  {c}
                </span>
              ))
            : null;
        })()}
      </div>
      <div className="text-sm text-gray-700 space-y-2">
        {Object.keys(location).map(key => {
          if (["lat", "lng", "siteTypeCategory", "tertiaryCategories", "id"].includes(key))
            return null;
          const val = (location as any)[key];
          if (val == null || val === "") return null;
          const label =
            LABELS[key] || key.replace(/([A-Z])/g, " $1").replace(/^./, s => s.toUpperCase());
          return (
            <div key={key} className="flex">
              <div className="w-36 font-semibold text-slate-700">{label}</div>
              <div className="flex-1">{String(val)}</div>
            </div>
          );
        })}
      </div>
    </div>
  );

  if (detailed) {
    // Render a centered DOM overlay covering the map viewport (middle 1/3) with a slight dark backdrop
    return (
      <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-auto">
        {/* semi-transparent backdrop that closes on click */}
        <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden />

        {/* centered panel taking ~1/3 of the width */}
        <div className="relative w-1/3 max-w-3xl bg-white rounded-lg p-6 shadow-2xl z-50">
          <button
            aria-label="Close details"
            onClick={onClose}
            className="absolute -top-3 -right-3 bg-white rounded-full p-1 shadow-md hover:bg-gray-50"
          >
            <svg className="w-4 h-4 text-slate-700" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {detailedContent}
        </div>
      </div>
    );
  }

  // basic panel rendered in bottom-left of the map viewport
  return (
    <div className="absolute left-4 bottom-4 z-50">
      <div className="relative p-3 w-80 bg-white rounded shadow">
        <button
          aria-label="Close popup"
          onClick={onClose}
          className="absolute -top-3 -right-3 bg-white rounded-full p-1 shadow-md hover:bg-gray-50"
        >
          <svg className="w-4 h-4 text-slate-700" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {basicContent}
      </div>
    </div>
  );
}
