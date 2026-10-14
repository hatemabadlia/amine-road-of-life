// Dev helper: jump to a chapter objective that uses furniture, play it and screenshot Amine there.
// usage: node scripts/use-shots.mjs <outDir> <chapter>:<objectiveId> ...
import { chromium } from '@playwright/test';
const [out, ...jobs] = process.argv.slice(2);
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
page.on('pageerror', (e) => console.log('ERR', e.message));
const url = 'http://localhost:5199/?e2e=1&fx=1';
await page.goto(url); await page.evaluate(() => localStorage.clear()); await page.goto(url);
await page.click('[data-testid=new-game]');
await page.waitForSelector('[data-testid=chapter-card]', { timeout: 180000 });
const settle = async () => {
  let last = '';
  let same = 0;
  for (let i = 0; i < 80 && same < 3; i++) {
    await page.waitForTimeout(1200);
    const p = await page.evaluate(() => JSON.stringify(window.__AMINE__.pose()));
    same = p === last ? same + 1 : 0;
    last = p;
  }
};
for (const job of jobs) {
  const [ch, id] = job.split(':');
  await page.evaluate((c) => window.__AMINE__.jumpTo(Number(c)), ch);
  await page.waitForTimeout(1500);
  await page.click('[data-testid=start-chapter]');
  for (let i = 0; i < 30 && (await page.evaluate(() => !!window.__AMINE__.state().dialogue)); i++) { await page.keyboard.press('Enter'); await page.waitForTimeout(200); }
  const tgt = await page.evaluate((oid) => window.__AMINE__.skipTo(oid), id);
  await page.evaluate((t) => window.__AMINE__.goTo(t), tgt);
  await page.waitForTimeout(2500);
  await page.evaluate((t) => window.__AMINE__.state().interact(t, 'object'), tgt);
  await settle();
  console.log(job, JSON.stringify(await page.evaluate(() => window.__AMINE__.pose())));
  await page.screenshot({ path: `${out}/${ch}-${id}.png` });
  for (let i = 0; i < 40 && (await page.evaluate(() => !!window.__AMINE__.state().dialogue)); i++) {
    const v = await page.evaluate(() => window.__AMINE__.state().dialogue.view.kind);
    if (v === 'choice') await page.click('[data-testid=choice-0]'); else await page.keyboard.press('Enter');
    await page.waitForTimeout(200);
  }
}
await browser.close();
