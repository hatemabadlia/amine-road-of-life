// QA: every flag the story checks must be set somewhere, and every flag it sets should be used.
// usage: npx vite-node scripts/flag-lint.ts
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { CHAPTERS } from '../src/content/chapters';
import { CHARACTERS } from '../src/content/characters';
import { SIDES } from '../src/content/sides';

const set = new Map<string, string[]>();
const read = new Map<string, string[]>();
const add = (m: Map<string, string[]>, k: string, where: string) => m.set(k, [...(m.get(k) ?? []), where]);
const scan = (v: unknown, where: string): void => {
  if (Array.isArray(v)) return v.forEach((x) => scan(x, where));
  if (!v || typeof v !== 'object') return;
  const o = v as Record<string, unknown>;
  for (const k of ['set', 'unset']) if (Array.isArray(o[k])) for (const f of o[k] as string[]) add(set, f, where);
  if (o.onLate && typeof o.onLate === 'object') scan(o.onLate, where);
  if (typeof o.if === 'string')
    for (const part of o.if.split(/[|&]/)) {
      const t = part.trim().replace(/^!/, '');
      if (/^[a-zA-Z_]\w*$/.test(t)) add(read, t, where);
    }
  for (const [k, x] of Object.entries(o)) if (k !== 'set' && k !== 'unset') scan(x, `${where}${o.id && typeof o.id === 'string' ? '/' + o.id : ''}`);
};
for (const c of CHAPTERS) scan(c, `ch${c.id}`);
for (const s of SIDES) scan(s, `side/${s.id}`);
for (const c of CHARACTERS) scan(c.ambient, `ambient/${c.id}`);
// flags read or written by code (endings, store, engine)
const files = (d: string): string[] => readdirSync(d).flatMap((f) => (statSync(join(d, f)).isDirectory() ? files(join(d, f)) : [join(d, f)]));
for (const f of files('src').filter((f) => /\.tsx?$/.test(f) && !f.includes('content/chapters'))) {
  const src = readFileSync(f, 'utf8');
  for (const m of src.matchAll(/flags\.(\w+)|flags\[['"](\w+)['"]\]|\bf\(['"](\w+)['"]\)|has\(['"](\w+)['"]\)/g)) add(read, m[1] ?? m[2] ?? m[3] ?? m[4], f);
  for (const m of src.matchAll(/flags\[['"](\w+)['"]\]\s*=|setFlag\(\w+,\s*['"](\w+)['"]/g)) add(set, m[1] ?? m[2], f);
  // flags written by template, e.g. `late_ch${n}` — record the prefix
  for (const m of src.matchAll(/set:\s*\[\s*`(\w+)\$\{/g)) add(set, m[1] + '*', f);
}
const isSet = (k: string) => set.has(k) || [...set.keys()].some((s) => s.endsWith('*') && k.startsWith(s.slice(0, -1)));
const neverSet = [...read].filter(([k]) => !isSet(k));
const neverRead = [...set].filter(([k]) => !k.endsWith('*') && !read.has(k));
console.log(`${set.size} flags set, ${read.size} flags read`);
console.log(`\nREAD BUT NEVER SET (${neverSet.length}):`);
for (const [k, w] of neverSet) console.log(`  ${k}  ← ${[...new Set(w)].slice(0, 3).join(', ')}`);
console.log(`\nSET BUT NEVER READ (${neverRead.length}):`);
console.log('  ' + neverRead.map(([k, w]) => `${k} (${w[0]})`).join('\n  '));
