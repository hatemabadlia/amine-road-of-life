// Dev helper: play one chapter with chosen answers and screenshot every scene.
// usage: node scripts/chapter-shots.mjs <chapter> <outDir> '<{"decisionId":optionIndex}>' ['<{"flag":true}>']
import { chromium } from '@playwright/test';
const [chapter, out, picksJson = '{}', flagsJson = '{}'] = process.argv.slice(2);
const n = Number(chapter);
const pick = JSON.parse(picksJson);
const flags = JSON.parse(flagsJson);
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
page.on('pageerror', (e) => console.log('ERR', e.message));
const url = 'http://localhost:5199/?e2e=1&fx=1';
await page.goto(url);
await page.evaluate(() => localStorage.clear());
await page.goto(url);
await page.click('[data-testid=new-game]');
await page.waitForSelector('[data-testid=chapter-card]', { timeout: 180000 });
await page.evaluate((c) => window.__AMINE__.jumpTo(c), n);
let shot = 0;
const snap = async (name) => page.screenshot({ path: `${out}/${String(++shot).padStart(2, '0')}-${name}.png` });
const seen = new Set();
for (let guard = 0; guard < 160; guard++) {
  const st = await page.evaluate(() => { const s = window.__AMINE__.state(); return { card: s.card, v: s.dialogue?.view ?? null, ch: s.game.chapter, src: s.dialogue?.source ?? null }; });
  if (st.ch !== n) break;
  if (st.card) {
    await page.evaluate((f) => { const g = window.__AMINE__.state().game; Object.assign(g.flags, f); }, flags);
    await page.waitForTimeout(950);
    await page.click('[data-testid=start-chapter]');
    continue;
  }
  if (st.v) {
    const key = `${st.src?.kind}:${st.src?.id}:${st.v.kind === "choice" ? st.v.id : ""}`;
    if (!seen.has(key)) { seen.add(key); await page.waitForTimeout(1500); await snap(`${st.src?.id ?? "scene"}${st.v.kind === "choice" ? "-" + st.v.id : ""}`); }
    if (st.v.kind === 'choice') await page.click(`[data-testid=choice-${pick[st.v.id] ?? 0}]`);
    else { await page.keyboard.press('Enter'); await page.waitForTimeout(40); await page.keyboard.press('Enter'); }
    await page.waitForTimeout(150);
    continue;
  }
  const o = await page.evaluate(() => window.__AMINE__.objective());
  if (!o) { await page.waitForTimeout(200); continue; }
  await page.evaluate((t) => window.__AMINE__.goTo(t), o.target);
  await page.waitForTimeout(2500);
  if (o.type === 'goto') await snap(`at-${o.target}`);
  if (o.type !== 'goto') for (let k = 0; k < 4 && !(await page.evaluate(() => !!window.__AMINE__.state().dialogue)); k++) { await page.keyboard.press('KeyE'); await page.waitForTimeout(700); }
}
console.log(JSON.stringify(await page.evaluate(() => { const g = window.__AMINE__.state().game; return { ch: g.chapter, done: g.done, flags: Object.keys(g.flags).filter((k) => g.flags[k]).slice(-12) }; })));
await browser.close();
