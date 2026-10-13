// Ending model.
// A distinct ending = a unique combination of three independently-earned outcomes:
//   PATH (6)   — what Amine does with his life at 18
//   FAMILY (3) — the state of his relationship with his parents
//   MOURAD (4) — what became of his childhood friend, and of the friendship
// 6 × 3 × 4 = 72 possible endings. Each one has its own title, epilogue and
// final scene composed from outcome-specific text. Reachability of every
// ending is verified by automated playthrough search (tests/unit/endings.test.ts).
import type { GameState } from '../../types/game';

export type PathId = 'university' | 'vocational' | 'craft' | 'business' | 'recovery' | 'drifting';
export type FamilyId = 'close' | 'healing' | 'distant';
export type MouradId = 'together' | 'apart' | 'crisis' | 'gone';

export const PATHS: { id: PathId; title: string; text: string }[] = [
  {
    id: 'university',
    title: 'الطالب الجامعي',
    text: 'أمين نجح في البكالوريا ودخل للجامعة. أول واحد في العائلة. الطريق كان طويل، فيه غيابات وكذبات ورجوع، بصح وصل. في المدرج الكبير، يتفكّر الكسور تاع سي لخضر ويضحك وحدو.',
  },
  {
    id: 'vocational',
    title: 'الصنايعي المعتمد',
    text: 'أمين خذا شهادة الكفاءة المهنية وولى يخدم في شركة كهرباء. كل دار يشعلها الضو تاعها، فيها شوية منو. الناس اللي قالو "التكوين للي فشل"، دروك يعيّطولو كي يطفى الضو.',
  },
  {
    id: 'craft',
    title: 'المعلّم في الورشة',
    text: 'عمي بشير علّق اللافتة الجديدة: "ورشة بشير وأمين". الأبواب اللي يصنعهم أمين يتسكّرو بلا صوت، ويعيشو سنين. اليدين فيهم جروح صغار. وكل جرح، درس.',
  },
  {
    id: 'business',
    title: 'التاجر الصادق',
    text: 'الطبلة الصغيرة في السوق ولات محل. ماشي كبير، بصح نظيف. أمين يحسب كل دينار كيما علّمو عمي صالح: الثلث للدار، الثلث للحصالة، الثلث للحياة. الزبائن يرجعو على خاطر الكلمة.',
  },
  {
    id: 'recovery',
    title: 'طريق التعافي',
    text: 'أمين طاح. وطلب العاون. ونوض. التعافي ما كانش خط مستقيم: أيام مليحة وأيام صعيبة. بصح كل شهر يزيد. دروك يتكوّن في مركز التكوين، ويحكي قصتو للشباب في مركز الإصغاء: "طلب العاون ماشي ضعف".',
  },
  {
    id: 'drifting',
    title: 'الطريق الضايع',
    text: 'أمين في الثمنطاش، والطريق مازال ما بانش. الأبواب اللي تسكّرت كثيرة، والقرارات الصغار تجمّعو كالغبرة. بصح القصة ما كملتش: الزيتونة تاع جدّو تعطي كل عام، وحتى هو، يقدر يبدا موسم جديد.',
  },
];

export const FAMILIES: { id: FamilyId; title: string; text: string }[] = [
  { id: 'close', title: 'دار دافية', text: 'في الدار، الثقة رجعت كيما الخبز السخون كل صباح. بابا يسقسيه على النهار، وماما ما بقاتش تستنّى في الصالون.' },
  { id: 'healing', title: 'جرح يبرى', text: 'بين أمين وعائلتو، الحيط تكسّر وتعاود يتبنى. مازال كاين نظرات صامتة وكلمات ما تقالتش، بصح كل سيمانة، ياجورة جديدة.' },
  { id: 'distant', title: 'دار باردة', text: 'العائلة موجودة، بصح بعيدة. الكذبات القدام خلّاو مسافة ما تتقطعش بالخطوات. ماما مازالت تدعيلو كل ليلة، وبابا... يستنّى.' },
];

export const MOURADS: { id: MouradId; title: string; text: string }[] = [
  { id: 'together', title: 'الصاحب اللي رجع', text: 'ومراد؟ سنة كاملة نظيف. يخدم، يضحك، ويلعب الكورة كيما زمان. ساعات يقول لأمين: "لو كان خلّيتني ذيك الليلة..." وأمين يقاطعو: "ما خلّيتكش. وخلاص."' },
  { id: 'apart', title: 'كل واحد وطريقو', text: 'ومراد يتعالج في مدينة أخرى. الصحبة ما بقاتش كيما كانت، بصح مراد حي، ويحاول. وهاذا، في حد ذاتو، انتصار.' },
  { id: 'crisis', title: 'الباب المفتوح', text: 'ومراد مازال في الطريق الصعيب. ضعيف، تعبان. بصح أمين ما سكّرش الباب. كل جمعة يمر من القاطعة. ويوم من الأيام، مراد يقدر يدخل.' },
  { id: 'gone', title: 'الصاحب الضايع', text: 'ومراد ضاع. ماشي حتى واحد يعرف وين راه. أمين ساعات يشوف ولد صغير يلعب في القاطعة، ويتفكّر: "غير ساعة ونرجعو." ويعرف بلي ساعات الساعة ما ترجعش.' },
];

/** Final-scene line per path × family (18). */
const SCENES: Record<`${PathId}.${FamilyId}`, string> = {
  'university.close': 'نهار التسجيل في الجامعة، بابا لبس الجاكيطة تاع الأعراس. نفس الجاكيطة تاع نهار الاستدعاء. هاذ المرة، كان يضحك.',
  'university.healing': 'بابا ما جاش للتسجيل، بصح بعث ميساج: "ربي يوفقك يا ولدي." أمين قراه عشرين مرة.',
  'university.distant': 'في المدرج، أمين وحدو. نجح، بصح ما عندو حتى واحد يعيّطلو باش يقولو. كتب لماما. ردّت بقلب.',
  'vocational.close': 'أول دار ضوّاها أمين كانت دار العائلة. الكابلاج الجديد. بابا شعل الضو وقال: "هاذا ضو وليدي."',
  'vocational.healing': 'أمين صلّح الكهرباء تاع الدار بلا ما يطلبو منو. بابا شاف، وقال "يعطيك الصحة". جوج كلمات. بصح بداية.',
  'vocational.distant': 'أمين يضوّي ديار الناس كل نهار. والدار تاعو؟ ما دخلهاش من شهور.',
  'craft.close': 'الباب الجديد تاع دار العائلة صنعو أمين. بابا يسكّرو كل ليلة ويقول: "ما يصوّتش".',
  'craft.healing': 'أمين صنع كرسي لبابا، للرجل المكسورة. بابا ما قال والو. بصح قعد عليه كل عشية.',
  'craft.distant': 'في الورشة، عمي بشير ولّى كيما الأب. والأب الحقيقي؟ في الدار، بعيد بخمسة شوارع وعشر سنين.',
  'business.close': 'أول ربح كبير، أمين شرى لماما مشط خشب جديد. "تفكّري يا ماما؟ السوق، كي كان عندي حداش سنة."',
  'business.healing': 'بابا جا للمحل مرة. شرى حاجة صغيرة وخلّص. أمين ما حبش ياخذ الدراهم. بابا قال: "التاجر ياخذ حقّو."',
  'business.distant': 'المحل يربح. والدار؟ أمين يبعث الدراهم كل شهر. ماما تقبلهم. بابا يرجّعهم.',
  'recovery.close': 'في جلسة العائلة في المركز، بابا هدر أول مرة: "كنت خايف نخسرك." وأمين جاوب: "ما خسرتنيش."',
  'recovery.healing': 'ماما تجي معاه للجلسات كل شهر. بابا مازال ما جاش. بصح سقسى على الوقت.',
  'recovery.distant': 'أمين يتعافى وحدو، مع سامية وصحابو الجداد. العائلة بعيدة، بصح الباب، من جيهتو، مفتوح.',
  'drifting.close': 'العائلة مازالت معاه. بابا قالو: "ما عليهش. الطريق ما بانش اليوم، يبان غدوة. ونحنا هنا."',
  'drifting.healing': 'ماما تحطّلو الفطور كل صباح، حتى كي ينوض على الحداش. ما تقول والو. بصح ما تحبّسش.',
  'drifting.distant': 'أمين قاعد في القاطعة، وين كان مراد يستنّاه. الحومة تفوت. وهو يستنّى حاجة ما يعرفش واش هي.',
};

export interface Ending {
  id: string;
  path: PathId;
  family: FamilyId;
  mourad: MouradId;
  title: string;
  paragraphs: string[];
}

export function pathOf(s: GameState): PathId {
  const f = s.flags;
  if (f.amine_used && !f.amine_sought_help) return 'drifting';
  if (f.amine_used && f.amine_sought_help) return 'recovery';
  if (s.stats.risk >= 85) return 'drifting';
  if (f.path_study && f.bac_passed) return 'university';
  if (f.path_vocational && f.training_done) return 'vocational';
  if (f.path_craft && f.bachir_trusts) return 'craft';
  if (f.path_business && f.business_ok) return 'business';
  return 'drifting';
}

export function familyScore(s: GameState): number {
  return (s.stats.trust + s.stats.parents) / 2 + (s.stats.honesty - 50) / 5;
}

export function familyOf(s: GameState): FamilyId {
  const score = familyScore(s);
  if (score >= 70) return 'close';
  if (score >= 58 || s.flags.rebuilt_trust) return 'healing';
  return 'distant';
}

export function mouradOf(s: GameState): MouradId {
  const f = s.flags;
  if (f.end_mourad_together) return 'together';
  if (f.end_mourad_apart) return 'apart';
  if (f.end_mourad_crisis) return 'crisis';
  if (f.end_mourad_gone) return 'gone';
  if (f.mourad_recovering) return s.stats.mourad >= 55 ? 'together' : 'apart';
  return s.stats.mourad >= 35 ? 'crisis' : 'gone';
}

export function buildEnding(path: PathId, family: FamilyId, mourad: MouradId): Ending {
  const p = PATHS.find((x) => x.id === path)!;
  const fa = FAMILIES.find((x) => x.id === family)!;
  const m = MOURADS.find((x) => x.id === mourad)!;
  return {
    id: `${path}.${family}.${mourad}`,
    path,
    family,
    mourad,
    title: `${p.title} · ${fa.title} · ${m.title}`,
    paragraphs: [p.text, fa.text, m.text, SCENES[`${path}.${family}`]],
  };
}

export function evaluateEnding(s: GameState): string {
  return `${pathOf(s)}.${familyOf(s)}.${mouradOf(s)}`;
}

export function endingById(id: string): Ending | null {
  const [p, f, m] = id.split('.') as [PathId, FamilyId, MouradId];
  if (!PATHS.some((x) => x.id === p) || !FAMILIES.some((x) => x.id === f) || !MOURADS.some((x) => x.id === m)) return null;
  return buildEnding(p, f, m);
}

export const ALL_ENDINGS: Ending[] = PATHS.flatMap((p) => FAMILIES.flatMap((f) => MOURADS.map((m) => buildEnding(p.id, f.id, m.id))));

/** Heuristic distance-to-target used by the reachability search (higher = closer). */
export function endingFitness(target: string): (s: GameState) => number {
  const [tp, tf, tm] = target.split('.') as [PathId, FamilyId, MouradId];
  const famCenter: Record<FamilyId, number> = { close: 80, healing: 64, distant: 45 };
  return (s) => {
    const f = s.flags;
    let score = 0;
    if (pathOf(s) === tp) score += 300;
    else {
      const used = f.amine_used ? 1 : 0;
      const progress: Record<PathId, number> = {
        university: (f.path_study ? 40 : 0) + (f.bem_passed ? 20 : 0) + Math.min(s.stats.grades, 70) + Math.min(s.stats.attendance, 60) - used * 80,
        vocational: (f.path_vocational ? 60 : 0) + (f.training_commit ? 20 : 0) + Math.min(s.stats.attendance, 60) - used * 80,
        craft: (f.path_craft ? 60 : 0) + (f.bachir_impressed ? 30 : 0) + (f.craft_commit ? 20 : 0) - used * 80,
        business: (f.path_business ? 60 : 0) + (f.business_plan ? 30 : 0) + Math.min(s.savings, 3000) / 30 - used * 80,
        recovery: used * 60 + (f.amine_sought_help ? 60 : 0),
        drifting: s.stats.risk + (f.path_undecided ? 40 : 0),
      };
      score += progress[tp];
    }
    if (familyOf(s) === tf) score += 300;
    else score -= Math.abs(familyScore(s) - famCenter[tf]) * 3;
    const m = mouradOf(s);
    if (m === tm) score += 300;
    else {
      const wantRec = tm === 'together' || tm === 'apart';
      score += (wantRec === !!f.mourad_recovering ? 60 : 0);
      const center = tm === 'together' || tm === 'crisis' ? 70 : 20;
      score -= Math.abs(s.stats.mourad - center);
    }
    return score;
  };
}
