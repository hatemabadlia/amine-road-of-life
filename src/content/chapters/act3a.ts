// ACT III — Chapters 46–57: young adulthood, ages 16–17.
import type { Chapter } from '../../types/game';
import { A, B, M, MO, N, choose, fx, goto, opt, pass, say, talk, act, when } from './dsl';

const SA = (t: string, extra?: Parameters<typeof say>[2]) => say('samia', t, extra);
const BA = (t: string, extra?: Parameters<typeof say>[2]) => say('bachir', t, extra);
const MU = (t: string, extra?: Parameters<typeof say>[2]) => say('mustapha', t, extra);
const NA = (t: string, extra?: Parameters<typeof say>[2]) => say('nadia', t, extra);

const ch46: Chapter = {
  id: 46,
  act: 3,
  title: 'ستة عشر سنة',
  mission: 'عيد الميلاد',
  age: 16,
  summary: 'ستة عشر سنة. مفتاح الدار، وحرية جديدة، ومسؤولية جديدة.',
  start: { spot: 'home_bedroom', time: '09:00' },
  opening: [N('ستة عشر سنة. الوجه في المراية فيه شوية لحية. والعينين فيهم سنين.')],
  objectives: [
    talk('mama', 'ماما في الكوزينة', 'mama', [
      M('عيد ميلاد سعيد يا وليدي! درتلك المحاجب اللي تحبهم.'),
      say('selma', 'وأنا رسمتلك! هاذا أنت تلعب الكورة!'),
      fx({ parents: 4, health: 2 }),
    ]),
    talk('baba', 'بابا', 'baba', [
      B('هاك. مفتاح الدار. عندك ستة عشر سنة. ولّيت تدخل وتخرج كي الرجال.'),
      when('trust<35', [B('...نعطيهولك، ولو الثقة مازال تتبنى. هاذا المفتاح هو الثقة. ما تضيّعوش.')]),
      B('وهاك ألفين دينار هدية.', { fx: { money: 2000 } }),
      choose(
        'birthday_money',
        opt('ألف للحصالة، وألف نعزم بيها صحابي.', 'good', { if: 'money>=1000', fx: { money: -1000, savings: 1000 }, set: ['saver'] }),
        opt('نشري بيهم سبّاط جديد.', 'neutral', { fx: { money: -1800, confidence: 3 } }),
        opt('نخلّيهم للحاجة.', 'good', {}),
      ),
    ]),
    goto('square', 'روح للساحة مع صحابك', 'square'),
    talk('walid', 'وليد', 'walid', [
      say('walid', 'ستة عشر! كبرنا يا خو. تفكّر كي كنا نلعبو في الشارع بكورة مقطوعة؟'),
      when('mourad_first_session', [say('walid', 'ومراد بعثلك ميساج من المركز: "عيد سعيد يا خو. نخرج قريب."'), fx({ mourad: 3 })]),
      choose('birthday_plan', opt('نعزمكم على كاسكروط عند عمي صالح!', 'good', { if: 'money>=300', fx: { money: -300, confidence: 4 } }), opt('نتمشاو برك.', 'neutral', {})),
    ]),
  ],
  closing: [N('المفتاح في الجيب. خفيف. بصح أمين يحس بيه ثقيل، كيما الثقة.')],
};

const ch47: Chapter = {
  id: 47,
  act: 3,
  title: 'قرار الدراسة',
  mission: 'واش نقرا؟',
  age: 16,
  summary: 'الثانوية، التكوين المهني، الورشة، ولا تجارة صغيرة؟ القرار تاع أمين.',
  start: { spot: 'home_living', time: '17:00' },
  cast: { mustapha: 'training_center', bachir: 'workshop' },
  opening: [N('الصيف قرّب يكمل. لازم يختار.')],
  objectives: [
    goto('training', 'زور مركز التكوين المهني', 'training_center'),
    talk('mustapha', 'سي مصطفى', 'mustapha', [
      MU('مرحبا. كهرباء، تلحيم، تبريد وتكييف، إعلام آلي. شهادة دولة في سنتين.'),
      MU('بزاف يقولو التكوين للي فشل. أنا نقولك: البلاد تحتاج يدين يعرفو يخدمو.'),
    ]),
    goto('workshop', 'زور ورشة عمي بشير', 'workshop'),
    talk('bachir', 'عمي بشير', 'bachir', [
      when('bachir_impressed', [BA('أمين! الورشة تحتاج متعلّم. نعلّمك الصنعة كاملة، إذا تحب.')], [BA('تحب تتعلّم؟ الصنعة تحتاج صبر. ماشي كل واحد يصبر.')]),
    ]),
    goto('home', 'ارجع للدار', 'home_living'),
    talk('decide', 'القرار — هدّر مع بابا', 'baba', [
      B('خمّمت؟'),
      when('bem_failed', [B('الثانوية ما دخلتهاش. تقدر تعاود العام، ولا تختار طريق آخر.')]),
      choose(
        'path',
        opt('الثانوية، شعبة العلوم. نحب الجامعة.', 'good', {
          if: 'bem_passed',
          set: ['path_study'],
          fx: { confidence: 4 },
          then: [B('الجامعة! أول واحد في العائلة. ربي يوفّقك.'), fx({ parents: 5 })],
        }),
        opt('نعاود العام ونحاول الشهادة مرة أخرى.', 'good', {
          if: 'bem_failed',
          set: ['path_study', 'repeated_year'],
          fx: { confidence: 2 },
          then: [B('الرجوع ماشي عيب. العيب الوقوف.')],
        }),
        opt('التكوين المهني. نحب نتعلّم صنعة بشهادة.', 'good', {
          set: ['path_vocational'],
          then: [B('صنعة في اليد، أمان. واخا.')],
        }),
        opt('نخدم مع عمي بشير ونتعلّم الصنعة.', 'good', {
          set: ['path_craft'],
          then: [B('بشير راجل نظيف. تعلّم منو، ماشي غير الصنعة.')],
        }),
        opt('نبدا تجارة صغيرة في السوق.', 'neutral', {
          set: ['path_business'],
          then: [B('التجارة شطارة. وتحتاج راس مال، وصبر، وحساب. عندك؟')],
        }),
        opt('ما نعرفش يا بابا...', 'neutral', {
          set: ['path_undecided'],
          fx: { confidence: -3 },
          then: [B('ما تعرفش؟ ...الوقت ما يستنّاش. بصح ما نقدرش نختار في بلاصتك.')],
        }),
      ),
    ]),
  ],
  closing: [
    when('path_study', [N('الكتب الجداد عندهم ريحة. ريحة البداية.')]),
    when('path_vocational', [N('ملف التسجيل في التكوين. صورة، شهادة ميلاد، وقرار.')]),
    when('path_craft', [N('عمي بشير عطاه طابلية الخدمة. "هاذي تاعك دروك."')]),
    when('path_business', [N('أمين حسب الدراهم اللي عندو. الحساب ماشي ساهل.')]),
    when('path_undecided', [N('كامل صحابو اختارو. وأمين مازال في القاطعة.')]),
  ],
};

const ch48: Chapter = {
  id: 48,
  act: 3,
  title: 'صحاب الأمس',
  mission: 'سفيان رجع',
  age: 16,
  summary: 'سفيان وكمال رجعو للحومة. بطوموبيل جديدة، وعرض جديد.',
  start: { spot: 'crossroads', time: '19:00' },
  cast: { sofiane: 'crossroads', kamel: 'stairs' },
  opening: [N('طوموبيل سودا، الموزيكا عالية. سفيان يطل من الطاقة.')],
  objectives: [
    talk('sofiane', 'سفيان', 'sofiane', [
      say('sofiane', 'أمين! الشاطر! ولّيت تقرا وتخدم؟ ههه. شوف واش عندي أنا.'),
      say('sofiane', 'سهرة الليلة في الطرف الآخر من المدينة. البنات، الموزيكا، وكلش مخلّص.'),
      choose(
        'old_friends',
        opt('لا. غدوة عندي خدمة.', 'refuse', { set: ['refused_old_friends'], fx: { confidence: 5 } }),
        opt('ساعة برك.', 'bad', {
          set: ['partied_48'],
          fx: { risk: 8, health: -4, money: -200 },
          then: [pass(300), N('الساعة ولات خمسة. والسهرة كانت فيها حوايج أمين ما حبّش يشوفهم.')],
        }),
      ),
    ]),
    talk('kamel', 'كمال تحت الدروج', 'kamel', [
      say('kamel', 'أمين. كبرت. وعندك وجه نظيف، الشرطة ما تشكّش فيك.'),
      say('kamel', 'نحتاج واحد يخدم معايا. عشرين ألف في الشهر.'),
      choose(
        'kamel_job',
        opt('ماشي ليا. وما تعاودش تعرض.', 'refuse', { set: ['refused_kamel_job'], fx: { confidence: 6, risk: -4 } }),
        opt('نخمّم.', 'bad', { set: ['considering_kamel'], fx: { risk: 6 } }),
      ),
      when('amine_sought_help', [N('أمين تفكّر الدكتورة سامية: "الناس اللي كانو في الطريق القديم، يرجعو. حضّر الجواب قبل ما يجيو."')]),
    ]),
    goto('home', 'ارجع للدار', 'home_bedroom'),
    act('night', 'الفراش — الليل', 'bed', [
      when('considering_kamel', [
        N('عشرين ألف في الشهر. أمين يحسب. ومن بعد يتفكّر الكيس الصغير تحت الدروج، كي كان عندو عشر سنين.'),
        choose(
          'kamel_night',
          opt('غدوة نقولو لا. نهائيا.', 'good', { unset: ['considering_kamel'], set: ['refused_kamel_job'], fx: { risk: -6, confidence: 4 } }),
          opt('نشوف واش يعرض بالضبط.', 'bad', { fx: { risk: 4 } }),
        ),
      ], [N('أمين رقد بكري. غدوة خدمة.')]),
    ]),
  ],
  closing: [
    when('refused_old_friends & refused_kamel_job', [N('صحاب الأمس رجعو. بصح أمين ماشي تاع الأمس.')]),
    when('partied_48 | considering_kamel', [N('الطريق القديم ما يسكّرش وحدو. لازم تسكّرو أنت.')]),
  ],
};

const ch49: Chapter = {
  id: 49,
  act: 3,
  title: 'الفلوس والخدمة',
  mission: 'الميزانية',
  age: 16,
  summary: 'دخل صغير، مصاريف كثيرة. أمين يتعلّم يسيّر دراهمو.',
  start: { spot: 'workshop', time: '17:00' },
  cast: { bachir: 'workshop', salah: 'hanout' },
  opening: [N('الويكاند: خدمة. الأيام: قراية ولا تكوين. والدراهم... لازم تتحسب.')],
  objectives: [
    act('work', 'اخدم في الورشة — خدمة الويكاند', 'workbench', [
      BA('هاذ الشهر كاين كوموند كبيرة: أبواب لعمارة جديدة.'),
      choose(
        'weekend_work',
        opt('نخدم كل ويكاند.', 'good', { set: ['weekend_worker'], fx: { money: 6000, health: -2 }, then: [pass(480)] }),
        opt('ويكاند واحد برك.', 'neutral', { fx: { money: 2000 }, then: [pass(240)] }),
      ),
    ]),
    goto('hanout', 'روح لعمي صالح', 'hanout'),
    talk('salah', 'عمي صالح — درس في الحساب', 'salah', [
      say('salah', 'أمين، أربعين سنة وأنا نبيع. تعرف السر؟ الدينار اللي ما تصرفوش، هو الدينار اللي ربحتو بالصح.'),
      say('salah', 'قسّم: الثلث للدار، الثلث للحصالة، الثلث ليك.'),
      choose(
        'budget_plan',
        opt('نطبّق الثلث والثلث.', 'good', {
          if: 'money>=3000',
          set: ['saved_well'],
          fx: { money: -2000, savings: 1000, parents: 6, trust: 4 },
          then: [N('ألف للدار، ألف للحصالة. ماما حطّت الدراهم في الكوزينة وما قالت والو. بصح العينين قالو.')],
        }),
        opt('نحفظ كلش في الحصالة.', 'good', {
          if: 'money>=2000',
          set: ['saved_well'],
          fx: { money: -2000, savings: 2000 },
        }),
        opt('نصرف كي نحتاج.', 'neutral', { fx: { money: -800, confidence: 2 } }),
      ),
      when('smoking_habit', [say('salah', 'وهاذ الدخان اللي تشري مني كل نهار... حسبتو؟ خمسة آلاف في الشهر. خمسة آلاف تحرقهم.'), choose('quit_smoking', opt('عندك الحق. نحبس.', 'good', { unset: ['smoking_habit'], set: ['quit_smoking'], fx: { health: 6, risk: -5 } }), opt('ما نقدرش.', 'neutral', { fx: { money: -500, health: -3 } }))]),
    ]),
    act('piggy', 'الحصالة', 'piggy', [
      N('أمين حسب الحصالة.'),
      when('savings>=3000', [N('أكثر من ثلاثة آلاف. أول مرة يحس بلي عندو "مستقبل" في علبة.'), fx({ confidence: 5 }, { set: ['saved_well'] })], [N('شوية. بصح أحسن من والو.')]),
    ]),
  ],
  closing: [when('saved_well', [N('الدراهم ما ولاوش عدو. ولاو أداة.')], [N('الدراهم تمشي كالما في اليد.')])],
};

const ch50: Chapter = {
  id: 50,
  act: 3,
  title: 'المشكل الكبير',
  mission: 'الماضي يدق الباب',
  age: 16,
  summary: 'الشرطة تحقق في شبكة كمال. واسم أمين يطلع.',
  start: { spot: 'home_living', time: '10:00' },
  cast: { kamel: 'stairs' },
  opening: [N('دق في الباب. جوج شرطة. "أمين؟ تجي معانا شوية للكوميسارية، شاهد برك."')],
  objectives: [
    talk('police', 'بابا مع الشرطة', 'baba', [
      B('أمين، الشرطة تحب تسقسيك على كمال. أنا معاك.'),
      when(
        'did_errand | considering_kamel',
        [
          N('المفتّش عندو صورة: أمين، عندو أحدعش سنة، يوصّل كيس للساحة. كاميرا تاع حانوت.'),
          choose(
            'police_truth',
            opt('إيه. كنت صغير ووصّلت حاجة مرة. ما كنتش نعرف واش فيها. ونقول كل واش نعرف.', 'honest', {
              set: ['testified', 'honest_police'],
              fx: { honesty: 12, trust: 6, risk: -8 },
              then: [say('narrator', 'المفتّش كتب كلش. "كنت قاصر، والصراحة تاعك تعاوننا. روح."'), B('...راني فخور بيك. حتى في هاذي.')],
            }),
            opt('ما نعرف والو.', 'lie', {
              set: ['lied_police'],
              fx: { honesty: -10, risk: 10, trust: -6 },
              then: [N('المفتّش شاف في أمين طويل. "نتلاقاو مرة أخرى."')],
            }),
          ),
        ],
        [
          N('المفتّش يسقسي على كمال، على الدروج، على الليالي.'),
          choose(
            'witness',
            opt('نقول واش شفت.', 'honest', { set: ['testified'], fx: { honesty: 6, risk: -3 } }),
            opt('ما شفت والو.', 'neutral', { fx: { honesty: -2 } }),
          ),
        ],
      ),
    ]),
    goto('stairs', 'العشية — الدروج فارغين', 'stairs'),
    act('empty', 'تحت الدروج', 'under_stairs', [
      N('البلاصة اللي كانت فيها الكيسان، فارغة. كمال تشد.'),
      when('mourad_recovering | mourad_first_session', [N('ومراد في المركز. لو كان مازال هنا...')], [N('ومراد؟ وين راه الليلة؟')]),
    ]),
  ],
  closing: [when('testified', [N('الماضي دق الباب. أمين فتحلو، وهدر معاه، وسكّرو.')], [N('الماضي ما يمشيش. يستنّى.')])],
};

const ch51: Chapter = {
  id: 51,
  act: 3,
  title: 'مساعدة بلا خوف',
  mission: 'الدكتورة سامية',
  age: 16,
  summary: 'كاين حوايج ما يحملهمش واحد وحدو.',
  start: { spot: 'home_door', time: '15:00' },
  cast: { samia: 'center' },
  opening: [N('الضغط: القراية، الخدمة، الشرطة، مراد. أمين ما رقدش مليح من سيمانات.')],
  objectives: [
    goto('center', 'روح لمركز الإصغاء', 'center'),
    talk('samia', 'الدكتورة سامية', 'samia', [
      SA('أمين. مرحبا. واش راك؟ بالصح.'),
      when(
        'amine_used & !amine_sought_help',
        [
          N('أمين سكت. ومن بعد، الكلام خرج.'),
          choose(
            'second_chance',
            opt('من نهار جرّبت، كل ما يضيق عليّا نفكّر نرجع. نحتاج عاون.', 'honest', {
              set: ['amine_sought_help'],
              fx: { honesty: 12, risk: -15, health: 6, confidence: 4 },
              then: [SA('هاذي شجاعة. نبداو اليوم. خطوة بخطوة.'), SA('والعائلة؟ نحضّرو مع بعض كيفاش تقولهم.')],
            }),
            opt('والو، الضغط تاع القراية برك.', 'neutral', { then: [SA('واخا. الباب مفتوح ديما.')] }),
          ),
        ],
        [
          A('الضغط. ومراد. ونحس بلي لازم نكون قوي للكل.'),
          SA('ماشي لازم تحمل الكل. حتى القوي يحتاج يرتاح.'),
          SA('نديرو تمارين للتنفس، ونقسمو المشاكل: واش في يدك، واش ماشي في يدك.'),
          fx({ health: 5, confidence: 5 }, { set: ['coping_skills'] }),
        ],
      ),
      when('amine_sought_help', [SA('شحال من نهار بلا ما ترجع؟'), A('ميتين وعشرين نهار.'), SA('ميتين وعشرين. احسبهم. كل واحد فيهم انتصار.'), fx({ confidence: 4 })]),
    ]),
    goto('home', 'ارجع للدار', 'home_living'),
    talk('mama', 'ماما', 'mama', [
      M('وين كنت؟'),
      choose(
        'tell_mama_center',
        opt('في مركز الإصغاء. نروح عند الدكتورة. ونحس روحي خير.', 'honest', {
          fx: { honesty: 5, parents: 6, trust: 4 },
          set: ['family_knows_help'],
          then: [M('...وأنا اللي كنت نحسب العيب نطلبو العاون. ربي يحفظك يا وليدي.')],
        }),
        opt('مع صحابي.', 'neutral', {}),
      ),
    ]),
  ],
  closing: [N('مساعدة بلا خوف. ماشي بلا خوف بالصح... مساعدة رغم الخوف.')],
};

const ch52: Chapter = {
  id: 52,
  act: 3,
  title: 'مراد في أزمة',
  mission: 'الليلة الطويلة',
  age: 16,
  summary: 'تيليفون في نص الليل. مراد في الزنقة، وما يجاوبش.',
  start: { spot: 'home_bedroom', time: '01:30' },
  cast: { mourad: 'alley', fatiha: 'home_door' },
  opening: [N('الواحدة والنص تاع الليل. ميساج من نمرة ما يعرفهاش: "صاحبك مراد في الزنقة. ما راهوش يتحرك."')],
  objectives: [
    goto('alley', 'أجري للزنقة!', 'alley'),
    talk('crisis', 'مراد طايح', 'mourad', [
      N('مراد طايح حدا الحيط. النفس ضعيف. الوجه أصفر.', { cam: 'high' }),
      choose(
        'emergency',
        opt('نعيّط للحماية المدنية 14 ونبقى معاه.', 'help', {
          set: ['called_help', 'mourad_saved'],
          fx: { confidence: 6, mourad: 10 },
          then: [N('"الحماية المدنية، نسمعوك." أمين قال العنوان، والحالة. قالولو كيفاش يحطّو على جنبو.'), N('ثمن دقايق. أطول ثمن دقايق في حياتو. الصفارة.', { cam: 'wide' })],
        }),
        opt('نجري نعيّط لخالتو فتيحة.', 'help', {
          set: ['called_fatiha_crisis', 'mourad_saved'],
          fx: { mourad: 6 },
          then: [N('فتيحة جات تجري. عيّطت للحماية. أمين ما قدرش يتنفس.')],
        }),
        opt('نهرب. إذا جات الشرطة يحسبوني معاه.', 'bad', {
          set: ['ran_from_crisis'],
          fx: { mourad: -20, honesty: -10, confidence: -8 },
          then: [N('أمين جرى. ومن البعيد، سمع واحد آخر يعيّط. الحماية جات.'), N('مراد عاش. بصح أمين ما عاشش هاذيك الليلة مرتاح.')],
        }),
      ),
    ], { moves: [{ npc: 'mourad', spot: 'center' }] }),
    talk('fatiha', 'خالتي فتيحة — الصباح', 'fatiha', [
      when('mourad_saved', [say('fatiha', 'الطبيب قال: عشر دقايق زايدين وكان... ربي يجازيك يا أمين.'), say('fatiha', 'مراد فاق. سقسا عليك.')], [say('fatiha', 'مراد في السبيطار. واحد ما نعرفوش عيّط للحماية. الحمد لله.')]),
    ], { skipTo: '09:00' }),
    goto('center', 'روح لمراد — راه نقلوه للمركز', 'center', { if: 'mourad_saved' }),
    talk(
      'mourad_after',
      'مراد',
      'mourad',
      [
        MO('...جيت.'),
        A('ديما نجي.'),
        MO('كنت نموت يا أمين. بالصح. ما نحبش نموت.', { cam: 'close' }),
        choose(
          'treatment',
          opt('إذن ابدا العلاج. بالجد هاذ المرة. وأنا معاك كل خطوة.', 'help', {
            if: 'mourad>=35 | offered_help_mourad | mourad_first_session',
            set: ['mourad_recovering'],
            fx: { mourad: 10 },
            then: [MO('...كل خطوة؟'), A('كل خطوة.'), say('samia', 'مراد، البرنامج يبدا الاثنين. وأمين يقدر يجي للجلسات العائلية إذا حبيت.')],
          }),
          opt('ربي يشفيك يا مراد.', 'neutral', { fx: { mourad: 2 }, then: [MO('...إيه.')] }),
        ),
      ],
      { if: 'mourad_saved' },
    ),
  ],
  closing: [
    when('mourad_recovering', [N('مراد قرّر. ماشي على خاطر أمين. على خاطرو هو. وأمين؟ كان حدّاه.')]),
    when('ran_from_crisis', [N('الخوف خلّى أمين يجري. والندم خلّاه يرجع كل ليلة لذيك الزنقة.')]),
  ],
};

const ch53: Chapter = {
  id: 53,
  act: 3,
  title: 'الثقة المكسورة',
  mission: 'نرمّم',
  age: 17,
  summary: 'الثقة ما ترجعش بكلمة. ترجع بالأفعال، نهار بنهار.',
  start: { spot: 'home_living', time: '17:00' },
  opening: [N('سبعطاش سنة. أمين قرّر: يرمّم الحيط اللي بينو وبين عائلتو. ياجورة بياجورة.')],
  objectives: [
    talk('baba', 'هدّر مع بابا بالصح', 'baba', [
      when('trust<50', [B('واش تحب يا أمين؟'), A('نحب نرجع كيما كنا. ونعرف بلي هاذ الشي يحتاج وقت.')], [B('واش كاين؟'), A('نحب نكون أقرب ليك يا بابا.')]),
      choose(
        'repair_talk',
        opt('ما نطلبش تسامحني اليوم. نطلب فرصة نوريك.', 'honest', { set: ['repair_started'], fx: { trust: 4, honesty: 4 } }),
        opt('خلاص، نسينا الماضي؟', 'neutral', { then: [B('النسيان ماشي سهل يا وليدي.')] }),
      ),
    ]),
    act('fix', 'صلّح الطابلة المكسورة في الكوزينة', 'kitchen_table', [
      N('الطابلة تاع الكوزينة تتحرك من عامين. بابا ديما يقول "غدوة نصلّحها".'),
      when('worked_bachir | path_craft', [N('أمين جاب الأدوات من الورشة. ساعة، وحدة جديدة.'), fx({ parents: 6, trust: 4 }, { set: ['fixed_table'] })], [
        N('أمين حاول. ما جاتش مليحة، بصح ما تتحركش.'),
        fx({ parents: 3, trust: 2 }, { set: ['fixed_table'] }),
      ]),
    ]),
    talk('mama', 'ماما', 'mama', [
      M('شكون صلّح الطابلة؟ ...أنت؟'),
      M('تعرف يا أمين، الأم ما تحتاجش كلام. تحتاج تشوف.'),
      choose(
        'mama_promise',
        opt('كل نهار، نرجع قبل العشا. ونقولك وين رايح.', 'good', { set: ['daily_honesty'], fx: { parents: 5, trust: 3 } }),
        opt('نحاول يا ماما.', 'neutral', { fx: { parents: 1 } }),
      ),
    ]),
    act('weeks', 'سيمانات تفوت — الفراش', 'bed', [
      N('سيمانة. جوج. شهر.'),
      when(
        'repair_started & daily_honesty & honesty>=50',
        [N('بابا ولى يسقسي على الخدمة. ماما ولات تضحك. سلمى تقول لصحاباتها "خويا".'), fx({ trust: 14, parents: 8 }, { set: ['rebuilt_trust'] })],
        [N('ساعات يرجع متأخر. ساعات ينسى. الثقة تطلع بالشوية، وتطيح بالخف.'), fx({ trust: 3 })],
      ),
    ]),
  ],
  closing: [when('rebuilt_trust', [N('بابا عطى أمين مفتاح الطوموبيل. ما قال والو. ما كانش لازم.')], [N('الحيط مازال. بصح فيه ياجورات جدد.')])],
};

const ch54: Chapter = {
  id: 54,
  act: 3,
  title: 'أول مسؤولية',
  mission: 'بابا تجرح',
  age: 17,
  summary: 'بابا طاح في الشانطي. شهرين في الدار. والعائلة تحتاج أمين.',
  start: { spot: 'home_living', time: '08:00' },
  allowance: false,
  cast: { baba: 'home_living' },
  opening: [N('بابا طاح من السقالة. الرجل مكسورة. الطبيب قال: شهرين بلا خدمة. والشهرية؟ نص.')],
  objectives: [
    talk('baba', 'بابا في الفراش', 'baba', [
      B('أمين... عمري ما حبيت نطلب منك هاذي. بصح الدار تحتاجك.'),
      choose(
        'responsibility',
        opt('ما تقلقش يا بابا. أنا هنا.', 'good', { set: ['stepped_up'], fx: { trust: 6, parents: 6, confidence: 4 } }),
        opt('وأنا؟ القراية تاعي؟', 'neutral', { fx: { parents: -3 }, then: [B('عندك الحق. القراية قبل كلش. نتدبّرو.')] }),
      ),
    ]),
    talk('selma', 'سلمى تحتاج توصيلة للمدرسة', 'selma', [
      say('selma', 'أمين، تدّيني للمدرسة؟ بابا ما يقدرش.'),
      when('stepped_up', [A('كل صباح، على السبعة ونص.'), fx({ parents: 3 })], [A('...اليوم برك.')]),
    ]),
    goto('workshop', 'روح للخدمة', 'workshop'),
    act('extra_work', 'خدمة زايدة للدار', 'workbench', [
      BA('سمعت على باباك. خوذ ساعات زايدين. وإذا احتجت سلفة، قولّي.'),
      choose(
        'extra_hours',
        opt('نخدم الويكاند والعشيات.', 'good', {
          set: ['supported_family'],
          fx: { money: 5000, health: -4, grades: -3 },
          then: [pass(360), N('أمين ما بقاش يرقد بزاف. بصح الدار ما خصها والو.')],
        }),
        opt('الويكاند برك، باش ما نخسرش القراية.', 'good', {
          set: ['supported_family', 'balanced'],
          fx: { money: 2500, health: -1 },
          then: [pass(240)],
        }),
      ),
    ]),
    goto('home', 'ارجع للدار', 'home_kitchen'),
    talk('mama', 'ماما', 'mama', [
      M('شحال جبت؟'),
      when('supported_family', [
        choose(
          'give_family',
          opt('هاكي كلش يا ماما.', 'good', { if: 'money>=2500', fx: { money: -2500, parents: 10, trust: 6 } }),
          opt('هاكي النص، والنص للحصالة.', 'good', { if: 'money>=2500', fx: { money: -2500, savings: 1200, parents: 6, trust: 4 } }),
          opt('نخلّي شوية ليا...', 'neutral', { if: 'money>=1000', fx: { money: -1000, parents: 3 } }),
          opt('ما بقاش عندي ما نعطي اليوم.', 'neutral', {}),
        ),
      ]),
      M('باباك قالي: "أمين ولّى راجل." وبكى. عمرو ما بكى قدامي.'),
    ]),
  ],
  closing: [N('شهرين. أمين تعلّم بلي المسؤولية ماشي كلمة. هي نوض في الصباح كي ما تحبش.')],
};

const ch55: Chapter = {
  id: 55,
  act: 3,
  title: 'إغراء الطريق الساهل',
  mission: 'الطريق القصير',
  age: 17,
  summary: 'دراهم كثيرة بسرعة. ولا أسئلة الامتحان قبل الوقت. الطريق الساهل يعيّط.',
  start: { spot: 'square', time: '18:00' },
  cast: { sofiane: 'square', kamel: 'souk' },
  opening: [N('الحاجة كبيرة. والطريق الساهل قدامك، يضحك.')],
  objectives: [
    talk('offer', 'سفيان', 'sofiane', [
      when(
        'path_study',
        [
          say('sofiane', 'أمين، عندي الأسئلة تاع امتحان البكالوريا التجريبي. وحتى الحقيقي، يقولو يطيحو قبل نهار. عشرة آلاف.'),
          choose(
            'cheat',
            opt('لا. نحب ننجح بصح، ولا ما ننجحش.', 'refuse', { set: ['refused_shortcut'], fx: { confidence: 6, honesty: 5 } }),
            opt('هات.', 'bad', { if: 'money>=1000', set: ['took_shortcut', 'cheated'], fx: { money: -100000, honesty: -12, risk: 8 } }),
          ),
        ],
        [
          say('sofiane', 'كمال يحتاج سايق يوصّل "سلعة" لقسنطينة. خمسين ألف في رحلة وحدة. عندك البيرمي؟'),
          choose(
            'smuggle',
            opt('لا. ولا بمليون.', 'refuse', { set: ['refused_shortcut'], fx: { confidence: 6, risk: -5 } }),
            opt('مرة وحدة، والدار تحتاج.', 'bad', {
              set: ['took_shortcut', 'smuggled'],
              fx: { money: 50000, risk: 25, honesty: -15, health: -4 },
              then: [N('الطريق طويل. كل باراج، القلب يحبس. خمسين ألف. ولا حتى دينار يحس بيه حلال.')],
            }),
          ),
        ],
      ),
    ]),
    act('think', 'الفوارة — خمّم', 'fountain', [
      when('took_shortcut', [N('الدراهم في الجيب. والخوف حتى هو.'), choose('undo', opt('نرجّع واش خذيت ونقول لبابا.', 'honest', { unset: ['took_shortcut'], set: ['undid_shortcut'], fx: { money: -100000, honesty: 12, trust: 4, risk: -10 }, then: [N('أمين رجّع. وحكى لبابا. بابا ما زعفش. قال: "رجعت من الطريق قبل ما يبلعك."')] }), opt('خلاص، فات.', 'neutral', {}))]),
      when('refused_shortcut', [N('الفوارة تجري. أمين يحس بخفة. الطريق الطويل طويل، بصح نظيف.')]),
    ]),
    goto('home', 'ارجع للدار', 'home_living'),
    talk('baba', 'بابا', 'baba', [
      B('شفتك مع سفيان في الساحة.'),
      choose(
        'baba_shortcut',
        opt('عرض عليا حاجة. وقلتلو لا.', 'honest', { if: 'refused_shortcut', fx: { trust: 5, honesty: 3 }, then: [B('الطريق الساهل يعيّط على الناس كامل. قليل اللي ما يجاوبش.')] }),
        opt('حكيتلك واش صرا. ورجّعت.', 'honest', { if: 'undid_shortcut', fx: { trust: 3 } }),
        opt('والو، سلام برك.', 'neutral', { then: [when('took_shortcut', [N('الكذبة الجديدة خفيفة. بصح فوق كومة قديمة.'), fx({ honesty: -4 })])] }),
      ),
    ]),
  ],
  closing: [when('took_shortcut', [N('الطريق الساهل ساهل في البداية برك.')], [N('الإغراء فات. وأمين واقف.')])],
};

const ch56: Chapter = {
  id: 56,
  act: 3,
  title: 'اختبار الصداقة',
  mission: 'مراد يطلب',
  age: 17,
  summary: 'مراد يطلب دراهم. العاون الحقيقي ماشي ديما "إيه".',
  start: { spot: 'home_door', time: '18:00' },
  cast: { mourad: 'crossroads', samia: 'center' },
  opening: [N('مراد في القاطعة. يبان متوتر.')],
  objectives: [
    talk('ask', 'مراد', 'mourad', [
      when(
        'mourad_recovering',
        [
          MO('أمين... عندي دين قديم مع واحد. يحب خمسة آلاف. إذا ما خلّصتش...'),
          N('مراد ما يشوفش في العينين. أمين يعرف هاذ النظرة.'),
          choose(
            'enable',
            opt('هاك. ما نحبش يصرالك والو.', 'bad', {
              if: 'money>=1000',
              unset: ['mourad_recovering'],
              set: ['mourad_relapsed'],
              fx: { money: -100000, mourad: 4 },
              then: [N('الدراهم ما مشاتش لحتى دين. أمين عرف هاذ الشي من بعد بسيمانة، كي مراد ما جاش للجلسة.')],
            }),
            opt('ما نعطيكش دراهم. بصح نروحو دروك لسامية مع بعض، ونشوفو الدين مع خالتك.', 'help', {
              set: ['tough_love'],
              fx: { mourad: -2, confidence: 4 },
              then: [MO('...تعرفني مليح.'), A('نعرفك. ونحبك. لهذا لا.'), MO('...يالله. للمركز.')],
            }),
          ),
        ],
        [
          MO('أمين. نحتاج دراهم. عافاك.'),
          choose(
            'last_chance',
            opt('دراهم لا. بصح إذا تحب تبدا العلاج، نكون معاك من الصباح.', 'help', {
              if: 'mourad>=40 & !ran_from_crisis',
              set: ['mourad_recovering', 'late_recovery_mourad'],
              fx: { mourad: 6 },
              then: [MO('...تعبت يا أمين. تعبت. إيه. غدوة.'), N('وغدوة، مراد جا. على التسعة. عند باب المركز.')],
            }),
            opt('هاك.', 'bad', { if: 'money>=500', fx: { money: -500, mourad: 3 }, set: ['enabled_mourad'] }),
            opt('لا يا مراد.', 'neutral', { fx: { mourad: -5 } }),
          ),
        ],
      ),
    ]),
    goto('center', 'روح للمركز', 'center', { if: 'tough_love | late_recovery_mourad' }),
    talk('samia', 'الدكتورة سامية', 'samia', [
      say('samia', 'أمين، درت الصح. "لا" ساعات هي أحسن "نحبك".'),
      say('samia', 'والعاون ماشي إنقاذ. أنت ماشي مسؤول على شفاء مراد. مسؤول على صدقك معاه.'),
      fx({ confidence: 4, mourad: 4 }),
    ], { if: 'tough_love | late_recovery_mourad' }),
  ],
  closing: [
    when('mourad_relapsed', [N('أمين حب يعاون، وعاون المرض. هاذي أصعب درس في الصحبة.')]),
    when('tough_love | late_recovery_mourad', [N('"لا" اللي تحمي، أصعب من "إيه" اللي تقتل.')]),
  ],
};

const ch57: Chapter = {
  id: 57,
  act: 3,
  title: 'نهار بلا هروب',
  mission: 'نواجه',
  age: 17,
  summary: 'نهار واحد، بلا هروب من حتى مشكل.',
  start: { spot: 'home_bedroom', time: '07:00' },
  cast: { nadia: 'lycee_class', mustapha: 'training_center', bachir: 'workshop' },
  opening: [N('أمين كتب في ورقة: "اليوم، ما نهربش." وحطّها على المرايا.')],
  objectives: [
    act('list', 'اكتب واش لازم تواجه', 'desk', [
      N('القائمة: '),
      when('path_study', [N('١. الأستاذة نادية: النقطة الضعيفة في الفيزياء.')]),
      when('path_vocational', [N('١. سي مصطفى: الغيابات في التطبيق.')]),
      when('path_craft', [N('١. عمي بشير: الباب اللي خسرتو الشهر الفارط.')]),
      when('path_business | path_undecided', [N('١. الحساب: الدراهم ما يكفيوش والمشروع ما بداش.')]),
      when('took_shortcut', [N('٢. الدراهم تاع قسنطينة.')]),
      when('trust<45', [N('٣. بابا.')]),
    ]),
    talk(
      'face_study',
      'الأستاذة نادية',
      'nadia',
      [
        NA('أمين؟ جيت وحدك تسقسي على الفيزياء؟ هاذي أول مرة.'),
        choose('face1', opt('نحتاج نفهم، ماشي غير ننجح.', 'good', { fx: { grades: 8, confidence: 4 }, set: ['faced_problem'] }), opt('غير نسقسي على الامتحان.', 'neutral', { fx: { grades: 2 } })),
      ],
      { if: 'path_study' },
    ),
    talk(
      'face_voc',
      'سي مصطفى في مركز التكوين',
      'mustapha',
      [
        MU('أمين، الغيابات تاعك في الورشات التطبيقية... ثلاثة زايدين وتتقصى.'),
        choose('face2', opt('ما تزيدش. ونعوّض واش فاتني السبت.', 'good', { fx: { attendance: 10 }, set: ['faced_problem', 'training_commit'] }), opt('نحاول.', 'neutral', {})),
      ],
      { if: 'path_vocational' },
    ),
    talk(
      'face_craft',
      'عمي بشير',
      'bachir',
      [
        BA('الباب اللي خسرتو، الزبون رجّعو.'),
        choose('face3', opt('غلطتي. نعاودو بدراهمي ونتعلّم.', 'good', { fx: { money: -1500, confidence: 5 }, set: ['faced_problem', 'craft_commit'] }), opt('الخشب كان مايل.', 'neutral', { fx: { honesty: -3 } })),
      ],
      { if: 'path_craft' },
    ),
    act(
      'face_money',
      'الحصالة — احسب بالصح',
      'piggy',
      [
        N('الأرقام ما يكذبوش.'),
        choose(
          'face4',
          opt('ندير خطة: كل شهر نحفظ ثلث، وندرس السوق قبل ما نبدا.', 'good', { set: ['faced_problem', 'business_plan'], fx: { confidence: 4 } }),
          opt('نبدا بلا خطة، ونشوفو.', 'neutral', {}),
        ),
      ],
      { if: 'path_business | path_undecided' },
    ),
    talk(
      'face_father',
      'بابا',
      'baba',
      [
        A('بابا. ما نحبش نهرب منك أكثر.'),
        B('...وأنا ما نحبش نهرب منك. اقعد.'),
        fx({ trust: 8, parents: 6 }, { set: ['faced_father'] }),
      ],
      { if: 'trust<45' },
    ),
  ],
  closing: [when('faced_problem', [N('نهار بلا هروب. التعب كبير، بصح الراس خفيف.')], [N('النهار فات. وبعض المشاكل مازالو يستنّاو.')])],
};

export const ACT3A: Chapter[] = [ch46, ch47, ch48, ch49, ch50, ch51, ch52, ch53, ch54, ch55, ch56, ch57];
