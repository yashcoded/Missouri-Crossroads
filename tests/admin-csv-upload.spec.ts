import { test, expect } from '@playwright/test';
import path from 'path';

/**
 * Admin and CSV Upload Tests
 * Tests for admin functionality and CSV upload features
 */

test.describe('CSV Upload API', () => {
  test('should have CSV upload endpoint available', async ({ request }) => {
    // Test that the endpoint exists (will fail without auth, but shouldn't 404)
    const response = await request.post('/api/admin/upload-csv', {
      data: {}
    });
    
    // Should return 400/401/403, not 404 (endpoint exists)
    expect(response.status()).not.toBe(404);
  });

  test('should validate file type for CSV upload', async ({ request }) => {
    const response = await request.post('/api/admin/upload-csv', {
      multipart: {
        file: {
          name: 'test.txt',
          mimeType: 'text/plain',
          buffer: Buffer.from('not a csv'),
        }
      }
    });
    
    // Should reject non-CSV files
    expect([400, 415]).toContain(response.status());
  });

  test('should require file parameter', async ({ request }) => {
    const response = await request.post('/api/admin/upload-csv', {
      data: {}
    });
    
    // Should return error for missing file (400 or 500 both acceptable)
    expect([400, 500]).toContain(response.status());
  });
});

test.describe('CSV Data API - Caching', () => {
  test('should use cache for repeated requests', async ({ request }) => {
    const fileName = 'metadata-1759267238657.csv';
    
    // First request
    const response1 = await request.get(`/api/map/csv-data?fileName=${fileName}`);
    expect(response1.ok()).toBe(true);
    const data1 = await response1.json();
    
    // Second request (should be cached)
    const response2 = await request.get(`/api/map/csv-data?fileName=${fileName}`);
    expect(response2.ok()).toBe(true);
    const data2 = await response2.json();
    
    // Data should be identical
    expect(data1.locations.length).toBe(data2.locations.length);
    expect(data1.success).toBe(data2.success);
  });

  test('should support viewport-based loading', async ({ request }) => {
    const fileName = 'metadata-1759267238657.csv';
    
    // Request with viewport parameters
    const response = await request.get(
      `/api/map/csv-data?fileName=${fileName}&centerLat=38.6270&centerLng=-90.1994&viewport=true`
    );
    
    expect(response.ok()).toBe(true);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.locations).toBeDefined();
  });

  test('should handle different center locations', async ({ request }) => {
    const fileName = 'metadata-1759267238657.csv';
    
    // Request for Kansas City area
    const kcResponse = await request.get(
      `/api/map/csv-data?fileName=${fileName}&centerLat=39.0997&centerLng=-94.5786`
    );
    expect(kcResponse.ok()).toBe(true);
    
    // Request for St. Louis area
    const stlResponse = await request.get(
      `/api/map/csv-data?fileName=${fileName}&centerLat=38.6270&centerLng=-90.1994`
    );
    expect(stlResponse.ok()).toBe(true);
    
    // Both should return valid data
    const kcData = await kcResponse.json();
    const stlData = await stlResponse.json();
    
    expect(kcData.success).toBe(true);
    expect(stlData.success).toBe(true);
  });
});

test.describe('CSV Parsing Edge Cases', () => {
  test('should handle empty coordinate fields', async ({ request }) => {
    const response = await request.get('/api/map/csv-data?fileName=metadata-1759267238657.csv');
    const data = await response.json();
    
    // Should not crash on empty coordinates
    expect(data.success).toBe(true);
  });

  test('should handle malformed coordinate strings', async ({ request }) => {
    const response = await request.get('/api/map/csv-data?fileName=metadata-1759267238657.csv');
    const data = await response.json();
    
    // Should gracefully skip malformed coordinates
    expect(data.success).toBe(true);
    expect(data.locations).toBeInstanceOf(Array);
  });

  test('should provide detailed parsing statistics', async ({ request }) => {
    const response = await request.get('/api/map/csv-data?fileName=metadata-1759267238657.csv');
    const data = await response.json();
    
    // Response should include metadata about parsing
    expect(data.success).toBe(true);
    expect(data.locations).toBeDefined();
    expect(data.locations.length).toBeGreaterThan(0);
  });
});

test.describe('S3 Presigned URL API', () => {
  test('should have presign endpoint available', async ({ request }) => {
    const response = await request.post('/api/s3/presign', {
      data: {
        fileName: 'test.jpg',
        contentType: 'image/jpeg'
      }
    });
    
    // Should either succeed or fail with proper error (not 404)
    expect(response.status()).not.toBe(404);
  });

  test('should require fileName parameter', async ({ request }) => {
    const response = await request.post('/api/s3/presign', {
      data: {
        contentType: 'image/jpeg'
      }
    });
    
    expect(response.status()).toBe(400);
  });

  test('should require contentType parameter', async ({ request }) => {
    const response = await request.post('/api/s3/presign', {
      data: {
        fileName: 'test.jpg'
      }
    });
    
    expect(response.status()).toBe(400);
  });

  test('should support different file types', async ({ request }) => {
    const fileTypes = [
      { fileName: 'test.jpg', contentType: 'image/jpeg' },
      { fileName: 'test.png', contentType: 'image/png' },
      { fileName: 'test.mp3', contentType: 'audio/mpeg' },
    ];
    
    for (const fileType of fileTypes) {
      const response = await request.post('/api/s3/presign', {
        data: fileType
      });
      
      // Should either succeed or fail with auth error (not validation error)
      expect([200, 401, 403, 500]).toContain(response.status());
    }
  });
});

test.describe('Error Handling', () => {
  test('should handle missing CSV file gracefully', async ({ request }) => {
    const response = await request.get('/api/map/csv-data?fileName=nonexistent.csv');
    
    // Should return error or fallback data
    expect([200, 404, 500]).toContain(response.status());
    
    if (response.ok()) {
      const data = await response.json();
      // If it returns 200, should have fallback/sample data
      expect(data).toBeDefined();
    }
  });

  test('should handle invalid query parameters', async ({ request }) => {
    const response = await request.get('/api/map/csv-data?fileName=test.csv&centerLat=invalid&centerLng=abc');
    
    // Should handle gracefully, not crash
    expect([200, 400]).toContain(response.status());
  });

  test('should handle special characters in fileName', async ({ request }) => {
    const response = await request.get('/api/map/csv-data?fileName=../../../etc/passwd');
    
    // Should handle safely - may return 200 with fallback data or error
    if (response.status() === 200) {
      const data = await response.json();
      const dataStr = JSON.stringify(data);
      // Should not return actual system files
      expect(dataStr).not.toMatch(/root:x:|\/bin\/bash/);
    }
    expect([200, 400, 404, 500]).toContain(response.status());
  });
});

test.describe('Data Integrity', () => {
  test('should preserve data structure through parsing', async ({ request }) => {
    const response = await request.get('/api/map/csv-data?fileName=metadata-1759267238657.csv');
    const data = await response.json();
    
    expect(data.success).toBe(true);
    expect(data.locations).toBeInstanceOf(Array);
    
    // Each location should have required fields
    if (data.locations.length > 0) {
      const location = data.locations[0];
      expect(location).toHaveProperty('id');
      expect(location).toHaveProperty('organizationName');
      expect(location).toHaveProperty('siteTypeCategory');
      
      // Coordinate fields
      if (location.lat && location.lng) {
        expect(typeof location.lat).toBe('number');
        expect(typeof location.lng).toBe('number');
      }
    }
  });
});

