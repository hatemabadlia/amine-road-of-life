// ACT II — Chapters 23–34: adolescence, ages 13–14.
import type { Chapter } from '../../types/game';
import { A, B, M, MO, N, choose, fx, goto, opt, pass, say, talk, act, when } from './dsl';

const SO = (t: string, extra?: Parameters<typeof say>[2]) => say('sofiane', t, extra);
const IM = (t: string, extra?: Parameters<typeof say>[2]) => say('imene', t, extra);
const NA = (t: string, extra?: Parameters<typeof say>[2]) => say('nadia', t, extra);

const ch23: Chapter = {
  id: 23,
  act: 2,
  title: 'ثانوية جديدة',
  mission: 'أول نهار في الإكمالية',
  age: 13,
  summary: 'إكمالية الأمير عبد القادر. أساتذة جداد، وجوه جديدة، وأمين لازم يلقى بلاصتو.',
  start: { spot: 'home_door', time: '07:15' },
  cast: { mourad: 'lycee_courtyard', walid: 'lycee_courtyard' },
  opening: [
    N('ثلاثطاش سنة. الصوت بدا يتبدّل، والمرايا ولات صديق وعدو في نفس الوقت.'),
    M('أمين! أول نهار، ما تبطاش!'),
  ],
  objectives: [
    goto('to_school', 'روح للإكمالية — الطريق للغرب', 'lycee_gate', {
      deadline: '08:00',
      onLate: { set: ['late_ch23'], fx: { attendance: -3 }, note: 'أول نهار وتأخرت!' },
    }),
    talk('courtyard', 'الساحة — شوف شكون تعرف', 'walid', [
      say('walid', 'أمين! نفس القسم! الثالثة متوسط اثنين.'),
      when('mourad>=40', [MO('وأنا حتى! الثلاثة كيما زمان.')], [N('مراد في قسم آخر. سلّم من بعيد.')]),
      SO('هيه، أنتوما الجداد. هنا الساحة عندها قوانين.'),
      N('سفيان. أطول واحد في الساحة، ودايرين بيه خمسة.'),
    ]),
    act('seat', 'القسم — اختار بلاصتك', 'lycee_desk', [
      NA('صباح الخير. أنا الأستاذة نادية، رياضيات. اختارو بلايصكم بالعقل.'),
      N('القدّام: إيمان، الأولى في القسم الفارط. اللور: سفيان وجماعتو يضحكو.'),
      choose(
        'seat_choice',
        opt('القدّام، حدا وليد وإيمان.', 'good', {
          set: ['front_seat'],
          fx: { grades: 3 },
          then: [IM('مرحبا. عندك كراس منظّم؟ نتبادلو الدروس.'), fx({}, { set: ['knows_imene'] })],
        }),
        opt('اللور، حدا سفيان.', 'bad', {
          set: ['back_seat'],
          fx: { risk: 3, confidence: 2 },
          then: [SO('عقلية! الشاطر جا يقعد مع الرجال.')],
        }),
        opt('الوسط، بعيد على كلش.', 'neutral', {}),
      ),
      NA('أول تمرين: حلّو المعادلة. ثلاثة إكس زايد أربعة يساوي ستطاش.'),
      choose(
        'first_eq',
        opt('إكس يساوي أربعة!', 'good', { fx: { grades: 3, confidence: 4 }, then: [NA('برافو. اسمك؟ أمين. نتفكّرك.')] }),
        opt('نسكت.', 'neutral', {}),
      ),
    ], { time: 300 }),
    goto('home', 'ارجع للدار', 'home_kitchen'),
    talk('mama', 'احكي لماما', 'mama', [
      M('كيفاش كانت الإكمالية؟'),
      when('front_seat', [A('قعدت القدّام. الأستاذة تاع الرياضيات مليحة.'), M('ربي يوفقك.', { fx: { parents: 3 } })]),
      when('back_seat', [A('عادي...'), N('أمين ما قالش على سفيان.')]),
    ]),
  ],
  closing: [N('مؤسسة جديدة. نفس أمين... ولا لا؟')],
};

const ch24: Chapter = {
  id: 24,
  act: 2,
  title: 'الشلة الجديدة',
  mission: 'الدخول للشلة',
  age: 13,
  summary: 'سفيان يعرض على أمين يدخل للشلة. بصح للدخول ثمن.',
  start: { spot: 'lycee_courtyard', time: '12:00' },
  cast: { sofiane: 'lycee_courtyard', walid: 'football' },
  opening: [N('الشلة تاع سفيان: يلبسو كيف كيف، يضحكو كيف كيف، وحتى واحد ما يقولّهم لا.')],
  objectives: [
    talk('offer', 'سفيان يعيّطلك', 'sofiane', [
      SO('أمين. شفتك. عندك ستيل. تحب تكون معانا؟'),
      SO('بصح كاين اختبار. الأستاذة نادية تخلّي محفظتها في القسم. جيبلنا الأسئلة تاع الفرض.'),
      choose(
        'crew_test',
        opt('لا. هاذي سرقة.', 'refuse', {
          set: ['refused_crew'],
          fx: { confidence: 5, risk: -2 },
          then: [SO('ههه، روح العب مع الصغار.'), N('الشلة ضحكت. أمين مشى. ظهرو مستقيم.')],
        }),
        opt('نجيبهم.', 'bad', {
          set: ['joined_crew', 'stole_exam'],
          fx: { risk: 10, honesty: -10, confidence: 3 },
          then: [N('المحفظة مفتوحة. الورقة في الجيب. القلب يضرب.'), SO('هاذا هو! مرحبا في الشلة.')],
        }),
        opt('ندخل للشلة، بصح ما نسرقش.', 'neutral', {
          set: ['crew_friend'],
          fx: { risk: 3 },
          then: [SO('...تحب تكون معانا بلا ما تخلّص؟ نشوفو. بقى على الجنب.')],
        }),
      ),
    ]),
    goto('field', 'العشية — التدريب في الملعب', 'football', { time: 180 }),
    talk('walid', 'وليد في التدريب', 'walid', [
      when('joined_crew', [say('walid', 'سمعت دخلت مع سفيان... أمين، هاذوك يطيّحوك.')]),
      when('refused_crew', [say('walid', 'سمعت واش درت مع سفيان. راجل!', { fx: { confidence: 2 } })]),
      say('walid', 'المدرب حسين يحضّر فريق الأشبال للبطولة الولائية. تجي؟'),
      choose(
        'cadets',
        opt('نجي! نحتاج حاجة مليحة في حياتي.', 'good', { set: ['cadets_team'], fx: { health: 3, confidence: 2 } }),
        opt('ما عنديش الوقت.', 'neutral', {}),
      ),
    ]),
    act(
      'exam_day',
      'نهار الفرض — اقعد في بلاصتك',
      'lycee_desk',
      [
        when(
          'stole_exam',
          [
            NA('الفرض اليوم... بدّلتو. واحد دخل للمحفظة تاعي.'),
            NA('إذا اللي دارها يجي يقولّي، نسامحو. إذا لا، نلقاه.'),
            choose(
              'exam_confess',
              opt('نروح نقولها بعد القسم.', 'honest', {
                set: ['confessed_exam'],
                fx: { honesty: 12, trust: -2, grades: -3 },
                then: [NA('...شكرا على الشجاعة. صفر في الفرض، وما نقول لحتى واحد. الفرصة الجاية ما تضيّعهاش.')],
              }),
              opt('نسكت.', 'lie', { fx: { honesty: -4 }, then: [N('الأسئلة الجديدة صعاب. وأمين ما راجعش.'), fx({ grades: -5 })] }),
            ),
          ],
          [N('فرض الرياضيات.'), when('grades>=55', [fx({ grades: 3 })], [fx({ grades: -2 })])],
        ),
      ],
      { skipTo: '08:00', time: 60 },
    ),
  ],
  closing: [
    when('joined_crew', [N('الشلة عندها دفا. بصح الدفا تاع الجماعة، ساعات يحرق.')]),
    when('refused_crew', [N('أمين بقى برا الشلة. والبرا، ساعات، هو أكبر بلاصة.')]),
  ],
};

const ch25: Chapter = {
  id: 25,
  act: 2,
  title: 'أول سيجارة؟',
  mission: 'السيجارة',
  age: 13,
  summary: 'الكل يتكيّف ورا الإكمالية. السيجارة ولات "عادي".',
  start: { spot: 'lycee_gate', time: '16:00' },
  cast: { sofiane: 'lycee_gate', mourad: 'lycee_gate' },
  opening: [N('ورا حيط الإكمالية، بعد القسم. سحابة صغيرة فوق الشلة.')],
  objectives: [
    talk('pressure', 'الشلة ورا الحيط', 'sofiane', [
      SO('أمين! خوذ. ولا راك تخاف من ماماك؟'),
      when('mourad>=40', [MO('...خوذ يا خو. الكل يتكيّف.')]),
      when('refused_smoke_12', [N('أمين تفكّر الزنقة، عام فات. قالها مرة. يقدر يعاودها؟')]),
      when('tried_smoke_12', [N('أمين يعرف الطعم. القحّة. الدوخة.')]),
      choose(
        'first_cig',
        opt('لا يا خو. ما يعجبنيش.', 'refuse', {
          set: ['refused_cig_13'],
          fx: { confidence: 6, risk: -3 },
          then: [SO('ههه، الولد تاع ماماه.'), A('إيه، ولد ماماه. وراني فرحان.'), N('ضحكو. بصح جوج من الشلة شافو أمين بعين أخرى.')],
        }),
        opt('نتكيّف معاكم.', 'bad', {
          set: ['smoked'],
          fx: { health: -6, risk: 10, confidence: 2 },
          then: [N('السيجارة الأولى ما عندها حتى طعم مليح. بصح عندها طعم "معاهم".')],
        }),
        opt('نمشي بلا ما نقول والو.', 'neutral', { fx: { confidence: 1 } }),
      ),
    ]),
    goto('home', 'ارجع للدار', 'home_bedroom'),
    act('mirror', 'خمّم في بيتك', 'bed', [
      when(
        'smoked',
        [
          N('الريحة في الشعر، في الأصابع. أمين غسل يديه ثلاث مرات.'),
          choose(
            'cig_next',
            opt('هاذي أول وآخر مرة.', 'good', { set: ['quit_early'], fx: { risk: -4 } }),
            opt('مرة مرة ماشي مشكل.', 'bad', { set: ['smoking_habit'], fx: { risk: 4 } }),
          ),
        ],
        [N('أمين تمدّد. ما كانش حتى ريحة في حوايجو. كاين برك فخر صغير ما قالو لحتى واحد.')],
      ),
    ]),
    talk('baba', 'بابا يعيّطلك', 'baba', [
      B('أمين، جيبلي الولاعة من الكوزينة... ههه، نمزح. عمري ما تكيّفت.'),
      B('تعرف علاه؟ خو جدّك مات بالدخان. أربعين سنة يقحّ.'),
      when('smoking_habit', [N('أمين ما قدرش يشوف في عينين بابا.'), fx({ honesty: -2 })]),
      when('refused_cig_13', [A('بابا، اليوم عرضوا عليا وقلت لا.'), B('...تعال نبوسك على راسك.', { fx: { trust: 5, parents: 4 } })]),
    ]),
  ],
  closing: [
    when('smoking_habit', [N('مرة مرة. هكذا يقولو كامل في البداية.')]),
    when('refused_cig_13 | quit_early', [N('أمين اختار. وكل اختيار، يسهّل اللي يجي من بعدو.')]),
  ],
};

const ch26: Chapter = {
  id: 26,
  act: 2,
  title: 'غياب بلا حساب',
  mission: 'القهوة ولا القسم؟',
  age: 13,
  summary: 'الغياب ولا عادي. ساعة هنا، ساعة تما. حتى يولّي النهار كامل.',
  start: { spot: 'home_door', time: '07:30' },
  cast: { sofiane: 'square', mourad: 'square' },
  opening: [N('الحصة الأولى: تاريخ. الشلة في القهوة تاع الساحة.')],
  objectives: [
    goto('crossroads', 'القاطعة — المدرسة على اليسار، الساحة على اليمين', 'crossroads'),
    act('decide', 'خمّم', 'street_sign', [
      when('joined_crew | crew_friend', [N('ميساج من سفيان: "القهوة. دروك."')], [N('ميساج من مراد: "القهوة؟ الكل هنا."')]),
      choose(
        'skip3',
        opt('القسم.', 'good', { set: ['went_class_26'] }),
        opt('القهوة، ساعة برك.', 'bad', {
          set: ['skipped_ch26'],
          fx: { attendance: -8, risk: 4 },
          then: [when('skipped_ch1 | skipped_ch16', [fx({}, { set: ['truant_habit'] })])],
        }),
      ),
    ]),
    goto('cafe', 'روح للساحة', 'square', { if: 'skipped_ch26' }),
    talk(
      'cafe_time',
      'الشلة في القهوة',
      'sofiane',
      [
        SO('هاو جا! قهوة لأمين!'),
        pass(180),
        N('ساعة ولات ثلاثة. "القسم الجاي نروحو"... ما راحوش.'),
        fx({ money: -40, attendance: -6 }),
        when('truant_habit', [N('أمين ما بقاش يحس بالذنب. وهاذا، هو اللي يخوّف.')]),
      ],
      { if: 'skipped_ch26' },
    ),
    goto('school', 'روح للإكمالية', 'lycee_gate', { if: 'went_class_26', deadline: '08:15', onLate: { fx: { attendance: -2 } } }),
    act('class', 'القسم', 'lycee_desk', [NA('الدرس اليوم: النسب المئوية.'), fx({ grades: 4 })], { if: 'went_class_26', time: 360 }),
    goto('home', 'ارجع للدار', 'home_living'),
    talk('fatiha', 'خالتي فتيحة عند الباب', 'fatiha', [
      when(
        'skipped_ch26',
        [
          say('fatiha', 'أمين؟ شفتك في القهوة الصباح وقت القراية.'),
          choose(
            'fatiha_skip',
            opt('إيه يا خالتي... ما تقوليش لماما، عافاك.', 'neutral', {
              then: [say('fatiha', 'ما نقولش. بصح أنت قولها. هاذ الطريق مشى فيه مراد قبلك.'), fx({ honesty: 1 })],
            }),
            opt('ماشي أنا.', 'lie', { fx: { honesty: -4 }, then: [say('fatiha', '...ماشي أنت. واخا.'), fx({}, { set: ['fatiha_knows'] })] }),
          ),
        ],
        [say('fatiha', 'أمين، ربي يحفظك. شفت مراد في القهوة... قولو يرجع للقراية.')],
      ),
    ]),
  ],
  closing: [
    when('truant_habit', [N('الغياب ما بقاش حادث. ولا عادة. والعادات ما يتبدّلوش بسهولة.')]),
    when('went_class_26', [N('القسم ممل ساعات. بصح الممل اليوم، يخلّص غدوة.')]),
  ],
};

const ch27: Chapter = {
  id: 27,
  act: 2,
  title: 'دراهم ما تكفيش',
  mission: 'الحساب',
  age: 13,
  summary: 'الفليكسي، القهوة، والحوايج. المصروف ما بقاش يكفي.',
  start: { spot: 'home_bedroom', time: '10:00' },
  allowance: true,
  cast: { sofiane: 'square', salah: 'hanout' },
  opening: [N('آخر الشهر. الجيب فارغ والطلبات كثيرة.')],
  objectives: [
    act('count', 'احسب دراهمك في الحصالة', 'piggy', [
      N('أمين حسب: الفليكسي، القهوة مع الصحاب، الحوايج...'),
      when('smoking_habit', [N('والدخان. كل نهار، باكية تمشي.'), fx({ money: -60, health: -3 })]),
      choose(
        'budget',
        opt('ندير بودجي: نكتب كل دينار نصرفو.', 'good', { set: ['made_budget'], fx: { confidence: 3 } }),
        opt('ما عليهش، نتصرّف.', 'neutral', {}),
      ),
    ]),
    talk('sofiane_loan', 'سفيان في الساحة', 'sofiane', [
      SO('ما عندكش؟ نسلّفك ألف دينار. ترجّعهم ألف وخمسمية آخر الشهر.'),
      choose(
        'loan',
        opt('لا. ما نتسلّفش بالزيادة.', 'refuse', { fx: { confidence: 3 } }),
        opt('هات.', 'bad', {
          set: ['debt_sofiane'],
          fx: { money: 1000, risk: 8 },
          then: [N('ألف دينار. خفاف في اليد، ثقال في الراس.')],
        }),
      ),
    ]),
    act('work', 'الحانوت — عمي صالح يحتاج يد', 'boxes', [
      say('salah', 'أمين، كبرت! الجمعة والسبت نحتاج واحد. خمسمية في السيمانة.'),
      choose(
        'weekend_job',
        opt('موافق!', 'good', {
          set: ['works_salah'],
          fx: { money: 500, confidence: 4, health: -1 },
          then: [pass(240), say('salah', 'هاك. خدمة نظيفة.')],
        }),
        opt('لا، السبت للراحة.', 'neutral', {}),
      ),
    ]),
    talk('mama', 'ماما', 'mama', [
      M('أمين، تقدر تعطيني يد في الشراء تاع الشهر؟ باباك عندو دواء غالي هاذ الشهر.'),
      choose(
        'help_home',
        opt('هاكي يا ماما، ميتين دينار من عندي.', 'good', { if: 'money>=200', fx: { money: -200, parents: 6, trust: 3 } }),
        opt('ما عنديش يا ماما...', 'neutral', {}),
      ),
      when('debt_sofiane', [N('في الجيب ألف دينار تاع سفيان. ماشي تاع أمين.')]),
    ]),
  ],
  closing: [
    when('made_budget', [N('أول بودجي في حياتو: ورقة صغيرة فوق المكتب. ماشي حاجة كبيرة. بصح بداية.')]),
    when('debt_sofiane', [N('الدين يكبر وحدو، حتى وأنت راقد.')]),
  ],
};

const ch28: Chapter = {
  id: 28,
  act: 2,
  title: 'صاحب السوء',
  mission: 'غطّيني',
  age: 14,
  summary: 'صاحب يطلب من أمين يكذب على عائلتو باش يغطّيه.',
  start: { spot: 'home_door', time: '18:00' },
  cast: { mourad: 'crossroads', fatiha: 'home_door' },
  opening: [N('أربعطاش سنة. التيليفون يرن: مراد.')],
  objectives: [
    talk('ask', 'مراد في القاطعة', 'mourad', [
      MO('أمين، الليلة رايح لعرس في الحومة الفوقانية مع كمال. إذا خالتي سقساتك، قولها كان يقرا عندك.'),
      MO('صاحبي ولا لا؟'),
      choose(
        'cover',
        opt('واخا، نغطّيك.', 'bad', { set: ['agreed_cover'], fx: { mourad: 6 } }),
        opt('ما نكذبش على خالتك يا مراد.', 'refuse', {
          set: ['refused_cover'],
          fx: { mourad: -6, honesty: 3 },
          then: [MO('...مليح. نشوف من يغطّيني.')],
        }),
        opt('واش رايح تدير مع كمال في الليل؟', 'good', {
          set: ['asked_mourad_why'],
          then: [MO('...والو. سهرة. ما تسقسيش بزاف.'), N('مراد شاف الأرض. أمين عرف بلي كاين حاجة أخرى.')],
        }),
      ),
    ]),
    talk('fatiha', 'خالتي فتيحة', 'fatiha', [
      say('fatiha', 'أمين، مراد عندك؟ قال رايح يقرا معاك.'),
      choose(
        'answer_fatiha',
        opt('إيه يا خالتي، راه عندنا.', 'lie', {
          if: 'agreed_cover',
          set: ['covered_mourad'],
          fx: { honesty: -8, mourad: 4 },
          then: [say('fatiha', 'الحمد لله. أنت ولد مليح، نثق فيك.'), N('"نثق فيك". الكلمة جرحت أكثر من أي عقوبة.')],
        }),
        opt('لا يا خالتي. ما راهوش عندي. قال رايح لعرس مع كمال.', 'honest', {
          set: ['told_fatiha_truth'],
          fx: { honesty: 8, mourad: -10, trust: 3 },
          then: [say('fatiha', 'كمال؟! ...يعطيك الصحة يا وليدي. نروح نجيبو.')],
        }),
        opt('ما نعرفش يا خالتي.', 'neutral', { fx: { honesty: -2 } }),
      ),
    ]),
    goto('home', 'ادخل للدار', 'home_living'),
    talk('baba', 'بابا', 'baba', [
      B('فتيحة كانت عند الباب. واش كانت تحب؟'),
      when('covered_mourad', [
        choose(
          'tell_baba_cover',
          opt('كذبت عليها باش نغطّي مراد...', 'honest', {
            fx: { honesty: 6, trust: -2 },
            then: [B('الصاحب اللي يطلب منك تكذب، ماشي يحتاج غطا. يحتاج عاون.'), B('روح غدوة قول لفتيحة الصح.')],
          }),
          opt('والو، كانت تسقسي على مراد.', 'lie', { fx: { honesty: -3 } }),
        ),
      ]),
      when('told_fatiha_truth', [A('قلتلها الصح على مراد. ومراد راح يكرهني.'), B('اللي يكرهك على الصح، يرجع يحبك على الصح. ربي معاك.', { fx: { trust: 4 } })]),
    ]),
  ],
  closing: [
    when('covered_mourad', [N('في الليل، أمين سمع الموطو تاع كمال يفوت. ومراد معاه.')]),
    when('told_fatiha_truth', [N('مراد ما ردّش على الميساجات. بصح رقد في دارو الليلة.')]),
  ],
};

const ch29: Chapter = {
  id: 29,
  act: 2,
  title: 'ليلة بلا رجوع',
  mission: 'العرس',
  age: 14,
  summary: 'عرس في الحومة. الرجوع على العشرة. بصح الليل طويل.',
  start: { spot: 'home_living', time: '19:30' },
  event: 'wedding',
  cast: { sofiane: 'square', mourad: 'square', walid: 'square' },
  opening: [N('عرس ولد الجيران في الساحة. الزرنة والبندير. بابا قال: "العشرة تكون في الدار."')],
  objectives: [
    talk('rule', 'بابا', 'baba', [
      B('العشرة. ماشي العشرة وربع.'),
      choose('curfew', opt('العشرة، كلمة.', 'good', { set: ['curfew_promise'] }), opt('بابا، العرس يكمل مع الصبح!', 'neutral', { fx: { anger: 3 } })),
    ]),
    goto('wedding', 'روح للعرس في الساحة', 'square'),
    talk('party', 'الشباب في العرس', 'walid', [
      say('walid', 'أمين! الزرنة تاع تبسة ما كاين كيفها!'),
      N('الحومة كاملة ترقص. الضو، الحلوى، الضحك.'),
      SO('أمين! من بعد العرس، نروحو للبحيرة بالطوموبيل تاع خو كمال. السهرة الحقيقية!'),
      choose(
        'after_party',
        opt('لا، بابا قال العشرة.', 'good', { set: ['went_home_on_time'] }),
        opt('يالله!', 'bad', {
          set: ['stayed_out_night'],
          fx: { risk: 12, trust: -10, anger: 25, health: -4 },
          then: [pass(300), N('الطوموبيل تجري. الموزيكا عالية. الثلاثة تاع الصباح.'), N('ثلاثين ميساج من ماما. أمين ما شافهمش حتى ولّى.')],
        }),
        opt('نرقص شوية ونرجع.', 'neutral', { then: [pass(60)] }),
      ),
    ]),
    goto('home', 'ارجع للدار', 'home_living', {
      deadline: '22:00',
      onLate: { set: ['late_ch29'], fx: { trust: -5, anger: 10 }, note: 'فات العشرة!' },
    }),
    talk('aftermath', 'الدار', 'mama', [
      when(
        'stayed_out_night',
        [
          M('...'),
          N('ماما قاعدة في الصالون، العينين حمر. بابا لابس، كان رايح للكوميسارية.'),
          B('عرفت واش درت فينا؟ حسبناك ميت في طريق!'),
          choose(
            'night_reaction',
            opt('سامحوني. غلطت. ما كانش عندي الحق.', 'honest', {
              fx: { honesty: 8, anger: -5 },
              set: ['apologized_night'],
              then: [M('...الحمد لله اللي رجعت. هذا وحدو.'), B('غدوة نهدرو. الليلة، روح ترقد.')],
            }),
            opt('راني كبير! نسهر كيما نحب!', 'bad', {
              fx: { trust: -8, anger: 15, parents: -8 },
              set: ['defied_parents'],
              then: [B('كبير؟ الكبير يعرف يعيّط لماماه ويقولها راني لاباس.'), N('الباب تسكّر. الدار ولات باردة.')],
            }),
          ),
        ],
        [
          when('late_ch29', [M('العشرة ونص يا أمين. ماشي بزاف، بصح ماشي كيما قلنا.')], [M('جيت على الوقت. يعطيك الصحة.', { fx: { trust: 4 } })]),
        ],
      ),
    ]),
  ],
  closing: [
    when('stayed_out_night', [N('ليلة وحدة. بصح كاين ليالي يبقاو في الدار، حتى كي تطلع الشمس.')], [N('الزرنة سكتت. والحومة رقدت. وأمين في فراشو.')]),
  ],
};

const ch30: Chapter = {
  id: 30,
  act: 2,
  title: 'أول مواجهة مع المخدرات',
  mission: 'الكيس الصغير',
  age: 14,
  summary: 'تحت الدروج، كمال يعرض على أمين حاجة أخطر من الدخان.',
  start: { spot: 'hanout_front', time: '20:00' },
  cast: { kamel: 'stairs', mourad: 'stairs' },
  opening: [N('الليل. تحت الدروج، الضو مكسّر. الكبار يضحكو بصوت غريب.')],
  objectives: [
    goto('stairs', 'روح للعمارة — مراد بعثلك ميساج', 'stairs'),
    talk('offer', 'كمال', 'kamel', [
      say('kamel', 'أمين! كبرت يا الصغير. تعال، اقعد.'),
      MO('...'),
      N('مراد ساكت. العينين حمر. يضحك على والو.'),
      say('kamel', 'خوذ. هاذي تنسّيك المشاكل. الدار، القراية، كلش.'),
      N('أمين يعرف واش هي. شافها تخسّر ولاد الحومة واحد بواحد.'),
      choose(
        'drugs',
        opt('لا. ما نقيسش هاذ الشي. أبدا.', 'refuse', {
          set: ['refused_drugs'],
          fx: { confidence: 8, risk: -5 },
          then: [say('kamel', 'كيفك. الباب مفتوح كي تتبدّل.'), A('ما نتبدّلش.')],
        }),
        opt('مراد، أرواح معايا. دروك.', 'help', {
          set: ['refused_drugs', 'pulled_mourad_30'],
          fx: { confidence: 6, mourad: 4 },
          then: [
            MO('...أمين، روح. خلّيني.'),
            A('ما نخلّيكش. أرواح.'),
            when('mourad>=55', [N('مراد نوض. بالشوية. وتبع أمين.'), fx({ mourad: 4 }, { set: ['mourad_followed_30'] })], [N('مراد ما نوضش.')]),
          ],
        }),
        opt('...نجرّب مرة وحدة.', 'bad', {
          set: ['amine_used'],
          fx: { health: -12, risk: 20, confidence: -4 },
          then: [
            N('الدقايق الجايين ما كانوش كيما قال كمال. الدوخة، القلب يضرب، الخوف.'),
            N('ما نسى حتى مشكل. زادو مشاكل.'),
          ],
        }),
      ),
    ]),
    goto('home', 'ارجع للدار', 'home_bedroom'),
    act('night', 'الفراش', 'bed', [
      when(
        'amine_used',
        [
          N('السقف يدور. أمين خايف. خايف من روحو.'),
          choose(
            'night_after',
            opt('نقول لواحد. غدوة.', 'honest', { set: ['wants_help'], fx: { confidence: 2 } }),
            opt('حتى واحد ما لازم يعرف.', 'neutral', { set: ['hiding_use'] }),
          ),
        ],
        [N('أمين ما رقدش. ماشي من الخوف على روحو، من الخوف على مراد.'), fx({}, { set: ['worried_mourad_30'] })],
      ),
    ]),
  ],
  closing: [
    when('refused_drugs', [N('"لا" اليوم كانت أثقل من كل اللاوات اللي قبلها. وأقوى.')]),
    when('amine_used', [N('أمين عرف الليلة حاجة: اللي يقولك "تنسّيك"، يقصد "تنساك أنت".')]),
  ],
};

const ch31: Chapter = {
  id: 31,
  act: 2,
  title: 'العلامات الحمراء',
  mission: 'مراد ماشي لاباس',
  age: 14,
  summary: 'مراد ضعاف، يسرق من الدار، يزعف على والو. العلامات واضحة.',
  start: { spot: 'lycee_courtyard', time: '10:00' },
  cast: { mourad: 'lycee_courtyard', fatiha: 'home_door' },
  opening: [N('مراد في الساحة. وحدو. السبّاط تاع النايك تبدّل بحاجة قديمة.')],
  objectives: [
    talk('mourad', 'روح لمراد', 'mourad', [
      MO('واش تحب؟'),
      N('العينين غارقين. اليدين ترعد. ضعف بزاف.'),
      MO('سلّفني ألف دينار. نرجّعهملك. عافاك.'),
      choose(
        'mourad_money',
        opt('واش راك تدير بالدراهم يا مراد؟', 'good', {
          set: ['asked_mourad_money'],
          then: [MO('...ماشي شغلك!'), N('مراد نوض ومشى. بصح أمين شاف الدموع.'), fx({}, { set: ['noticed_mourad_signs'] })],
        }),
        opt('هاك.', 'bad', {
          if: 'money>=200',
          fx: { money: -200, mourad: 5 },
          set: ['gave_mourad_money'],
          then: [N('مراد خطف الدراهم ومشى بلا شكرا.'), fx({}, { set: ['noticed_mourad_signs'] })],
        }),
        opt('ما عنديش.', 'neutral', { then: [MO('...كيما كامل.'), fx({}, { set: ['noticed_mourad_signs'] })] }),
      ),
    ]),
    goto('home', 'ارجع للحومة', 'home_door'),
    talk('fatiha', 'خالتي فتيحة', 'fatiha', [
      say('fatiha', 'أمين... الذهب تاع أختي ضاع من الدار. ومراد ما رقدش في الدار ثلاث ليالي.'),
      say('fatiha', 'قولّي الصح يا وليدي. واش بيه مراد؟'),
      choose(
        'tell_fatiha',
        opt('خالتي... نظن مراد يتعاطى. ويحتاج عاون، ماشي عقوبة.', 'honest', {
          set: ['told_fatiha_signs'],
          fx: { honesty: 8, trust: 4, mourad: -4 },
          then: [
            say('fatiha', '...يا ربي.'),
            say('fatiha', 'وين نروح؟ شكون يعاوننا؟'),
            A('سمعت بلي كاين مركز الإصغاء في الطرف الفوقاني. ما يحكموش على حتى واحد.'),
            fx({}, { set: ['knows_center'] }),
          ],
        }),
        opt('ما نعرف والو يا خالتي.', 'neutral', { fx: { honesty: -3 }, then: [say('fatiha', '...ربي يستر.')] }),
      ),
    ]),
  ],
  closing: [
    when('told_fatiha_signs', [N('أمين حس بلي خان مراد. بصح في قلبو، كان يعرف: الخيانة الحقيقية هي السكوت.')], [N('العلامات حمرا. وأمين شافهم. واش يدير بيهم، هاذاك سؤال للغد.')]),
  ],
};

const ch32: Chapter = {
  id: 32,
  act: 2,
  title: 'الأب فقد الثقة',
  mission: 'الحيط بيناتنا',
  age: 14,
  summary: 'بابا اكتشف حاجة. والحيط بينو وبين أمين ولا عالي.',
  start: { spot: 'home_bedroom', time: '21:00' },
  cast: { mama: 'home_bedroom' },
  opening: [N('الباب تاع البيت تفتح بقوة. بابا في يدو حاجة.')],
  objectives: [
    talk('confront', 'بابا', 'baba', [
      when(
        'amine_used & hiding_use',
        [
          B('لقيت هاذي في جيب السروال تاعك. تعرف واش هي؟'),
          fx({ trust: -20, anger: 30, parents: -8 }, { set: ['father_found_drugs', 'father_trust_broken'] }),
        ],
        [
          when(
            'honesty<45 | smoking_habit | stayed_out_night | debt_sofiane',
            [
              B('سفيان جا للباب يطلب دراهم سلّفهملك. والدخان في الكارطابل. والكذبات...', { if: 'debt_sofiane | smoking_habit' }),
              B('ما بقيتش نعرفك يا أمين. كل كلمة تقولها، نسقسي روحي: صح ولا كذب؟'),
              fx({ trust: -15, anger: 20 }, { set: ['father_trust_broken'] }),
            ],
            [
              B('سمعت من فتيحة على مراد. من اليوم، ما تقعدش معاه.'),
              B('مانيش ضدك. خايف عليك.'),
              fx({}, { set: ['forbid_mourad'] }),
            ],
          ),
        ],
      ),
      choose(
        'father_response',
        opt('عندك الحق يا بابا. نحتاج عاون، ماشي نخبّي.', 'honest', {
          if: 'father_trust_broken',
          set: ['asked_father_help'],
          fx: { honesty: 10, anger: -10, trust: 3 },
          then: [B('...'), B('عاون؟ ...نجيبو. ونكون معاك. بصح من اليوم، الصح وبرك.')],
        }),
        opt('ماشي شغلك! حياتي!', 'bad', {
          fx: { trust: -8, anger: 15, parents: -10 },
          set: ['father_fight'],
          then: [N('بابا ضرب الحيط بيدو. خرج. الدار سكتت.')],
        }),
        opt('مراد صاحبي، ويحتاجني دروك أكثر من أي وقت.', 'help', {
          if: 'forbid_mourad',
          fx: { mourad: 5 },
          set: ['defended_mourad'],
          then: [B('...إذا تحب تعاونو، عاونو بالراس، ماشي بالقلب برك. وقولّي كل شي.'), fx({ trust: 2 })],
        }),
        opt('نسكت.', 'neutral', { fx: { parents: -3 } }),
      ),
    ]),
    act('alone', 'بيتك', 'desk', [
      N('أمين قاعد وحدو. على المكتب، صورة قديمة: هو وبابا في البحر، عندو ستة سنين.'),
      when('father_trust_broken', [N('الثقة ماشي حاجة تتعطى مرة وحدة. تتعطى كل نهار. ويقدر يتسحب كل نهار.')]),
    ]),
    talk('mama_late', 'ماما دخلت للبيت', 'mama', [
      M('...ما رقدتش؟'),
      when('father_fight', [M('باباك ما رقدش حتى هو. قاعد في الكوزينة يشرب القهوة على الثلاثة تاع الليل.')]),
      when('asked_father_help', [M('باباك قالي واش قلتلو. قالي: "وليدي طلب العاون. الحمد لله."')]),
      M('واش ما كان، احنا عائلتك. ماشي أعداءك.'),
      choose(
        'mama_reply',
        opt('سامحيني يا ماما.', 'honest', { fx: { parents: 5, anger: -5 } }),
        opt('خلّيني وحدي.', 'neutral', { fx: { parents: -2 } }),
      ),
    ], { skipTo: '23:30' }),
  ],
  closing: [
    when('asked_father_help', [N('في الليل، بابا دخل. قعد على طرف الفراش. ما قال والو. بصح قعد.')]),
    when('father_fight', [N('جوج رجال في دار وحدة، وما يهدروش.')]),
  ],
};

const ch33: Chapter = {
  id: 33,
  act: 2,
  title: 'الطريق المسدود',
  mission: 'الأبواب تتسكّر',
  age: 14,
  summary: 'الفريق الولائي، الرحلة المدرسية... الأبواب تتفتح غير للي حضّر.',
  start: { spot: 'football', time: '16:00' },
  cast: { coach: 'football', walid: 'football' },
  opening: [N('المدرب حسين عندو القائمة تاع الفريق الولائي.')],
  objectives: [
    talk('coach', 'المدرب حسين', 'coach', [
      when(
        'attendance>=60 & health>=60 & cadets_team',
        [say('coach', 'أمين، اسمك في القائمة. الفريق الولائي. مبروك.'), fx({ confidence: 10 }, { set: ['regional_team'] })],
        [
          when(
            'attendance<60',
            [say('coach', 'أمين... الإكمالية بعثتلي الغيابات. القانون واضح: ما كانش فريق بلا قراية.')],
            [say('coach', 'ما كنتش حاضر في التدريبات. الموهبة بلا حضور ما تكفيش.')],
          ),
          fx({ confidence: -6 }, { set: ['missed_regional'] }),
        ],
      ),
    ]),
    talk('walid', 'وليد', 'walid', [
      when('regional_team', [say('walid', 'نسافرو مع بعض لعنابة! ما نصدقش!')]),
      when('missed_regional', [say('walid', 'سامحني يا خو... كنت نحب تكون معانا.'), choose('react', opt('العام الجاي. نصلّح.', 'good', { set: ['determined_33'], fx: { confidence: 3 } }), opt('ما يهمنيش.', 'neutral', { fx: { confidence: -2 } }))]),
    ]),
    goto('school', 'الإكمالية — لوحة الرحلة', 'lycee_courtyard'),
    talk('nadia', 'الأستاذة نادية', 'nadia', [
      NA('الرحلة العلمية للمرصد تاع الجزائر. أربعة تلاميذ من كل قسم.'),
      when(
        'grades>=60 & honesty>=50',
        [NA('أمين، اخترتك. المعدّل والسلوك.'), fx({ confidence: 5 }, { set: ['science_trip'] })],
        [NA('هاذ العام ماشي أنت يا أمين. المعدّل والسلوك. بصح الباب ما تسكّرش للأبد.'), fx({ confidence: -3 })],
      ),
    ]),
  ],
  closing: [
    when('missed_regional', [N('ماشي حتى واحد سكّر الباب في وجه أمين. هو سكّرو، بالشوية، نهار بنهار.')]),
    when('regional_team & science_trip', [N('جوج أبواب في نهار واحد. اللي يزرع، يحصد.')]),
  ],
};

const ch34: Chapter = {
  id: 34,
  act: 2,
  title: 'فلوس راحت',
  mission: 'لعبة الكارطة',
  age: 14,
  summary: 'في السوق، لعبة "الكارطة الثلاثة" تقول بلي الربح ساهل.',
  start: { spot: 'souk', time: '11:00' },
  cast: { kamel: 'souk', sofiane: 'souk' },
  opening: [N('السوق تاع الجمعة. عباد كثير، وطابلة صغيرة فيها ثلاث كارطات.')],
  objectives: [
    act('game', 'شوف الطابلة', 'stall', [
      say('kamel', 'وين الملكة؟ حط ميتين، تربح أربعمية! ساهلة!'),
      N('واحد قبل أمين ربح جوج مرات. الملكة واضحة.'),
      choose(
        'gamble',
        opt('نلعب بالحصالة كاملة. نضاعفها!', 'bad', {
          if: 'savings>=100',
          set: ['gambled', 'lost_money'],
          then: [N('مرة ربح. مرة خسر. مرة خسر. مرة خسر...'), fx({ savings: -100000, confidence: -8 }), N('الحصالة فرغت. والراجل اللي ربح قبلو، يضحك مع كمال.')],
        }),
        opt('نلعب ميتين برك.', 'bad', {
          if: 'money>=200',
          set: ['gambled', 'lost_money'],
          fx: { money: -200, confidence: -3 },
          then: [N('الملكة ماكانتش تما. عمرها ما كانت تما.')],
        }),
        opt('هاذي حيلة. اللي ربح قبلي معاهم.', 'good', {
          set: ['saw_scam'],
          fx: { confidence: 5 },
          then: [say('kamel', 'روح يا الذكي.')],
        }),
      ),
    ]),
    talk(
      'debt',
      'سفيان يستنّاك',
      'sofiane',
      [
        SO('أمين. الألف وخمسمية. اليوم.'),
        choose(
          'repay',
          opt('هاك. وما نعاودش نتسلّف منك.', 'good', {
            if: 'money>=1500',
            fx: { money: -1500 },
            unset: ['debt_sofiane'],
            then: [SO('...كيفك.')],
          }),
          opt('هاك واش عندي، والباقي من الخدمة.', 'good', {
            fx: { money: -100000 },
            set: ['partial_repay'],
            unset: ['debt_sofiane'],
            then: [SO('كل سيمانة نجي.'), N('أمين يخدم شهرين باش يكمّل دين ألف دينار.'), fx({ health: -3 })],
          }),
          opt('ما عنديش.', 'bad', {
            fx: { risk: 8, health: -6, confidence: -5 },
            set: ['beaten_debt'],
            then: [N('سفيان وجوج من الشلة. الزنقة. ما كانش حتى واحد يشوف.'), N('أمين رجع للدار بالعين زرقا.')],
          }),
        ),
      ],
      { if: 'debt_sofiane' },
    ),
    goto('home', 'ارجع للدار', 'home_living'),
    talk('mama', 'ماما', 'mama', [
      when('beaten_debt', [M('عينك! واش صرالك؟!'), choose('beaten_truth', opt('تسلّفت دراهم... وما رجّعتهمش.', 'honest', { fx: { honesty: 8, anger: 10 }, then: [M('يا ربي... باباك يروح يهدر مع عايلة هاذ الولد. ومن اليوم، ما تتسلّف من حتى واحد.')], unset: ['debt_sofiane'] }), opt('طحت في الماتش.', 'lie', { fx: { honesty: -5 } }))]),
      when('lost_money & !beaten_debt', [A('ماما... ضيّعت الدراهم اللي جمعتهم.'), M('كيفاش؟'), A('لعبة في السوق. حيلة.'), M('الدراهم ترجع يا وليدي. المهم تعلّمت.', { fx: { honesty: 4 } })]),
      when('saw_scam', [A('ماما، في السوق كاين حيلة تاع الكارطات. كمال معاهم.'), M('ربي يكفينا شرهم. ونقول لعمي صالح يحذّر الناس.', { fx: { trust: 2 } })]),
    ]),
  ],
  closing: [
    when('lost_money', [N('الدراهم اللي تجي بالساهل، تمشي بالساهل. واللي تجي بالعرق، تعلّمك قيمتها.')], [N('الحصالة سالمة. والراس حتى هو.')]),
  ],
};

export const ACT2A: Chapter[] = [ch23, ch24, ch25, ch26, ch27, ch28, ch29, ch30, ch31, ch32, ch33, ch34];
