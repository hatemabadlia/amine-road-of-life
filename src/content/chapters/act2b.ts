// ACT II — Chapters 35–45: adolescence, age 15. Crisis, help, and the crossroads.
import type { Chapter } from '../../types/game';
import { A, B, M, MO, N, choose, fx, goto, opt, pass, say, talk, act, when } from './dsl';

const NA = (t: string, extra?: Parameters<typeof say>[2]) => say('nadia', t, extra);
const SA = (t: string, extra?: Parameters<typeof say>[2]) => say('samia', t, extra);
const BA = (t: string, extra?: Parameters<typeof say>[2]) => say('bachir', t, extra);
const IM = (t: string, extra?: Parameters<typeof say>[2]) => say('imene', t, extra);

const ch35: Chapter = {
  id: 35,
  act: 2,
  title: 'الغياب الكبير',
  mission: 'إنذار الإقصاء',
  age: 15,
  summary: 'شهادة التعليم المتوسط قريبة. والغيابات وصلت للحد.',
  start: { spot: 'lycee_courtyard', time: '09:00' },
  cast: { sofiane: 'square', walid: 'lycee_courtyard' },
  opening: [N('خمسطاش سنة. عام الشهادة. على لوحة الإدارة: "قائمة التلاميذ المهددين بالإقصاء".')],
  objectives: [
    act('list', 'شوف القائمة', 'lycee_desk', [
      when(
        'attendance<55',
        [N('أمين... اسمك في القائمة. خمسة غيابات زايدين ويتقصى من الامتحان.'), fx({ confidence: -6 }, { set: ['exclusion_warning'] })],
        [N('اسمك ماشي في القائمة. بصح اسم سفيان كاين... واسم مراد.'), fx({}, { set: ['mourad_exclusion'] })],
      ),
    ]),
    talk('nadia', 'الأستاذة نادية تحب تشوفك', 'nadia', [
      when(
        'exclusion_warning',
        [
          NA('أمين، عندك المخ. نشوفو في التمارين. بصح الغياب يقتل كلش.'),
          NA('نقترح عليك عقد: حضور كامل، دروس دعم الثلاثاء، ونوقّع أنا وباباك.'),
          choose(
            'contract',
            opt('نوقّع. نحتاج هاذ الفرصة.', 'good', { set: ['attendance_contract'], fx: { attendance: 12, confidence: 4, trust: 4 } }),
            opt('خلّيني نخمّم...', 'neutral', { fx: { attendance: -2 } }),
          ),
        ],
        [NA('أمين، مراد في القائمة. أنت صاحبو. هدّر معاه، يمكن يسمعلك أكثر منّا.'), fx({}, { set: ['nadia_asks_mourad'] })],
      ),
    ]),
    goto('square', 'الساحة — الشلة تعيّط', 'square'),
    talk('sofiane', 'سفيان', 'sofiane', [
      say('sofiane', 'أمين! يالله للبحيرة، الطقس يشبح. الامتحان؟ ههه.'),
      choose(
        'last_skip',
        opt('لا. هاذ العام نكمّل.', 'refuse', { set: ['committed_35'], fx: { confidence: 4, attendance: 4 } }),
        opt('يالله.', 'bad', {
          set: ['skipped_ch35'],
          fx: { attendance: -12, risk: 5 },
          then: [when('exclusion_warning', [N('خمسة غيابات... ولات أربعة.'), fx({}, { set: ['near_exclusion'] })])],
        }),
      ),
    ]),
    goto('home', 'ارجع للدار', 'home_living'),
    talk('baba', 'بابا', 'baba', [
      when('attendance_contract', [B('الأستاذة نادية عيّطت. وقّعت معاها. هاذي ماشي ورقة، هاذي كلمة.', { fx: { trust: 3 } })]),
      when('near_exclusion', [B('غياب آخر؟ في عام الشهادة؟ ...واش تحب تولّي يا أمين؟', { fx: { anger: 10, trust: -5 } })]),
      when('!attendance_contract & !near_exclusion', [B('كيفاش القراية؟'), A('ماشية يا بابا.'), B('ربي يوفّقك.')]),
    ]),
  ],
  closing: [
    when('attendance_contract', [N('ورقة موقّعة من ثلاثة: أمين، بابا، والأستاذة. أول عقد في حياتو.')]),
    when('near_exclusion', [N('الحد قريب. وأمين يمشي على طرفو.')]),
  ],
};

const ch36: Chapter = {
  id: 36,
  act: 2,
  title: 'الاعتراف لمراد',
  mission: 'هدرة الصح',
  age: 15,
  summary: 'أمين ومراد، وحدهم، فوق السطح تاع العمارة. وقت الصح.',
  start: { spot: 'home_door', time: '18:30' },
  cast: { mourad: 'stairs' },
  opening: [N('الصاحب اللي كبرت معاه ما يولّيش غريب في نهار. يولّي غريب بالشوية، حتى تنسى كيفاش كان.')],
  objectives: [
    goto('stairs', 'روح للعمارة', 'stairs'),
    talk('talk', 'مراد', 'mourad', [
      MO('...جيت تحكم عليّا كيما كامل؟'),
      choose(
        'approach',
        opt('جيت نقولك بلي توحّشتك. الصاحب تاعي.', 'help', {
          fx: { mourad: 8 },
          then: [MO('...'), MO('حتى أنا توحّشتني. توحّشت روحي.')],
        }),
        opt('شوف واش وليت! كلش من كمال!', 'bad', {
          fx: { mourad: -10 },
          set: ['judged_mourad'],
          then: [MO('سهل تحكم وأنت عندك باباك وماماك.')],
        }),
      ),
      MO('تعرف... بابا مشى. ماما في فرنسا. خالتي تعب. وكمال... كمال كان الوحيد اللي يشوفني.', { cam: 'close' }),
      MO('القرقوبي... بديت باش ننسى. دروك ما نقدرش نحبس.', { cam: 'close' }),
      choose(
        'mourad_truth',
        opt('مراد، كاين ناس يعاونو. مركز الإصغاء. نروح معاك.', 'help', {
          set: ['offered_help_mourad'],
          fx: { mourad: 6, confidence: 3 },
          then: [MO('...ما نعرفش. نخاف يحبسوني.'), A('ماشي حبس. ناس يسمعو، ويعاونو. ما يحكموش.'), MO('...نخمّم.')],
        }),
        opt('ما نقدرش نعاونك. أنت اخترت.', 'neutral', {
          fx: { mourad: -8 },
          set: ['gave_up_mourad'],
          then: [MO('إيه. أنا اخترت. روح.')],
        }),
        opt('حتى أنا جرّبت... وخفت.', 'honest', {
          if: 'amine_used',
          set: ['shared_struggle', 'offered_help_mourad'],
          fx: { mourad: 10, honesty: 6 },
          then: [MO('أنت؟!'), A('مرة وحدة. ومن ذاك النهار نحس بلي لازم نهدر مع واحد. يمكن نروحو مع بعض.'), MO('...مع بعض. يمكن.')],
        }),
      ),
    ]),
    goto('home', 'ارجع للدار', 'home_bedroom'),
  ],
  closing: [
    when('offered_help_mourad', [N('"نخمّم". كلمة صغيرة. بصح من عند واحد كان يقول "ما يهمنيش"، هاذي باب.')]),
    when('gave_up_mourad', [N('أمين نزل الدروج. ما شافش اللور.')]),
  ],
};

const ch37: Chapter = {
  id: 37,
  act: 2,
  title: 'مواجهة الحومة',
  mission: 'الهدرة تمشي',
  age: 15,
  summary: 'الحومة تهدر. على أمين، على مراد، على العائلة.',
  start: { spot: 'hanout_front', time: '17:00' },
  cast: { fatiha: 'hanout_front', sofiane: 'square', salah: 'hanout' },
  opening: [N('في الحومة، الأخبار تمشي أسرع من الريح.')],
  objectives: [
    talk('rumor', 'خالتي فتيحة', 'fatiha', [
      say('fatiha', 'أمين... الناس يقولو بلي أنت تبيع مع كمال. أنا ما صدّقتش. بصح قلت نقولك.'),
      when('did_errand | amine_used', [N('الهدرة فيها شوية صح... وهاذا اللي يوجع.')]),
      choose(
        'rumor_react',
        opt('شكرا يا خالتي. نروح نواجه اللي يقولها.', 'good', { set: ['face_rumor'] }),
        opt('خلّيهم يهدرو.', 'neutral', { set: ['ignore_rumor'] }),
      ),
    ]),
    talk(
      'sofiane',
      'سفيان في الساحة — هو اللي بدا الهدرة',
      'sofiane',
      [
        say('sofiane', 'إيه أنا قلتها. واش؟ تحب تضرب؟'),
        choose(
          'confront',
          opt('ما نضربش. نقولك برك: كذبتك ما تبدّلش شكون أنا.', 'good', {
            fx: { confidence: 8 },
            set: ['calm_confront'],
            then: [say('sofiane', '...'), N('الناس اللي في الساحة سمعو. وسكتو.')],
          }),
          opt('يضربو.', 'bad', {
            fx: { health: -8, risk: 6, trust: -4 },
            set: ['fought_sofiane'],
            then: [N('الضربة الأولى. الثانية. الشرطة تفوت... والكل يهرب.'), N('أمين في الكوميسارية، بابا جا يديه.')],
          }),
        ),
      ],
      { if: 'face_rumor' },
    ),
    talk('salah', 'عمي صالح', 'salah', [
      say('salah', 'أمين، الهدرة تاع الناس كيما الغبرة. تطيح وحدها كي تمشي مستقيم.'),
      when('calm_confront', [say('salah', 'سمعت واش درت في الساحة. باباك لازم يكون فخور.', { fx: { trust: 3 } })]),
      when('fought_sofiane', [say('salah', 'الضرب يعطيهم الحق. حتى ولو كانو غالطين.')]),
      say('salah', 'وعلى فكرة، عمي بشير تاع الورشة يحتاج واحد في الصيف. قلتلو عليك.'),
      fx({}, { set: ['salah_recommends'] }),
    ]),
  ],
  closing: [
    when('calm_confront', [N('الحومة بدات تشوف أمين بعين أخرى. ماشي الطفل. الراجل اللي ما يهربش.')]),
    when('fought_sofiane', [N('ليلة في الكوميسارية. بابا ما قال والو في الطوموبيل. السكوت قال كلش.')]),
  ],
};

const ch38: Chapter = {
  id: 38,
  act: 2,
  title: 'فرصة عمل',
  mission: 'الورشة',
  age: 15,
  summary: 'صيف في ورشة عمي بشير: الخشب، الحديد، والصبر.',
  start: { spot: 'home_door', time: '07:30' },
  allowance: false,
  opening: [N('الصيف. عمي بشير يفتح الورشة على الثمانية. ما يحبش اللي يجي متأخر.')],
  objectives: [
    goto('workshop', 'روح للورشة قبل الثمانية', 'workshop', {
      deadline: '08:00',
      onLate: { set: ['late_workshop'], note: 'عمي بشير ما يحبش التأخير.' },
    }),
    talk('bachir', 'عمي بشير', 'bachir', [
      when('late_workshop', [BA('الثمانية وخمسة. أول نهار؟ المرة الجاية ما تدخلش.')], [BA('على الوقت. مليح. هاذا أول درس.')]),
      when('salah_recommends', [BA('صالح قالي عليك. ما يقولش على حتى واحد بلا ما يعرفو.')]),
      BA('الخدمة هنا: النجارة والتلحيم. تبدا بالتنظيف وتشوف. الشهرية ثلاثة آلاف في الشهر.'),
    ]),
    act('work', 'اخدم في الطاولة', 'workbench', [
      N('النشارة، الريحة تاع الخشب، الصوت تاع المنشار.'),
      BA('شوف. قيس مرتين، قص مرة.'),
      choose(
        'work_style',
        opt('نخدم بالشوية ونسقسي.', 'good', {
          set: ['worked_bachir', 'bachir_impressed'],
          fx: { confidence: 6, money: 3000 },
          then: [pass(480), BA('اليد تاعك تتعلم. هاذي موهبة.')],
        }),
        opt('نخدم بالزربة باش نكمّل بكري.', 'neutral', {
          set: ['worked_bachir'],
          fx: { money: 2500 },
          then: [pass(360), BA('الزربة تضيّع الخشب. المرة الجاية بالشوية.')],
        }),
      ),
    ]),
    talk('bachir_money', 'عمي بشير — آخر الشهر', 'bachir', [
      BA('هاك الشهرية. حلال عليك.'),
      BA('تعرف علاه نحب نخدم بيدي؟ خاطر الكرسي اللي ندير، يقعد عليه واحد عشرين سنة.'),
      choose(
        'pay_use',
        opt('نحط نصها في الحصالة.', 'good', { if: 'money>=1500', fx: { money: -1500, savings: 1500 }, set: ['saver'] }),
        opt('نعطي جزء لماما.', 'good', { if: 'money>=1000', fx: { money: -1000, parents: 8, trust: 4 }, set: ['helped_family_money'] }),
        opt('نشري تيليفون جديد.', 'neutral', { if: 'money>=2500', fx: { money: -2500, confidence: 3 } }),
        opt('نخلّيهم في جيبي.', 'neutral', {}),
      ),
      when('smoking_habit', [N('ونص الباقي... دخان. كل سيمانة.'), fx({ money: -300, health: -2 })]),
    ]),
  ],
  closing: [
    when('bachir_impressed', [N('في الليل، اليدين فيهم جرح صغير ونشارة. أمين ما غسلهمش دغيا. كان فخور بيهم.')], [N('أول شهرية. ماشي من عند بابا. من عند الخدمة.')]),
  ],
};

const ch39: Chapter = {
  id: 39,
  act: 2,
  title: 'نهار العلاج',
  mission: 'مركز الإصغاء',
  age: 15,
  summary: 'مركز الإصغاء والوقاية. باب ما يسكّرش في وجه حتى واحد.',
  start: { spot: 'home_door', time: '10:00' },
  cast: { mourad: 'crossroads', samia: 'center' },
  opening: [
    N('مركز الإصغاء في الطرف الفوقاني. بناية بيضا، فيها جنينة صغيرة.'),
    when('amine_used', [N('أمين مازال يتفكّر ذيك الليلة تحت الدروج. ومن ذاك النهار، الخوف ما خرجش.')]),
  ],
  objectives: [
    talk('mourad', 'مراد في القاطعة', 'mourad', [
      when(
        'offered_help_mourad',
        [
          MO('أمين... قلت نخمّم. خمّمت.'),
          MO('تجي معايا؟ وحدي ما نقدرش ندخل.'),
          choose(
            'go_with_mourad',
            opt('نجي معاك. أرواح.', 'help', { set: ['mourad_to_center'], fx: { mourad: 8 } }),
            opt('روح وحدك، هاذي حياتك.', 'neutral', { fx: { mourad: -6 } }),
          ),
        ],
        [
          MO('وين رايح؟'),
          A('للمركز تاع الإصغاء.'),
          MO('...للمهابل؟ ههه.'),
          choose(
            'invite_mourad',
            opt('للي يحبو يتبدّلو. تجي؟', 'help', {
              if: 'mourad>=45',
              set: ['mourad_to_center'],
              fx: { mourad: 4 },
              then: [MO('...نجي نشوف برك. ما ندخلش.')],
            }),
            opt('والو. نتلاقاو من بعد.', 'neutral', {}),
          ),
        ],
      ),
    ]),
    goto('center', 'روح لمركز الإصغاء', 'center'),
    talk('samia', 'الدكتورة سامية', 'samia', [
      SA('مرحبا. أنا سامية. هنا ما كانش أحكام. واش جابك اليوم؟'),
      when(
        'amine_used',
        [
          choose(
            'seek_help',
            opt('جرّبت حاجة... ومن ذاك الوقت نخاف من روحي. نحتاج عاون.', 'honest', {
              set: ['amine_sought_help'],
              fx: { honesty: 12, confidence: 6, risk: -15, health: 4 },
              then: [
                SA('شكرا على الثقة. هاذي أصعب خطوة، وأنت درتها.'),
                SA('مرة وحدة ولا أكثر، المهم دروك. نتلاقاو كل سيمانة. ونخمّمو مع بعض كيفاش نهدرو مع العائلة.'),
                SA('التعافي ماشي خط مستقيم. يطلع وينزل. بصح يمشي للقدام.'),
              ],
            }),
            opt('جيت نسقسي على صاحبي برك.', 'neutral', {
              set: ['hid_from_samia'],
              then: [SA('صاحبك محظوظ بيك. وأنت؟ إذا حبيت تهدر على روحك، الباب مفتوح.')],
            }),
          ),
        ],
        [
          A('جيت على صاحبي... وعلى روحي شوية. الضغط، الامتحان، الحومة.'),
          SA('الضغط ماشي ضعف. اللي يجي يهدر، هو القوي.'),
          fx({ confidence: 5, health: 2 }, { set: ['visited_center'] }),
        ],
      ),
      when('mourad_to_center', [
        MO('...دكتورة. أنا مراد. ونحتاج... نحتاج عاون.'),
        SA('مرحبا يا مراد. راك في البلاصة الصحيحة.'),
        N('مراد بكى. لأول مرة من سنين، قدام واحد كبير.'),
        fx({ mourad: 6 }, { set: ['mourad_first_session'] }),
      ]),
    ]),
    goto('home', 'ارجع للدار', 'home_living'),
    talk('family', 'العائلة', 'mama', [
      when('amine_sought_help', [
        M('أمين؟ وجهك... واش صرا؟'),
        choose(
          'tell_family_help',
          opt('ماما، بابا... رحت للمركز. على حاجة درتها. نحب نحكيلكم.', 'honest', {
            set: ['family_knows_help'],
            fx: { trust: 8, honesty: 8, parents: 6, anger: 6 },
            then: [B('...'), B('تعال. اقعد. ونسمعو.'), M('أنت وليدنا. والوليد كي يطيح، نوضوه.')],
          }),
          opt('والو. عيّان برك.', 'neutral', { then: [N('مازال الوقت. سامية قالت: بالشوية.')] }),
        ),
      ]),
      when('!amine_sought_help', [M('كنت في المركز؟ فتيحة قالتلي بلي مراد مشى معاك. ربي يجازيك.', { if: 'mourad_to_center', fx: { trust: 4, parents: 3 } })]),
    ]),
  ],
  closing: [
    when('amine_sought_help', [N('طلب العاون ماشي ضعف. أمين عرفها اليوم، ماشي بالكلام. بالخطوة.')]),
    when('mourad_first_session', [N('مراد دخل للمركز. الطريق طويل. بصح أول خطوة كانت الأصعب.')]),
  ],
};

const ch40: Chapter = {
  id: 40,
  act: 2,
  title: 'الرجوع للقسم',
  mission: 'نلحق',
  age: 15,
  summary: 'الدروس تجمّعت. أمين لازم يلحق، والوقت قليل.',
  start: { spot: 'lycee_class', time: '08:00' },
  cast: { imene: 'lycee_class', walid: 'lycee_courtyard' },
  opening: [N('ثلاثة شهور للشهادة. الدروس اللي فاتت كالجبل.')],
  objectives: [
    talk('nadia', 'الأستاذة نادية', 'nadia', [
      NA('أمين. الرياضيات، الفيزياء، العربية... الثغرات كثيرة. بصح ماشي مستحيلة.'),
      NA('دروس الدعم الثلاثاء والخميس. مجانية.'),
      choose(
        'support',
        opt('نحضر كل حصة.', 'good', { set: ['support_classes'], fx: { grades: 6, attendance: 5 } }),
        opt('نشوف إذا عندي الوقت.', 'neutral', { fx: { grades: 1 } }),
      ),
    ]),
    talk('imene', 'إيمان', 'imene', [
      IM('أمين، عندي ملخصات الفصل كامل. تحب نصوّرهملك؟'),
      when('front_seat', [IM('من نهار قعدت القدّام في أول نهار، عرفت بلي أنت جدّي.')]),
      choose('imene_help', opt('صحّيتي! نراجعو مع بعض؟', 'good', { set: ['study_with_imene'], fx: { grades: 4 } }), opt('شكرا، نتدبّر.', 'neutral', {})),
    ]),
    act('study', 'راجع في بيتك', 'desk', [
      N('ليلة. جوج. ثلاثة. المعادلات بدات تولّي صحاب.'),
      choose(
        'study_pace',
        opt('برنامج كل نهار: ساعتين.', 'good', { fx: { grades: 7, health: -2 }, set: ['study_plan_40'] }),
        opt('نراجع كي نحب.', 'neutral', { fx: { grades: 2 } }),
      ),
      pass(120),
    ]),
  ],
  closing: [when('study_plan_40', [N('الجبل ما ينقصش في نهار. بصح كل نهار، حجرة.')], [N('الوقت يجري. والدروس تستنّى.')])],
};

const ch41: Chapter = {
  id: 41,
  act: 2,
  title: 'صحبة جديدة',
  mission: 'نادي العلوم',
  age: 15,
  summary: 'نادي، تطوّع في دار الشباب، وصحاب يخلّوك أحسن.',
  start: { spot: 'lycee_courtyard', time: '14:00' },
  event: 'volunteer',
  cast: { imene: 'lycee_courtyard', yacine: 'lycee_courtyard', walid: 'football' },
  opening: [N('على باب المخبر: "نادي الروبوتيك — مرحبا بالجميع". وفي لوحة الإعلانات: "يوم التطوّع — دار الشباب، العشية".')],
  objectives: [
    talk('yacine', 'ياسين', 'yacine', [
      when(
        'helped_yacine | told_teacher_bully',
        [say('yacine', 'أمين! تفكّر أول نهار؟ دروك أنا رئيس النادي. تعال معانا!'), fx({ confidence: 3 })],
        [say('yacine', '...أمين. تفكّرني؟ الولد الجديد. ما عليهش، الماضي فات. النادي مفتوح للكل.')],
      ),
      when('mocked_yacine', [
        choose(
          'apologize_yacine',
          opt('ياسين... سامحني على ذاك النهار. كنت جبان.', 'honest', {
            set: ['apologized_yacine'],
            fx: { honesty: 6, confidence: 3 },
            then: [say('yacine', '...شكرا. نسيتها؟ لا. بصح سامحتك. يالله للنادي.')],
          }),
          opt('نسيت.', 'neutral', {}),
        ),
      ]),
      choose(
        'join_club',
        opt('ندخل للنادي.', 'good', { set: ['joined_club', 'new_friends'], fx: { confidence: 5, grades: 3 } }),
        opt('نروح نتطوّع في دار الشباب.', 'good', { set: ['volunteer', 'new_friends'], fx: { confidence: 5, parents: 3 } }),
        opt('ما نحبش النوادي.', 'neutral', {}),
      ),
    ]),
    act('club', 'أول نشاط في النادي', 'lycee_desk', [
      when('joined_club', [N('روبو صغير يمشي على خط أسود. كي مشى، الكل صفّق. أمين حس بحاجة جديدة: الفرحة النظيفة.')]),
      when('!joined_club', [N('أمين قعد يتفرّج. الضحك تاع النادي وصل حتى لعندو.')]),
      pass(120),
    ], { if: '!volunteer' }),
    // ---- volunteering day at Dar Chabab ---------------------------------------
    goto('to_dar', 'روح لدار الشباب — يوم التطوّع', 'dar_chabab_front', { if: 'volunteer' }),
    talk('hassane_signup', 'سجّل عند المنشّط حسان', 'hassane', [
      when(
        'planted_tree',
        [say('hassane', 'أمين! تفكّر الشجرة اللي غرستها وأنت عندك عشر سنين؟ دروك طالت أكثر منك!'), fx({ confidence: 2 })],
        [say('hassane', 'مرحبا! أنت أمين؟ ياسين قالي عليك.')],
      ),
      say('hassane', 'اليوم عندنا ثلاث فرق، وكل فريق ناقصو يد.'),
      say('hassane', 'التطوّع ماشي صدقة. هو تبادل: تعطي وقتك، وتاخذ معنى.'),
      choose(
        'vol_team',
        opt('فريق القفة: نحضّرو للعائلات المحتاجة.', 'help', { set: ['team_baskets'] }),
        opt('فريق التنظيف: الزنقة والساحة.', 'help', { set: ['team_clean'] }),
        opt('فريق دروس الدعم: نعاون الصغار.', 'help', { set: ['team_tutor'] }),
      ),
    ], { if: 'volunteer' }),
    act('team_baskets_work', 'فريق القفة — حضّر القفف', 'food_baskets', [
      N('سميد، زيت، سكر، عدس. سبعين قفة. حسان قال: "الأسماء تبقى سرّ. الكرامة قبل كلش."'),
      N('مع العشية، أمين حمل قفة لدار شيباني وحدو. الشيباني ما قدرش يهدر. حط يدّو على راس أمين: "ربي يرضى عليك يا وليدي."', { cam: 'close' }),
      fx({ parents: 4, confidence: 3, honesty: 2 }),
      pass(120),
    ], { if: 'team_baskets' }),
    act('team_clean_kit', 'فريق التنظيف — خوذ الجيلي والعدّة', 'clean_kit', [
      N('جيلي أخضر، ڨانطوات، شكاير، ومكانس. حسان: "نبداو بالزنقة اللي ورا الحانوت."'),
    ], { if: 'team_clean' }),
    act('team_clean_alley', 'نظّف الزنقة مع الفريق', 'alley_wall', [
      N('القرعات، البلاستيك، وحتى عقاب الدخان. الزنقة اللي كان يخاف منها، ولّات تشبه الحومة.'),
      when('smoking_habit | tried_cig_errand', [N('أمين لمّ عقاب سجاير من الأرض. وقف شوية. وكمّل.')]),
      N('شيباني خرج بالشاي: "ياخي بيكم يا الشباب!" وصغار الحومة جاو يعاونو.'),
      fx({ health: 2, confidence: 4, parents: 2 }),
      pass(120),
    ], { if: 'team_clean' }),
    act('team_tutor_work', 'فريق الدعم — عاون الصغار', 'tutor_table', [
      N('طفلة صغيرة ما تحبش الحساب. "الأرقام صعيبة." أمين جاب الحلوى وعاود الشرح.'),
      N('كي فهمت، ضحكت. وأمين تفكّر الأستاذة اللي ما قنطاتش منو.'),
      fx({ confidence: 4, grades: 2, parents: 2 }),
      pass(120),
    ], { if: 'team_tutor' }),
    talk('hassane_thanks', 'حسان — آخر النهار', 'hassane', [
      say('hassane', 'يعطيك الصحة يا أمين. هاذي شهادة متطوّع، وهاذا مفتاح القاعة: تقدر تجي وقت ما تحب.', { cam: 'close' }),
      choose(
        'keep_volunteering',
        opt('نجي كل سبت.', 'good', { set: ['volunteer_spirit', 'weekly_volunteer'], fx: { confidence: 3 } }),
        opt('نجي كي نقدر.', 'neutral', { set: ['volunteer_spirit'] }),
      ),
    ], { if: 'volunteer' }),
    talk('walid', 'وليد في الملعب', 'walid', [
      say('walid', 'أمين، تبدّلت. للأحسن.'),
      when('chose_mourad_group | joined_crew', [say('walid', 'كنت نقول خسرناك. الحمد لله اللي رجعت.')]),
      fx({ confidence: 2 }),
    ]),
  ],
  closing: [when('new_friends', [N('صحاب جداد. ما يطلبوش منك تكون حاجة. يطلبو منك تكون أحسن.')], [N('الصحبة اختيار. وأمين مازال يختار.')])],
};

const ch42: Chapter = {
  id: 42,
  act: 2,
  title: 'مواجهة الحقيقة',
  mission: 'الكذبات القدام',
  age: 15,
  summary: 'العائلة مجموعة. وكل الكذبات اللي ما تقالوش، يطلعو للسطح.',
  start: { spot: 'home_living', time: '20:00' },
  opening: [N('عشا العائلة. عمي جا من العاصمة. والهدرة ولات على "الأولاد اليوم".')],
  objectives: [
    talk('dinner', 'بابا', 'baba', [
      when(
        'forged_signature | lied_money | hid_skip_ch1 | covered_mourad | hid_from_samia | hiding_use',
        [
          B('أمين، المدير القديم تاع الابتدائي التقيت بيه. قالي حاجة على توقيع...', { if: 'forged_signature' }),
          B('وفتيحة قالت بلي غطّيت على مراد هذيك الليلة.', { if: 'covered_mourad' }),
          B('أمين، نحس بلي كاين حوايج ما قلتهمش. اليوم وقت الصح.'),
          choose(
            'truth_night',
            opt('كلش. نحكيلكم كلش.', 'honest', {
              set: ['full_truth'],
              unset: ['forged_signature', 'lied_money', 'hid_skip_ch1', 'covered_mourad', 'hid_from_samia', 'hiding_use'],
              fx: { honesty: 18, trust: 6, anger: 20 },
              then: [
                N('ساعة كاملة. التوقيع، الكذبات، الليالي.'),
                when('amine_used & !family_knows_help', [A('وحتى... جرّبت المخدرات مرة. ورحت لمركز الإصغاء.', { if: 'amine_sought_help' }), A('وحتى... جرّبت المخدرات. وما قلتش لحتى واحد.', { if: '!amine_sought_help' }), fx({}, { set: ['family_knows_help'] })]),
                M('...'),
                B('هاذا هو الراجل اللي كنت نستنّاه. ماشي الراجل اللي ما يغلطش. اللي يقول.'),
              ],
            }),
            opt('ما كاين والو.', 'lie', {
              fx: { trust: -12, honesty: -8 },
              set: ['denied_truth'],
              then: [B('...واخا. بصح الثقة ما ترجعش بالإنكار.')],
            }),
          ),
        ],
        [
          B('أمين، نحب نقولك حاجة قدام عمك: هاذ العام، ولّيت راجل.'),
          M('وعلى مراد... واش صرالو؟'),
          when('mourad_first_session', [A('راه يتعالج. نمشي معاه كل سيمانة.'), B('هاذي هي الصحبة.', { fx: { trust: 4 } })], [A('...ما نعرفش يا ماما. نحاول.')]),
          fx({ parents: 4 }, { set: ['clean_record'] }),
        ],
      ),
    ]),
    act('night', 'الفراش', 'bed', [
      when('full_truth', [N('أول ليلة من سنين، بلا حتى سر تحت الماطلة.')]),
      when('denied_truth', [N('السر يكبر. والدار تصغار.')]),
      when('clean_record', [N('ليلة عادية. هاذي هي النعمة.')]),
    ]),
    talk('morning', 'الصباح — ماما في الكوزينة', 'mama', [
      when('full_truth', [M('رقدت مليح؟ ...أنا ما رقدتش. بصح ماشي من الزعاف. من الراحة.')]),
      when('denied_truth', [M('...القهوة فوق الطابلة.'), N('ماما ما شافتش فيه.')]),
      when('clean_record', [M('عمك قالي: "وليدكم تربّى مليح." حمّرتلي الوجه.')]),
      choose(
        'morning_help',
        opt('نعاونك في الكوزينة قبل ما نخرج.', 'good', { fx: { parents: 3 } }),
        opt('نخرج دغيا، راني متأخر.', 'neutral', {}),
      ),
    ], { skipTo: '07:30' }),
  ],
  closing: [N('الحقيقة كيما الشمس: تقدر تخبّيها بيدك شوية. بصح يدك تعيا.')],
};

const ch43: Chapter = {
  id: 43,
  act: 2,
  title: 'الثمن',
  mission: 'كل اختيار عندو ثمن',
  age: 15,
  summary: 'الثمن تاع القرارات القدام يجي. ماشي كعقوبة، كنتيجة.',
  start: { spot: 'lycee_courtyard', time: '10:00' },
  cast: { mourad: 'center', walid: 'lycee_courtyard' },
  opening: [N('الثمن ما يجيش بالفاتورة. يجي كي ما تستنّاهش.')],
  objectives: [
    talk('price', 'وليد في الساحة', 'walid', [
      when(
        'amine_used & !amine_sought_help',
        [
          N('في الساحة، الراس دار. الأرض طلعت. أمين طاح.'),
          say('walid', 'أمين! أمين! عيّطو للحماية!'),
          fx({ health: -15, trust: -5 }, { set: ['collapsed'] }),
        ],
        [
          when(
            'near_exclusion | truant_habit',
            [say('walid', 'سمعت... الإدارة قالت بلي تعاود العام إذا ما نجحتش في الشهادة. ما كانش إنقاذ.'), fx({ confidence: -4 }, { set: ['no_rescue'] })],
            [say('walid', 'مراد في المركز اليوم. قال ما يحبش حتى واحد يزورو... بصح نعرف بلي يستنّاك.', { if: 'mourad_first_session' })],
          ),
        ],
      ),
      when('smoking_habit', [N('والدرج تاع الإكمالية... أمين يطلعو ويقطع النفس. خمسطاش سنة وتقطع النفس.'), fx({ health: -5 })]),
    ]),
    talk(
      'hospital',
      'رجعت من السبيطار — كلّم بابا في الدار',
      'baba',
      [
        B('الطبيب قال... قال حاجة ما حبّيتش نسمعها.'),
        choose(
          'hospital_truth',
          opt('بابا، نحتاج عاون. بالصح.', 'honest', {
            set: ['amine_sought_help', 'family_knows_help'],
            fx: { honesty: 12, trust: 4, risk: -15 },
            then: [B('...نعاونوك. والدكتورة تاع المركز، نروحو عندها مع بعض.'), M('ما خلّيناكش، وما نخلّيوكش.')],
          }),
          opt('ما صرا والو، غير عيا.', 'lie', { fx: { trust: -10, honesty: -6 }, set: ['denied_collapse'] }),
        ),
      ],
      { if: 'collapsed' },
    ),
    goto('center', 'زور مراد في المركز', 'center', { if: 'mourad_first_session & !collapsed' }),
    talk(
      'mourad_visit',
      'مراد',
      'mourad',
      [
        MO('جيت؟ ...قلت ما نحبش زيارات.'),
        A('وأنا قلت ما نخلّيكش.'),
        MO('ثلاث سيمانات بلا والو. صعيبة يا خو. بزاف.'),
        choose(
          'support_mourad',
          opt('نجي كل جمعة. حتى تخرج.', 'help', { set: ['weekly_visits'], fx: { mourad: 8 } }),
          opt('ربي معاك.', 'neutral', { fx: { mourad: 2 } }),
        ),
      ],
      { if: 'mourad_first_session & !collapsed' },
    ),
  ],
  closing: [
    when('collapsed', [N('الجسم يحسب كلش. حتى اللي تحسب بلي حتى واحد ما شافو.')]),
    when('weekly_visits', [N('كل جمعة. الحافلة الثلاثة. ومراد يستنّى عند الباب.')]),
  ],
};

const ch44: Chapter = {
  id: 44,
  act: 2,
  title: 'آخر فرصة قبل الامتحان',
  mission: 'المراجعة الأخيرة',
  age: 15,
  summary: 'سيمانتين للشهادة. كل ساعة تحسب.',
  start: { spot: 'home_bedroom', time: '08:00' },
  cast: { imene: 'lycee_class', walid: 'home_living' },
  opening: [N('سيمانتين. الكتب فوق المكتب كالسور.')],
  objectives: [
    act('plan', 'المكتب — دير برنامج', 'desk', [
      N('ورقة بيضا، وقلم أحمر. أربعطاش نهار، ستة مواد.'),
      A('الرياضيات أصعب حاجة... نبدا بيها ولا نخلّيها للآخر؟'),
      choose(
        'final_prep',
        opt('برنامج كامل: الصباح رياضيات، العشية علوم، الليل عربية.', 'good', { set: ['final_prep_full'], fx: { grades: 8, health: -3 } }),
        opt('نراجع شوية كل نهار.', 'neutral', { fx: { grades: 3 } }),
        opt('خلاص، فات الوقت.', 'bad', { set: ['gave_up_exam'], fx: { grades: -3, confidence: -5 } }),
      ),
    ]),
    talk('walid', 'وليد جا يراجع معاك', 'walid', [
      say('walid', 'جبت تمارين الدورات اللي فاتت. نحلّوهم مع بعض؟'),
      M('جبتلكم الشاي والمقروط. ما تنساوش تاكلو.'),
      say('walid', 'صحّيتي خالتي!'),
      when('mourad_first_session', [say('walid', 'ومراد بعثلك: "ربي يوفقك يا خو. أنا نحضّر التكوين."')]),
      choose('group_review', opt('يالله.', 'good', { fx: { grades: 4, confidence: 2 }, then: [pass(180)] }), opt('نفضّل وحدي.', 'neutral', {})),
    ]),
    goto('school', 'الإكمالية — حصة الأسئلة', 'lycee_class'),
    talk('nadia', 'الأستاذة نادية', 'nadia', [
      NA('آخر حصة. أسئلة؟'),
      when('support_classes', [NA('أمين، تبدّلت هاذ العام. نقولها قدام القسم كامل.', { fx: { confidence: 6 } })]),
      when('gave_up_exam', [NA('أمين... ما تستسلمش. حتى عشر نقاط زايدين يبدّلو كلش.'), choose('nadia_push', opt('...واخا. نحاول.', 'good', { unset: ['gave_up_exam'], fx: { grades: 3 } }), opt('ما نقدرش.', 'neutral', {}))]),
    ]),
    // ---- exam day: the BEM at the exam centre ---------------------------------
    goto('exam', 'نهار الامتحان — مركز الامتحان', 'exam_hall', { skipTo: '07:30' }),
    act('exam_desk', 'اقعد في بلاصتك — شهادة التعليم المتوسط', 'exam_desk', [
      N('سيمانتين فاتو كالريح. قاعة كبيرة، طاولات بعيدة على بعضها، ورقم أمين ملصوق في الزاوية.', { cam: 'wide' }),
      N('المراقب: "التيليفونات في الشكارة. الورقة تتقلب كي نقول."'),
      N('الرياضيات. التمرين الأول يعرفو. الثاني... الثاني صعيب.'),
      when(
        'final_prep_full',
        [N('بصح أمين حلّ تمرين كيفو في السيمانة اللي فاتت. القلم بدا يمشي وحدو.'), fx({ grades: 2, confidence: 3 })],
        [
          when(
            'gave_up_exam',
            [
              N('أمين شاف في الورقة البيضا. الوقت يجري.'),
              choose(
                'exam_try',
                opt('نكتب واش نعرف. حتى نقطة وحدة تحسب.', 'good', { unset: ['gave_up_exam'], fx: { grades: 2, confidence: 2 } }),
                opt('نسلّم الورقة بكري.', 'bad', { fx: { confidence: -3 } }),
              ),
            ],
            [N('أمين خمّم، شطب، عاود. وفي الآخر لقى الطريق.'), fx({ confidence: 1 })],
          ),
        ],
      ),
      N('"الوقت كمل. الأقلام فوق الطاولة." أمين خرج للشمس، والقلب يدق.'),
      pass(180),
    ]),
  ],
  closing: [N('خمسة أيام امتحانات. الليلة اللخرانية، ماما جابت كاس حليب ودخلت بلا صوت. والباقي، في يد اللي يصحّح.')],
};

const ch45: Chapter = {
  id: 45,
  act: 2,
  title: 'مفترق الطرق',
  mission: 'نتائج الشهادة',
  age: 15,
  summary: 'نتائج شهادة التعليم المتوسط. كل الطرقات تبدا من هنا.',
  start: { spot: 'lycee_gate', time: '10:00' },
  cast: { walid: 'lycee_gate', imene: 'lycee_gate', mourad: 'crossroads' },
  opening: [N('النتائج على الحيط. الكل يدفع باش يشوف.')],
  objectives: [
    act('results', 'شوف النتائج', 'lycee_desk', [
      when(
        'grades>=55 & attendance>=45 & !gave_up_exam',
        [
          when('grades>=75', [N('أمين — 15.20 — ناجح بامتياز.'), fx({ confidence: 12 }, { set: ['bem_passed', 'bem_honors'] })], [
            N('أمين — 11.40 — ناجح.'),
            fx({ confidence: 8 }, { set: ['bem_passed'] }),
          ]),
        ],
        [N('أمين — 8.90 — راسب.'), fx({ confidence: -10 }, { set: ['bem_failed'] })],
      ),
    ]),
    talk('friends', 'وليد وإيمان', 'walid', [
      when('bem_passed', [say('walid', 'نجحنا! الثانوية مع بعض!')], [say('walid', 'أمين... ما عليهش. تعاود ولا التكوين المهني، الطريق مازال طويل.')]),
    ]),
    talk('mourad', 'مراد في القاطعة', 'mourad', [
      when('mourad_first_session', [MO('سمعت النتيجة. أنا؟ ما دخلتش للامتحان... بصح راني نقرا مع المركز، يحضّرو التكوين المهني.')], [MO('نتيجة؟ ههه، أنا عندي نتيجة وحدة: الشارع.')]),
      when('bem_passed', [MO('مبروك يا خو. بالصح.', { fx: { mourad: 3 } })]),
    ]),
    goto('home', 'ارجع للدار', 'home_living'),
    talk('family', 'العائلة', 'baba', [
      when('bem_honors', [B('بامتياز؟! ...ماما، جيبي الحلوى! كامل الحومة لازم تعرف!', { fx: { parents: 8, trust: 5 } })]),
      when('bem_passed & !bem_honors', [B('نجحت. الحمد لله. خطوة.', { fx: { parents: 4, trust: 3 } })]),
      when('bem_failed', [
        B('...'),
        choose(
          'failed_talk',
          opt('غلطت فالعام. بصح ما نحبش نوقف هنا.', 'honest', { set: ['determined_after_fail'], fx: { trust: 3, confidence: 3 }, then: [B('مليح. نخمّمو مع بعض: تعاود، ولا التكوين.')] }),
          opt('خلاص، القراية ماشي ليا.', 'neutral', { fx: { confidence: -4 }, then: [B('القراية أنواع. واحد يقرا في الكتاب، واحد يقرا بيدو.')] }),
        ),
      ]),
    ]),
  ],
  closing: [
    N('نهاية المراهقة الأولى. الطريق ينقسم قدام أمين.'),
    when('bem_passed', [N('الثانوية تستنّى.')], [N('الطريق الكلاسيكي تسكّر. بصح ماشي الطريق الوحيد.')]),
  ],
};

export const ACT2B: Chapter[] = [ch35, ch36, ch37, ch38, ch39, ch40, ch41, ch42, ch43, ch44, ch45];
