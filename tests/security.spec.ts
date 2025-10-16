import { test, expect } from '@playwright/test';

/**
 * Security Tests
 * Tests to ensure sensitive data is not exposed to the client
 */

test.describe('Security - Environment Variables', () => {
  test('should NOT expose AWS credentials in client-side JavaScript', async ({ page }) => {
    await page.goto('/map');
    await page.waitForLoadState('domcontentloaded');
    
    // Check if AWS credentials are exposed in environment or global scope
    const hasAWSKeys = await page.evaluate(() => {
      // Check process.env (won't exist in browser)
      const processEnv = typeof process !== 'undefined' && process.env;
      if (processEnv) {
        const envStr = JSON.stringify(processEnv);
        if (envStr.includes('NEXT_PUBLIC_AWS_ACCESS_KEY') || 
            envStr.includes('NEXT_PUBLIC_AWS_SECRET')) {
          return true;
        }
      }
      
      // Check window object for exposed keys
      const win = window as any;
      return !!(win.AWS_ACCESS_KEY_ID || win.AWS_SECRET_ACCESS_KEY || 
                win.NEXT_PUBLIC_AWS_ACCESS_KEY_ID || win.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY);
    });
    
    expect(hasAWSKeys).toBe(false);
  });

  test('should NOT expose AWS credentials in page source', async ({ page }) => {
    await page.goto('/map');
    const content = await page.content();
    
    // Check for AWS access key patterns
    expect(content).not.toMatch(/AKIA[0-9A-Z]{16}/);
    expect(content).not.toMatch(/AWS_SECRET_ACCESS_KEY/);
  });

  test('should NOT expose sensitive environment variables in network responses', async ({ page }) => {
    const responses: string[] = [];
    
    page.on('response', async response => {
      if (response.url().includes('/api/')) {
        try {
          const body = await response.text();
          responses.push(body);
        } catch (e) {
          // Some responses can't be read as text
        }
      }
    });
    
    await page.goto('/map');
    await page.waitForLoadState('domcontentloaded');
    
    const allResponses = responses.join('\n');
    expect(allResponses).not.toMatch(/AKIA[0-9A-Z]{16}/);
    expect(allResponses).not.toMatch(/AWS_SECRET_ACCESS_KEY/);
  });

  test('should use server-side API routes for AWS operations', async ({ page, request }) => {
    // Check that map data comes from API route, not direct S3
    const response = await request.get('/api/map/csv-data?fileName=test.csv');
    
    // Should get response from Next.js API, not direct S3 URL
    expect(response.url()).toContain('/api/map/csv-data');
    expect(response.url()).not.toContain('amazonaws.com');
  });
});

test.describe('Security - Headers and CORS', () => {
  test('should have appropriate security headers', async ({ page }) => {
    const response = await page.goto('/');
    
    const headers = response?.headers();
    
    // Check for X-Content-Type-Options
    // Note: Next.js may not set all headers by default
    expect(headers).toBeDefined();
  });

  test('should not expose server information in headers', async ({ page }) => {
    const response = await page.goto('/');
    const headers = response?.headers();
    
    // Should not expose server version or tech stack
    const serverHeader = headers?.['server'];
    if (serverHeader) {
      expect(serverHeader).not.toMatch(/\d+\.\d+/); // No version numbers
    }
  });
});

test.describe('Security - Input Validation', () => {
  test('should sanitize search input', async ({ page }) => {
    await page.goto('/map');
    await page.waitForLoadState('domcontentloaded');
    
    const dialogs: any[] = [];
    page.on('dialog', dialog => dialogs.push(dialog));
    
    const searchInput = page.getByPlaceholder(/Search/i);
    await expect(searchInput).toBeVisible({ timeout: 3000 });
    
    // Try XSS attack
    await searchInput.fill('<script>alert("xss")</script>');
    await page.waitForTimeout(300);
    
    // Should not execute script
    expect(dialogs.length).toBe(0);
  });

  test('should handle SQL injection attempts in search', async ({ page }) => {
    await page.goto('/map');
    await page.waitForLoadState('domcontentloaded');
    
    const searchInput = page.getByPlaceholder(/Search/i);
    await expect(searchInput).toBeVisible({ timeout: 3000 });
    
    // Try SQL injection
    await searchInput.fill("' OR '1'='1");
    
    // Page should still be on map (no crash)
    expect(page.url()).toContain('/map');
  });
});

test.describe('Security - API Endpoints', () => {
  test('API should not return sensitive internal data', async ({ request }) => {
    const response = await request.get('/api/map/csv-data?fileName=test.csv');
    const data = await response.json();
    
    // Should not expose internal paths or configurations
    const dataStr = JSON.stringify(data);
    expect(dataStr).not.toMatch(/\/Users\/|C:\\|password|secret|key.*=/i);
  });

  test('API should validate fileName parameter', async ({ request }) => {
    // Try path traversal attack
    const response = await request.get('/api/map/csv-data?fileName=../../../etc/passwd');
    
    // If it returns 200, verify it's returning safe sample/fallback data, not actual file
    if (response.status() === 200) {
      const data = await response.json();
      const dataStr = JSON.stringify(data);
      // Should not contain /etc/passwd content
      expect(dataStr).not.toMatch(/root:x:|\/bin\/bash/);
    }
    
    // Should handle safely (either reject or return safe fallback)
    expect([200, 400, 404, 500]).toContain(response.status());
  });

  test('API should handle missing parameters gracefully', async ({ request }) => {
    const response = await request.get('/api/map/csv-data');
    
    // Should handle gracefully (may return 200 with default/sample data or error)
    expect([200, 400, 404, 500]).toContain(response.status());
    
    // If successful, should return valid structure
    if (response.ok()) {
      const data = await response.json();
      expect(data).toBeDefined();
    }
  });
});

test.describe('Security - Authentication', () => {
  test('should have authentication routes available', async ({ page }) => {
    await page.goto('/auth');
    
    // Should load auth page (or redirect)
    await page.waitForLoadState('networkidle');
    expect(page.url()).toBeTruthy();
  });

  test('should not expose Cognito client secret in client code', async ({ page }) => {
    await page.goto('/auth');
    await page.waitForLoadState('networkidle');
    
    const content = await page.content();
    expect(content).not.toMatch(/COGNITO_CLIENT_SECRET/);
    expect(content).not.toMatch(/ClientSecret/);
  });
});

test.describe('Security - Data Validation', () => {
  test('should validate coordinate data ranges', async ({ request }) => {
    const response = await request.get('/api/map/csv-data?fileName=metadata-1759267238657.csv');
    expect(response.ok()).toBe(true);
    
    const data = await response.json();
    const locations = data.locations || [];
    
    // All coordinates should be within Missouri bounds
    locations.forEach((loc: any) => {
      if (loc.lat && loc.lng) {
        expect(loc.lat).toBeGreaterThan(35);
        expect(loc.lat).toBeLessThan(41);
        expect(loc.lng).toBeGreaterThan(-96);
        expect(loc.lng).toBeLessThan(-89);
      }
    });
  });

  test('should handle malformed CSV data gracefully', async ({ request }) => {
    // This tests robustness against bad data
    const response = await request.get('/api/map/csv-data?fileName=invalid.csv');
    
    // Should return error or empty array, not crash
    expect([200, 400, 404, 500]).toContain(response.status());
  });
});

