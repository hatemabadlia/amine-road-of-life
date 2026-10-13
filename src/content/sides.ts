// Optional side activities. Available in free roam, once per chapter each.
// They never advance the main story but change money, stats and time.
import type { Step } from '../types/game';
import { A, M, N, choose, fx, opt, pass, say } from './chapters/dsl';

export interface SideActivity {
  id: string;
  /** object or character id the player interacts with */
  target: string;
  label: string;
  minAge?: number;
  maxAge?: number;
  /** repeatable within a chapter (zero-sum actions like the piggy bank) */
  repeatable?: boolean;
  dialogue: Step[];
}

export const SIDES: SideActivity[] = [
  // ---- Dar Chabab: volunteering ---------------------------------------------
  {
    id: 'vol_tutor',
    target: 'tutor_table',
    label: 'تطوّع: عاون الصغار في الواجبات',
    minAge: 13,
    dialogue: [
      N('طاولة مليانة كراريس. طفل صغير ما فهمش القسمة. أمين عاود الشرح بالحلوى: "عندك عشرة، وثلاثة صحاب..."'),
      N('كي فهم، الطفل ضحك. وأمين حتى هو فهم حاجة: كي تشرح، تتعلّم مرتين.'),
      fx({ confidence: 2, grades: 1, parents: 1 }, { set: ['volunteer_spirit'] }),
      pass(60),
    ],
  },
  {
    id: 'vol_plant',
    target: 'garden_plot',
    label: 'تطوّع: اغرس شجرة في حملة التشجير',
    dialogue: [
      N('حفرة، شتلة زيتون صغيرة، وبيدون ما. المنشّط قال: "هاذي تكبر وأنت تكبر."'),
      N('أمين كتب اسمو على لوحة صغيرة وحطها حدا الشجرة.'),
      fx({ health: 1, confidence: 2 }, { set: ['volunteer_spirit', 'planted_tree'] }),
      pass(45),
    ],
  },
  {
    id: 'vol_baskets',
    target: 'food_baskets',
    label: 'تطوّع: حضّر قفف للعائلات المحتاجة',
    dialogue: [
      N('سميد، زيت، سكر، عدس، حليب. قفة ورا قفة. الأسماء ما تتقالش: الكرامة قبل كلش.'),
      N('خمسين قفة. وكل وحدة فيها دار كاملة.'),
      fx({ parents: 2, confidence: 2, honesty: 1 }, { set: ['volunteer_spirit'] }),
      pass(60),
    ],
  },
  {
    id: 'vol_clean',
    target: 'clean_kit',
    label: 'تطوّع: حملة تنظيف الحومة',
    dialogue: [
      N('جيلي أخضر، ڨانطوات، وشكاير. الفريق نظّف الزنقة والساحة. الناس خرجو من الديار يعاونو.'),
      N('شيباني جاب الشاي للكل: "ياخي بيكم يا الشباب."'),
      fx({ health: 1, confidence: 2, parents: 1 }, { set: ['volunteer_spirit'] }),
      pass(60),
    ],
  },
  {
    id: 'youth_pingpong',
    target: 'pingpong',
    label: 'العب البينغ بونغ في دار الشباب',
    repeatable: true,
    dialogue: [N('تك، تك، تك. الكورة الصغيرة تجري، والضحك يجري معاها.'), fx({ health: 1 }), pass(20)],
  },
  {
    id: 'study',
    target: 'desk',
    label: 'اقرا ساعة',
    dialogue: [N('ساعة مراجعة. الدروس تولّي أوضح شوية.'), fx({ grades: 2, confidence: 1 }), pass(60)],
  },
  {
    id: 'piggy',
    target: 'piggy',
    label: 'الحصالة',
    repeatable: true,
    dialogue: [
      N('الحصالة تاعك. الادخار يحمي من الأيام الصعيبة.'),
      choose(
        'piggy_action',
        opt('حط نص دراهمك في الحصالة', 'good', { if: 'money>=20', then: [N('الدراهم في الأمان.')] }),
        opt('خرّج مية دينار', 'neutral', { if: 'savings>=100', fx: { savings: -100, money: 100 } }),
        opt('سكّر الحصالة', 'neutral'),
      ),
    ],
  },
  {
    id: 'shop',
    target: 'counter',
    label: 'اشري من الحانوت',
    dialogue: [
      say('salah', 'واش تحب يا وليدي؟'),
      choose(
        'shop_buy',
        opt('خبزة وحليب للدار — 45 دج', 'good', { if: 'money>=45', fx: { money: -45, parents: 2 } }),
        opt('عصير — 50 دج', 'neutral', { if: 'money>=50', fx: { money: -50, health: 1 } }),
        opt('كراس جديد — 80 دج', 'good', { if: 'money>=80', fx: { money: -80, grades: 1 } }),
        opt('حلوى وشيبس — 30 دج', 'neutral', { if: 'money>=30', fx: { money: -30, confidence: 1 } }),
        opt('والو، شكرا', 'neutral'),
      ),
    ],
  },
  {
    id: 'boxes_job',
    target: 'boxes',
    label: 'عاون عمي صالح في السلعة',
    maxAge: 15,
    dialogue: [
      say('salah', 'السلعة جات. تعاوني نرفدوها للداخل؟'),
      N('ساعة تحمل الكراطن.'),
      fx({ money: 60, confidence: 1, health: -1 }),
      say('salah', 'هاك حقّك. حلال عليك.'),
      pass(60),
    ],
  },
  {
    id: 'workshop_job',
    target: 'workbench',
    label: 'خدمة في الورشة',
    minAge: 15,
    dialogue: [
      say('bachir', 'كاين خدمة صغيرة: نصقلو هاذ الطابلة.'),
      N('ثلاث ساعات تخدم بيديك.'),
      fx({ money: 400, confidence: 2, health: -1 }),
      pass(180),
    ],
  },
  {
    id: 'help_mama',
    target: 'mama',
    label: 'عاون ماما',
    dialogue: [M('تعاوني نغسلو المواعن؟'), A('هاني يا ماما.'), fx({ parents: 2 }), pass(20)],
  },
  {
    id: 'play_selma',
    target: 'selma',
    label: 'العب مع سلمى',
    dialogue: [say('selma', 'نلعبو الغميضة!'), N('سلمى تضحك. الدار تضحك معاها.'), fx({ parents: 1, confidence: 1 }), pass(20)],
  },
  {
    id: 'rest',
    target: 'fountain',
    label: 'ارتاح حدا الفوارة',
    dialogue: [N('صوت الما، الشيوخ يلعبو الدومينو، الحمام يطير.'), fx({ health: 1 }), pass(20)],
  },
  {
    id: 'gift',
    target: 'stall',
    label: 'اشري هدية لماما',
    minAge: 13,
    dialogue: [
      N('الطبلة فيها مناديل، عطر، أواني.'),
      choose(
        'gift_buy',
        opt('منديل لماما — 300 دج', 'good', { if: 'money>=300', fx: { money: -300, parents: 4 } }),
        opt('ما نشري والو', 'neutral'),
      ),
    ],
  },
  {
    id: 'mosque',
    target: 'prayer_row',
    label: 'اقعد في الجامع شوية',
    dialogue: [N('السكينة. الحصير البارد، وصوت القرآن الخفيف.'), fx({ confidence: 1, health: 1 }), pass(20)],
  },
  {
    id: 'tv',
    target: 'tv',
    label: 'شوف التلفزيون',
    dialogue: [N('ماتش، أخبار، مسلسل. الوقت يفوت.'), fx({ confidence: 1 }), pass(40)],
  },
];

/** Deposit half of pocket money: computed at runtime (not expressible as a static effect). */
export const PIGGY_DEPOSIT_CHOICE = 0;
