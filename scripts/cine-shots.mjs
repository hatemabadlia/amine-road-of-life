// Dev helper: screenshots of a chapter-1 conversation (cinematic camera). usage: node scripts/cine-shots.mjs <outDir>
import { chromium } from '@playwright/test';
const out = process.argv[2];
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
page.on('pageerror', (e) => console.log('ERR', e.message));
await page.goto('http://localhost:5199/?e2e=1&fx=1');
await page.evaluate(() => localStorage.clear());
await page.goto('http://localhost:5199/?e2e=1&fx=1');
await page.click('[data-testid=new-game]');
await page.waitForSelector('[data-testid=chapter-card]', { timeout: 180000 });
await page.waitForTimeout(1000);
await page.click('[data-testid=start-chapter]');
const adv = async () => { for (let i = 0; i < 40; i++) { const d = await page.evaluate(() => window.__AMINE__.state().dialogue?.view.kind ?? null); if (!d) return; if (d === 'choice') await page.click('[data-testid=choice-0]'); else { await page.keyboard.press('Enter'); await page.waitForTimeout(40); await page.keyboard.press('Enter'); } await page.waitForTimeout(80); } };
await adv();
await page.evaluate(() => window.__AMINE__.goTo('bed')); await page.waitForTimeout(1500); await page.keyboard.press('KeyE'); await page.waitForTimeout(500); await adv();
await page.evaluate(() => window.__AMINE__.goTo('mama')); await page.waitForTimeout(2500); await page.keyboard.press('KeyE');
await page.waitForTimeout(500);
console.log('obj', JSON.stringify(await page.evaluate(() => window.__AMINE__.objective())), 'dlg', await page.evaluate(() => !!window.__AMINE__.state().dialogue), 'focus', await page.evaluate(() => document.querySelector('[data-testid=prompt]')?.textContent));
for (let k = 0; k < 5 && !(await page.evaluate(() => !!window.__AMINE__.state().dialogue)); k++) { await page.keyboard.press('KeyE'); await page.waitForTimeout(800); }
let n = 0;
for (let i = 0; i < 12; i++) {
  const v = await page.evaluate(() => { const d = window.__AMINE__.state().dialogue; return d ? (d.view.kind === 'line' ? d.view.speaker : 'choice') : null; });
  if (!v) break;
  await page.waitForTimeout(2500);
  await page.screenshot({ path: `${out}/cine${n++}-${v}.png` });
  if (v === 'choice') await page.click('[data-testid=choice-0]'); else { await page.keyboard.press('Enter'); await page.waitForTimeout(40); await page.keyboard.press('Enter'); }
  await page.waitForTimeout(300);
}
await browser.close();
