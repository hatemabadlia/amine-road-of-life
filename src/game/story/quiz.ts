// Study mini-game: short maths quizzes matched to Amine's age, played as
// dialogue choices (2 + 6 at ten, equations at fifteen, derivatives at the BAC).
// Generated at runtime, so they are not part of the story graph or its history.
import type { ChoiceStep, Step } from '../../types/game';

export interface Question {
  expr: string;
  answer: string;
  options: string[];
}

type Rand = () => number;
/** keep maths left-to-right inside Arabic text */
const ltr = (s: string) => `\u2066${s}\u2069`;
const int = (r: Rand, a: number, b: number) => a + Math.floor(r() * (b - a + 1));

function shuffle<T>(r: Rand, xs: T[]): T[] {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** A numeric question with three plausible wrong answers (off by one or two, or a common slip). */
function numeric(r: Rand, expr: string, answer: number, slips: number[] = []): Question {
  const wrong = new Set<number>();
  for (const s of slips) if (s !== answer && s >= 0) wrong.add(s);
  for (const d of shuffle(r, [1, -1, 2, -2, 10, 3])) {
    if (wrong.size >= 3) break;
    const v = answer + d;
    if (v !== answer && v >= 0) wrong.add(v);
  }
  const options = shuffle(r, [answer, ...[...wrong].slice(0, 3)]).map(String);
  return { expr, answer: String(answer), options };
}

function symbolic(r: Rand, expr: string, answer: string, wrong: string[]): Question {
  return { expr, answer, options: shuffle(r, [answer, ...wrong.slice(0, 3)]) };
}

const GENERATORS: { minAge: number; make: (r: Rand) => Question }[] = [
  // age 10 — primary school
  { minAge: 10, make: (r) => { const a = int(r, 2, 9), b = int(r, 2, 9); return numeric(r, `${a} + ${b} = ?`, a + b, [a + b - 1]); } },
  { minAge: 10, make: (r) => { const a = int(r, 8, 18), b = int(r, 2, 7); return numeric(r, `${a} − ${b} = ?`, a - b, [a + b]); } },
  // 11–12
  { minAge: 11, make: (r) => { const a = int(r, 2, 9), b = int(r, 3, 9); return numeric(r, `${a} × ${b} = ?`, a * b, [a + b, a * (b - 1)]); } },
  { minAge: 11, make: (r) => { const a = int(r, 12, 48), b = int(r, 11, 39); return numeric(r, `${a} + ${b} = ?`, a + b, [a + b - 10]); } },
  { minAge: 12, make: (r) => { const b = int(r, 3, 9), q = int(r, 3, 9); return numeric(r, `${b * q} ÷ ${b} = ?`, q, [b]); } },
  // 13–15 — middle school
  { minAge: 13, make: (r) => { const a = int(r, 2, 5), x = int(r, 2, 9), b = int(r, 1, 9); return numeric(r, `${a}x + ${b} = ${a * x + b}   →   x = ?`, x, [a * x, x + b]); } },
  { minAge: 13, make: (r) => { const p = [10, 20, 25, 50][int(r, 0, 3)], n = [40, 60, 80, 120, 200][int(r, 0, 4)]; return numeric(r, `${p}% × ${n} = ?`, (p * n) / 100, [p + n / 10]); } },
  { minAge: 14, make: (r) => { const n = int(r, 4, 13); return numeric(r, `√${n * n} = ?`, n, [n * 2]); } },
  { minAge: 14, make: (r) => { const a = int(r, 2, 3), n = int(r, 3, 5); return numeric(r, `${a}^${n} = ?`, a ** n, [a * n]); } },
  // 16–18 — secondary school, BAC
  { minAge: 16, make: (r) => { const n = int(r, 2, 5); return symbolic(r, `(x^${n})′ = ?`, `${n}x^${n - 1}`, [`x^${n - 1}`, `${n}x^${n}`, `x^${n + 1}/${n + 1}`]); } },
  { minAge: 16, make: (r) => { const n = int(r, 2, 4); return numeric(r, `log₁₀(${10 ** n}) = ?`, n, [10 * n]); } },
  { minAge: 16, make: (r) => { const a = int(r, 2, 6), b = int(r, 1, 6); return numeric(r, `(x − ${a})(x + ${b}) = 0   →   x > 0 : x = ?`, a, [b]); } },
  { minAge: 17, make: (r) => { const k = int(r, 2, 6); return symbolic(r, `lim (x→+∞)  ${k}/x = ?`, '0', [String(k), '+∞', '1']); } },
];

/** General-knowledge questions for the school culture contest (history and geography of Algeria). */
const CULTURE: [string, string, string[]][] = [
  ['عاصمة الجزائر؟', 'الجزائر العاصمة', ['وهران', 'قسنطينة', 'تبسة']],
  ['الثورة التحريرية بدات في...', '1 نوفمبر 1954', ['5 جويلية 1962', '8 ماي 1945', '1 نوفمبر 1962']],
  ['عيد الاستقلال؟', '5 جويلية 1962', ['1 نوفمبر 1954', '19 مارس 1962', '8 ماي 1945']],
  ['شكون أسّس جمعية العلماء المسلمين؟', 'عبد الحميد بن باديس', ['الأمير عبد القادر', 'مصالي الحاج', 'العربي بن مهيدي']],
  ['شكون قاوم فرنسا في الغرب وأسّس الدولة الجزائرية الحديثة؟', 'الأمير عبد القادر', ['ابن باديس', 'الشيخ بوعمامة', 'لالة فاطمة نسومر']],
  ['أكبر بلاد في إفريقيا بالمساحة؟', 'الجزائر', ['مصر', 'نيجيريا', 'السودان']],
  ['قوس كاراكلا وكنيسة القديس كريسبين الأثرية في...', 'تبسة', ['تيمقاد', 'جميلة', 'شرشال']],
  ['أعلى قمة في الجزائر؟', 'تاهات', ['لالة خديجة', 'الشلية', 'المرجاجو']],
  ['شكون كتب كلمات النشيد الوطني "قسمًا"؟', 'مفدي زكريا', ['محمد ديب', 'كاتب ياسين', 'مالك حداد']],
  ['الماء يغلي في درجة...', '100', ['50', '0', '212']],
];

function culture(r: Rand, n: number): Question[] {
  return shuffle(r, CULTURE)
    .slice(0, n)
    .map(([expr, answer, wrong]) => ({ expr, answer, options: shuffle(r, [answer, ...wrong]) }));
}

/** Questions for this age: mostly the newest kind, with some easier review. */
export function makeQuestions(age: number, n: number, r: Rand = Math.random, kind: 'math' | 'culture' = 'math'): Question[] {
  if (kind === 'culture') return culture(r, n);
  const pool = GENERATORS.filter((g) => g.minAge <= age);
  const recent = pool.filter((g) => g.minAge >= Math.max(10, age - 2));
  const out: Question[] = [];
  const used = new Set<string>();
  for (let tries = 0; out.length < n && tries < 50; tries++) {
    const list = r() < 0.7 && recent.length ? recent : pool;
    const q = list[Math.floor(r() * list.length)].make(r);
    if (used.has(q.expr)) continue;
    used.add(q.expr);
    out.push(q);
  }
  return out;
}

/** Dialogue steps for a quiz: one choice per question, with feedback and a small grades reward. */
export function quizSteps(age: number, n: number, kind: 'math' | 'culture' = 'math', r: Rand = Math.random): Step[] {
  const qs = makeQuestions(age, n, r, kind);
  const sum = (q: Question) => (kind === 'math' ? q.expr.replace('?', q.answer) : `${q.expr} ${q.answer}`);
  return qs.map(
    (q, i): ChoiceStep => ({
      id: `quiz_${i + 1}`,
      quiz: { n: i + 1, of: qs.length, expr: q.expr, kind },
      choose: q.options.map((o) =>
        o === q.answer
          ? { t: o, tone: 'good' as const, fx: { grades: 1 }, then: [{ s: 'narrator', t: `✔ صح! ${kind === 'math' ? ltr(sum(q)) : sum(q)}` }] }
          : { t: o, tone: 'neutral' as const, then: [{ s: 'narrator', t: `✘ لا... الجواب الصحيح: ${kind === 'math' ? ltr(q.answer) : q.answer}. أمين كتبها في الكرّاس باش ما ينساش.` }] },
      ),
    }),
  );
}

/** Insert a quiz after the first scene-setting line of a dialogue (or at the start). */
export function withQuiz(dialogue: Step[], quiz: Step[]): Step[] {
  const first = dialogue.findIndex((s) => 's' in s && !s.if);
  const at = first + 1;
  return [...dialogue.slice(0, at), ...quiz, ...dialogue.slice(at)];
}
