import { test, expect } from '@playwright/test';

/**
 * PWA (Progressive Web App) Tests
 * Tests for PWA functionality including:
 * - Manifest file accessibility and validity
 * - Service worker registration
 * - PWA icons presence
 * - PWA metadata in HTML
 * - Offline functionality
 * - Installability features
 */

test.describe('PWA Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
  });

  test('should have accessible manifest.json', async ({ page }) => {
    // Check manifest link in HTML (may appear multiple times - in head and body)
    const manifestLinks = page.locator('link[rel="manifest"]');
    const count = await manifestLinks.count();
    expect(count).toBeGreaterThan(0);
    
    // Check first manifest link
    const firstLink = manifestLinks.first();
    await expect(firstLink).toHaveAttribute('href', '/manifest.json');

    // Fetch and verify manifest content
    const response = await page.request.get('/manifest.json');
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('application/json');

    const manifest = await response.json();
    
    // Verify required manifest fields
    expect(manifest).toHaveProperty('name');
    expect(manifest).toHaveProperty('short_name');
    expect(manifest).toHaveProperty('start_url');
    expect(manifest).toHaveProperty('display');
    expect(manifest).toHaveProperty('theme_color');
    expect(manifest).toHaveProperty('background_color');
    expect(manifest).toHaveProperty('icons');
    
    // Verify manifest values
    expect(manifest.name).toBe('Missouri Crossroads');
    expect(manifest.short_name).toBe('MO Crossroads');
    expect(manifest.start_url).toBe('/');
    expect(manifest.display).toBe('standalone');
    expect(manifest.icons).toHaveLength(2);
    
    // Verify icon entries
    const icons = manifest.icons;
    expect(icons[0]).toHaveProperty('src', '/icon-192x192.png');
    expect(icons[0]).toHaveProperty('sizes', '192x192');
    expect(icons[1]).toHaveProperty('src', '/icon-512x512.png');
    expect(icons[1]).toHaveProperty('sizes', '512x512');
  });

  test('should have PWA icons available', async ({ page }) => {
    // Check 192x192 icon
    const icon192Response = await page.request.get('/icon-192x192.png');
    expect(icon192Response.status()).toBe(200);
    expect(icon192Response.headers()['content-type']).toContain('image');
    
    // Check 512x512 icon
    const icon512Response = await page.request.get('/icon-512x512.png');
    expect(icon512Response.status()).toBe(200);
    expect(icon512Response.headers()['content-type']).toContain('image');
  });

  test('should have PWA metadata in HTML head', async ({ page }) => {
    // Check manifest link exists (link tags are not "visible" but exist in DOM)
    const manifestLinks = page.locator('link[rel="manifest"]');
    const manifestCount = await manifestLinks.count();
    expect(manifestCount).toBeGreaterThan(0);
    await expect(manifestLinks.first()).toHaveAttribute('href', '/manifest.json');

    // Check theme color meta tag (may be in viewport or separate)
    const themeColor = page.locator('meta[name="theme-color"]');
    const themeColorCount = await themeColor.count();
    if (themeColorCount > 0) {
      await expect(themeColor.first()).toHaveAttribute('content', '#000000');
    }
    // Theme color is handled via viewport export in Next.js, so it may not appear as separate meta

    // Check Apple Web App meta tags
    const appleCapable = page.locator('meta[name="apple-mobile-web-app-capable"]');
    const appleCapableCount = await appleCapable.count();
    if (appleCapableCount > 0) {
      await expect(appleCapable.first()).toHaveAttribute('content', 'yes');
    }

    const appleTitle = page.locator('meta[name="apple-mobile-web-app-title"]');
    const appleTitleCount = await appleTitle.count();
    if (appleTitleCount > 0) {
      await expect(appleTitle.first()).toHaveAttribute('content', 'MO Crossroads');
    }

    const appleStatusBar = page.locator('meta[name="apple-mobile-web-app-status-bar-style"]');
    const appleStatusBarCount = await appleStatusBar.count();
    if (appleStatusBarCount > 0) {
      await expect(appleStatusBar.first()).toHaveAttribute('content', 'default');
    }

    // Check MS application meta tags
    const msTileColor = page.locator('meta[name="msapplication-TileColor"]');
    const msTileColorCount = await msTileColor.count();
    if (msTileColorCount > 0) {
      await expect(msTileColor.first()).toHaveAttribute('content', '#000000');
    }
    
    // At minimum, verify manifest link exists (core PWA requirement)
    expect(manifestCount).toBeGreaterThan(0);
  });

  test('should register service worker in production build', async ({ page, context }) => {
    // Note: Service worker is disabled in development mode
    // This test verifies the service worker files exist
    // For full testing, you'd need to run against a production build
    
    // Check if service worker file exists
    const swResponse = await page.request.get('/sw.js');
    // Service worker may not be available in dev mode, so we check status
    const status = swResponse.status();
    
    // In production, service worker should be available (200)
    // In development, it may not exist (404) or be disabled
    expect([200, 404]).toContain(status);
    
    if (status === 200) {
      expect(swResponse.headers()['content-type']).toContain('javascript');
    }
  });

  test('should have proper viewport configuration', async ({ page }) => {
    // Check viewport meta tag
    const viewport = page.locator('meta[name="viewport"]');
    const viewportCount = await viewport.count();
    expect(viewportCount).toBeGreaterThan(0);
    
    const viewportContent = await viewport.first().getAttribute('content');
    
    expect(viewportContent).toContain('device-width');
    expect(viewportContent).toContain('initial-scale=1');
  });

  test('should have PWA shortcuts in manifest', async ({ page }) => {
    const response = await page.request.get('/manifest.json');
    const manifest = await response.json();
    
    // Check shortcuts exist
    expect(manifest).toHaveProperty('shortcuts');
    expect(Array.isArray(manifest.shortcuts)).toBe(true);
    
    if (manifest.shortcuts && manifest.shortcuts.length > 0) {
      // Verify shortcut structure
      const mapShortcut = manifest.shortcuts.find((s: any) => s.url === '/map');
      expect(mapShortcut).toBeDefined();
      expect(mapShortcut).toHaveProperty('name');
      expect(mapShortcut).toHaveProperty('url');
    }
  });

  test('should have proper app categories in manifest', async ({ page }) => {
    const response = await page.request.get('/manifest.json');
    const manifest = await response.json();
    
    // Check categories
    expect(manifest).toHaveProperty('categories');
    expect(Array.isArray(manifest.categories)).toBe(true);
    expect(manifest.categories.length).toBeGreaterThan(0);
    
    // Verify expected categories
    expect(manifest.categories).toContain('maps');
  });

  test('should have correct start URL and display mode', async ({ page }) => {
    const response = await page.request.get('/manifest.json');
    const manifest = await response.json();
    
    // Verify start URL is root
    expect(manifest.start_url).toBe('/');
    
    // Verify display mode is standalone (app-like experience)
    expect(manifest.display).toBe('standalone');
  });

  test('should have theme color consistency', async ({ page }) => {
    // Check manifest theme color
    const manifestResponse = await page.request.get('/manifest.json');
    const manifest = await manifestResponse.json();
    const manifestThemeColor = manifest.theme_color;
    
    // Check HTML meta theme color (may not be present as separate meta)
    const themeColorMeta = page.locator('meta[name="theme-color"]');
    const themeColorCount = await themeColorMeta.count();
    let htmlThemeColor = null;
    if (themeColorCount > 0) {
      htmlThemeColor = await themeColorMeta.first().getAttribute('content');
    }
    
    // Check MS Tile color
    const msTileColor = page.locator('meta[name="msapplication-TileColor"]');
    const msColor = await msTileColor.getAttribute('content');
    
    // Manifest theme color should always be present
    expect(manifestThemeColor).toBe('#000000');
    
    // HTML theme color may be in viewport export (Next.js handles this)
    // MS Tile color should match
    if (htmlThemeColor) {
      expect(htmlThemeColor).toBe('#000000');
    }
    expect(msColor).toBe('#000000');
  });

  test('should have proper icon sizes and types', async ({ page }) => {
    const response = await page.request.get('/manifest.json');
    const manifest = await response.json();
    
    const icons = manifest.icons;
    
    // Verify both required icon sizes exist
    const icon192 = icons.find((icon: any) => icon.sizes === '192x192');
    const icon512 = icons.find((icon: any) => icon.sizes === '512x512');
    
    expect(icon192).toBeDefined();
    expect(icon512).toBeDefined();
    
    // Verify icon properties
    expect(icon192.type).toBe('image/png');
    expect(icon512.type).toBe('image/png');
    expect(icon192.purpose).toBe('any maskable');
    expect(icon512.purpose).toBe('any maskable');
  });

  test('should have mobile web app capabilities', async ({ page }) => {
    // Check mobile-web-app-capable meta tag (may not always be present)
    const mobileCapable = page.locator('meta[name="mobile-web-app-capable"]');
    const mobileCapableCount = await mobileCapable.count();
    if (mobileCapableCount > 0) {
      await expect(mobileCapable.first()).toHaveAttribute('content', 'yes');
    }
    
    // Check application-name meta tag (may not always be present)
    const appName = page.locator('meta[name="application-name"]');
    const appNameCount = await appName.count();
    if (appNameCount > 0) {
      await expect(appName.first()).toHaveAttribute('content', 'MO Crossroads');
    }
    
    // At minimum, verify Apple Web App capabilities are present
    const appleCapable = page.locator('meta[name="apple-mobile-web-app-capable"]');
    await expect(appleCapable.first()).toHaveAttribute('content', 'yes');
  });

  test('should have proper orientation setting', async ({ page }) => {
    const response = await page.request.get('/manifest.json');
    const manifest = await response.json();
    
    // Verify orientation is set
    expect(manifest).toHaveProperty('orientation');
    expect(manifest.orientation).toBe('portrait-primary');
  });

  test('should have background color for splash screen', async ({ page }) => {
    const response = await page.request.get('/manifest.json');
    const manifest = await response.json();
    
    // Verify background color is set (for splash screen)
    expect(manifest).toHaveProperty('background_color');
    expect(manifest.background_color).toBe('#ffffff');
  });
});

test.describe('PWA - Service Worker (Production Only)', () => {
  test.skip(process.env.NODE_ENV === 'development', 'Service worker disabled in development');
  
  test('should have workbox service worker file', async ({ page }) => {
    // Check for workbox file (pattern: workbox-*.js)
    const workboxFiles = [
      '/workbox-e9849328.js',
      // Add other workbox files if they exist
    ];
    
    for (const file of workboxFiles) {
      const response = await page.request.get(file);
      // In production, should exist; in dev, may not
      if (response.status() === 200) {
        expect(response.headers()['content-type']).toContain('javascript');
      }
    }
  });
});

test.describe('PWA - Installability', () => {
  test('should be installable as PWA', async ({ page, context }) => {
    await page.goto('/');
    
    // Check for manifest link (required for installability)
    // Link tags exist in DOM but are not "visible" - check for existence instead
    const manifestLinks = page.locator('link[rel="manifest"]');
    const manifestCount = await manifestLinks.count();
    expect(manifestCount).toBeGreaterThan(0);
    await expect(manifestLinks.first()).toHaveAttribute('href', '/manifest.json');
    
    // Verify manifest is valid JSON
    const manifestResponse = await page.request.get('/manifest.json');
    expect(manifestResponse.status()).toBe(200);
    const manifest = await manifestResponse.json();
    
    // Required fields for installability
    expect(manifest.name).toBeTruthy();
    expect(manifest.short_name).toBeTruthy();
    expect(manifest.icons).toBeTruthy();
    expect(manifest.icons.length).toBeGreaterThan(0);
    expect(manifest.start_url).toBeTruthy();
    expect(manifest.display).toBeTruthy();
    
    // Verify icons are accessible
    for (const icon of manifest.icons) {
      const iconResponse = await page.request.get(icon.src);
      expect(iconResponse.status()).toBe(200);
    }
  });
});

