// Dev helper: play chapter 8 (Friday prayer) and screenshot each step. usage: node scripts/friday-shots.mjs <outDir>
import { chromium } from '@playwright/test';
const out = process.argv[2];
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
page.on('pageerror', (e) => console.log('ERR', e.message));
const url = 'http://localhost:5199/?e2e=1&fx=1';
await page.goto(url); await page.evaluate(() => localStorage.clear()); await page.goto(url);
await page.click('[data-testid=new-game]');
await page.waitForSelector('[data-testid=chapter-card]', { timeout: 180000 });
await page.evaluate(() => window.__AMINE__.jumpTo(8));
const shots = new Set(['wudu', 'shoes', 'khutba', 'pray', 'after_prayer']);
for (let guard = 0; guard < 80; guard++) {
  const st = await page.evaluate(() => { const s = window.__AMINE__.state(); return { card: s.card, d: s.dialogue?.view.kind ?? null, ch: s.game.chapter }; });
  if (st.ch !== 8) break;
  if (st.card) { await page.waitForTimeout(950); await page.click('[data-testid=start-chapter]'); continue; }
  if (st.d) {
    await page.waitForTimeout(1800);
    const src = await page.evaluate(() => window.__AMINE__.state().dialogue?.source);
    if (src?.kind === 'objective' && shots.has(src.id)) { await page.screenshot({ path: `${out}/${src.id}.png` }); shots.delete(src.id); }
    if (st.d === 'choice') await page.click('[data-testid=choice-0]'); else { await page.keyboard.press('Enter'); await page.waitForTimeout(40); await page.keyboard.press('Enter'); }
    await page.waitForTimeout(150);
    continue;
  }
  const o = await page.evaluate(() => window.__AMINE__.objective());
  if (!o) { await page.waitForTimeout(200); continue; }
  if (o.id === 'to_mosque') { await page.evaluate(() => window.__AMINE__.goTo('mosque_front')); await page.waitForTimeout(3000); await page.screenshot({ path: `${out}/outside.png` }); continue; }
  await page.evaluate((t) => window.__AMINE__.goTo(t), o.target);
  await page.waitForTimeout(1500);
  if (o.type !== 'goto') for (let k = 0; k < 4 && !(await page.evaluate(() => !!window.__AMINE__.state().dialogue)); k++) { await page.keyboard.press('KeyE'); await page.waitForTimeout(700); }
}
console.log('flags', JSON.stringify(await page.evaluate(() => { const g = window.__AMINE__.state().game; return { ch: g.chapter, khutba: !!g.flags.listened_khutba, baba: !!g.flags.sat_with_baba }; })));
await browser.close();
