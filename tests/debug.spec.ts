import { test, expect } from '@playwright/test';

test('Debug - See what is actually on the page', async ({ page }) => {
  await page.goto('http://localhost:3000/test-aws');
  await page.waitForLoadState('networkidle');
  
  // Take a screenshot
  await page.screenshot({ path: 'debug-screenshot.png', fullPage: true });
  
  // Get all text content
  const pageText = await page.textContent('body');
  console.log('Page text content:', pageText);
  
  // Get all h2 elements
  const h2Elements = await page.locator('h2').allTextContents();
  console.log('H2 elements:', h2Elements);
  
  // Get all button elements
  const buttonElements = await page.locator('button').allTextContents();
  console.log('Button elements:', buttonElements);
  
  // Check if the page loaded correctly
  await expect(page.locator('h1')).toContainText('AWS Integration Test');
});
