// QA: scans every line of text in the game (dialogue, choices, objectives, notes,
// chapter cards, endings, ambient lines) for typing mistakes.
// usage: npx vite-node scripts/text-lint.ts
import { CHAPTERS } from '../src/content/chapters';
import { CHARACTERS, characterById } from '../src/content/characters';
import { SIDES } from '../src/content/sides';
import { ALL_ENDINGS } from '../src/content/endings';
import type { Step } from '../src/types/game';

const rows: { where: string; text: string; speaker?: string }[] = [];
const walk = (steps: Step[] | undefined, where: string) => {
  for (const s of steps ?? []) {
    if ('s' in s) rows.push({ where, text: s.t, speaker: s.s });
    if ('choose' in s) for (const c of s.choose) { rows.push({ where: `${where}/${s.id}`, text: c.t }); walk(c.then, `${where}/${s.id}`); }
    if ('then' in s && 'if' in s && !('s' in s)) { walk(s.then, where); walk(s.else, where); }
    if ('note' in s && s.note) rows.push({ where: `${where}/note`, text: s.note });
  }
};
for (const c of CHAPTERS) {
  const w = `ch${c.id}`;
  for (const t of [c.title, c.mission, c.summary]) rows.push({ where: `${w}/card`, text: t });
  walk(c.opening, `${w}/opening`);
  walk(c.closing, `${w}/closing`);
  for (const o of c.objectives) {
    rows.push({ where: `${w}/${o.id}/objective`, text: o.text });
    if (o.onLate?.note) rows.push({ where: `${w}/${o.id}/late`, text: o.onLate.note });
    walk(o.dialogue, `${w}/${o.id}`);
  }
}
for (const s of SIDES) walk(s.dialogue, `side/${s.id}`);
for (const ch of CHARACTERS) for (const r of ch.ambient) for (const l of r.lines) rows.push({ where: `ambient/${ch.id}`, text: l });
for (const e of ALL_ENDINGS) for (const [k, v] of Object.entries(e)) if (typeof v === 'string' && /[؀-ۿ]/.test(v)) rows.push({ where: `ending/${e.id}/${k}`, text: v });

const problems: string[] = [];
const flag = (r: (typeof rows)[number], why: string) => problems.push(`${r.where}: ${why}\n    «${r.text}»`);
const speakers = new Set([...CHARACTERS.map((c) => c.id), 'amine', 'narrator']);
for (const r of rows) {
  const t = r.text;
  if (r.speaker && !speakers.has(r.speaker)) flag(r, `unknown speaker "${r.speaker}"`);
  if (!t || !t.trim()) { flag(r, 'empty text'); continue; }
  if (t !== t.trim()) flag(r, 'space at the start or end');
  if (/ {2,}/.test(t)) flag(r, 'double space');
  if (/ [!?؟،,.:؛]/.test(t) && !/ \.\.\./.test(t.replace(/ \.\.\./g, ''))) {
    const m = t.match(/ [!?؟،,.:؛]/g)!.filter((x) => x !== ' .');
    if (m.length) flag(r, 'space before punctuation');
  }
  if (/[،,!?؟:؛][^\s"»)\]!?؟.…\d]/.test(t.replace(/\.\.\./g, '…'))) flag(r, 'no space after punctuation');
  if (/\?/.test(t) && /[؀-ۿ]/.test(t)) flag(r, 'Latin "?" in Arabic text (use "؟")');
  if (/,/.test(t) && /[؀-ۿ]/.test(t)) flag(r, 'Latin "," in Arabic text (use "،")');
  if (/(^|\s)(\S+) \2(\s|$)/.test(t) && !/(شوية شوية|بالسيف بالسيف|برك برك|دوك دوك|واحد واحد|خطوة خطوة|يوم يوم|بلاك بلاك|ههه|لا لا|إيه إيه|نعم نعم)/.test(t)) flag(r, `repeated word "${t.match(/(^|\s)(\S+) \2(\s|$)/)![2]}"`);
  const q = (t.match(/"/g) ?? []).length;
  if (q % 2) flag(r, 'unbalanced quotes "');
  if ((t.match(/\(/g) ?? []).length !== (t.match(/\)/g) ?? []).length) flag(r, 'unbalanced brackets');
  if ((t.match(/«/g) ?? []).length !== (t.match(/»/g) ?? []).length) flag(r, 'unbalanced « »');
  if (/\.\.\.\.|…\./.test(t)) flag(r, 'too many dots');
  if (/[a-zA-Z]/.test(t) && /[؀-ۿ]/.test(t) && !/\b(BEM|BAC|BAC\+|PC|TV|WiFi|Wi-Fi|OK|ok|CV|SMS|DA|VAR|CEM|DZ)\b/.test(t)) flag(r, 'Latin letters inside Arabic');
  if (/[ًٌٍَُِّْ]{3,}/.test(t)) flag(r, 'stacked diacritics');
  if (/ـ{2,}/.test(t)) flag(r, 'tatweel');
  if (/[٠-٩]/.test(t) && /\d/.test(t)) flag(r, 'mixes Arabic-Indic and Western digits');
}
// characters referenced by casts exist
for (const c of CHAPTERS) for (const id of Object.keys(c.cast ?? {})) if (!characterById.has(id)) problems.push(`ch${c.id}: cast has unknown character "${id}"`);
console.log(`${rows.length} texts checked, ${problems.length} problems`);
console.log(problems.join('\n'));
