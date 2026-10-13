import { expect, test, type Page } from '@playwright/test';

declare global {
  interface Window {
    __AMINE__: {
      state: () => any; // eslint-disable-line @typescript-eslint/no-explicit-any
      pose: () => { x: number; y: number; z: number; yaw: number };
      goTo: (id: string) => boolean;
      objective: () => { id: string; type: string; target: string; text: string } | null;
      interact: () => void;
    };
  }
}

const URL = '/?e2e=1';

async function startNewGame(page: Page) {
  await page.goto(URL);
  await page.evaluate(() => localStorage.clear());
  await page.goto(URL);
  await expect(page.getByTestId('menu')).toBeVisible();
  await page.getByTestId('new-game').click();
  await expect(page.getByTestId('chapter-card')).toBeVisible({ timeout: 60_000 });
}

async function advanceDialogue(page: Page, max = 60) {
  for (let i = 0; i < max; i++) {
    const kind = await page.evaluate(() => window.__AMINE__.state().dialogue?.view.kind ?? null);
    if (!kind) return;
    if (kind === 'choice') await page.getByTestId('choice-0').click();
    else {
      // first press completes the typewriter, second advances
      await page.keyboard.press('Enter');
      await page.waitForTimeout(40);
      if ((await page.evaluate(() => window.__AMINE__.state().dialogue?.view.kind ?? null)) === 'line') await page.keyboard.press('Enter');
    }
    await page.waitForTimeout(80);
  }
}

/** Play the current chapter to completion through the real UI (teleporting between objectives). */
async function playChapter(page: Page) {
  const start = await page.evaluate(() => window.__AMINE__.state().game.chapter);
  for (let guard = 0; guard < 120; guard++) {
    const st = await page.evaluate(() => {
      const s = window.__AMINE__.state();
      return { ch: s.game.chapter, card: s.card, dialogue: !!s.dialogue, screen: s.screen };
    });
    if (st.screen !== 'game' || st.ch !== start) return;
    if (st.card) {
      await page.waitForTimeout(950);
      await page.getByTestId('start-chapter').click();
      continue;
    }
    if (st.dialogue) {
      await advanceDialogue(page);
      continue;
    }
    const o = await page.evaluate(() => window.__AMINE__.objective());
    if (!o) {
      await page.waitForTimeout(150);
      continue;
    }
    await page.evaluate((t) => window.__AMINE__.goTo(t), o.target);
    await page.waitForTimeout(500);
    if (await page.evaluate(() => !!window.__AMINE__.state().dialogue)) continue;
    if (o.type !== 'goto') {
      await expect(page.getByTestId('prompt')).toBeVisible({ timeout: 10_000 });
      await page.keyboard.press('KeyE');
      await page.waitForTimeout(200);
    } else {
      await page.waitForTimeout(400);
    }
  }
  throw new Error('chapter did not finish');
}

test('main menu renders with Arabic title and actions', async ({ page }) => {
  await page.goto(URL);
  await page.evaluate(() => localStorage.clear());
  await page.goto(URL);
  await expect(page.locator('.title')).toHaveText('أمين');
  await expect(page.getByTestId('new-game')).toBeVisible();
  await expect(page.getByTestId('continue')).toHaveCount(0);
});

test('new game: chapter card, opening dialogue, then mission HUD', async ({ page }) => {
  await startNewGame(page);
  await expect(page.getByTestId('chapter-card')).toContainText('أول نهار خارج السيطرة');
  await page.waitForTimeout(950);
  await page.getByTestId('start-chapter').click();
  await expect(page.getByTestId('dialogue')).toBeVisible();
  await advanceDialogue(page);
  await expect(page.getByTestId('objective')).toContainText('نوض من الفراش');
  await expect(page.getByTestId('money')).toContainText('20');
  await expect(page.getByTestId('clock')).toContainText('07:');
});

test('keyboard moves Amine and walls stop him', async ({ page }) => {
  await startNewGame(page);
  await page.waitForTimeout(950);
  await page.getByTestId('start-chapter').click();
  await advanceDialogue(page);
  const before = await page.evaluate(() => window.__AMINE__.pose());
  // camera starts looking south: holding S walks north into the bedroom's outer wall (z = -28)
  await page.keyboard.down('KeyS');
  await page.waitForTimeout(4000);
  await page.keyboard.up('KeyS');
  const after = await page.evaluate(() => window.__AMINE__.pose());
  expect(Math.abs(after.z - before.z)).toBeGreaterThan(1.5);
  expect(after.z).toBeGreaterThan(-27.9); // did not pass through the wall
  expect(after.y).toBeGreaterThan(-0.2); // did not fall through the floor
});

test('chapter 1 is playable start to finish, autosaves, and Continue resumes chapter 2', async ({ page }) => {
  test.setTimeout(240_000);
  await startNewGame(page);
  await playChapter(page);
  await expect(page.getByTestId('chapter-card')).toContainText('كذبة المصروف', { timeout: 20_000 });
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('amine.save') ?? '{}'));
  expect(saved.version).toBe(2);
  expect(saved.state.chapter).toBe(2);
  expect(saved.state.completed).toContain(1);
  expect(saved.state.history.length).toBeGreaterThan(3);
  await page.goto(URL);
  await page.getByTestId('continue').click();
  await expect(page.getByTestId('chapter-card')).toContainText('كذبة المصروف', { timeout: 60_000 });
});

test('pause menu saves and settings persist', async ({ page }) => {
  await startNewGame(page);
  await page.waitForTimeout(950);
  await page.getByTestId('start-chapter').click();
  await advanceDialogue(page);
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('pause-menu')).toBeVisible();
  await page.getByTestId('save-btn').click();
  await expect(page.locator('.toast').filter({ hasText: 'تحفظت' })).toBeVisible();
  await page.getByRole('button', { name: 'الإعدادات' }).click();
  await page.getByLabel('سرعة النص').selectOption('instant');
  const s = await page.evaluate(() => JSON.parse(localStorage.getItem('amine.settings') ?? '{}'));
  expect(s.textSpeed).toBe('instant');
  await page.getByRole('button', { name: 'القائمة' }).click();
  await page.getByTestId('resume').click();
  await expect(page.getByTestId('pause-menu')).toHaveCount(0);
});

test('mobile layout shows touch controls and the joystick moves Amine', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'mobile only');
  await startNewGame(page);
  await page.waitForTimeout(950);
  await page.getByTestId('start-chapter').click();
  await advanceDialogue(page);
  await expect(page.getByTestId('touch-controls')).toBeVisible();
  const before = await page.evaluate(() => window.__AMINE__.pose());
  const stick = page.locator('.joystick');
  const box = (await stick.boundingBox())!;
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;
  // drag the joystick downward (= walk backwards, toward the north wall)
  await page.dispatchEvent('.joystick', 'pointerdown', { pointerId: 7, clientX: cx, clientY: cy, isPrimary: true, pointerType: 'touch' });
  await page.dispatchEvent('.joystick', 'pointermove', { pointerId: 7, clientX: cx, clientY: cy + 60, isPrimary: true, pointerType: 'touch' });
  await page.waitForTimeout(2500);
  await page.dispatchEvent('.joystick', 'pointerup', { pointerId: 7, clientX: cx, clientY: cy + 60, isPrimary: true, pointerType: 'touch' });
  const after = await page.evaluate(() => window.__AMINE__.pose());
  expect(Math.hypot(after.x - before.x, after.z - before.z)).toBeGreaterThan(0.8);
});
