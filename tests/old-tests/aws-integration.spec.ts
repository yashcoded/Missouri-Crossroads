import { test, expect } from '@playwright/test';

test.describe('AWS Integration Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the test page before each test
    await page.goto('http://localhost:3000/test-aws');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Authentication Flow', () => {
    test('should display authentication form', async ({ page }) => {
      const authForm = page.locator('h2:has-text("Authentication")');
      await expect(authForm).toBeVisible();
      
      const signUpButton = page.locator('button:has-text("Sign Up")');
      await expect(signUpButton).toBeVisible();
    });

    test('should handle user registration', async ({ page }) => {
      // Fill in registration form
      await page.fill('input[placeholder="Username"]', `testuser${Date.now()}`);
      await page.fill('input[placeholder="Email"]', `test${Date.now()}@example.com`);
      await page.fill('input[placeholder="Name"]', 'Test User');
      await page.fill('input[placeholder="Preferred Username"]', 'testuser');
      await page.fill('input[placeholder="Password"]', 'TestPassword123!');
      
      // Click sign up
      await page.click('button:has-text("Sign Up")');
      
      // Should show confirmation message or form
      await expect(page.locator('text=confirmation') || page.locator('text=verification')).toBeVisible({ timeout: 10000 });
    });

    test('should handle user sign in', async ({ page }) => {
      // Fill in sign in form
      await page.fill('input[placeholder="Username"]', 'testuser');
      await page.fill('input[placeholder="Password"]', 'TestPassword123!');
      
      // Click sign in
      await page.click('button:has-text("Sign In")');
      
      // Should show success or redirect
      await expect(page.locator('text=Sign In') || page.locator('text=Welcome')).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Note Creation', () => {
    test('should display note creator form', async ({ page }) => {
      const noteCreator = page.locator('h2:has-text("Note Creator")');
      await expect(noteCreator).toBeVisible();
      
      const titleInput = page.locator('input[placeholder="Enter note title"]');
      await expect(titleInput).toBeVisible();
    });

    test('should create a note successfully', async ({ page }) => {
      // Fill in note form
      const noteTitle = `Test Note ${Date.now()}`;
      await page.fill('input[placeholder="Enter note title"]', noteTitle);
      await page.fill('textarea[placeholder="Enter note content"]', 'This is a test note content');
      
      // Select note type
      await page.selectOption('select', 'note');
      
      // Add some tags
      await page.fill('input[placeholder="Add tags (comma separated)"]', 'test, aws, integration');
      
      // Submit the form
      await page.click('button:has-text("Create Note")');
      
      // Should show success message
      await expect(page.locator('text=Note created successfully')).toBeVisible({ timeout: 10000 });
    });

    test('should handle file uploads', async ({ page }) => {
      // Create a test image file
      const testImagePath = 'tests/fixtures/test-image.jpg';
      
      // Fill in basic note info first
      await page.fill('input[placeholder="Enter note title"]', `Test Note with Image ${Date.now()}`);
      await page.fill('textarea[placeholder="Enter note content"]', 'This note has an image');
      
      // Upload image file
      const fileInput = page.locator('input[type="file"]').first();
      await fileInput.setInputFiles(testImagePath);
      
      // Should show upload progress or file name
      await expect(page.locator('text=test-image.jpg') || page.locator('text=Uploading')).toBeVisible({ timeout: 5000 });
      
      // Submit the form
      await page.click('button:has-text("Create Note")');
      
      // Should show success message
      await expect(page.locator('text=Note created successfully')).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Notes Viewer', () => {
    test('should display notes viewer', async ({ page }) => {
      const notesViewer = page.locator('h2:has-text("Your Notes")');
      await expect(notesViewer).toBeVisible();
      
      const refreshButton = page.locator('button:has-text("Refresh")');
      await expect(refreshButton).toBeVisible();
    });

    test('should load and display notes', async ({ page }) => {
      // Click refresh to load notes
      await page.click('button:has-text("Refresh")');
      
      // Should show either notes or "No notes found" message
      await expect(
        page.locator('text=No notes found') || 
        page.locator('.border.rounded-lg') // Note card class
      ).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('CSV Metadata Upload', () => {
    test('should display CSV uploader', async ({ page }) => {
      const csvUploader = page.locator('h2:has-text("Upload Metadata CSV")');
      await expect(csvUploader).toBeVisible();
      
      const fileInput = page.locator('input[type="file"]').last();
      await expect(fileInput).toBeVisible();
    });

    test('should upload CSV file successfully', async ({ page }) => {
      // Create a test CSV file
      const testCSVPath = 'tests/fixtures/test-metadata.csv';
      
      // Select CSV file
      const fileInput = page.locator('input[type="file"]').last();
      await fileInput.setInputFiles(testCSVPath);
      
      // Should show file info
      await expect(page.locator('text=test-metadata.csv')).toBeVisible();
      
      // Click upload button
      await page.click('button:has-text("Upload CSV")');
      
      // Should show success message
      await expect(page.locator('text=Upload Successful')).toBeVisible({ timeout: 15000 });
      
      // Should show public URL
      await expect(page.locator('text=Public URL')).toBeVisible();
    });

    test('should validate file type', async ({ page }) => {
      // Try to upload non-CSV file
      const testImagePath = 'tests/fixtures/test-image.jpg';
      
      const fileInput = page.locator('input[type="file"]').last();
      await fileInput.setInputFiles(testImagePath);
      
      // Should show error message
      await expect(page.locator('text=Please select a valid CSV file')).toBeVisible();
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

  test.describe('Error Handling', () => {
    test('should handle authentication errors gracefully', async ({ page }) => {
      // Try to create note without authentication
      await page.fill('input[placeholder="Enter note title"]', 'Test Note');
      await page.fill('textarea[placeholder="Enter note content"]', 'Test content');
      
      await page.click('button:has-text("Create Note")');
      
      // Should show authentication required message
      await expect(page.locator('text=Authentication Required') || page.locator('text=Please sign in')).toBeVisible();
    });

    test('should handle network errors gracefully', async ({ page }) => {
      // Simulate network error by going offline
      await page.context().setOffline(true);
      
      // Try to refresh notes
      await page.click('button:has-text("Refresh")');
      
      // Should show error message
      await expect(page.locator('text=Error') || page.locator('text=Failed')).toBeVisible({ timeout: 10000 });
      
      // Go back online
      await page.context().setOffline(false);
    });
  });

  test.describe('Responsive Design', () => {
    test('should work on mobile devices', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      // All components should still be visible
      await expect(page.locator('h2:has-text("Authentication")')).toBeVisible();
      await expect(page.locator('h2:has-text("Note Creator")')).toBeVisible();
      await expect(page.locator('h2:has-text("Your Notes")')).toBeVisible();
      await expect(page.locator('h2:has-text("Upload Metadata CSV")')).toBeVisible();
    });

    test('should work on tablet devices', async ({ page }) => {
      // Set tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 });
      
      // Grid layout should adjust
      await expect(page.locator('.grid.grid-cols-1.lg\\:grid-cols-2')).toBeVisible();
    });
  });
});
