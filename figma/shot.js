const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  // Hero (top of page)
  await page.screenshot({ path: 'figma/shot-hero.png' });

  // Scroll to dashboard
  await page.evaluate(() => {
    document.querySelector('#dashboard')?.scrollIntoView();
  });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: 'figma/shot-dashboard.png' });

  await browser.close();
  console.log('done');
})();
