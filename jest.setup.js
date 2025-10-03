import '@testing-library/jest-dom'

// Mock Google Maps
global.google = {
  maps: {
    Map: jest.fn(),
    Marker: jest.fn(),
    InfoWindow: jest.fn(),
    LatLngBounds: jest.fn(),
    Size: jest.fn(),
    Point: jest.fn(),
    Animation: {
      DROP: 1
    }
  }
}

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn(),
  }),
  usePathname: () => '/',
}))

// Mock environment variables
process.env.NEXT_PUBLIC_MAP_KEY = 'test-google-maps-key'
process.env.NEXT_PUBLIC_PLACES_KEY = 'test-google-places-key'
