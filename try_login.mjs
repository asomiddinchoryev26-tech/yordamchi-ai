import { chromium } from './node_modules/playwright/index.mjs';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.setViewportSize({ width: 1280, height: 860 });
await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle', timeout: 10000 });
await page.waitForTimeout(800);
try { await page.click('button:has-text("Talaba")'); await page.waitForTimeout(300); } catch(e) {}
await page.fill('input[type="email"]', 'asomiddinchoryev26@gmail.com');
const pws = ['Asomiddin26!','Asomiddin1!','asomiddin123','Admin1234!','Qwerty123!'];
for (const pw of pws) {
  await page.fill('input[type="password"]', pw);
  const btn = page.locator('button[type="submit"]').first();
  await btn.click();
  await page.waitForTimeout(2000);
  const url = page.url();
  console.log(pw + ' -> ' + url.replace('http://localhost:5173',''));
  if (!url.includes('/login')) { console.log('SUCCESS: ' + pw); break; }
}
await page.screenshot({ path: '/tmp/login_result.png' });
await browser.close();
