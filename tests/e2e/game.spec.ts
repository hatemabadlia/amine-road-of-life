import { expect, test, type Page } from '@playwright/test';

declare global {
  interface Window {
    __AMINE__: {
      state: () => any; // eslint-disable-line @typescript-eslint/no-explicit-any
      pose: () => { x: number; y: number; z: number; yaw: number };
      goTo: (id: string) => boolean;
      objective: () => { id: string; type: string; target: string; text: string } | null;
      interact: () => void;
      nav: () => { ready: boolean; w: number; blocked: number };
      route: (a: string, b: string) => { points: number; length: number } | null;
      places: () => string[];
      music: () => { theme: string | null; level: number };
      jumpTo: (id: number) => boolean;
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

test('every story place and object can be reached on foot from the front door', async ({ page }) => {
  test.setTimeout(240_000);
  await startNewGame(page);
  await page.waitForFunction(() => window.__AMINE__.nav().ready, null, { timeout: 120_000 });
  const ids: string[] = await page.evaluate(() => window.__AMINE__.places());
  expect(ids.length).toBeGreaterThan(40);
  const bad: string[] = [];
  for (const id of ids) {
    const r = await page.evaluate((x) => window.__AMINE__.route('home_door', x), id);
    if (!r) bad.push(id);
  }
  expect(bad).toEqual([]);
});

test('music plays and follows the story: menu theme, then the childhood theme in chapter 1', async ({ page }) => {
  await page.goto(URL);
  await page.evaluate(() => localStorage.clear());
  await page.goto(URL);
  await page.locator('.title').click(); // any gesture unlocks audio
  await expect.poll(() => page.evaluate(() => window.__AMINE__.music().theme), { timeout: 10_000 }).toBe('menu');
  await expect.poll(() => page.evaluate(() => window.__AMINE__.music().level), { timeout: 15_000 }).toBeGreaterThan(0.001);
  await page.getByTestId('new-game').click();
  await expect(page.getByTestId('chapter-card')).toBeVisible({ timeout: 60_000 });
  await expect.poll(() => page.evaluate(() => window.__AMINE__.music().theme), { timeout: 10_000 }).toBe('childhood');
});

test('chapter 16: the bus ride plays and drops Amine at the cybercafé', async ({ page }) => {
  test.setTimeout(240_000);
  await startNewGame(page);
  await page.evaluate(() => window.__AMINE__.jumpTo(16));
  for (let guard = 0; guard < 60; guard++) {
    if (await page.getByTestId('bus-ride').isVisible()) break;
    const st = await page.evaluate(() => {
      const s = window.__AMINE__.state();
      return { card: s.card, dialogue: !!s.dialogue };
    });
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
    if (!o) continue;
    await page.evaluate((t) => window.__AMINE__.goTo(t), o.target);
    await page.waitForTimeout(600);
    if (o.type !== 'goto' && !(await page.evaluate(() => !!window.__AMINE__.state().dialogue))) {
      await expect(page.getByTestId('prompt')).toBeVisible({ timeout: 10_000 });
      await page.keyboard.press('KeyE');
    }
  }
  await expect(page.getByTestId('bus-ride')).toBeVisible();
  await expect(page.getByTestId('bus-ride')).toHaveCount(0, { timeout: 30_000 });
  const o = await page.evaluate(() => window.__AMINE__.objective());
  expect(o?.target).toBe('cyber_pc');
  const p = await page.evaluate(() => window.__AMINE__.pose());
  expect(Math.hypot(p.x - 5.8, p.z + 61.5)).toBeLessThan(3);
});

test('chapter 8: Friday prayer — ablution, shoes off, khutba and prayer inside the mosque', async ({ page }) => {
  test.setTimeout(300_000);
  await startNewGame(page);
  await page.evaluate(() => window.__AMINE__.jumpTo(8));
  const visited: string[] = [];
  let prayedInside = false;
  for (let guard = 0; guard < 120; guard++) {
    const st = await page.evaluate(() => {
      const s = window.__AMINE__.state();
      return { card: s.card, dialogue: !!s.dialogue, ch: s.game.chapter };
    });
    if (st.ch !== 8) break;
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
    visited.push(o.id);
    await page.evaluate((t) => window.__AMINE__.goTo(t), o.target);
    await page.waitForTimeout(600);
    if (o.id === 'pray') {
      const p = await page.evaluate(() => window.__AMINE__.pose());
      // inside the prayer hall (walls x 29..41, z -56..-42)
      prayedInside = p.x > 29 && p.x < 41 && p.z > -56 && p.z < -42;
    }
    if (o.type !== 'goto' && !(await page.evaluate(() => !!window.__AMINE__.state().dialogue))) {
      await expect(page.getByTestId('prompt')).toBeVisible({ timeout: 10_000 });
      await page.keyboard.press('KeyE');
      await page.waitForTimeout(200);
    }
  }
  expect(visited).toEqual(expect.arrayContaining(['to_mosque', 'wudu', 'shoes', 'khutba', 'pray', 'after_prayer']));
  expect(prayedInside).toBe(true);
  const g = await page.evaluate(() => window.__AMINE__.state().game);
  expect(g.chapter).toBe(9);
  expect(g.flags.listened_khutba).toBe(true);
});

test('chapter 41: volunteering day at Dar Chabab — sign up, clean-up team, certificate', async ({ page }) => {
  test.setTimeout(300_000);
  await startNewGame(page);
  await page.evaluate(() => window.__AMINE__.jumpTo(41));
  // volunteer instead of the club, then pick the clean-up team
  const pick: Record<string, number> = { join_club: 1, vol_team: 1 };
  const visited: string[] = [];
  for (let guard = 0; guard < 150; guard++) {
    const st = await page.evaluate(() => {
      const s = window.__AMINE__.state();
      return { card: s.card, view: s.dialogue?.view ?? null, ch: s.game.chapter };
    });
    if (st.ch !== 41) break;
    if (st.card) {
      await page.waitForTimeout(950);
      await page.getByTestId('start-chapter').click();
      continue;
    }
    if (st.view) {
      if (st.view.kind === 'choice') await page.getByTestId(`choice-${pick[st.view.id] ?? 0}`).click();
      else {
        await page.keyboard.press('Enter');
        await page.waitForTimeout(40);
        if ((await page.evaluate(() => window.__AMINE__.state().dialogue?.view.kind ?? null)) === 'line') await page.keyboard.press('Enter');
      }
      await page.waitForTimeout(80);
      continue;
    }
    const o = await page.evaluate(() => window.__AMINE__.objective());
    if (!o) {
      await page.waitForTimeout(150);
      continue;
    }
    visited.push(o.id);
    await page.evaluate((t) => window.__AMINE__.goTo(t), o.target);
    await page.waitForTimeout(600);
    if (o.type !== 'goto' && !(await page.evaluate(() => !!window.__AMINE__.state().dialogue))) {
      await expect(page.getByTestId('prompt')).toBeVisible({ timeout: 10_000 });
      await page.keyboard.press('KeyE');
      await page.waitForTimeout(200);
    }
  }
  expect(visited).toEqual(expect.arrayContaining(['to_dar', 'hassane_signup', 'team_clean_kit', 'team_clean_alley', 'hassane_thanks']));
  expect(visited).not.toContain('club');
  const g = await page.evaluate(() => window.__AMINE__.state().game);
  expect(g.chapter).toBe(42);
  expect(g.flags.volunteer_spirit).toBe(true);
});

test('chapter 3: volunteering starts at age 10 — Hassane invites Amine and he plants his first tree', async ({ page }) => {
  test.setTimeout(300_000);
  await startNewGame(page);
  await page.evaluate(() => window.__AMINE__.jumpTo(3));
  const visited: string[] = [];
  for (let guard = 0; guard < 150; guard++) {
    const st = await page.evaluate(() => {
      const s = window.__AMINE__.state();
      return { card: s.card, view: s.dialogue?.view ?? null, ch: s.game.chapter };
    });
    if (st.ch !== 3) break;
    if (st.card) {
      await page.waitForTimeout(950);
      await page.getByTestId('start-chapter').click();
      continue;
    }
    if (st.view) {
      // first option everywhere: includes "yes, I want to plant a tree"
      if (st.view.kind === 'choice') await page.getByTestId('choice-0').click();
      else {
        await page.keyboard.press('Enter');
        await page.waitForTimeout(40);
        if ((await page.evaluate(() => window.__AMINE__.state().dialogue?.view.kind ?? null)) === 'line') await page.keyboard.press('Enter');
      }
      await page.waitForTimeout(80);
      continue;
    }
    const o = await page.evaluate(() => window.__AMINE__.objective());
    if (!o) {
      await page.waitForTimeout(150);
      continue;
    }
    visited.push(o.id);
    await page.evaluate((t) => window.__AMINE__.goTo(t), o.target);
    await page.waitForTimeout(600);
    if (o.type !== 'goto' && !(await page.evaluate(() => !!window.__AMINE__.state().dialogue))) {
      await expect(page.getByTestId('prompt')).toBeVisible({ timeout: 10_000 });
      await page.keyboard.press('KeyE');
      await page.waitForTimeout(200);
    }
  }
  expect(visited).toEqual(expect.arrayContaining(['hassane_invite', 'first_tree']));
  const g = await page.evaluate(() => window.__AMINE__.state().game);
  expect(g.chapter).toBe(4);
  expect(g.flags.planted_tree).toBe(true);
  expect(g.flags.volunteer_spirit).toBe(true);
});

test('chapter 15: Ramadan — food baskets at Dar Chabab, iftar at home, tarawih at the mosque', async ({ page }) => {
  test.setTimeout(300_000);
  await startNewGame(page);
  await page.evaluate(() => window.__AMINE__.jumpTo(15));
  const visited: string[] = [];
  // the hour when each objective became active
  const hours: Record<string, number> = {};
  for (let guard = 0; guard < 150; guard++) {
    const st = await page.evaluate(() => {
      const s = window.__AMINE__.state();
      return { card: s.card, view: s.dialogue?.view ?? null, ch: s.game.chapter };
    });
    if (st.ch !== 15) break;
    if (st.card) {
      await page.waitForTimeout(950);
      await page.getByTestId('start-chapter').click();
      continue;
    }
    if (st.view) {
      // first option everywhere: includes "I'll help pack the baskets"
      if (st.view.kind === 'choice') await page.getByTestId('choice-0').click();
      else {
        await page.keyboard.press('Enter');
        await page.waitForTimeout(40);
        if ((await page.evaluate(() => window.__AMINE__.state().dialogue?.view.kind ?? null)) === 'line') await page.keyboard.press('Enter');
      }
      await page.waitForTimeout(80);
      continue;
    }
    const o = await page.evaluate(() => window.__AMINE__.objective());
    if (!o) {
      await page.waitForTimeout(150);
      continue;
    }
    if (!visited.includes(o.id)) {
      visited.push(o.id);
      hours[o.id] = await page.evaluate(() => (window.__AMINE__.state().game.time % 1440) / 60);
    }
    await page.evaluate((t) => window.__AMINE__.goTo(t), o.target);
    await page.waitForTimeout(600);
    if (o.type !== 'goto' && !(await page.evaluate(() => !!window.__AMINE__.state().dialogue))) {
      await expect(page.getByTestId('prompt')).toBeVisible({ timeout: 10_000 });
      await page.keyboard.press('KeyE');
      await page.waitForTimeout(200);
    }
  }
  expect(visited).toEqual(expect.arrayContaining(['to_dar', 'hassane_ramadan', 'baskets', 'home', 'iftar', 'to_mosque', 'taraweeh', 'imam_ramadan']));
  // iftar just before sunset, tarawih after it
  expect(hours.home).toBeGreaterThanOrEqual(18.8);
  expect(hours.home).toBeLessThan(19.2);
  expect(hours.to_mosque).toBeGreaterThanOrEqual(20);
  const g = await page.evaluate(() => window.__AMINE__.state().game);
  expect(g.chapter).toBe(16);
  expect(g.flags.ramadan_baskets).toBe(true);
});

/** Play one chapter through the real UI; returns the objectives in the order they became active. */
async function playThrough(page: Page, chapter: number, pick: Record<string, number> = {}, onChoice?: (view: { id: string; quiz?: unknown }) => Promise<boolean>) {
  const visited: string[] = [];
  for (let guard = 0; guard < 200; guard++) {
    const st = await page.evaluate(() => {
      const s = window.__AMINE__.state();
      return { card: s.card, view: s.dialogue?.view ?? null, ch: s.game.chapter };
    });
    if (st.ch !== chapter) break;
    if (st.card) {
      await page.waitForTimeout(950);
      await page.getByTestId('start-chapter').click();
      continue;
    }
    if (st.view) {
      if (st.view.kind === 'choice') {
        if (!(onChoice && (await onChoice(st.view)))) await page.getByTestId(`choice-${pick[st.view.id] ?? 0}`).click();
      } else {
        await page.keyboard.press('Enter');
        await page.waitForTimeout(40);
        if ((await page.evaluate(() => window.__AMINE__.state().dialogue?.view.kind ?? null)) === 'line') await page.keyboard.press('Enter');
      }
      await page.waitForTimeout(80);
      continue;
    }
    const o = await page.evaluate(() => window.__AMINE__.objective());
    if (!o) {
      await page.waitForTimeout(150);
      continue;
    }
    if (!visited.includes(o.id)) visited.push(o.id);
    await page.evaluate((t) => window.__AMINE__.goTo(t), o.target);
    await page.waitForTimeout(600);
    if (o.type !== 'goto' && !(await page.evaluate(() => !!window.__AMINE__.state().dialogue))) {
      await expect(page.getByTestId('prompt')).toBeVisible({ timeout: 10_000 });
      await page.keyboard.press('KeyE');
      await page.waitForTimeout(200);
    }
  }
  return visited;
}

test('studying opens the maths quiz: a right answer raises the grades, a wrong one shows the answer', async ({ page }) => {
  test.setTimeout(300_000);
  await startNewGame(page);
  await page.evaluate(() => window.__AMINE__.jumpTo(6));
  const results: { right: boolean; gained: number }[] = [];
  await playThrough(page, 6, {}, async (view) => {
    if (!view.quiz) return false;
    await expect(page.getByTestId('quiz')).toBeVisible();
    // age 10: a sum or a difference of small numbers, written left to right
    await expect(page.getByTestId('quiz')).toContainText(/\d+ [+−] \d+ = \?/);
    const before = await page.evaluate(() => window.__AMINE__.state().game.stats.grades);
    await page.getByTestId('choice-0').click();
    await page.waitForTimeout(100);
    const line: string = await page.evaluate(() => window.__AMINE__.state().dialogue?.view.text ?? '');
    const after = await page.evaluate(() => window.__AMINE__.state().game.stats.grades);
    results.push({ right: line.startsWith('✔'), gained: after - before });
    return true;
  });
  expect(results).toHaveLength(2);
  for (const r of results) expect(r.gained).toBe(r.right ? 1 : 0);
  // quiz answers are practice, not story decisions
  const g = await page.evaluate(() => window.__AMINE__.state().game);
  expect(g.chapter).toBe(7);
  expect(g.history.some((d: { id: string }) => d.id.startsWith('quiz_'))).toBe(false);
});

test('chapter 53: Eid morning — prayer with Baba, forgiveness at home, the eidiya for Selma', async ({ page }) => {
  test.setTimeout(300_000);
  await startNewGame(page);
  await page.evaluate(() => window.__AMINE__.jumpTo(53));
  const visited = await playThrough(page, 53);
  expect(visited).toEqual(expect.arrayContaining(['eid_morning', 'eid_mosque', 'eid_prayer', 'eid_home', 'baba', 'eidiya']));
  expect(visited.indexOf('eid_prayer')).toBeLessThan(visited.indexOf('baba'));
  const g = await page.evaluate(() => window.__AMINE__.state().game);
  expect(g.chapter).toBe(54);
  expect(g.flags.fixed_table).toBe(true);
});

test('chapters panel: every chapter is open without a save — pick 45 and play it to the end', async ({ page }) => {
  test.setTimeout(300_000);
  await page.goto(URL);
  await page.evaluate(() => localStorage.clear());
  await page.goto(URL);
  await page.getByTestId('chapters').click();
  await expect(page.getByTestId('chapter-list').locator('.chapter-item:enabled')).toHaveCount(68);
  await page.getByTestId('chapter-45').click();
  await page.getByTestId('confirm-replay').click();
  await expect(page.getByTestId('chapter-card')).toContainText('مفترق الطرق', { timeout: 60_000 });
  const g = await page.evaluate(() => window.__AMINE__.state().game);
  expect(g.chapter).toBe(45);
  expect(g.age).toBe(15);
  expect(g.completed.length).toBe(44); // chapters 1–44 were played automatically
  await playChapter(page);
  await expect(page.getByTestId('chapter-card')).toContainText('ستة عشر سنة', { timeout: 20_000 });
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('amine.save') ?? '{}'));
  expect(saved.state.chapter).toBe(46);
  // the pause menu also opens chapters ahead: jump to 60 keeps the choices made so far
  const history = await page.evaluate(() => window.__AMINE__.state().game.history.length);
  await page.waitForTimeout(950);
  await page.getByTestId('start-chapter').click();
  await advanceDialogue(page);
  await page.keyboard.press('Escape');
  await page.getByTestId('pause-menu').getByRole('button', { name: /الفصول/ }).click();
  await page.getByTestId('chapter-60').click();
  await page.getByTestId('confirm-replay').click();
  await expect.poll(() => page.evaluate(() => window.__AMINE__.state().game.chapter)).toBe(60);
  expect(await page.evaluate(() => window.__AMINE__.state().game.history.length)).toBeGreaterThan(history);
});

test('a ?chapter= link opens that chapter directly', async ({ page }) => {
  await page.goto(URL);
  await page.evaluate(() => localStorage.clear());
  await page.goto(`${URL}&chapter=53`);
  await expect(page.getByTestId('chapter-card')).toBeVisible({ timeout: 60_000 });
  expect(await page.evaluate(() => window.__AMINE__.state().game.chapter)).toBe(53);
});
