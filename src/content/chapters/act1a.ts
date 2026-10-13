// ACT I — Chapters 1–5: the detailed playable slice.
import type { Chapter } from '../../types/game';
import { A, B, M, MO, N, choose, fx, goto, opt, pass, say, talk, act, when } from './dsl';

const ch1: Chapter = {
  id: 1,
  act: 1,
  title: 'أول نهار خارج السيطرة',
  mission: 'صباح الحومة',
  age: 10,
  summary: 'صباح عادي في الحومة. أمين لازم يروح للمدرسة، بصح مراد عندو فكرة أخرى.',
  start: { spot: 'home_bedroom', time: '07:00' },
  allowance: false,
  cast: { mourad: 'crossroads' },
  opening: [
    N('تبسة. حومة شعبية، صباح من صباحات أكتوبر. ريحة الخبز السخون والبرد الخفيف.'),
    M('أمين، نوض يا وليدي، راك تتأخر على القراية!'),
    A('...خمس دقايق برك يا ماما.'),
  ],
  objectives: [
    act('wake', 'نوض من الفراش', 'bed', [
      A('آآه... البرد.'),
      choose(
        'wake_up',
        opt('نوض دغيا', 'good', { fx: { confidence: 1 }, then: [A('يالله، نهار جديد.')] }),
        opt('ارقد خمس دقايق زايدين', 'bad', {
          set: ['overslept'],
          then: [pass(20), N('الخمس دقايق ولاو عشرين...'), M('أمييين! راني نعيّط عليك من الصباح!')],
        }),
      ),
    ]),
    talk('mama', 'روح سلّم على ماما في الكوزينة', 'mama', [
      M('صباح الخير يا وليدي. روح اغسل وجهك، الفطور واجد.'),
      when('overslept', [M('شفت الساعة؟ كل نهار نفس الحكاية.', { fx: { anger: 5 } })]),
      M('وقولّي، درت الواجب تاع الحساب البارح؟'),
      choose(
        'homework',
        opt('إيه يا ماما، درتو كامل.', 'lie', {
          set: ['lied_homework'],
          fx: { honesty: -5 },
          then: [M('مليح، الله يرضى عليك.'), N('أمين ما كمّلش الواجب... بصح الكلمة خرجت.')],
        }),
        opt('لا... نسيت. نكمّلو قبل القراية.', 'honest', {
          set: ['honest_homework'],
          fx: { honesty: 3, anger: 3 },
          then: [M('آه يا أمين! المرة الجاية دير الواجب قبل ما ترقد.'), M('بصح يعطيك الصحة خاطر قلتلي الصح.')],
        }),
      ),
    ]),
    act('wash', 'روح اغسل وجهك', 'sink', [N('الما بارد بزاف!'), A('برررر... ضرك فقت.'), fx({ health: 1 })]),
    act('breakfast', 'فطر مع العائلة', 'kitchen_table', [
      N('قهوة بالحليب، خبز الدار وشوية زيت زيتون من عند جدّك.'),
      say('selma', 'أمين! كليتلي الخبزة تاعي!'),
      A('هاهي، هاهي، خوذ نصها.'),
      M('كولو وما تتشاجروش. صباح ربي.'),
      fx({ health: 3, parents: 2 }),
      pass(15),
    ]),
    talk('father', 'روح لبابا في الصالون', 'baba', [
      B('صباح الخير يا أمين.'),
      B('هاك المصروف تاعك، خمسين دينار. ما تصرفهمش كامل في الحلوى.', { fx: { money: 50 } }),
      B('شوف يا أمين، الغلطة تصرا، بصح لازم تكون راجل وتتحمّل مسؤوليتك.'),
      B('روح للمدرسة طول، وما تبقاش تحوّس مع مراد في الطريق.'),
      choose(
        'promise_school',
        opt('واخا يا بابا، طول للمدرسة.', 'good', { fx: { trust: 2 }, set: ['said_straight'] }),
        opt('علاه ديما مراد؟ مراد صاحبي!', 'neutral', {
          fx: { mourad: 3, anger: 2 },
          then: [B('صاحبك على راسي، بصح القراية قبل كل شي.')],
        }),
      ),
    ]),
    goto('leave', 'اخرج من الدار', 'home_door'),
    talk('meet_mourad', 'مراد يستنّى فيك في القاطعة', 'mourad', [
      MO('أمين! وأخيرا. اسمع، عندي فكرة.'),
      MO('اليوم عندنا الرسم والحساب... ممل. ولاد الحومة رايحين للملعب، والكورة جديدة!'),
      MO('واش بيك؟ غير ساعة ونرجعو، ما راح يصرا والو.'),
      choose(
        'skip_school',
        opt('يالله، ساعة برك.', 'bad', {
          set: ['skipped_ch1', 'with_mourad_ch1'],
          fx: { mourad: 8, attendance: -8, risk: 5 },
          then: [MO('هذا هو صاحبي! أجري قبل ما يشوفونا!')],
        }),
        opt('ماشي كل مرة نتبعك وخلاص. عندي قرايتي ثاني.', 'refuse', {
          set: ['refused_mourad_ch1'],
          fx: { mourad: -5, confidence: 4 },
          then: [MO('أوكي، روح يا الشاطر.'), N('مراد مشى وحدو للملعب.')],
        }),
        opt('أرواح معايا للمدرسة، ونلعبو العشية مع بعض.', 'good', {
          if: 'confidence>=50',
          set: ['convinced_mourad_ch1'],
          fx: { mourad: 3, confidence: 5 },
          then: [MO('...واخا، بصح العشية الماتش عليك!'), N('مراد مشى معاك. ساعات كلمة وحدة تبدّل نهار كامل.')],
        }),
      ),
    ], {
      moves: [
        { npc: 'mourad', spot: 'school_courtyard', if: 'convinced_mourad_ch1' },
        { npc: 'mourad', spot: 'football', if: '!convinced_mourad_ch1' },
      ],
    }),
    // --- skipped school ---
    goto('to_field', 'روح مع مراد للملعب', 'football', { if: 'skipped_ch1' }),
    talk(
      'field_time',
      'العب مع مراد في الملعب',
      'mourad',
      [
        N('الكورة تجري، الصغار يعيّطو، والشمس طلعت. الساعة الأولى فاتت كالريح.'),
        MO('شفت؟ قتلك! أحسن من الحساب.'),
        pass(90),
        N('بصح في قلب أمين كاين حاجة ثقيلة... المعلم، بابا، الكلمة اللي قالها الصباح.'),
        choose(
          'stay_or_return',
          opt('نرجع للمدرسة قبل ما تكمل القراية.', 'good', {
            set: ['returned_early'],
            fx: { confidence: 3, mourad: -3 },
            then: [MO('راك تخاف بزاف يا أمين...'), A('ماشي خوف. كلمة قلتها لبابا.')],
          }),
          opt('نقعد للعشية، ماكان والو.', 'bad', {
            set: ['stayed_all_day', 'school_called'],
            fx: { attendance: -6, mourad: 5, risk: 4 },
            then: [pass(240), N('النهار كامل فات في الملعب. والمدرسة عيّطت للدار.')],
          }),
        ),
      ],
      { if: 'skipped_ch1' },
    ),
    goto('back_to_school', 'ارجع للمدرسة', 'school_gate', { if: 'returned_early' }),
    talk(
      'director_catch',
      'المدير شافك عند الباب',
      'director',
      [
        say('director', 'أمين! وين كنت الصباح كامل؟ اسمك مكتوب غايب.', { cam: 'low' }),
        choose(
          'director_truth',
          opt('رحت للملعب مع مراد... سامحني، رجعت وحدي.', 'honest', {
            set: ['confessed_director', 'director_warning'],
            fx: { honesty: 6, attendance: -3 },
            then: [
              say('director', 'على الأقل رجعت وقلت الصح. هذا إنذار، والمرة الجاية نعيّط لباباك.'),
              say('director', 'أدخل للقسم، وقول لمراد بلي راني نستنّاه.'),
            ],
          }),
          opt('كنت مريض، رحت للطبيب.', 'lie', {
            set: ['lied_director', 'school_called'],
            fx: { honesty: -8, attendance: -3 },
            then: [say('director', 'مريض؟ وعلاه سروالك كامل تراب؟ مليح، نعيّطو لباباك ونشوفو.')],
          }),
        ),
        pass(150),
      ],
      { if: 'returned_early' },
    ),
    // --- went to school ---
    goto('to_school', 'روح للمدرسة قبل الثامنة', 'school_gate', {
      if: '!skipped_ch1',
      deadline: '08:00',
      onLate: { set: ['late_ch1'], fx: { attendance: -3 }, note: 'فات الوقت! راك متأخر.' },
    }),
    act(
      'class',
      'ادخل للقسم واقعد في بلاصتك',
      'school_desk',
      [
        when('late_ch1', [
          say('teacher', 'أمين! الساعة شحال؟ القسم بدا من ربع ساعة.'),
          A('سامحني يا سي لخضر...'),
          say('teacher', 'اقعد. وغدوة نشوفك قبل الجرس.'),
        ]),
        say('teacher', 'السلام عليكم. خرّجو الكراريس، نصحّحو الواجب.'),
        when(
          'lied_homework',
          [
            say('teacher', 'أمين، وين الواجب؟ نص التمارين فارغة.'),
            N('الكذبة الصغيرة تاع الصباح رجعت. ماما ما عرفتش... بصح المعلم شاف.'),
            fx({ grades: -3 }, { set: ['homework_caught'] }),
          ],
          [
            when('honest_homework', [
              A('سي لخضر، ما كمّلتش الواجب... كمّلت شوية الصباح.'),
              say('teacher', 'نقدّر الصراحة. كمّلو اليوم في الدار.'),
              fx({ honesty: 2 }),
            ]),
          ],
        ),
        when('convinced_mourad_ch1', [say('teacher', 'مراد حتى هو هنا اليوم؟ هذي مفاجأة مليحة.'), fx({ mourad: 3 })]),
        N('درس الكسور. الأرقام صعاب، بصح أمين حاول.'),
        choose(
          'class_effort',
          opt('ارفع يدك وجاوب', 'good', { fx: { grades: 4, confidence: 3 } }),
          opt('ابقى ساكت وتبّع', 'neutral', { fx: { grades: 2 } }),
          opt('ارسم في الكراس', 'bad', { fx: { grades: -1 } }),
        ),
      ],
      { if: '!skipped_ch1', time: 420 },
    ),
    goto('go_home', 'عندك وقت فراغ — ارجع للدار قبل المغرب', 'home_living', {
      deadline: '18:30',
      onLate: { set: ['late_home_ch1'], fx: { anger: 10, trust: -3 }, note: 'ماما راهي قلقانة... فات المغرب!' },
    }),
    talk('evening', 'احكي لبابا على نهارك', 'baba', [
      when(
        'school_called',
        [
          B('المدير عيّطلي اليوم. قال بلي ما كنتش في القسم.'),
          B('وين كنت يا أمين؟ وما تكذبش عليّا.'),
          choose(
            'evening_confess',
            opt('كنت في الملعب مع مراد. غلطت يا بابا.', 'honest', {
              set: ['confessed_ch1'],
              fx: { trust: -4, honesty: 10, anger: 8 },
              then: [
                B('...زعفت عليك. بصح قلتلي الصح، وهذا مهم.'),
                B('الثقة تتبنى بالشوية وتطيح بالخف. ما تعاودهاش.'),
              ],
            }),
            opt('المدير غالط، كنت في المدرسة!', 'lie', {
              set: ['lied_ch1', 'caught_lie_ch1'],
              fx: { trust: -15, honesty: -10, anger: 20, parents: -5 },
              then: [
                B('المدير غالط؟ والمعلم غالط؟ وخالتك فتيحة اللي شافتك في الملعب، حتى هي غالطة؟'),
                N('بابا ما زادش هدر. السكوت تاعو كان أثقل من العقوبة.'),
              ],
            }),
          ),
        ],
        [
          when(
            'skipped_ch1',
            [
              B('كيفاش كان النهار في المدرسة؟'),
              choose(
                'hide_skip',
                opt('بصراحة... هربت الصباح ورجعت. المدير عطاني إنذار.', 'honest', {
                  set: ['confessed_ch1'],
                  fx: { trust: 2, honesty: 10, anger: 5 },
                  then: [B('رجعت وحدك وجيت تقولي. هذا راجل يغلط ويصلّح.'), B('غدوة نروح نسلّم على المدير.')],
                }),
                opt('عادي، كيما كل نهار.', 'lie', {
                  set: ['hid_skip_ch1'],
                  fx: { honesty: -6 },
                  then: [B('مليح. روح دير الواجب.'), N('السر بقى في قلب أمين. ساعات السر يكبر وحدو.')],
                }),
              ),
            ],
            [
              B('واش درتو اليوم في القسم؟'),
              when('late_ch1', [A('وصلت متأخر شوية... سي لخضر عيّط عليا.'), B('غدوة تنوض بكري. الوقت ما يستنّاش.'), fx({ honesty: 2 })]),
              when('refused_mourad_ch1', [
                A('مراد قالي نروحو للملعب، بصح ما رحتش.'),
                B('هكذا! هذا هو أمين اللي نعرفو. قول لا كي تكون لازم.', { fx: { trust: 6, confidence: 3 } }),
              ]),
              when('convinced_mourad_ch1', [
                A('مراد حب يهرب، بصح ديتو معايا للقسم.'),
                B('صاحب يجبد صاحبو للخير... ربي يحفظكم.', { fx: { trust: 5, mourad: 2 } }),
              ]),
              fx({ parents: 2 }),
            ],
          ),
        ],
      ),
      when('late_home_ch1', [M('وزيد رجعت مع الليل! قلبي طاح عليك.'), fx({ parents: -3 })]),
    ]),
  ],
  closing: [
    N('الليل طاح على الحومة. أمين في الفراش، يخمّم في النهار.'),
    when('confessed_ch1', [N('قال الصح، وصعبت عليه. بصح قلبو خفيف.')]),
    when('lied_ch1 | hid_skip_ch1', [N('الكذبة سكنت معاه تحت الغطا. ما راهيش ساكتة.')]),
    when('!skipped_ch1', [N('نهار عادي... بصح الأيام العادية هي اللي تبني الراجل.')]),
  ],
};

const ch2: Chapter = {
  id: 2,
  act: 1,
  title: 'كذبة المصروف',
  mission: 'خبزة وصرف',
  age: 10,
  summary: 'ولاد الحومة يجمعو الدراهم باش يشريو كورة جديدة. أمين يقدر يقول الصح... ولا لا.',
  start: { spot: 'home_bedroom', time: '09:00' },
  cast: { mourad: 'hanout_front' },
  opening: [
    N('نهار السبت. ما كانش قراية، والحومة كلها برا.'),
    when('caught_lie_ch1', [N('من نهار الكذبة، بابا يهدر مع أمين بالقليل.')]),
  ],
  objectives: [
    talk('mama_errand', 'ماما تعيّط عليك', 'mama', [
      M('أمين، روح للحانوت، جيبلي جوج خبزات وحليب.'),
      M('هاك مية دينار. والصرف تجيبهولي، راني نحسب.', { fx: { money: 100 } }),
      A('واخا يا ماما.'),
    ]),
    goto('to_shop', 'روح لحانوت عمي صالح', 'hanout'),
    act('buy', 'اشري الخبز والحليب', 'counter', [
      say('salah', 'صباح الخير يا أمين! واش تحب؟'),
      A('جوج خبزات وكيس حليب يا عمي صالح.'),
      say('salah', 'خبزة بعشرة، الحليب بخمسة وعشرين... خمسة وأربعين دينار.', { fx: { money: -45 } }),
      say('salah', 'هاك الصرف، خمسة وخمسين. سلّملي على باباك.'),
      N('مدّ يدو للحلوى والشيبس... الريحة تعيّط.'),
      choose(
        'shop_change',
        opt('نخلّي الصرف كامل لماما.', 'good', { fx: { honesty: 2 } }),
        opt('نشري شيبس بعشرين ونقول الخبز غلى.', 'lie', {
          set: ['spent_change'],
          fx: { money: -20, honesty: -3 },
          then: [say('salah', 'هاك، بالهناء.'), N('الشيبس بنين... بصح الحساب ما راهوش صحيح.')],
        }),
      ),
    ]),
    talk('ball_money', 'مراد قدام الحانوت', 'mourad', [
      MO('أمين! راناجمعو للكورة الجديدة، كل واحد ميتين دينار. عندك؟'),
      A('عندي غير المصروف...'),
      MO('خلّي صرف ماماك. تقولها الحليب غلى. كل الأمهات يصدقو!'),
      choose(
        'take_change',
        opt('لا، هادو دراهم ماما. نعطيك من مصروفي غدوة.', 'refuse', {
          set: ['refused_take_change'],
          fx: { mourad: -3, honesty: 3 },
          then: [MO('أوكي... بصح ما تجيش تلعب بكورتنا.')],
        }),
        opt('نعطيك من مصروفي اللي عندي الآن.', 'good', {
          if: 'money>=80',
          fx: { money: -30, mourad: 5 },
          set: ['paid_ball'],
          then: [MO('صحا! هكذا يكون الصاحب.')],
        }),
        opt('هاك الصرف، نقولها بلي الحليب غلى.', 'lie', {
          set: ['kept_change', 'lied_money'],
          fx: { money: -50, mourad: 8, honesty: -6, risk: 3 },
          then: [MO('ملك! غدوة الكورة تاعنا!'), N('الدراهم مشات. الكذبة لازم تتقال دروك.')],
        }),
      ),
    ]),
    goto('home_back', 'ارجع للدار بالخبز', 'home_kitchen'),
    talk('mama_change', 'عطي لماما الخبز والصرف', 'mama', [
      M('جبت الخبز؟ والصرف؟'),
      when(
        'kept_change | spent_change',
        [
          choose(
            'change_story',
            opt('ماما... صرفت الصرف. سامحيني.', 'honest', {
              set: ['confessed_change'],
              unset: ['lied_money'],
              fx: { honesty: 8, anger: 6, trust: -2 },
              then: [M('صرفتو؟! ...على الأقل قلتلي.'), M('من مصروفك الجاي ترجّعهم. هكذا تتعلّم.'), fx({ money: -20 })],
            }),
            opt('عمي صالح قال الحليب غلى...', 'lie', {
              set: ['lied_money'],
              fx: { honesty: -5 },
              then: [M('غلى؟ ...هكذا ولات الدنيا. روح.'), N('ماما صدّقت. وهذا اللي وجع أكثر.')],
            }),
          ),
        ],
        [M('بارك الله فيك يا وليدي، كامل صحيح.', { fx: { trust: 3, parents: 2 } })],
      ),
    ]),
    goto('afternoon', 'العشية — روح شوف الماتش في الملعب', 'football', { time: 60 }),
    talk('walid_meet', 'سلّم على وليد', 'walid', [
      say('walid', 'أمين! جيت تلعب؟ كورتنا قديمة بصح تمشي.'),
      when('kept_change', [say('walid', 'سمعت مراد جمع دراهم الكورة... منين جابهم كامل؟'), A('...ما نعرفش.')]),
      say('walid', 'المدرب حسين يقول اللي يحب يدخل للفريق، لازم يجيب كشف النقاط مليح.'),
      choose(
        'walid_team',
        opt('نحب ندخل! ندير جهدي في القراية.', 'good', { set: ['wants_team'], fx: { confidence: 3, grades: 1 } }),
        opt('الفريق؟ نلعب في الشارع وخلاص.', 'neutral', { fx: {} }),
      ),
      pass(60),
    ]),
    goto('home_night', 'ارجع للدار قبل الليل', 'home_living', {
      deadline: '19:00',
      onLate: { fx: { anger: 6 }, note: 'رجعت متأخر!' },
    }),
  ],
  closing: [
    when('lied_money', [N('ميتين دينار. مبلغ صغير... بصح الكذبة ما عندهاش وزن، عندها ثمن.')]),
    when('confessed_change', [N('أمين رجّع الدراهم من مصروفو. صعيب، بصح نظيف.')]),
    when('!lied_money & !confessed_change', [N('الصرف رجع كامل. حاجة صغيرة، بصح ماما ما نساتهاش.')]),
  ],
};

const ch3: Chapter = {
  id: 3,
  act: 1,
  title: 'صحاب الحومة',
  mission: 'ثلاثة طرقات',
  age: 10,
  summary: 'في الحومة كاين وليد اللي يحب الكورة والقراية، مراد صاحب الطفولة، كمال الكبير تاع العمارة، وحسان تاع دار الشباب.',
  start: { spot: 'home_door', time: '14:00' },
  cast: { mourad: 'crossroads', kamel: 'stairs', walid: 'football', coach: 'football', hassane: 'dar_chabab_front' },
  opening: [N('العشية بعد القراية. الحومة عندها ثلاثة طرقات، وكل طريق فيه صاحب.')],
  objectives: [
    talk('mourad_corner', 'مراد في القاطعة', 'mourad', [
      MO('أمين! تعرف كمال تاع العمارة؟ قالي نوليو معاه، عندو دراهم ديما.'),
      MO('أرواح نسلمو عليه، الكبار يحترموه.'),
      choose(
        'follow_mourad',
        opt('أرواح نشوفو.', 'neutral', { set: ['went_to_kamel'], fx: { mourad: 3 } }),
        opt('ما نحبش الكبار تاع العمارة.', 'refuse', { fx: { mourad: -2, confidence: 2 } }),
      ),
    ]),
    talk(
      'kamel_meet',
      'كمال تحت الدروج',
      'kamel',
      [
        say('kamel', 'هذا هو صاحبك يا مراد؟ صغير بزاف.'),
        say('kamel', 'اسمع يا الصغير. روح لعمي صالح جيبلي باكية دخان، قولو بابا بعثني.'),
        say('kamel', 'هاك مية دينار، والصرف خلّيه ليك.'),
        choose(
          'kamel_errand',
          opt('لا. ما نجيبش الدخان.', 'refuse', {
            set: ['refused_kamel'],
            fx: { confidence: 6, risk: -2, mourad: -2 },
            then: [say('kamel', 'هههه، خاف! روح لماماك.'), MO('...خلّيه يا كمال.'), N('ضحكو. بصح أمين حس بحاجة صحيحة في صدرو.')],
          }),
          opt('هات الدراهم...', 'bad', {
            set: ['tried_cig_errand'],
            fx: { risk: 6, honesty: -3, money: 100 },
            then: [N('أمين خذا الدراهم. الطريق للحانوت ولا طويل.')],
          }),
        ),
      ],
      { if: 'went_to_kamel' },
    ),
    act(
      'cig_shop',
      'روح للحانوت',
      'counter',
      [
        say('salah', 'دخان؟ ليك أنت؟'),
        A('...لبابا.'),
        say('salah', 'باباك ما يتكيّفش يا أمين، نعرفو من عشرين سنة.'),
        say('salah', 'الدخان ما يتباعش للصغار. ومول الدراهم قولو يجي وحدو.'),
        choose(
          'cig_truth',
          opt('سامحني يا عمي صالح. كمال اللي بعثني.', 'honest', {
            set: ['told_salah_kamel'],
            fx: { honesty: 5, money: -100 },
            then: [say('salah', 'رجّعلو الدراهم وقولو عمي صالح يسلم عليك. وأنت ابعد عليهم يا وليدي.'), fx({ risk: -3 })],
          }),
          opt('نسكت ونخرج.', 'neutral', { fx: { money: -100 }, then: [N('أمين رجّع الدراهم لكمال بلا ما يقول والو.')] }),
        ),
      ],
      { if: 'tried_cig_errand' },
    ),
    goto('to_field', 'روح للملعب، وليد يستنّى', 'football'),
    talk('coach_meet', 'كلّم المدرب حسين', 'coach', [
      say('coach', 'أنت صاحب وليد؟ شفتك تلعب في الشارع، رجلك مليحة.'),
      say('coach', 'التدريب نهار الثلاثاء والخميس. بصح شرطي واحد: ما كانش غياب على القراية.'),
      when('skipped_ch1', [say('coach', 'سمعت بلي هربت من المدرسة مرة... هنا ما تهربش.')]),
      choose(
        'join_team',
        opt('موافق! نجي للتدريب ونحافظ على القراية.', 'good', {
          set: ['joined_team'],
          fx: { confidence: 6, health: 3 },
          then: [say('walid', 'مرحبا بيك في الفريق يا أمين!'), fx({}, { set: ['friends_walid'] })],
        }),
        opt('نخمّم شوية.', 'neutral', { fx: { confidence: -1 } }),
      ),
      pass(90),
    ]),
    // ---- the first volunteering: tree planting at Dar Chabab ------------------
    talk('hassane_invite', 'المنشّط حسان يوزّع أوراق قدام دار الشباب', 'hassane', [
      say('hassane', 'السلام عليكم يا البطل! أنا حسان، منشّط في دار الشباب. هاك ورقة.'),
      N('على الورقة: "حملة التشجير — كل طفل يغرس شجرة ويكتب عليها اسمو".'),
      say('hassane', 'اليوم العشية في الساحة اللي ورا. ما تحتاج حتى حاجة: غير يديك وقلبك.'),
      choose(
        'first_volunteer',
        opt('نجي! نحب نغرس شجرة باسمي.', 'help', { set: ['volunteer_kid'], fx: { confidence: 2 } }),
        opt('مرة أخرى إن شاء الله.', 'neutral', { then: [say('hassane', 'الباب مفتوح ديما. الشجرة تستنّاك.')] }),
      ),
    ]),
    act(
      'first_tree',
      'اغرس شجرتك الأولى في ساحة دار الشباب',
      'garden_plot',
      [
        N('حفرة صغيرة، شتلة زيتون، وبيدون ما. أطفال الحومة كامل يحفرو ويضحكو.'),
        say('hassane', 'شوف: الشجرة كيما الإنسان. تحتاج ما، شمس، وواحد يتفكّرها.'),
        N('أمين كتب على لوحة صغيرة بخط معوّج: "شجرة أمين — 10 سنين". وحطها حداها.', { cam: 'close' }),
        say('hassane', 'كل عام تجي تشوفها. نشوفو شكون يكبر أكثر: أنت ولا هي!'),
        fx({ confidence: 4, parents: 2, health: 1 }, { set: ['volunteer_spirit', 'planted_tree'] }),
        pass(45),
      ],
      { if: 'volunteer_kid' },
    ),
    goto('home_eve', 'ارجع للدار', 'home_living', {
      deadline: '18:30',
      onLate: { fx: { anger: 6, trust: -2 }, note: 'رجعت مع الليل.' },
    }),
    talk('baba_eve', 'احكي لبابا', 'baba', [
      B('شكون كنت معاه اليوم؟'),
      when('joined_team', [A('دخلت لفريق المدرب حسين!'), B('حسين؟ راجل مليح. بصح القراية قبل الكورة.', { fx: { trust: 2, parents: 2 } })]),
      when('tried_cig_errand & !told_salah_kamel', [N('أمين ما قالش على الدخان. عمي صالح يسلّم على بابا كل جمعة...'), fx({}, { set: ['cig_secret'] })]),
      when('told_salah_kamel', [
        A('كمال تاع العمارة بعثني نجيبلو الدخان... ورفضت في الأخير.'),
        B('ابعد على هذاك الشاب. ويعطيك الصحة خاطر قلتلي.', { fx: { trust: 5, honesty: 3 } }),
      ]),
      when('refused_kamel', [A('كمال حب يبعثني نجيبلو الدخان، قلتلو لا.'), B('هذا هو! راني فخور بيك.', { fx: { trust: 5, confidence: 2 } })]),
      when('volunteer_kid', [
        A('وبابا! غرست شجرة في دار الشباب، وكتبت عليها اسمي!'),
        B('اللي يغرس شجرة، يغرس الخير في الحومة كاملة. جدّك يفرح كي يسمع.', { fx: { trust: 2, parents: 3 } }),
      ]),
    ]),
  ],
  closing: [
    N('ثلاثة صحاب، ثلاثة طرقات. أمين باقي صغير، بصح الاختيار بدا من اليوم.'),
    when('volunteer_kid', [N('وطريق رابع، صغير كيما شتلة: في ساحة دار الشباب، شجرة عليها اسم أمين.')]),
  ],
};

const ch4: Chapter = {
  id: 4,
  act: 1,
  title: 'الماتش اللي ما كملش',
  mission: 'ماتش الحومات',
  age: 10,
  summary: 'ماتش كبير ضد ولاد الحومة الفوقانية... وغدوة فرض في الحساب.',
  start: { spot: 'home_bedroom', time: '15:00' },
  cast: { mourad: 'football', walid: 'football', fatiha: 'football' },
  opening: [
    N('اليوم الماتش الكبير. الحومة التحتانية ضد الحومة الفوقانية.'),
    M('أمين، غدوة عندك فرض في الحساب. راجع قبل ما تخرج!'),
  ],
  objectives: [
    act('study_first', 'المكتب — راجع قبل الماتش ولا لا؟', 'desk', [
      N('كراس الحساب مفتوح. من الطاقة تسمع الصغار يعيّطو: "أمين! الماتش!"'),
      choose(
        'study_before',
        opt('نراجع ساعة ومن بعد نروح.', 'good', {
          set: ['studied_ch4'],
          fx: { grades: 5, mourad: -2 },
          then: [pass(60), N('ساعة كاملة مع الكسور. الراس تعب بصح فهم.')],
        }),
        opt('نراجع في الليل. الماتش ما يستنّاش!', 'bad', { set: ['skipped_study_ch4'], fx: { grades: -1 } }),
      ),
    ]),
    goto('to_match', 'روح للملعب', 'football'),
    talk('lineup', 'وليد يحضّر التشكيلة', 'walid', [
      say('walid', 'أمين! ولاد الفوق جابو واحد طويل كالعمود. شكون يحرسو؟'),
      choose(
        'position',
        opt('أنا نحرسو. نلعب في الدفاع.', 'good', { fx: { confidence: 2 }, set: ['played_defense'] }),
        opt('أنا نهاجم. نجيبلكم قول!', 'neutral', { fx: { confidence: 3 }, set: ['played_attack'] }),
      ),
      say('walid', 'يالله! الحومة التحتانية ما تطيحش!'),
    ]),
    talk('match', 'كلّم مراد، الماتش بدا', 'mourad', [
      MO('وأخيرا جيت! راهم غالبينا جوج لصفر!'),
      when('studied_ch4', [MO('وين كنت؟ تقرا؟ في نهار الماتش؟!')]),
      when('played_attack', [N('أمين دخل في الهجوم. دريبل، شاط... قول! جوج لواحد!')], [N('أمين دخل في الدفاع. قطع كورة، جوج، والطويل ما عداش. جوج لواحد!')]),
      N('مراد ضرب الكورة بكل قوتو... طاااخ! الزاج تاع خالتي فتيحة تكسّر.'),
      N('الكل هرب. مراد أول واحد.'),
      choose(
        'window',
        opt('نهرب معاهم.', 'bad', { set: ['ran_window'], fx: { honesty: -4, mourad: 3 } }),
        opt('نوقف ونروح لخالتي فتيحة.', 'honest', {
          set: ['stayed_window'],
          fx: { honesty: 6, confidence: 4 },
          then: [
            say('fatiha', 'شكون كسّر الزاج؟!'),
            choose(
              'tell_who',
              opt('مراد ضربها... بصح كانت غلطة.', 'honest', {
                set: ['told_on_mourad'],
                fx: { mourad: -10, honesty: 2 },
                then: [say('fatiha', 'مراد! نهدر مع يماه. وأنت يعطيك الصحة على الصراحة.')],
              }),
              opt('أنا كنت في الماتش. نعاونو كامل في الخلاص.', 'good', {
                set: ['shared_blame'],
                fx: { money: -30, mourad: 4, trust: 2 },
                then: [say('fatiha', 'راجل صغير. خلّي الدراهم، قول لصحابك يجيو يعتذرو.')],
              }),
            ),
          ],
        }),
      ),
      pass(30),
    ]),
    goto('home_after', 'ارجع للدار', 'home_living', { deadline: '19:00', onLate: { fx: { anger: 5 }, note: 'الليل طاح.' } }),
    act(
      'night_study',
      'الفرض غدوة — راجع في الليل',
      'desk',
      [
        N('العينين ثقال. الأرقام يرقصو.'),
        choose(
          'night_effort',
          opt('نكمّل حتى نفهم.', 'good', { fx: { grades: 3, health: -2 }, set: ['studied_ch4'] }),
          opt('نرقد. ربي يسهّل.', 'neutral', { fx: { grades: -2 } }),
        ),
      ],
      { if: 'skipped_study_ch4' },
    ),
    talk('mama_night', 'ماما', 'mama', [
      when('ran_window', [M('خالتي فتيحة جات... قالت الزاج تكسّر وولاد الحومة هربو. كنت معاهم؟')]),
      when(
        'ran_window',
        [
          choose(
            'window_mama',
            opt('إيه... كنت. وهربت.', 'honest', {
              fx: { honesty: 6, anger: 4 },
              set: ['admitted_window'],
              then: [M('الهروب ما يصلّحش الزاج. غدوة تروح تعتذر.')],
            }),
            opt('لا، كنت بعيد.', 'lie', { fx: { honesty: -5 }, set: ['lied_window'] }),
          ),
        ],
        [M('سمعت واش درت مع خالتي فتيحة. ربي يرضى عليك.', { if: 'stayed_window', fx: { parents: 4, trust: 3 } })],
      ),
    ]),
  ],
  closing: [
    when('studied_ch4', [N('الماتش ما كملش... بصح الفرض راهو موجد.')], [N('الماتش ما كملش، والكراس حتى هو.')]),
  ],
};

const ch5: Chapter = {
  id: 5,
  act: 1,
  title: 'الاستدعاء',
  mission: 'ورقة من المدير',
  age: 10,
  summary: 'المدير يبعث استدعاء. لمن؟ وعلاه؟ كل شي يتعلّق بواش صرا من قبل.',
  start: { spot: 'home_bedroom', time: '07:15' },
  cast: { mourad: 'school_courtyard', fatiha: 'home_door' },
  opening: [N('نهار الفرض. الحومة ساكتة، والمدرسة تستنّى.')],
  objectives: [
    goto('to_school', 'روح للمدرسة', 'school_gate', {
      deadline: '08:00',
      onLate: { set: ['late_ch5'], fx: { attendance: -3 }, note: 'وصلت متأخر نهار الفرض!' },
    }),
    act(
      'exam',
      'الفرض — اقعد في بلاصتك',
      'school_desk',
      [
        say('teacher', 'كل واحد في بلاصتو. ساعة واحدة.'),
        when(
          'studied_ch4',
          [N('الكسور... هاذو شفتهم! القلم يمشي وحدو.'), fx({ grades: 6, confidence: 4 })],
          [N('الكسور... الأرقام ما يتذكّروش.'), fx({ grades: -4, confidence: -3 })],
        ),
        when('late_ch5', [say('teacher', 'جيت متأخر، عندك نص ساعة برك.'), fx({ grades: -2 })]),
        N('الولد اللي حداك دفع الورقة تاعو شوية لجيهتك. الأجوبة باينين.'),
        choose(
          'copy_offer',
          opt('نشوف الورقة تاعي برك.', 'refuse', { fx: { honesty: 3, confidence: 2 } }),
          opt('نقرا شوية من عندو...', 'bad', {
            set: ['copied_ch5'],
            fx: { grades: 2, honesty: -6 },
            then: [say('teacher', 'أمين! العينين في ورقتك!'), N('سي لخضر ما زادش. بصح كتب حاجة في الكراس تاعو.')],
          }),
        ),
      ],
      { time: 120 },
    ),
    talk('director_letter', 'المدير يعيّطلك', 'director', [
      when(
        'skipped_ch1 | homework_caught | late_ch1 | late_ch5',
        [
          say('director', 'أمين. هذا استدعاء لباباك. غيابات، تأخر، واجبات ناقصة.'),
          say('director', 'نحب نشوفو هنا نهار الأحد. فاهم؟'),
          fx({}, { set: ['letter_amine'] }),
        ],
        [
          say('director', 'أمين، أنت ساكن قريب من مراد. هذا استدعاء لعائلتو.'),
          say('director', 'عطيه لخالتو فتيحة، هي اللي تهتم بيه.'),
          fx({}, { set: ['letter_mourad'] }),
        ],
      ),
    ]),
    talk(
      'mourad_letter_ask',
      'مراد في الساحة',
      'mourad',
      [
        MO('أمين... سمعت. الورقة تاعي عندك؟'),
        MO('عافاك قطّعها. إذا خالتي شافتها، بابا يقتلني.'),
        choose(
          'mourad_letter',
          opt('ما نقدرش يا مراد. نعطيها لخالتك ونكون معاك.', 'good', {
            set: ['will_deliver'],
            fx: { mourad: -4, honesty: 4 },
            then: [MO('...ديما تختار الصح، حتى على حسابي.'), A('نختارك أنت. بصح ماشي بالكذب.')],
          }),
          opt('هاك، دير بيها واش تحب.', 'bad', {
            set: ['gave_letter_mourad'],
            fx: { mourad: 10, honesty: -4, risk: 2 },
            then: [MO('أنت صاحب صح!'), N('مراد قطّع الورقة ورماها. والمدير ما ينساش.')],
          }),
        ),
      ],
      { if: 'letter_mourad' },
    ),
    talk(
      'fatiha_letter',
      'عطي الورقة لخالتي فتيحة قدام الدار',
      'fatiha',
      [
        say('fatiha', 'استدعاء؟ مراد؟ يا ربي...'),
        say('fatiha', 'يعطيك الصحة يا أمين. أنت ولد أصيل. نهدر معاه بالشوية.'),
        fx({ trust: 3, parents: 2 }, { set: ['delivered_letter'] }),
      ],
      { if: 'will_deliver' },
    ),
    act(
      'hide_choice',
      'الاستدعاء في الكارطابل... قبل ما تدخل للدار',
      'bed',
      [
        N('الورقة في الكارطابل. فيها اسمك وتوقيع المدير.'),
        choose(
          'letter_decision',
          opt('نعطيها لبابا الليلة.', 'honest', { set: ['will_give_letter'], fx: { honesty: 4 } }),
          opt('نخبّيها تحت الماطلة.', 'lie', {
            set: ['hid_letter'],
            fx: { honesty: -8, risk: 3 },
            then: [N('الورقة تحت الماطلة. بصح الماطلة ما تخبّيش الصوت تاع التيليفون.')],
          }),
        ),
      ],
      { if: 'letter_amine' },
    ),
    talk('baba_letter', 'روح لبابا', 'baba', [
      when('will_give_letter', [
        A('بابا... المدير بعثلك هذي.'),
        B('استدعاء...؟ اقعد.'),
        B('القراءة تاعك، الغيابات... أمين، علاه؟'),
        when('confessed_ch1', [B('على الأقل ما خبّيتهاش. كيما في نهار الملعب، جيت وقلت.')]),
        B('نروح الأحد. ومن اليوم كاين قواعد جديدة.'),
        fx({ trust: 2, anger: 10, honesty: 4 }, { set: ['faced_convocation'] }),
      ]),
      when('hid_letter', [
        B('المدير عيّطلي. قال بعث معاك ورقة. وين هي؟'),
        A('...'),
        B('تحت الماطلة؟ أمين! الغلطة كانت صغيرة، والكذبة كبّرتها.'),
        fx({ trust: -14, anger: 20, parents: -4 }, { set: ['faced_convocation', 'caught_hiding_letter'] }),
      ]),
      when('letter_mourad', [
        B('سمعت من فتيحة على الورقة تاع مراد.', { if: 'delivered_letter' }),
        B('ما ساهلش تعطي ورقة كيما هذي لصاحبك. بصح هذا هو الصح.', { if: 'delivered_letter', fx: { trust: 3 } }),
        B('المدير عيّط على مراد. قال بعث الورقة معاك... وما وصلت لحتى واحد.', { if: 'gave_letter_mourad', fx: { trust: -6, anger: 8 } }),
        when('!delivered_letter & !gave_letter_mourad', [B('كيفاش كان الفرض؟')]),
      ]),
      when('faced_convocation', [
        B('من اليوم، واش راك ناوي؟'),
        choose(
          'after_convocation',
          opt('نقرا كل عشية، وما نغيبش. ونوريك.', 'good', { set: ['plan_ch5'], fx: { trust: 3 } }),
          opt('...ما نعرفش.', 'neutral', { fx: { confidence: -2 } }),
        ),
      ]),
      when('lied_money & faced_convocation', [B('وزيد... عمي صالح قالي بلي الحليب ما غلاش. تفكّرت هذيك المرة؟', { fx: { trust: -5, honesty: -2 } }), fx({}, { set: ['money_lie_found'] })]),
    ]),
  ],
  closing: [
    when('faced_convocation', [N('نهار الأحد، المكتب تاع المدير. بابا لابس الجاكيطة تاع الأعراس. أمين ما نساش هذيك النظرة.')]),
    when('!faced_convocation', [N('الاستدعاء ما كانش ليه هذي المرة. بصح الحومة صغيرة، والأخبار تمشي.')]),
  ],
};

export const ACT1A: Chapter[] = [ch1, ch2, ch3, ch4, ch5];
