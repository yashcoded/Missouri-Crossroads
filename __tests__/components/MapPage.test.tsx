import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import MapPage from '../../app/map/page';

// Mock the MissouriMap component
jest.mock('../../app/components/MissouriMap', () => {
  return function MockMissouriMap({ fileName }: { fileName: string }) {
    return <div data-testid="missouri-map">Mock Missouri Map - {fileName}</div>;
  };
});

describe('MapPage Component', () => {
  test('renders map page shell and header area (title removed in UI)', () => {
    render(<MapPage />);

    // The main header was intentionally removed from the UI; ensure the page shell renders
    expect(screen.getByTestId('missouri-map')).toBeInTheDocument();
  });

  test('renders MissouriMap component', () => {
    render(<MapPage />);

    expect(screen.getByTestId('missouri-map')).toBeInTheDocument();
    expect(
      screen.getByText('Mock Missouri Map - metadata-1759267238657.csv')
    ).toBeInTheDocument();
  });

  test('has proper styling classes', () => {
    const { container } = render(<MapPage />);

    // Check for gradient background
    expect(container.querySelector('.bg-gradient-to-br')).toBeInTheDocument();

    // The page title block was commented out in the app; verify the map is present instead
    expect(screen.getByTestId('missouri-map')).toBeInTheDocument();
  });
});
