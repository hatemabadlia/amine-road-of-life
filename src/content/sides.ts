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
    target: 'mosque_door',
    label: 'ادخل للجامع شوية',
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
