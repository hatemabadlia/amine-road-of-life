// QA sweep: plays the whole game in a real browser through the real UI (teleporting
// between objectives, random answers), and logs every problem it meets: page errors,
// objectives whose prompt never shows, interactions that open nothing, objectives
// that never complete. One screenshot per objective for a visual review.
// usage: node scripts/sweep.mjs <outDir> [seed] [fromChapter] [toChapter] [url]
import { chromium } from '@playwright/test';
import { writeFileSync, mkdirSync } from 'node:fs';
const [out, seedArg = '1', fromArg = '1', toArg = '68', url = 'http://localhost:4173/?e2e=1'] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
let seed = Number(seedArg);
const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
const from = Number(fromArg);
const to = Number(toArg);
const issues = [];
const log = (kind, data) => {
  const row = { kind, ...data };
  issues.push(row);
  console.log(JSON.stringify(row));
};
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
let where = '';
page.on('pageerror', (e) => log('pageerror', { where, msg: e.message.slice(0, 300) }));
page.on('console', (m) => m.type() === 'error' && log('console', { where, msg: m.text().slice(0, 300) }));
await page.goto(url);
await page.evaluate(() => localStorage.clear());
await page.goto(url);
await page.click('[data-testid=new-game]');
await page.waitForSelector('[data-testid=chapter-card]', { timeout: 180000 });
if (from > 1) await page.evaluate((c) => window.__AMINE__.jumpTo(c), from);
const state = () =>
  page.evaluate(() => {
    const s = window.__AMINE__.state();
    return { ch: s.game?.chapter, card: s.card, v: s.dialogue?.view ?? null, src: s.dialogue?.source ?? null, screen: s.screen, ride: !!s.ride, phase: s.game?.phase };
  });
let tries = 0;
let lastObj = '';
let shots = 0;
const t0 = Date.now();
let chStart = Date.now();
for (let guard = 0; guard < 6000; guard++) {
  const st = await state();
  if (st.screen === 'ending') {
    log('ending', { ch: st.ch, ending: await page.evaluate(() => window.__AMINE__.state().game.ending) });
    break;
  }
  if (st.screen !== 'game') {
    log('screen', { screen: st.screen });
    break;
  }
  if (st.ch > to) break;
  where = `ch${st.ch}`;
  if (st.card) {
    if (st.ch > from) console.log(`# ch${st.ch - 1} done in ${Math.round((Date.now() - chStart) / 1000)}s (total ${Math.round((Date.now() - t0) / 60000)}m)`);
    chStart = Date.now();
    await page.waitForTimeout(1000);
    await page.click('[data-testid=start-chapter]').catch(() => {});
    await page.waitForTimeout(300);
    continue;
  }
  if (st.ride) {
    await page.waitForTimeout(500);
    continue;
  }
  if (st.v) {
    where = `ch${st.ch}:${st.src?.kind}:${st.src?.id ?? ''}`;
    if (st.v.kind === 'choice') {
      const n = st.v.options.length;
      const pick = st.v.options[Math.floor(rnd() * n)].index;
      const ok = await page
        .click(`[data-testid=choice-${pick}]`, { timeout: 5000 })
        .then(() => true)
        .catch(() => false);
      if (!ok) log('choice-click', { where, id: st.v.id, pick });
    } else {
      if (!st.v.text || !String(st.v.text).trim()) log('empty-line', { where, speaker: st.v.speaker });
      await page.keyboard.press('Enter');
      await page.waitForTimeout(40);
      await page.keyboard.press('Enter');
    }
    await page.waitForTimeout(120);
    continue;
  }
  const o = await page.evaluate(() => window.__AMINE__.objective());
  if (!o) {
    await page.waitForTimeout(300);
    continue;
  }
  const key = `${st.ch}:${o.id}`;
  tries = key === lastObj ? tries + 1 : 0;
  lastObj = key;
  where = `ch${st.ch}:${o.id}`;
  if (tries === 6) {
    log('stuck', { ch: st.ch, id: o.id, type: o.type, target: o.target, pose: await page.evaluate(() => window.__AMINE__.pose()) });
    // skip the rest of this chapter so the sweep continues
    await page.evaluate((c) => window.__AMINE__.jumpTo(c), st.ch + 1);
    continue;
  }
  const routed = await page.evaluate((t) => window.__AMINE__.goTo(t), o.target);
  if (routed === false) log('goto-failed', { ch: st.ch, id: o.id, target: o.target });
  await page.waitForTimeout(900);
  if (tries === 0) await page.screenshot({ path: `${out}/${String(++shots).padStart(3, '0')}-ch${st.ch}-${o.id}.jpg`, type: 'jpeg', quality: 60 });
  if (await page.evaluate(() => !!window.__AMINE__.state().dialogue)) continue;
  if (o.type !== 'goto') {
    const prompt = await page
      .getByTestId('prompt')
      .waitFor({ state: 'visible', timeout: 10000 })
      .then(() => true)
      .catch(() => false);
    if (!prompt) {
      log('no-prompt', { ch: st.ch, id: o.id, target: o.target, pose: await page.evaluate(() => window.__AMINE__.pose()) });
      continue;
    }
    await page.keyboard.press('KeyE');
    const opened = await page
      .waitForFunction(() => !!window.__AMINE__.state().dialogue || !window.__AMINE__.objective(), null, { timeout: 5000 })
      .then(() => true)
      .catch(() => false);
    if (!opened) {
      const now = await page.evaluate(() => window.__AMINE__.objective());
      if (now?.id === o.id) log('no-dialogue', { ch: st.ch, id: o.id, target: o.target });
    }
  } else {
    await page.waitForTimeout(500);
  }
}
writeFileSync(`${out}/issues.json`, JSON.stringify(issues, null, 1));
console.log(`# finished in ${Math.round((Date.now() - t0) / 60000)}m, ${issues.filter((i) => i.kind !== 'ending').length} issues`);
await browser.close();
