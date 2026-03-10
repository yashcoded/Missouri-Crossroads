'use client';
import React, { useEffect, useState } from 'react';
// Note: we intentionally do not import server resolver here because the
// browser cannot call id.loc.gov directly (CORS). Instead the badge will
// call our server-side proxy at `/api/loc/subject` which uses the resolver
// server-side and is not subject to browser CORS.
export interface LocationData {
  id: string;
  organizationName: string;
  yearEstablished?: string;
  builtPlaced?: string;
  address?: string;
  fullAddress?: string;
  siteTypeCategory?: string;
  tertiaryCategories?: string;
  lat?: number;
  lng?: number;
  // contact/social
  facebook?: string;
  instagram?: string;
  website?: string;
  email?: string;
  phone?: string;
  // facebook metrics
  fbFollowers?: string | number;
  fbLikes?: string | number;
  fbGroupMembers?: string | number;
  // administrative / metadata
  county?: string;
  dataDate?: string;
  nrhpNomination?: string;
  // raw geo-string variations (if present)
  geoCoordinatesDD?: string;
  geoCoordinatesDMM?: string;
  needsGeocoding?: boolean;
}

interface MapPopupProps {
  location: LocationData | null;
  onClose?: () => void;
}
import { InfoWindow } from '@react-google-maps/api';
import GoogleMapsDirectionsLink from '../GoogleMapsDirectionsLink';

// Friendly labels for detailed view keys
const LABELS: Record<string, string> = {
  organizationName: 'Organization',
  yearEstablished: 'Year Established',
  builtPlaced: 'Built / Placed',
  address: 'Address',
  fullAddress: 'Full Address',
  siteTypeCategory: 'Category',
  tertiaryCategories: 'Tags',
  facebook: 'Facebook',
  instagram: 'Instagram',
  website: 'Website',
  email: 'Email',
  phone: 'Phone',
  fbFollowers: 'Facebook Followers',
  fbLikes: 'Facebook Likes',
  fbGroupMembers: 'Facebook Group Members',
  county: 'County',
  dataDate: 'Data Date',
  nrhpNomination: 'NRHP Nomination',
  geoCoordinatesDD: 'Geo (DD)',
  geoCoordinatesDMM: 'Geo (DMM)',
  id: 'ID',
};

export default function MapPopup(props: any) {
  const { location, detailed = false, onClose, onDetails } = props;
  if (!location || location.lat == null || location.lng == null) return null;
  console.log('Rendering MapPopup for location:', location);

  // Category badge component — resolves LOC URL asynchronously and avoids
  // calling async functions during render (prevents href becoming a Promise).
  const CategoryBadge: React.FC<{ c: string; small?: boolean }> = ({
    c,
    small,
  }) => {
    const [locUrl, setLocUrl] = useState<string | null | undefined>(undefined);

    useEffect(() => {
      let mounted = true;
      function buildSearchFallback(term: string) {
        const raw = String(term || '').trim();
        const q0 = encodeURIComponent(raw).replace(/%20/g, '+');
        const parts = [
          `q=${q0}`,
          `q=${encodeURIComponent('rdftype:SimpleType')}`,
          `q=${encodeURIComponent('rdftype:Authority')}`,
          `q=${encodeURIComponent('cs:http://id.loc.gov/authorities/subjects')}`,
          `q=${encodeURIComponent('memberOf:http://id.loc.gov/authorities/subjects/collection_LCSH_General')}`,
        ];
        return `https://id.loc.gov/search/?${parts.join('&')}`;
      }
      (async () => {
        try {
          // Try sessionStorage first to avoid any network RTT if available
          const cacheKey = 'locUrlCache_v1';
          const raw =
            typeof window !== 'undefined'
              ? window.sessionStorage.getItem(cacheKey)
              : null;
          const cache = raw
            ? (JSON.parse(raw) as Record<string, string | null>)
            : {};
          if (cache && Object.prototype.hasOwnProperty.call(cache, c)) {
            if (!mounted) return;
            const val = cache[c] ?? buildSearchFallback(c);
            setLocUrl(val);
            return;
          }

          // Fall back to batch endpoint (POST) which can later be used to
          // resolve many queries at once. We send a single-item array here
          // but map-shell can call the same endpoint with many items.
          const res = await fetch('/api/loc/subjects', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ qs: [c] }),
          });
          if (!mounted) return;
          if (!res.ok) {
            const fallback = buildSearchFallback(c);
            setLocUrl(fallback);
            return;
          }
          const body = await res.json();
          const url = body?.results?.[c] ?? null;

          // persist in sessionStorage for quick reuse during this session
          const newCache = { ...(cache || {}) } as Record<
            string,
            string | null
          >;
          newCache[c] = url ?? null;
          try {
            window.sessionStorage.setItem(cacheKey, JSON.stringify(newCache));
          } catch (e) {
            // ignore sessionStorage errors
          }

          const final = url ?? buildSearchFallback(c);
          setLocUrl(final);
        } catch (e) {
          if (!mounted) return;
          const fallback = buildSearchFallback(c);
          setLocUrl(fallback);
        }
      })();
      return () => {
        mounted = false;
      };
    }, [c]);

    const baseClass = small
      ? 'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200'
      : 'inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-blue-50 text-blue-800 border border-blue-100';

    if (locUrl) {
      const isAuthority =
        typeof locUrl === 'string' &&
        /id\.loc\.gov\/authorities\/subjects\/sh/.test(locUrl);
      return (
        <a
          href={locUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`${baseClass} hover:underline`}
          title={`Look up ${c} on LOC`}
        >
          {isAuthority ? (
            <span className="inline-flex items-center gap-2">
              <svg
                className="w-3 h-3 text-green-600"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span>{c}</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-2">
              <svg
                className="w-3 h-3 text-gray-500"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13 16h-1v-4h-1"
                />
              </svg>
              <span>{c}</span>
            </span>
          )}
        </a>
      );
    }

    return <span className={baseClass}>{c}</span>;
  };
  // helper to render values with simple linkification for urls and emails
  const renderValue = (val: any) => {
    if (val == null) return null;
    const s = String(val).trim();
    if (s === '') return null;
    // simple url detection
    if (/^https?:\/\//i.test(s)) {
      return (
        <a
          href={s}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline"
        >
          {s}
        </a>
      );
    }
    // email
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)) {
      return (
        <a href={`mailto:${s}`} className="text-blue-600 hover:underline">
          {s}
        </a>
      );
    }
    // preserve line breaks for addresses or long text
    return (
      <div className="whitespace-pre-wrap wrap-break-word text-slate-700">
        {s}
      </div>
    );
  };

  // normalize contact-like fields: return a trimmed string or null for
  // placeholders like "N/A", "n/a", "NA", "unknown", or dash-only values.
  const normalizeContact = (v: any): string | null => {
    if (v == null) return null;
    const s = String(v).trim();
    if (s === '') return null;
    const low = s.toLowerCase();
    // common placeholder patterns we want to ignore
    if (low === 'n/a' || low === 'na' || low === 'unknown' || low === 'none')
      return null;
    if (/^n\/?a$/i.test(s)) return null; // n/a, N/A
    if (/^[-—–]+$/.test(s)) return null; // '---' or em-dash
    return s;
  };

  const basicContent = (
    <div className="p-3 max-w-sm bg-white rounded shadow">
      <h3 className="font-bold text-lg mb-2">
        {location.organizationName || 'Unknown'}
      </h3>

      {/* Divider */}
      <div className="border-t border-slate-200 my-3" />

      {/* Address */}
      <div className="text-sm text-gray-700 mb-2">
        <div>
          <span className="font-semibold">{LABELS.address || 'Address'}:</span>
          <span className="ml-2">{renderValue(location.address) ?? '—'}</span>
        </div>
      </div>

      {/* Contact */}
      <div className="text-sm text-gray-700 mb-3">
        <div>
          <span className="font-semibold">Contact:</span>
          <span className="ml-2 block wrap-break-word break-all whitespace-normal max-w-full">
            {(() => {
              const phone = normalizeContact(location.phone);
              const email = normalizeContact(location.email);
              const website = normalizeContact(location.website);
              const facebook = normalizeContact(location.facebook);
              const instagram = normalizeContact(location.instagram);

              const makeUrl = (u: string) =>
                /^https?:\/\//i.test(u) ? u : `https://${u}`;

              if (phone)
                return (
                  <a
                    href={`tel:${phone}`}
                    className="text-blue-600 hover:underline wrap-break-word"
                  >
                    {phone}
                  </a>
                );
              if (email)
                return (
                  <a
                    href={`mailto:${email}`}
                    className="text-blue-600 hover:underline wrap-break-word"
                  >
                    {email}
                  </a>
                );
              if (website)
                return (
                  <a
                    href={makeUrl(website)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline wrap-break-word"
                  >
                    {website}
                  </a>
                );
              if (facebook)
                return (
                  <a
                    href={makeUrl(facebook)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline wrap-break-word"
                  >
                    Facebook
                  </a>
                );
              if (instagram)
                return (
                  <a
                    href={makeUrl(instagram)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline wrap-break-word"
                  >
                    Instagram
                  </a>
                );

              const q = encodeURIComponent(
                location.organizationName || location.address || ''
              ).replace(/%20/g, '+');
              const url = `https://www.google.com/search?q=${q}`;
              return (
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Search for {location.organizationName || 'this place'}
                </a>
              );
            })()}
          </span>
        </div>
      </div>

      {/* Categories */}
      <div className="flex flex-wrap gap-2 mb-3">
        {(() => {
          const catsRaw = [
            location.siteTypeCategory,
            location.tertiaryCategories,
          ]
            .filter(Boolean)
            .join(', ');
          const cats = catsRaw
            .split(/[,;/|]+/)
            .map(s => s.trim())
            .filter(Boolean);
          return cats.length > 0
            ? cats.map((c, i) => <CategoryBadge key={i} c={c} small />)
            : null;
        })()}
      </div>

      {/* Bottom actions: Directions (left) and Details (right) */}
      <div className="mt-3 flex items-center justify-between">
        <div>
          <GoogleMapsDirectionsLink
            lat={location.lat}
            lng={location.lng}
            address={location.fullAddress || location.address}
            label={location.organizationName}
          />
        </div>
        <div>
          <button
            onClick={() => {
              try {
                window.dispatchEvent(
                  new CustomEvent('open-location-details', {
                    detail: { id: location.id },
                  })
                );
              } catch (e) {}
              onDetails?.();
            }}
            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Details
          </button>
        </div>
      </div>
    </div>
  );

  // Group related fields together for a cleaner detailed view
  const FIELD_GROUPS: { title: string; keys: string[] }[] = [
    {
      title: 'Contact & Address',
      keys: ['fullAddress', 'address', 'phone', 'email', 'county'],
    },
    {
      title: 'Socials',
      keys: [
        'facebook',
        'instagram',
        'website',
        'fbFollowers',
        'fbLikes',
        'fbGroupMembers',
      ],
    },
    {
      title: 'Basic Information',
      keys: ['yearEstablished', 'builtPlaced', 'dataDate', 'nrhpNomination'],
    },
    {
      title: 'Geolocation',
      keys: ['geoCoordinatesDD', 'geoCoordinatesDMM'],
    },
  ];

  const excludedKeys = new Set([
    'lat',
    'lng',
    'siteTypeCategory',
    'tertiaryCategories',
    'id',
  ]);

  const detailedContent = (
    <div className="bg-white rounded shadow max-w-3xl w-full max-h-[80vh] overflow-y-auto overflow-x-hidden p-6">
      <div className="mb-4">
        <h3 className="font-extrabold text-2xl text-slate-800">
          {location.organizationName || 'Unknown'}
        </h3>
        {location.yearEstablished && (
          <div className="text-sm text-slate-500 mt-1">
            Established: {location.yearEstablished}
          </div>
        )}
      </div>

      {/* categories */}
      <div className="flex flex-wrap gap-2 mb-4">
        {(() => {
          const catsRaw = [
            location.siteTypeCategory,
            location.tertiaryCategories,
          ]
            .filter(Boolean)
            .join(', ');
          const cats = catsRaw
            .split(/[,;/|]+/)
            .map(s => s.trim())
            .filter(Boolean);
          return cats.length > 0
            ? cats.map((c, i) => <CategoryBadge key={i} c={c} />)
            : null;
        })()}
      </div>

      <div className="space-y-6">
        {FIELD_GROUPS.map((group, gi) => {
          // collect visible fields in this group
          const entries = group.keys
            .map(k => ({ key: k, val: (location as any)[k] }))
            .filter(
              e =>
                e.val !== undefined &&
                e.val !== null &&
                String(e.val).trim() !== ''
            );
          if (entries.length === 0) return null;
          return (
            <div
              key={group.title}
              className={`${gi > 0 ? 'pt-4 border-t-2 border-slate-300' : ''}`}
            >
              <div className="mb-2">
                <div className="text-xs uppercase tracking-wider font-semibold text-slate-600">
                  {group.title}
                </div>
              </div>

              <div className="space-y-3 pl-4">
                {entries.map(({ key, val }) => (
                  <div key={key} className="flex items-start gap-4">
                    <div className="w-40 text-sm font-semibold text-slate-700 pt-1">
                      {LABELS[key] ||
                        key
                          .replace(/([A-Z])/g, ' $1')
                          .replace(/^./, s => s.toUpperCase())}
                    </div>
                    <div className="flex-1 min-w-0 text-sm text-slate-700">
                      {renderValue(val)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {/* render any remaining fields not in groups */}
        {Object.keys(location)
          .filter(
            k =>
              !excludedKeys.has(k) &&
              !FIELD_GROUPS.some(g => g.keys.includes(k))
          )
          .map(key => {
            const val = (location as any)[key];
            if (val == null || String(val).trim() === '') return null;
            const label =
              LABELS[key] ||
              key
                .replace(/([A-Z])/g, ' $1')
                .replace(/^./, s => s.toUpperCase());
            return (
              <div key={key} className="flex items-start gap-4">
                <div className="w-40 text-sm font-semibold text-slate-700 pt-1">
                  {label}
                </div>
                <div className="flex-1 min-w-0 text-sm text-slate-700">
                  {renderValue(val)}
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );

  if (detailed) {
    // Render a centered DOM overlay covering the map viewport with a wide panel
    // that overlays everything else (high z-index) and a semi-transparent backdrop.
    return (
      <div className="absolute inset-0 z-[9998] flex items-center justify-center pointer-events-auto py-2 sm:py-4 md:py-8 px-2 sm:px-4 md:px-6">
        {/* semi-transparent backdrop that closes on click */}
        <div
          className="absolute inset-0 bg-black/50"
          onClick={onClose}
          aria-hidden
        />

        {/* centered panel: full-ish on mobile, 50% width on md+ screens, sits above all other UI */}
        <div className="relative w-full md:w-1/2 max-w-full md:max-w-4xl max-h-[calc(100vh-5rem)] sm:max-h-[calc(100vh-4rem)] overflow-y-auto bg-white rounded-lg p-4 sm:p-6 shadow-2xl z-[9999]">
          <button
            aria-label="Close details"
            onClick={onClose}
            className="absolute top-2 right-2 sm:-top-3 sm:-right-3 bg-white rounded-full p-2 sm:p-1 shadow-md hover:bg-gray-50 min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation"
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

          {detailedContent}
        </div>
      </div>
    );
  }

  // basic panel rendered in bottom-left of the map viewport
  return (
    <div className="absolute left-2 sm:left-4 bottom-2 sm:bottom-4 z-50 w-[calc(100%-4rem)] sm:w-80 max-w-[calc(100vw-4rem)] sm:max-w-none">
      <div className="relative p-3 sm:p-4 bg-white rounded-lg sm:rounded shadow-lg sm:shadow">
        <button
          aria-label="Close popup"
          onClick={onClose}
          className="absolute top-2 right-2 sm:-top-3 sm:-right-3 bg-white rounded-full p-2 sm:p-1 shadow-md hover:bg-gray-50 min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation"
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

        {basicContent}
      </div>
    </div>
  );
}
