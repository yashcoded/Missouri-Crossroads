'use client';
import { getLocUrlForCategory } from '../../lib/locCategoryMap';
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

  const basicContent = (
    <div className="p-3 max-w-sm bg-white rounded shadow">
      <h3 className="font-bold text-lg mb-2">
        {location.organizationName || 'Unknown'}
      </h3>
      {/* categories as badges */}
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
          <span className="font-semibold">{LABELS.address || 'Address'}:</span>
          <span className="ml-2">{location.address || '—'}</span>
        </div>
      </div>
      <div className="mt-3 flex justify-start">
        <button
          onClick={() => {
            try {
              window.dispatchEvent(
                new CustomEvent('open-location-details', {
                  detail: { id: location.id },
                })
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
      <div className="whitespace-pre-wrap break-words text-slate-700">{s}</div>
    );
  };

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
            ? cats.map((c, i) => {
                const locUrl = getLocUrlForCategory(c);
                return locUrl ? (
                  <a
                    key={i}
                    href={locUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-blue-50 text-blue-800 border border-blue-100 hover:underline"
                    title={`Look up ${c} on LOC`}
                  >
                    {c}
                  </a>
                ) : (
                  <span
                    key={i}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-blue-50 text-blue-800 border border-blue-100"
                  >
                    {c}
                  </span>
                );
              })
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
      <div className="absolute inset-0 z-[9998] flex items-center justify-center pointer-events-auto py-8 px-6">
        {/* semi-transparent backdrop that closes on click */}
        <div
          className="absolute inset-0 bg-black/50"
          onClick={onClose}
          aria-hidden
        />

        {/* centered panel: full-ish on mobile, 50% width on md+ screens, sits above all other UI */}
        <div className="relative w-full md:w-1/2 max-w-[calc(100%-4rem)] md:max-w-4xl max-h-[calc(100vh-4rem)] overflow-y-auto bg-white rounded-lg p-6 shadow-2xl z-[9999]">
          <button
            aria-label="Close details"
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
