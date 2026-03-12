'use client';
import React, { useEffect } from 'react';
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
  // structured category pairs provided by server: { raw, label, url? }
  categoryPairs?: { raw: string; label: string; url?: string }[];
}

interface MapPopupProps {
  location: LocationData | null;
  onClose?: () => void;
}

import { InfoWindow } from '@react-google-maps/api';
import GoogleMapsDirectionsLink from '../GoogleMapsDirectionsLink';

const UMSL_RED = 'rgba(186, 12, 47, 1)';
const UMSL_RED_SOFT = 'rgba(186, 12, 47, 0.18)';
const UMSL_GOLD = 'rgba(234, 171, 0, 1)';
const UMSL_GOLD_SOFT = 'rgba(234, 171, 0, 0.18)';
const PANEL_BG = 'rgba(24, 24, 27, 0.94)';
const PANEL_BG_LIGHT = 'rgba(39, 39, 42, 0.72)';
const PANEL_BORDER = 'rgba(234, 171, 0, 0.18)';

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

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Rendering MapPopup for location:', location);
      console.log('MapPopup categoryPairs:', (location as any)?.categoryPairs);
    }
  }, [location]);

  const renderValue = (val: any) => {
    if (val == null) return null;
    const s = String(val).trim();
    if (s === '') return null;

    if (/^https?:\/\//i.test(s)) {
      return (
        <a
          href={s}
          target="_blank"
          rel="noopener noreferrer"
          className="break-all text-[#EAAB00] transition hover:text-white hover:underline"
        >
          {s}
        </a>
      );
    }

    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)) {
      return (
        <a
          href={`mailto:${s}`}
          className="break-all text-[#EAAB00] transition hover:text-white hover:underline"
        >
          {s}
        </a>
      );
    }

    return (
      <div className="whitespace-pre-wrap break-words text-zinc-300">{s}</div>
    );
  };

  const normalizeContact = (v: any): string | null => {
    if (v == null) return null;
    const s = String(v).trim();
    if (s === '') return null;
    const low = s.toLowerCase();
    if (low === 'n/a' || low === 'na' || low === 'unknown' || low === 'none')
      return null;
    if (/^n\/?a$/i.test(s)) return null;
    if (/^[-—–]+$/.test(s)) return null;
    return s;
  };

  const renderCategoryBadge = (
    p: { raw: string; label: string; url?: string },
    i: number,
    large = false
  ) => {
    const badge = (
      <span
        key={`cat-${i}`}
        className={`inline-flex items-center rounded-full font-semibold text-white ${
          large ? 'px-3 py-1 text-sm' : 'px-2 py-0.5 text-xs'
        }`}
        style={{
          background: UMSL_RED_SOFT,
          border: `1px solid ${UMSL_GOLD_SOFT}`,
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
        }}
      >
        {p.label}
      </span>
    );

    if (p.url) {
      return (
        <a
          key={`link-${i}`}
          href={p.url}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:underline"
        >
          {badge}
        </a>
      );
    }

    return badge;
  };

  const basicContent = (
    <div className="max-w-sm p-1 text-zinc-300">
      <h3 className="mb-2 text-lg font-bold text-white">
        {location.organizationName || 'Unknown'}
      </h3>

      <div
        className="my-3 border-t"
        style={{ borderColor: 'rgba(234, 171, 0, 0.14)' }}
      />

      <div className="mb-2 text-sm">
        <div>
          <span className="font-semibold text-zinc-200">
            {LABELS.address || 'Address'}:
          </span>
          <span className="ml-2">{renderValue(location.address) ?? '—'}</span>
        </div>
      </div>

      <div className="mb-3 text-sm">
        <div>
          <span className="font-semibold text-zinc-200">Contact:</span>
          <span className="ml-2 block max-w-full break-all whitespace-normal">
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
                    className="break-all text-[#EAAB00] transition hover:text-white hover:underline"
                  >
                    {phone}
                  </a>
                );
              if (email)
                return (
                  <a
                    href={`mailto:${email}`}
                    className="break-all text-[#EAAB00] transition hover:text-white hover:underline"
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
                    className="break-all text-[#EAAB00] transition hover:text-white hover:underline"
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
                    className="break-all text-[#EAAB00] transition hover:text-white hover:underline"
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
                    className="break-all text-[#EAAB00] transition hover:text-white hover:underline"
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
                  className="text-[#EAAB00] transition hover:text-white hover:underline"
                >
                  Search for {location.organizationName || 'this place'}
                </a>
              );
            })()}
          </span>
        </div>
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        {location.categoryPairs && location.categoryPairs.length > 0
          ? location.categoryPairs.map((p, i) => renderCategoryBadge(p, i))
          : null}
      </div>

      <div
        className="mt-3 flex items-center justify-between border-t pt-3"
        style={{ borderColor: 'rgba(234, 171, 0, 0.14)' }}
      >
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
            className="rounded px-3 py-1 text-white transition"
            style={{
              backgroundColor: UMSL_RED,
              boxShadow: '0 8px 20px rgba(186,12,47,0.28)',
            }}
          >
            Details
          </button>
        </div>
      </div>
    </div>
  );

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
    <div className="w-full max-w-3xl max-h-full overflow-y-auto overflow-x-hidden p-1 text-zinc-300">
      <div className="mb-4">
        <h3 className="text-2xl font-extrabold text-white">
          {location.organizationName || 'Unknown'}
        </h3>
        {location.yearEstablished && (
          <div className="mt-1 text-sm text-zinc-500">
            Established: {location.yearEstablished}
          </div>
        )}
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {location.categoryPairs && location.categoryPairs.length > 0
          ? location.categoryPairs.map((p, i) =>
              renderCategoryBadge(p, i, true)
            )
          : null}
      </div>

      <div className="space-y-6">
        {FIELD_GROUPS.map((group, gi) => {
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
              className={gi > 0 ? 'border-t pt-4' : ''}
              style={gi > 0 ? { borderColor: 'rgba(234, 171, 0, 0.14)' } : {}}
            >
              <div className="mb-2">
                <div
                  className="text-xs font-semibold uppercase tracking-wider"
                  style={{ color: UMSL_GOLD }}
                >
                  {group.title}
                </div>
              </div>

              <div className="space-y-3 pl-0 sm:pl-4">
                {entries.map(({ key, val }) => (
                  <div
                    key={key}
                    className="flex flex-col gap-1 sm:flex-row sm:items-start sm:gap-4"
                  >
                    <div className="w-full pt-1 text-sm font-semibold text-zinc-400 sm:w-40">
                      {LABELS[key] ||
                        key
                          .replace(/([A-Z])/g, ' $1')
                          .replace(/^./, s => s.toUpperCase())}
                    </div>
                    <div className="min-w-0 flex-1 text-sm text-zinc-300">
                      {renderValue(val)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

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
              <div
                key={key}
                className="flex flex-col gap-1 sm:flex-row sm:items-start sm:gap-4"
              >
                <div className="w-full pt-1 text-sm font-semibold text-zinc-400 sm:w-40">
                  {label}
                </div>
                <div className="min-w-0 flex-1 text-sm text-zinc-300">
                  {renderValue(val)}
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );

  if (detailed) {
    return (
      <div className="pointer-events-auto absolute inset-0 z-[9998] flex items-center justify-center px-2 py-2 sm:px-4 sm:py-4 md:px-6 md:py-8">
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
          onClick={onClose}
          aria-hidden
        />

        <div
          className="relative z-[9999] max-h-full w-full max-w-full overflow-y-auto rounded-2xl p-4 shadow-2xl sm:p-6 md:w-1/2 md:max-w-4xl"
          style={{
            background: PANEL_BG,
            border: `1px solid ${PANEL_BORDER}`,
            boxShadow: '0 28px 80px rgba(0,0,0,0.45)',
          }}
        >
          <button
            aria-label="Close details"
            onClick={onClose}
            className="touch-manipulation absolute right-2 top-2 flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full p-2 shadow-md transition hover:scale-105 sm:-right-3 sm:-top-3 sm:p-1"
            style={{
              background: 'rgba(24, 24, 27, 0.98)',
              border: `1px solid ${PANEL_BORDER}`,
            }}
          >
            <svg
              className="h-4 w-4"
              style={{ color: UMSL_GOLD }}
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

  return (
    <div className="absolute bottom-2 right-2 z-50 w-[calc(100%-4rem)] max-w-[calc(100vw-4rem)] sm:bottom-4 sm:right-4 sm:w-80 sm:max-w-none">
      <div
        className="relative rounded-xl p-3 shadow-2xl backdrop-blur-md sm:rounded-2xl sm:p-4"
        style={{
          background: PANEL_BG,
          border: `1px solid ${PANEL_BORDER}`,
          boxShadow: '0 20px 50px rgba(0,0,0,0.35)',
        }}
      >
        <button
          aria-label="Close popup"
          onClick={onClose}
          className="touch-manipulation absolute right-2 top-2 flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full p-2 shadow-md transition hover:scale-105 sm:-right-3 sm:-top-3 sm:p-1"
          style={{
            background: 'rgba(24, 24, 27, 0.98)',
            border: `1px solid ${PANEL_BORDER}`,
          }}
        >
          <svg
            className="h-4 w-4"
            style={{ color: UMSL_GOLD }}
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
