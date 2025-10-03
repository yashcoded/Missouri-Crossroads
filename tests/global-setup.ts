import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Check if the app is running
  try {
    await page.goto('http://localhost:3000/test-aws');
    await page.waitForLoadState('networkidle', { timeout: 30000 });
    console.log('✅ App is running and accessible');
  } catch (error) {
    console.log('⚠️ App might not be running, tests will start the server');
  }
  
  await browser.close();
}

export default globalSetup;
