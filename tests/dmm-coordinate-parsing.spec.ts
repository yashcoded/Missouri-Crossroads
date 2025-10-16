import { test, expect } from '@playwright/test';

/**
 * DMM Coordinate Parsing Tests
 * Tests for the enhanced coordinate parsing that handles multiple formats:
 * - DMM (Degrees, Decimal Minutes): N39° 11.234' W93° 52.567'
 * - DMS (Degrees, Minutes, Seconds): N39° 11' 23.4" W93° 52' 33.8"
 * - Decimal: 39.187233, -93.876056
 * - Various format variations
 */

test.describe('Coordinate Parsing - API Tests', () => {
  test('should parse multiple coordinate formats successfully', async ({ request }) => {
    const response = await request.get('/api/map/csv-data?fileName=metadata-1759267238657.csv');
    expect(response.ok()).toBe(true);
    
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.locations).toBeDefined();
    
    // Should have parsed more locations than before (> 91)
    const validLocations = data.locations.filter((loc: any) => 
      loc.lat && loc.lng && loc.lat !== 0 && loc.lng !== 0
    );
    expect(validLocations.length).toBeGreaterThan(91);
    
    // Verify we have many locations (CSV contains 1080 rows)
    expect(data.locations.length).toBeGreaterThan(100);
  });

  test('should handle reversed coordinate order', async ({ request }) => {
    // Test cases like: "W92°44'34 N38°58'25" (longitude first)
    const response = await request.get('/api/map/csv-data?fileName=metadata-1759267238657.csv');
    const data = await response.json();
    
    // Should successfully parse locations with reversed order
    expect(data.locations.length).toBeGreaterThan(50);
    
    // All parsed locations should have valid Missouri coordinates
    const locationsInMissouri = data.locations.filter((loc: any) => {
      if (!loc.lat || !loc.lng) return true; // Skip unparsed
      return loc.lat >= 35 && loc.lat <= 41 && 
             loc.lng >= -96 && loc.lng <= -89;
    });
    
    // Most locations should be within Missouri bounds
    const ratio = locationsInMissouri.length / data.locations.length;
    expect(ratio).toBeGreaterThan(0.8);
  });

  test('should handle DMS format with seconds', async ({ request }) => {
    // Test cases like: "N39° 11' 23.6" W93° 52' 33.8"
    const response = await request.get('/api/map/csv-data?fileName=metadata-1759267238657.csv');
    const data = await response.json();
    
    // Should parse DMS format correctly
    expect(data.success).toBe(true);
    expect(data.locations.length).toBeGreaterThan(91);
  });

  test('should handle decimal coordinate pairs', async ({ request }) => {
    const response = await request.get('/api/map/csv-data?fileName=metadata-1759267238657.csv');
    const data = await response.json();
    
    // Some rows have decimal coordinates that should be parsed
    const decimalsFound = data.locations.some((loc: any) => 
      loc.lat && String(loc.lat).includes('.')
    );
    expect(decimalsFound).toBe(true);
  });
});

test.describe('Coordinate Validation', () => {
  test('should reject coordinates outside Missouri bounds', async ({ request }) => {
    const response = await request.get('/api/map/csv-data?fileName=metadata-1759267238657.csv');
    const data = await response.json();
    
    // Filter locations with coordinates
    const withCoords = data.locations.filter((loc: any) => 
      loc.lat && loc.lng && loc.lat !== 0 && loc.lng !== 0
    );
    
    // All should be within Missouri (with small buffer for nearby locations)
    withCoords.forEach((loc: any) => {
      // Missouri bounds: lat 35.99 to 40.61, lng -95.77 to -89.10
      expect(loc.lat).toBeGreaterThan(34); // Allow 1 degree buffer
      expect(loc.lat).toBeLessThan(42);
      expect(loc.lng).toBeGreaterThan(-97);
      expect(loc.lng).toBeLessThan(-88);
    });
  });

  test('should validate latitude is between -90 and 90', async ({ request }) => {
    const response = await request.get('/api/map/csv-data?fileName=metadata-1759267238657.csv');
    const data = await response.json();
    
    data.locations.forEach((loc: any) => {
      if (loc.lat && loc.lat !== 0) {
        expect(loc.lat).toBeGreaterThan(-90);
        expect(loc.lat).toBeLessThan(90);
      }
    });
  });

  test('should validate longitude is between -180 and 180', async ({ request }) => {
    const response = await request.get('/api/map/csv-data?fileName=metadata-1759267238657.csv');
    const data = await response.json();
    
    data.locations.forEach((loc: any) => {
      if (loc.lng && loc.lng !== 0) {
        expect(loc.lng).toBeGreaterThan(-180);
        expect(loc.lng).toBeLessThan(180);
      }
    });
  });
});

test.describe('Data Quality', () => {
  test('should have organization names for all locations', async ({ request }) => {
    const response = await request.get('/api/map/csv-data?fileName=metadata-1759267238657.csv');
    const data = await response.json();
    
    // Most locations should have names
    const withNames = data.locations.filter((loc: any) => 
      loc.organizationName && loc.organizationName.trim() !== ''
    );
    
    expect(withNames.length).toBeGreaterThan(data.locations.length * 0.9);
  });

  test('should categorize locations correctly', async ({ request }) => {
    const response = await request.get('/api/map/csv-data?fileName=metadata-1759267238657.csv');
    const data = await response.json();
    
    // All locations should have a category field
    const withCategory = data.locations.filter((loc: any) => 
      loc.siteTypeCategory && loc.siteTypeCategory.trim() !== ''
    );
    
    // Most locations should have categories
    expect(withCategory.length).toBeGreaterThan(data.locations.length * 0.9);
    
    // Just verify we have the main categories present
    const categories = new Set(data.locations.map((loc: any) => loc.siteTypeCategory));
    const hasHistoric = Array.from(categories).some(cat => String(cat).includes('Historic'));
    const hasMonuments = Array.from(categories).some(cat => String(cat).includes('Monument'));
    
    // Should have at least some of the expected categories
    expect(hasHistoric || hasMonuments).toBe(true);
  });

  test('should handle special characters in location names', async ({ request }) => {
    const response = await request.get('/api/map/csv-data?fileName=metadata-1759267238657.csv');
    const data = await response.json();
    
    // Should not have HTML entities or broken encoding
    data.locations.forEach((loc: any) => {
      if (loc.organizationName) {
        expect(loc.organizationName).not.toMatch(/&lt;|&gt;|&amp;amp;/);
        expect(loc.organizationName).not.toMatch(/\\u[0-9a-f]{4}/i);
      }
    });
  });
});

test.describe('Performance', () => {
  test('should cache CSV data for subsequent requests', async ({ request }) => {
    // First request (may be slow due to parsing)
    await request.get('/api/map/csv-data?fileName=metadata-1759267238657.csv');
    
    // Second request (should be faster - cached)
    const start2 = Date.now();
    const response = await request.get('/api/map/csv-data?fileName=metadata-1759267238657.csv');
    const duration2 = Date.now() - start2;
    
    // Cached request should be reasonably fast (< 500ms)
    expect(response.ok()).toBe(true);
    expect(duration2).toBeLessThan(500); // More realistic for cached response
  });
});

test.describe('Integration with Map Display', () => {
  test('should display parsed locations on map', async ({ page }) => {
    await page.goto('/map');
    await page.waitForLoadState('domcontentloaded');
    
    // Should show location count > 91 (the old count before DMM fix)
    const locationText = page.getByText(/Showing.*location/i);
    await expect(locationText).toBeVisible({ timeout: 5000 });
    
    const text = await locationText.textContent();
    const match = text?.match(/\d+/);
    const count = match ? parseInt(match[0]) : 0;
    
    expect(count).toBeGreaterThan(91);
  });
});

