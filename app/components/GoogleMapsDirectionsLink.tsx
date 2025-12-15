'use client';
import React from 'react';

export interface GoogleMapsDirectionsLinkProps {
  lat?: number | null;
  lng?: number | null;
  address?: string | null;
  label?: string | null;
  className?: string;
  children?: React.ReactNode;
}

export default function GoogleMapsDirectionsLink({
  lat,
  lng,
  address,
  label,
  className,
  children,
}: GoogleMapsDirectionsLinkProps) {
  // Build a destination string. Prefer lat,lng for precision, fall back to address.
  let dest: string | null = null;
  if (typeof lat === 'number' && typeof lng === 'number') {
    dest = `${lat},${lng}`;
  } else if (address && String(address).trim() !== '') {
    dest = String(address).trim();
  }

  if (!dest) {
    // Nothing to link to
    return null;
  }

  const q = encodeURIComponent(dest).replace(/%20/g, '+');
  // Omitting origin so Google uses the user's current location when possible
  const url = `https://www.google.com/maps/dir/?api=1&destination=${q}&travelmode=driving`;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      title={label ? `Directions to ${label}` : 'Get directions'}
      className={
        className ||
        'inline-flex items-center gap-2 px-3 py-1 rounded bg-green-600 text-white hover:bg-green-700'
      }
    >
      <svg
        className="w-4 h-4"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Simple car icon: roof/body and wheels */}
        <path d="M5 13 L6 9 H18 L19 13 Z" />
        <path d="M3 13 H21 V16 A1 1 0 0 1 20 17 H19 A1 1 0 0 1 18 16 V15 H6 V16 A1 1 0 0 1 5 17 H4 A1 1 0 0 1 3 16 Z" />
        <circle cx="7" cy="18" r="1" />
        <circle cx="17" cy="18" r="1" />
      </svg>
      <span className="text-sm">{children ?? 'Directions'}</span>
    </a>
  );
}
