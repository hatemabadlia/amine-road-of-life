// Dev helper: screenshots of the hospital, stadium and the chapter-29 wedding. usage: node scripts/places-shots.mjs <outDir>
import { chromium } from '@playwright/test';
const out = process.argv[2];
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
page.on('pageerror', (e) => console.log('ERR', e.message));
const url = 'http://localhost:5199/?e2e=1&fx=1';
await page.goto(url); await page.evaluate(() => localStorage.clear()); await page.goto(url);
await page.click('[data-testid=new-game]');
await page.waitForSelector('[data-testid=chapter-card]', { timeout: 180000 });
const go = async (ch, spot, time, name, cam) => {
  if (ch) { await page.evaluate((c) => window.__AMINE__.jumpTo(c), ch); await page.waitForTimeout(1500); }
  await page.evaluate(() => { const s = window.__AMINE__.state(); if (s.card) s.dismissCard(); });
  await page.waitForTimeout(300);
  for (let i = 0; i < 30; i++) { const d = await page.evaluate(() => window.__AMINE__.state().dialogue?.view.kind ?? null); if (!d) break; if (d === 'choice') await page.click('[data-testid=choice-0]'); else { await page.keyboard.press('Enter'); await page.waitForTimeout(30); await page.keyboard.press('Enter'); } await page.waitForTimeout(60); }
  await page.evaluate(([s, t]) => { window.__AMINE__.state().game.time = t; window.__AMINE__.goTo(s); }, [spot, time]);
  await page.waitForTimeout(4000);
  await page.screenshot({ path: `${out}/${name}.png` });
};
await go(0, 'hospital_front', 11 * 60, 'hospital-front');
await page.mouse.move(640,360); 
await go(0, 'stadium', 16 * 60, 'stadium');
await go(29, 'square', 21 * 60, 'wedding');
await browser.close();
