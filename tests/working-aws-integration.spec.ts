import { test, expect } from '@playwright/test';

test.describe('AWS Integration Tests - Working Version', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the test page before each test
    await page.goto('http://localhost:3000/test-aws');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Page Structure', () => {
    test('should display main page elements', async ({ page }) => {
      // Check main title
      await expect(page.locator('h1:has-text("AWS Integration Test")')).toBeVisible();
      
      // Check setup instructions
      await expect(page.locator('text=Setup Instructions')).toBeVisible();
      
      // Check authentication section
      await expect(page.locator('text=Authentication')).toBeVisible();
      
      // Check note creator section
      await expect(page.locator('text=Note Creator')).toBeVisible();
      
      // Check notes viewer section
      await expect(page.locator('text=Your Notes')).toBeVisible();
    });
  });

  test.describe('Authentication Form', () => {
    test('should display sign in form', async ({ page }) => {
      // Check sign in form elements
      await expect(page.locator('text=Sign In')).toBeVisible();
      await expect(page.locator('input[placeholder="Preferred Username"]')).toBeVisible();
      await expect(page.locator('input[placeholder="Password"]')).toBeVisible();
      await expect(page.locator('button:has-text("Sign In")')).toBeVisible();
    });

    test('should display sign up link', async ({ page }) => {
      await expect(page.locator('text=Don\'t have an account? Sign up')).toBeVisible();
    });
  });

  test.describe('Note Creator', () => {
    test('should display authentication required message', async ({ page }) => {
      await expect(page.locator('text=Authentication Required')).toBeVisible();
      await expect(page.locator('text=Please sign in to create notes and upload files.')).toBeVisible();
    });
  });

  test.describe('Notes Viewer', () => {
    test('should display notes section', async ({ page }) => {
      await expect(page.locator('text=Your Notes (0)')).toBeVisible();
    });
  });

  test.describe('API Endpoints', () => {
    test('should access notes API', async ({ request }) => {
      const response = await request.get('http://localhost:3000/api/notes');
      expect(response.status()).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty('message');
    });

    test('should create note via API', async ({ request }) => {
      const noteData = {
        title: `API Test Note ${Date.now()}`,
        BodyText: 'This note was created via API',
        creator: 'test-user',
        type: 'note'
      };
      
      const response = await request.post('http://localhost:3000/api/notes', {
        data: noteData
      });
      
      expect(response.status()).toBe(201);
      
      const data = await response.json();
      expect(data).toHaveProperty('noteId');
      expect(data.message).toBe('Note created successfully');
    });
  });

  test.describe('CSV Upload API', () => {
    test('should access CSV upload endpoint', async ({ request }) => {
      const response = await request.get('http://localhost:3000/api/admin/upload-csv');
      expect(response.status()).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty('uploadUrl');
    });
  });

  test.describe('S3 Presign API', () => {
    test('should access S3 presign API', async ({ request }) => {
      const response = await request.post('http://localhost:3000/api/s3/presign', {
        data: {
          fileName: 'test-file.jpg',
          fileType: 'image/jpeg',
          folder: 'images'
        }
      });
      
      expect(response.status()).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty('uploadUrl');
    });
  });

  test.describe('Responsive Design', () => {
    test('should work on mobile devices', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      // All main sections should still be visible
      await expect(page.locator('h1:has-text("AWS Integration Test")')).toBeVisible();
      await expect(page.locator('text=Authentication')).toBeVisible();
      await expect(page.locator('text=Note Creator')).toBeVisible();
      await expect(page.locator('text=Your Notes')).toBeVisible();
    });
  });
});
