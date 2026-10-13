// Dev helper: screenshot dev/viewer.html with query strings. usage: node scripts/viewer-shot.mjs <outDir> "<qs>" ...
import { chromium } from '@playwright/test';
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 640 } });
page.on('pageerror', (e) => console.log('ERR', e.message));
page.on('console', (m) => m.type() === 'error' && console.log('CONSOLE', m.text().slice(0, 300)));
for (const [i, qs] of process.argv.slice(3).entries()) {
  await page.goto('http://localhost:5199/dev/viewer.html?' + qs);
  await page.waitForTimeout(9000);
  await page.screenshot({ path: `${process.argv[2]}/v${i}.png` });
}
await browser.close();
