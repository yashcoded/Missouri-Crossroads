import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import GoogleMapsDirectionsLink from '../../app/components/GoogleMapsDirectionsLink';

describe('GoogleMapsDirectionsLink', () => {
  test('renders link with lat,lng destination when provided', () => {
    render(
      <GoogleMapsDirectionsLink lat={38.627} lng={-90.1994} label="StL" />
    );
    const link = screen.getByRole('link', { name: /Directions/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('target', '_blank');
    const href = link.getAttribute('href') || '';
    expect(href).toContain('destination=38.627');
    expect(href).toContain('travelmode=driving');
  });

  test('falls back to address when lat/lng not provided', () => {
    render(
      <GoogleMapsDirectionsLink
        address={'1600 Amphitheatre Parkway, Mountain View, CA'}
        label="Google"
      />
    );
    const link = screen.getByRole('link', {
      name: /Directions to Google|Directions/i,
    });
    expect(link).toBeInTheDocument();
    const href = link.getAttribute('href') || '';
    expect(href).toContain(
      'destination=1600+Amphitheatre+Parkway%2C+Mountain+View%2C+CA'
        .split('%2C')
        .slice(0, 1)[0] || '1600'
    );
    expect(href).toContain('travelmode=driving');
  });

  test('renders nothing when no destination data is available', () => {
    const { container } = render(<GoogleMapsDirectionsLink />);
    // Container should be empty (no anchor elements)
    expect(container.querySelector('a')).toBeNull();
  });
});
