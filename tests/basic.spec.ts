import { test, expect } from '@playwright/test';

test('Basic page load test', async ({ page }) => {
  // Listen for console errors
  const consoleErrors: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  // Listen for page errors
  const pageErrors: string[] = [];
  page.on('pageerror', error => {
    pageErrors.push(error.message);
  });

  // Navigate to the page
  await page.goto('http://localhost:3000/test-aws');
  
  // Wait a bit for any errors to appear
  await page.waitForTimeout(2000);
  
  // Check if there are any console errors
  console.log('Console errors:', consoleErrors);
  console.log('Page errors:', pageErrors);
  
  // Take a screenshot to see what's actually displayed
  await page.screenshot({ path: 'basic-test-screenshot.png', fullPage: true });
  
  // Get the page title
  const title = await page.title();
  console.log('Page title:', title);
  
  // Check if the page has any content
  const bodyText = await page.textContent('body');
  console.log('Body text (first 500 chars):', bodyText?.substring(0, 500));
  
  // Basic assertion - page should load without throwing
  expect(pageErrors.length).toBe(0);
});
