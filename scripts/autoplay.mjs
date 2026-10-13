// Dev helper: auto-play N chapters in a real browser through the real UI
// (teleporting between objectives), taking a screenshot at each objective.
import { chromium } from '@playwright/test';
const out = process.argv[2];
const chapters = Number(process.argv[3] ?? 1);
const url = process.argv[4] ?? 'http://localhost:5199/?e2e=1';
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
await page.goto(url);
await page.click('[data-testid=new-game]');
let shot = 0;
const snap = async (name) => page.screenshot({ path: `${out}/${String(++shot).padStart(3, '0')}-${name}.png` });
const startCh = await page.evaluate(() => window.__AMINE__.state().game.chapter);
for (let guard = 0; guard < 400; guard++) {
  const st = await page.evaluate(() => { const s = window.__AMINE__.state(); return { ch: s.game?.chapter, card: s.card, dlg: s.dialogue?.view?.kind ?? null, screen: s.screen, phase: s.game?.phase }; });
  if (st.screen !== 'game') break;
  if (st.ch >= startCh + chapters) break;
  if (st.card) {
    await page.waitForSelector('[data-testid=start-chapter]', { timeout: 60000 });
    await snap(`ch${st.ch}-card`);
    await page.click('[data-testid=start-chapter]');
    await page.waitForTimeout(300);
    continue;
  }
  if (st.dlg === 'choice') {
    await page.click('[data-testid=choice-0]');
    await page.waitForTimeout(150);
    continue;
  }
  if (st.dlg === 'line') {
    await page.keyboard.press('Space');
    await page.waitForTimeout(60);
    await page.keyboard.press('Space');
    await page.waitForTimeout(60);
    continue;
  }
  const o = await page.evaluate(() => window.__AMINE__.objective());
  if (!o) { await page.waitForTimeout(200); continue; }
  await page.evaluate((t) => window.__AMINE__.goTo(t), o.target);
  await page.waitForTimeout(700);
  await snap(`ch${st.ch}-${o.id}`);
  if (o.type !== 'goto') {
    await page.keyboard.press('KeyE');
    await page.waitForTimeout(300);
    const d = await page.evaluate(() => !!window.__AMINE__.state().dialogue);
    if (!d) console.log('no dialogue after interact for', o.id, o.target, JSON.stringify(await page.evaluate(() => window.__AMINE__.pose())));
  } else {
    await page.waitForTimeout(400);
  }
}
const fin = await page.evaluate(() => { const s = window.__AMINE__.state(); return { ch: s.game?.chapter, money: s.game?.money, stats: s.game?.stats, screen: s.screen }; });
console.log('final', JSON.stringify(fin));
console.log('errors', errors.slice(0, 10));
await browser.close();
