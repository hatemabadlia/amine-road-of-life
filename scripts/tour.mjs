// Dev helper: visit several places at different times of day and screenshot them.
// usage: node scripts/tour.mjs <outDir> [url] [only=name1,name2]
import { chromium } from '@playwright/test';
const out = process.argv[2] ?? 'shots';
const url = process.argv[3] ?? 'http://localhost:5199/?e2e=1';
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const logs = [];
page.on('console', (m) => m.type() !== 'log' && logs.push(`[${m.type()}] ${m.text()}`));
page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`));
await page.goto(url);
await page.evaluate(() => localStorage.clear());
await page.goto(url);
await page.waitForTimeout(1200);
await page.screenshot({ path: `${out}/00-menu.png` });
await page.click('[data-testid=new-game]');
await page.waitForSelector('[data-testid=chapter-card]', { timeout: 180000 });
await page.waitForTimeout(1000);
await page.screenshot({ path: `${out}/01-card.png` });
await page.click('[data-testid=start-chapter]');
for (let i = 0; i < 40; i++) {
  const d = await page.evaluate(() => window.__AMINE__.state().dialogue?.view.kind ?? null);
  if (!d) break;
  if (d === 'choice') await page.click('[data-testid=choice-0]');
  else await page.keyboard.press('Enter');
  await page.waitForTimeout(60);
}
const stops = [
  ['home_bedroom', 8 * 60, 'bedroom'],
  ['home_door', 8 * 60, 'street-morning'],
  ['crossroads', 12 * 60, 'crossroads-noon'],
  ['school_courtyard', 10 * 60, 'school'],
  ['football', 17 * 60, 'football-afternoon'],
  ['square', 18 * 60 + 50, 'square-dusk'],
  ['hanout_front', 22 * 60, 'hanout-night'],
  ['grandpa', 15 * 60, 'grandpa'],
];
const only = process.argv[4]?.split(',');
for (const [spot, time, name] of stops.filter((s) => !only || only.includes(s[2]))) {
  await page.evaluate(([s, t]) => {
    window.__AMINE__.state().game.time = t;
    window.__AMINE__.goTo(s);
  }, [spot, time]);
  await page.waitForTimeout(3500);
  await page.screenshot({ path: `${out}/${name}.png` });
}
const fps = await page.evaluate(() => new Promise((r) => { let n = 0; const t0 = performance.now(); const f = () => { n++; if (performance.now() - t0 < 2000) requestAnimationFrame(f); else r(n / 2); }; requestAnimationFrame(f); }));
console.log('swiftshader fps ~', fps);
console.log(logs.filter((l) => !l.includes('DevTools')).slice(0, 30).join('\n'));
await browser.close();
