// ACT I — Chapters 6–22: childhood, ages 10–12.
import type { Chapter } from '../../types/game';
import { A, B, M, MO, N, choose, fx, goto, opt, pass, say, talk, use, when } from './dsl';

const ch6: Chapter = {
  id: 6,
  act: 1,
  title: 'أول عقوبة',
  mission: 'نرجّع الثقة',
  age: 10,
  summary: 'بعد الاستدعاء، القواعد تبدّلت في الدار. الثقة ما ترجعش بالكلام.',
  start: { spot: 'home_living', time: '16:30' },
  opening: [N('الدار ساكتة. التلفزيون مطفي. بابا يستنّى في الصالون.')],
  objectives: [
    talk('rules', 'بابا يحب يهدر معاك', 'baba', [
      when(
        'faced_convocation',
        [
          B('من اليوم: المصروف ينقص للنص، التلفزيون ممنوع شهر، وكل عشية ساعة قراية.'),
          when('caught_hiding_letter', [B('والكذبة تاع الورقة... هذي اللي وجعتني أكثر من الغيابات.')]),
          fx({}, { set: ['allowance_cut'] }),
        ],
        [
          when(
            'lied_money | lied_window | caught_lie_ch1',
            [B('ما كانش استدعاء ليك، بصح الكذبات الصغار وصلولي. سيمانة بلا كورة.'), fx({}, { set: ['no_football'] })],
            [B('ما عندكش عقوبة يا أمين. بصح الحومة تبدّلت، ونحبك تكون حاضي روحك.')],
          ),
        ],
      ),
      choose(
        'accept_rules',
        opt('عندك الحق يا بابا. نصلّح.', 'good', { fx: { trust: 4, anger: -5 }, set: ['accepted_rules'] }),
        opt('ماشي عدل! مراد ما عندو حتى عقوبة!', 'bad', {
          fx: { anger: 8, trust: -2 },
          then: [B('مراد ماشي وليدي. أنت وليدي.')],
        }),
      ),
    ]),
    use('tv', 'التلفزيون يعيّط عليك...', 'tv', [
      N('الماتش تاع الشبيبة بدا. التيليكوموند فوق الكنبة.'),
      choose(
        'secret_tv',
        opt('نطفيه ونروح نقرا.', 'good', { fx: { trust: 2, grades: 1 } }),
        opt('نشوف شوية بلا ما يعرفو.', 'bad', {
          fx: { honesty: -3 },
          then: [
            when(
              'allowance_cut',
              [say('selma', 'باباااا! أمين يشوف التلفزيون!'), B('أمين!', { fx: { trust: -5, anger: 6 } })],
              [N('عشر دقايق، وحتى واحد ما شاف.')],
            ),
          ],
        }),
      ),
    ]),
    use('study', 'ساعة قراية في المكتب', 'desk', [
      N('ساعة كاملة. القسمة، والإملاء، والتاريخ.'),
      choose(
        'study_quality',
        opt('نركّز للآخر', 'good', { fx: { grades: 5, confidence: 2 }, set: ['studied_ch6'] }),
        opt('نقلّب الصفحات برك', 'neutral', { fx: { grades: 1 } }),
      ),
      pass(60),
    ]),
    talk('mama_errand', 'ماما تحتاجك للسوق', 'mama', [
      M('خوذ هذي ميتين دينار وجيبلي طماطم وبصل من السوق.', { fx: { money: 200 } }),
      M('وأعرف تساوم شوية، ماشي كل واحد يقولك سومة تخلّصها.'),
    ]),
    goto('to_souk', 'روح للسوق في الساحة', 'souk'),
    use('stall', 'اشري الخضرة', 'stall', [
      say('salah', 'أمين؟ جيت تقضي؟ الطماطم بستين، البصل بخمسين الكيلو.'),
      N('عمي صالح عندو طبلة في السوق نهار الجمعة.'),
      choose(
        'bargain',
        opt('عمي صالح، عطيني الكيلو بخمسين وندّي جوج.', 'good', {
          fx: { money: -180, confidence: 3 },
          set: ['bargained'],
          then: [say('salah', 'هههه، ولد باباه! خوذ.')],
        }),
        opt('نخلّص واش قال.', 'neutral', { fx: { money: -200 } }),
      ),
    ]),
    goto('home_k', 'ارجع للكوزينة', 'home_kitchen'),
    talk('mama_back', 'عطي الخضرة لماما', 'mama', [
      when(
        'bargained',
        [M('رجّعتلي عشرين دينار؟ ساومت؟ هذا هو الراجل!', { fx: { money: -20, trust: 4, parents: 3 } })],
        [M('بارك الله فيك.', { fx: { parents: 1 } })],
      ),
      when('accepted_rules & studied_ch6', [M('شفتك تقرا اليوم. باباك حتى هو شاف.', { fx: { trust: 4 } }), fx({}, { set: ['rebuilding_ch6'] })]),
    ]),
  ],
  closing: [
    N('الثقة كيما الحيط، تتبنى ياجورة بياجورة.'),
    when('rebuilding_ch6', [N('اليوم ياجورة وحدة تحطّت في بلاصتها.')]),
  ],
};

const ch7: Chapter = {
  id: 7,
  act: 1,
  title: 'سر تحت الدروج',
  mission: 'واش كاين تحت الدروج؟',
  age: 10,
  summary: 'تحت دروج العمارة، الكبار يخبّيو حاجة. ومراد ولى يقعد معاهم.',
  start: { spot: 'home_door', time: '16:00' },
  cast: { kamel: 'stairs', mourad: 'stairs' },
  opening: [N('كل عشية، الكبار يتلمّو تحت دروج العمارة. يسكتو كي يفوت واحد.')],
  objectives: [
    goto('to_stairs', 'روح للعمارة', 'stairs'),
    talk('mourad_stairs', 'مراد مع الكبار', 'mourad', [
      MO('أمين؟ واش جابك؟'),
      say('kamel', 'هذا الصغير تاع الدخان؟ ههه. روح من هنا، ما شفت والو.'),
      MO('...روح يا أمين. من بعد نشوفك.'),
      N('مراد ما شافش في عينين أمين.'),
      fx({}, { set: ['saw_stairs'] }),
    ]),
    use('look', 'شوف واش كاين تحت الدروج', 'under_stairs', [
      N('كي مشاو، كيس صغير ملفوف بالبلاستيك مخبّي ورا البوطو.'),
      N('أمين ما يعرفش واش فيه. بصح يعرف بلي ماشي حاجة مليحة.'),
      choose(
        'stairs_bag',
        opt('نخلّيه ونبعد. ونقول لواحد كبير نثق فيه.', 'good', { set: ['will_tell_stairs'], fx: { confidence: 2 } }),
        opt('نخلّيه وننسى. ماشي شغلي.', 'neutral', { set: ['kept_stairs_secret'] }),
        opt('ندّيه نشوف واش فيه.', 'bad', {
          set: ['touched_bag'],
          fx: { risk: 8 },
          then: [
            say('kamel', 'هيه! واش راك دير؟! حطّو!'),
            N('كمال رجع. قبض أمين من ذراعو.'),
            say('kamel', 'إذا قلت لحتى واحد... تفهم؟'),
            fx({ confidence: -6, health: -2 }, { set: ['threatened_kamel'] }),
          ],
        }),
      ),
    ]),
    goto('home_eve', 'ارجع للدار', 'home_living', { deadline: '19:00', onLate: { fx: { anger: 5 }, note: 'تأخرت.' } }),
    talk('baba_stairs', 'بابا في الصالون', 'baba', [
      B('مالك ساكت يا أمين؟ كأنك شفت غول.'),
      choose(
        'tell_father_stairs',
        opt('بابا... الكبار تحت الدروج يخبّيو حاجة. ومراد معاهم.', 'honest', {
          set: ['told_adult_stairs'],
          fx: { trust: 6, honesty: 5, risk: -3 },
          then: [
            B('...ربي يستر. يعطيك الصحة خاطر قلتلي.'),
            B('ما تقربش لتماك. وأنا نهدر مع الجيران ومع خالتي فتيحة على مراد.'),
            when('threatened_kamel', [B('هدّدك؟! ...ما تخافش. الراجل اللي يهدّد طفل، هو اللي خايف.', { fx: { confidence: 4 } })]),
          ],
        }),
        opt('والو، غير عيان.', 'neutral', {
          set: ['kept_stairs_secret'],
          then: [B('روح ترقد بكري.'), N('السر ثقيل على طفل عندو عشر سنين.')],
        }),
      ),
    ]),
  ],
  closing: [
    when('told_adult_stairs', [N('السر خرج من قلب أمين ودخل لراجل كبير يقدر يحملو. هكذا لازم يكون.')], [N('تحت الدروج، الكيس باقي. ومراد باقي.')]),
  ],
};

const ch8: Chapter = {
  id: 8,
  act: 1,
  title: 'نهار السوق',
  mission: 'السوق مع بابا',
  age: 11,
  summary: 'نهار جمعة في السوق مع بابا. الأسوام، الخدمة، وقيمة الدينار.',
  start: { spot: 'home_living', time: '08:30' },
  cast: { baba: 'souk', salah: 'souk' },
  opening: [N('عام فات. أمين عندو إحدى عشر سنة. بابا قالو: "اليوم تجي معايا للسوق."')],
  objectives: [
    talk('mama_list', 'خوذ القائمة من ماما', 'mama', [
      M('هاك القائمة: زيت، سميد، خضرة. ورد بالك على باباك، يصرف بزاف كي يشوف الفاكية!'),
    ]),
    goto('to_souk', 'الحق بابا في السوق', 'souk'),
    talk('baba_souk', 'بابا يستنّاك', 'baba', [
      B('شوف هذا الشيباني تاع الطماطم. ينوض الثلاثة تاع الصباح باش يجيب السلعة من الفلاحة.'),
      B('كل دينار في جيبك، وراه عرق واحد.'),
      B('أنا نخدم في الشانطي من السبعة حتى الخمسة. واش تظن السمنت يتحمل بالساهل؟'),
      choose(
        'souk_lesson',
        opt('شحال تربح في النهار يا بابا؟', 'good', {
          fx: { parents: 4 },
          then: [B('على قد الحاجة. والحاجة كثيرة. لهذا نقولك احفظ مصروفك.')],
        }),
        opt('بابا، شريلي هذيك الكورة!', 'neutral', { then: [B('ههه، نشوفو إذا بقات الدراهم.')] }),
      ),
    ]),
    use('work_stall', 'عاون عمي صالح في الطبلة', 'stall', [
      say('salah', 'أمين! عاوني نرتب هاذ الكراطن ونعطيك حقّك.'),
      choose(
        'work_souk',
        opt('نخدم ساعة.', 'good', {
          fx: { money: 50, confidence: 4 },
          set: ['earned_souk'],
          then: [pass(60), say('salah', 'هاك خمسين دينار. حلال عليك.'), N('أول دراهم ربحهم بيدو.')],
        }),
        opt('ما عنديش الوقت.', 'neutral', {}),
      ),
    ]),
    talk('baba_money', 'ارجع لبابا', 'baba', [
      when('earned_souk', [B('شفتك تخدم. كيفاش الشعور؟'), A('عيّاني... بصح فرحان.'), B('هذا هو الفرق بين دراهم تتعطالك ودراهم تربحها.', { fx: { trust: 3 } })]),
      B('واش تحب تدير بالدراهم اللي عندك؟'),
      choose(
        'spend_souk',
        opt('نشري لماما حاجة صغيرة.', 'good', {
          if: 'money>=40',
          fx: { money: -40, parents: 6 },
          set: ['gift_mama_ch8'],
          then: [N('مشط خشب مزوّق. ماما راح تفرح.')],
        }),
        opt('نحطّهم في الحصالة.', 'good', {
          if: 'money>=40',
          fx: { money: -40, savings: 40 },
          set: ['saver'],
          then: [B('اللي يحفظ الصغير، يلقى الكبير.')],
        }),
        opt('نشري حلوى وكارطات الكورة.', 'neutral', { fx: { money: -30, confidence: 1 } }),
      ),
    ]),
    goto('home_k', 'ارجع للدار', 'home_kitchen'),
    talk('mama_back', 'ماما', 'mama', [
      M('جيتو؟ وريني واش جبتو.'),
      when('gift_mama_ch8', [M('مشط؟ ليا أنا؟ ...ربي يخليك ليا يا أمين.')]),
    ]),
  ],
  closing: [N('في الليل، أمين حسب الدراهم تاعو. لأول مرة، كل دينار عندو قصة.')],
};

const ch9: Chapter = {
  id: 9,
  act: 1,
  title: 'الكراس الضايع',
  mission: 'وين راح الكراس؟',
  age: 11,
  summary: 'كراس الدروس ضاع، وغدوة لازم يتصحح. الصح ولا التحايل؟',
  start: { spot: 'classroom', time: '11:30' },
  cast: { mourad: 'crossroads', walid: 'football' },
  opening: [say('teacher', 'غدوة كل واحد يجيب كراس الدروس، نشوف إذا راكم تكتبو.')],
  objectives: [
    use('bag', 'دوّر في المحفظة', 'school_desk', [
      N('المحفظة... الكتاب، المقلمة... والكراس؟ ما كانش!'),
      A('يا ربي... وين خلّيتو؟'),
    ]),
    goto('to_field', 'يمكن نسيتو في الملعب', 'football'),
    talk('walid_nb', 'اسقسي وليد', 'walid', [
      say('walid', 'الكراس الأزرق؟ مراد خذاه البارح، قال ينقل منه الدروس.'),
      when('friends_walid', [say('walid', 'وإذا ما لقيتوش، خوذ تاعي وانقل منه الليلة.'), fx({}, { set: ['walid_offer_nb'] })]),
    ]),
    talk('mourad_nb', 'روح لمراد في القاطعة', 'mourad', [
      MO('الكراس؟ ...ضيّعتو. سامحني يا خو.'),
      MO('قول للمعلم بلي سرقوهولك. ما راح يعرف حتى واحد.'),
      choose(
        'notebook_plan',
        opt('نعاود نكتب الدروس الليلة ونقول الصح.', 'honest', { set: ['rewrite_nb'], fx: { mourad: -1, confidence: 2 } }),
        opt('نقول سرقوهولي.', 'lie', { set: ['lie_nb'], fx: { mourad: 3, honesty: -4 } }),
        opt('نقول بلي مراد ضيّعو.', 'neutral', { set: ['blame_mourad_nb'], fx: { mourad: -8 } }),
      ),
    ]),
    use(
      'rewrite',
      'عاود اكتب الدروس في المكتب',
      'desk',
      [
        when('walid_offer_nb', [N('كراس وليد مرتّب، خطّو مليح.')]),
        N('ثلاث ساعات تكتب. اليد تعبت.'),
        fx({ grades: 5, health: -1 }),
        pass(180),
      ],
      { if: 'rewrite_nb' },
    ),
    goto('next_morning', 'الصباح — روح للقسم', 'classroom', { skipTo: '08:00' }),
    talk('teacher_nb', 'وري الكراس للمعلم', 'teacher', [
      when('rewrite_nb', [
        A('سي لخضر، الكراس الأول ضاع. عاودت كتبت الدروس كامل.'),
        say('teacher', 'كامل؟ في ليلة؟ ...هذا هو المسؤول. عشرة على عشرة على الصدق.', { fx: { grades: 3, honesty: 6, confidence: 4 } }),
      ]),
      when('lie_nb', [
        A('سرقولي الكراس يا سي لخضر.'),
        say('teacher', 'سرقوه؟ شكون يسرق كراس؟ ...على كل حال، صفر في الكراس.', { fx: { grades: -4 } }),
        N('سي لخضر شاف في أمين شوية زايدة. المعلمين يعرفو.'),
      ]),
      when('blame_mourad_nb', [
        A('مراد ضيّعلي الكراس.'),
        say('teacher', 'وعلاه تعطي كراسك لمراد؟ أنت مسؤول على حوايجك. وما تحطّش الغلطة على صاحبك.', { fx: { grades: -2 } }),
        MO('...شكرا يا صاحبي.', { fx: { mourad: -4 } }),
      ]),
    ]),
  ],
  closing: [N('كراس ضايع، حاجة صغيرة. بصح كيفاش تتصرف في الحاجات الصغار، هو اللي يحضّرك للكبار.')],
};

const ch10: Chapter = {
  id: 10,
  act: 1,
  title: 'مراد تبدّل',
  mission: 'صاحبي ماشي كيما كان',
  age: 11,
  summary: 'سبّاط جديد، هدرة جديدة، صحاب جداد. مراد ولى واحد آخر.',
  start: { spot: 'home_door', time: '15:00' },
  cast: { mourad: 'crossroads', fatiha: 'home_door', kamel: 'stairs' },
  opening: [N('مراد ما بقاش يجي للقسم كل نهار. وكي يجي، يجي بحوايج جداد.')],
  objectives: [
    talk('fatiha_worry', 'خالتي فتيحة تحب تهدر معاك', 'fatiha', [
      say('fatiha', 'أمين يا وليدي... مراد ما بقاش يرقد في الدار بكري. منين يجيب الدراهم؟'),
      say('fatiha', 'أنت صاحبو. إذا شفت حاجة، قولّي. ماشي باش نعاقبو، باش نعاونو.'),
      choose(
        'promise_fatiha',
        opt('واخا يا خالتي. نحاول نهدر معاه.', 'good', { set: ['promised_fatiha'], fx: { trust: 2 } }),
        opt('ما نحبش نكون جاسوس على صاحبي.', 'neutral', { fx: { mourad: 2 } }),
      ),
    ]),
    talk('mourad_new', 'مراد في القاطعة بسبّاط جديد', 'mourad', [
      MO('شفت؟ نايك أصلي! ثمانية آلاف دينار.'),
      choose(
        'ask_money',
        opt('منين جبت هاذ الدراهم كامل؟', 'good', {
          fx: { mourad: -2 },
          then: [MO('نخدم مع كمال. نوصّل حوايج صغار. ساهل.'), MO('تحب تخدم حتى أنت؟ ربح ساهل.'), fx({}, { set: ['knows_errands'] })],
        }),
        opt('واو، يشبح! نحب واحد كيفو.', 'neutral', {
          fx: { mourad: 3, risk: 2 },
          then: [MO('ساهل. اخدم مع كمال وتشريه في سيمانة.'), fx({}, { set: ['knows_errands'] })],
        }),
      ),
    ]),
    goto('to_stairs', 'روح شوف كمال تحت الدروج', 'stairs', { if: 'knows_errands' }),
    talk('kamel_offer', 'كمال عندو اقتراح', 'kamel', [
      say('kamel', 'صاحب مراد؟ نحتاج واحد صغير، ما يشكّو فيه حتى واحد.'),
      say('kamel', 'توصّل كيس للساحة، تاخذ خمسمية. ما تسقسيش واش فيه.'),
      choose(
        'kamel_errand',
        opt('لا. ما نوصّلش حاجة ما نعرفهاش.', 'refuse', { set: ['refused_kamel_errand', 'refused_kamel'], fx: { confidence: 5, risk: -2 } }),
        opt('...خمسمية؟ مرة وحدة برك.', 'bad', {
          set: ['did_errand'],
          fx: { money: 500, risk: 12, honesty: -5, health: -1 },
          then: [N('الكيس خفيف. بصح اليد تاع أمين كانت ترعد كل الطريق.')],
        }),
      ),
    ]),
    talk('mourad_talk', 'ارجع لمراد', 'mourad', [
      when('refused_kamel_errand', [MO('علاه رفضت؟ راك تحسبني نخدم في الحرام؟'), A('ما نعرفش يا مراد. وهذا اللي يخوّفني.')]),
      when('did_errand', [MO('شفت؟ ساهل!'), A('...'), N('أمين ما قدرش يقول والو. الخمسمية في جيبو ثقال كالحجر.')]),
      choose(
        'warn_mourad',
        opt('مراد، هاذ الطريق ما يخرّجش. خالتك قلقانة عليك.', 'good', {
          fx: { mourad: -3, confidence: 2 },
          set: ['warned_mourad_11'],
          then: [MO('خالتي؟ ...ما تقولهاش والو، عافاك.')],
        }),
        opt('نتلاقاو غدوة للماتش.', 'neutral', { fx: { mourad: 2 } }),
      ),
    ]),
  ],
  closing: [
    N('صاحب الطفولة بدا يبعد. ماشي بالمسافة، بالطريق.'),
    when('did_errand', [N('وأمين تبعو خطوة. خطوة وحدة... بصح الخطوة الأولى هي الأصعب للرجوع.')]),
  ],
};

const ch11: Chapter = {
  id: 11,
  act: 1,
  title: 'أول امتحان صعيب',
  mission: 'كشف النقاط',
  age: 11,
  summary: 'نتائج الفصل الأول. الكشف لازم يتوقّع من الوالدين.',
  start: { spot: 'classroom', time: '09:00' },
  opening: [say('teacher', 'وزّعنا كشوف النقاط. كل واحد يجيبهولي غدوة موقّع.')],
  objectives: [
    use('results', 'خوذ كشف النقاط', 'school_desk', [
      when(
        'grades>=60',
        [N('المعدّل: 13.5 من 20. ماشي ممتاز، بصح مليح.'), fx({ confidence: 4 }, { set: ['good_report_11'] })],
        [N('المعدّل: 8.75 من 20. الحساب: 5. الأحمر في كل بلاصة.'), fx({ confidence: -5 }, { set: ['bad_report_11'] })],
      ),
    ]),
    talk('walid_help', 'وليد في الساحة', 'walid', [
      when('bad_report_11', [say('walid', 'ما تقلقش يا خو. تحب نقراو مع بعض كل سبت؟')], [say('walid', 'مبروك! نقراو مع بعض باش نزيدو؟')]),
      choose(
        'study_group',
        opt('إيه، كل سبت عندي.', 'good', { set: ['study_group'], fx: { grades: 3, confidence: 2 } }),
        opt('ما نحبش القراية في السبت.', 'neutral', {}),
      ),
    ], {}),
    goto('home', 'ارجع للدار بالكشف', 'home_living'),
    use(
      'signature',
      'الكشف يحتاج توقيع بابا...',
      'desk',
      [
        N('الكشف فوق المكتب. الأحمر يبان من بعيد.'),
        choose(
          'forge',
          opt('نوريه لبابا كيما هو.', 'honest', { set: ['showed_report'], fx: { honesty: 4 } }),
          opt('نقلّد التوقيع تاع بابا.', 'lie', { set: ['forged_signature'], fx: { honesty: -10, risk: 4 } }),
        ),
      ],
      { if: 'bad_report_11' },
    ),
    talk('baba_report', 'بابا', 'baba', [
      when('good_report_11', [B('ثلطاش ونص؟ مبروك يا أمين!', { fx: { trust: 4, parents: 3 } }), fx({}, { set: ['showed_report'] })]),
      when('showed_report & bad_report_11', [
        B('ثمانية؟ ...'),
        B('مانيش زعفان على النقطة. نزعف إذا ما حاولتش.'),
        B('واش تحتاج باش تتحسّن؟'),
        choose(
          'report_plan',
          opt('نقرا مع وليد كل سبت، ونعاود الحساب.', 'good', { if: 'study_group', fx: { trust: 6, grades: 2 }, set: ['recovery_plan_11'] }),
          opt('نحتاج دروس دعم في الحساب.', 'good', { fx: { trust: 3, money: 0 }, set: ['tutoring'], then: [B('نشوفو مع سي لخضر. نخلّصو من الشهرية، المهم تقرا.')] }),
          opt('ما نعرفش...', 'neutral', { fx: { confidence: -2 } }),
        ),
      ]),
      when('forged_signature', [
        B('كيفاش راه الكشف تاع الفصل؟'),
        A('...مازال ما عطاوناهش.'),
        N('الكذبة الثانية جات وحدها، باش تحمي الأولى.'),
        fx({ honesty: -4 }),
      ]),
    ]),
  ],
  closing: [
    when('forged_signature', [N('التوقيع المقلّد في المحفظة. والمعلم يعرف التوقيع تاع كل أب.')], [N('النقطة رقم. اللي يجي من بعد، هو اللي يقول شكون أمين.')]),
  ],
};

const ch12: Chapter = {
  id: 12,
  act: 1,
  title: 'السرقة الصغيرة',
  mission: 'في الحانوت',
  age: 11,
  summary: 'في الحانوت، أمين يشوف مراد يدخّل حاجة في جيبو.',
  start: { spot: 'hanout_front', time: '17:00' },
  cast: { mourad: 'hanout' },
  opening: [N('عمي صالح كبر، وعينيه ما بقاوش كيما كانو.')],
  objectives: [
    goto('enter', 'ادخل للحانوت', 'hanout'),
    use('witness', 'اشري حاجة من الكونطوار', 'counter', [
      say('salah', 'واش تحب يا أمين؟'),
      N('ورا الرفوف، أمين شاف مراد يدخّل كارطة تيليفون وشكلاطة في جيبو.'),
      N('مراد شاف أمين. غمزلو.'),
      choose(
        'theft',
        opt('نسكت.', 'neutral', { set: ['silent_theft'], fx: { honesty: -3 } }),
        opt('نشد مراد ونقولو يرجّعها.', 'good', { set: ['confront_theft'] }),
        opt('نقول لعمي صالح.', 'honest', {
          set: ['told_salah_theft'],
          fx: { mourad: -12, honesty: 4 },
          then: [say('salah', 'مراد! ...هات واش في جيبك.'), say('salah', 'يعطيك الصحة يا أمين. صعيبة، بصح صحيحة.')],
        }),
        opt('ندخّل حتى أنا حاجة.', 'bad', { set: ['stole_too'], fx: { risk: 10, honesty: -10 } }),
      ),
    ]),
    talk('mourad_out', 'مراد برا', 'mourad', [
      when('confront_theft', [
        A('مراد، رجّعها. عمي صالح ما عندو والو.'),
        choose(
          'convince_return',
          opt('إذا ما رجّعتهاش، نخلّصها أنا ونقولو.', 'good', {
            if: 'money>=100',
            fx: { money: -100, mourad: 2, honesty: 5 },
            set: ['paid_for_mourad'],
            then: [MO('...راك مهبول. هاك، رجّعها أنت.'), N('مراد عطاه الحوايج. أمين رجّعهم وقال لعمي صالح بلي ولد غلط وندم.')],
          }),
          opt('أنت خير من هكذا يا مراد.', 'good', {
            fx: { mourad: 4 },
            set: ['mourad_returned'],
            then: [MO('...'), N('مراد دخل. حطّ الشكلاطة والكارطة فوق الكونطوار وخرج بلا كلمة.'), say('salah', 'الله يهديك يا وليدي.')],
          }),
        ),
      ]),
      when('silent_theft', [MO('شفت؟ ساهلة. خوذ نص الشكلاطة.'), N('أمين ما كلاش. بصح ما قالش لا.')]),
      when('told_salah_theft', [MO('خاين! كنت نحسبك صاحبي!'), A('صاحبك هو اللي ما يخلّيكش تطيح.'), fx({ confidence: 3 })]),
      when('stole_too', [MO('ههه، ولّيت منّا!'), N('في الطريق، أمين حس بالحاجة في جيبو تحرق.'), fx({ mourad: 6 })]),
    ]),
  ],
  closing: [
    N('شكلاطة وكارطة. حاجات صغار. بصح عمي صالح يعرف كل ولد في الحومة من نهار تزاد.'),
    when('stole_too', [N('أمين ما رقدش مليح. الحاجة الصغيرة ما تخلّيش الضمير يرقد.')]),
  ],
};

const ch13: Chapter = {
  id: 13,
  act: 1,
  title: 'الولد الجديد',
  mission: 'ياسين',
  age: 11,
  summary: 'ياسين جا من ولاية بعيدة. لهجتو مختلفة، والصغار ما رحموهش.',
  start: { spot: 'school_gate', time: '10:00' },
  cast: { mourad: 'school_courtyard' },
  opening: [N('الاستراحة. ساحة المدرسة. صوت الضحك... بصح ماشي ضحك مليح.')],
  objectives: [
    goto('courtyard', 'ادخل للساحة', 'school_courtyard'),
    talk('bully', 'شوف واش صاير لياسين', 'yacine', [
      MO('هاو الجديد! قول "واش راك" كيما تقولوها عندكم! ههه!'),
      say('yacine', '...خلّوني.'),
      N('مراد خطف المحفظة تاع ياسين ورماها. الكتب طاحو في الغبرة.'),
      choose(
        'defend',
        opt('مراد، يزّي! رجّعلو المحفظة.', 'good', {
          set: ['helped_yacine'],
          fx: { mourad: -6, confidence: 6 },
          then: [MO('ههه، ولّيت المحامي تاعو؟'), A('ولّيت واحد ما يضحكش على الضعيف.'), say('yacine', '...شكرا.')],
        }),
        opt('نضحك معاهم.', 'bad', { set: ['mocked_yacine'], fx: { mourad: 4, honesty: -2, confidence: -2 } }),
        opt('نعيّط للمعلم.', 'good', {
          set: ['told_teacher_bully'],
          fx: { mourad: -3 },
          then: [say('teacher', 'واش صاير هنا؟! مراد، للمدير!'), say('yacine', 'شكرا...')],
        }),
      ),
    ]),
    use('pick_books', 'لمّ الكتب مع ياسين', 'notice_board', [
      when(
        'helped_yacine | told_teacher_bully',
        [
          say('yacine', 'أنا من الجنوب، من ورقلة. بابا تحوّل للخدمة هنا.'),
          say('yacine', 'ما نعرف حتى واحد.'),
          A('دروك تعرف واحد.'),
          fx({ confidence: 3 }, { set: ['friends_yacine'] }),
        ],
        [N('ياسين لمّ كتبو وحدو. أمين شاف من بعيد.'), N('ساعات الضحكة تاع الجماعة تخبّي صوت الضمير.')],
      ),
    ]),
    use('class_seat', 'ارجع للقسم', 'school_desk', [
      say('teacher', 'ياسين، اقعد...'),
      choose(
        'seat',
        opt('سي لخضر، يقعد حدايا.', 'good', { set: ['seat_yacine'], fx: { confidence: 2 }, then: [say('teacher', 'مليح يا أمين.')] }),
        opt('نسكت.', 'neutral', {}),
      ),
      when('mocked_yacine', [N('ياسين قعد وحدو في الآخر. ما شافش في حتى واحد.')]),
    ], { time: 240 }),
  ],
  closing: [
    when('helped_yacine | told_teacher_bully', [N('اليوم ياسين لقى صاحب. والصاحب، ما ينساش.')], [N('ياسين بقى وحدو. والوحدة في ساحة مدرسة، أطول من الدرس.')]),
  ],
};

const ch14: Chapter = {
  id: 14,
  act: 1,
  title: 'الوعد لبابا',
  mission: 'راجل الدار',
  age: 11,
  summary: 'بابا رايح يخدم في الجنوب لشهرين. يحتاج يثق في أمين.',
  start: { spot: 'home_living', time: '06:30' },
  cast: { baba: 'home_door' },
  allowance: true,
  opening: [N('الصباح بكري. الحقيبة عند الباب. بابا رايح لحاسي مسعود، شانطي جديد.')],
  objectives: [
    talk('farewell', 'روح لبابا عند الباب', 'baba', [
      B('شهرين ونرجع إن شاء الله. أنت الراجل في الدار دروك.'),
      when('trust<40', [B('...نعرف بلي الثقة بيناتنا تجرحت. بصح نحب نعطيك فرصة.')]),
      B('عاون ماماك، رد بالك على سلمى، وما تغيبش على القراية. نوعدني.'),
      choose(
        'promise',
        opt('نوعدك يا بابا. كلمة رجال.', 'good', { set: ['promise_made'], fx: { trust: 5, parents: 4, confidence: 3 } }),
        opt('نحاول...', 'neutral', { set: ['half_promise'], then: [B('المحاولة مليحة. بصح أنا نحبك تكون متأكد.')] }),
      ),
      B('هاك، هذي ميتين دينار زايدة. للحاجة، ماشي للحلوى.', { fx: { money: 200 } }),
    ]),
    talk('mama_morning', 'ماما في الكوزينة', 'mama', [
      M('باباك مشى... الدار ثقيلة بلا بيه.'),
      M('أمين، تقدر تدّي سلمى للمدرسة كل صباح؟'),
      choose(
        'help_mama',
        opt('إيه يا ماما، عليّا.', 'good', { set: ['takes_selma'], fx: { parents: 5 } }),
        opt('سلمى تعطّلني...', 'neutral', { fx: { parents: -2 } }),
      ),
    ]),
    goto('to_hanout', 'اشري الحليب والخبز للدار', 'hanout'),
    use('buy_home', 'اشري من عند عمي صالح', 'counter', [
      say('salah', 'باباك مشى للجنوب؟ ربي يرجعو بالسلامة.'),
      choose(
        'spend_extra',
        opt('حليب وخبز وفاكية لسلمى.', 'good', { fx: { money: -80, parents: 3 } }),
        opt('حليب وخبز، والباقي نحفظو.', 'good', {
          fx: { money: -55 },
          then: [N('أمين حط الباقي في جيبو للحاجة، كيما قال بابا.')],
        }),
        opt('حليب وخبز، وشيبس وجوز ليا.', 'neutral', { fx: { money: -90 } }),
      ),
    ]),
    goto('home_k', 'ارجع للدار', 'home_kitchen'),
    use('desk', 'دير الواجبات', 'desk', [N('الدار ساكتة بلا صوت التلفزيون تاع بابا.'), fx({ grades: 3 }), pass(60)]),
  ],
  closing: [
    when('promise_made', [N('الوعد سهل يتقال. الصعيب، يتعاش كل نهار.')], [N('بابا مشى. والدار ولات أكبر.')]),
  ],
};

const ch15: Chapter = {
  id: 15,
  act: 1,
  title: 'يوم بلا مصروف',
  mission: 'الشهرية ما وصلتش',
  age: 11,
  summary: 'الشهرية تاع بابا تعطّلت. الدار تحسب كل دينار.',
  start: { spot: 'home_kitchen', time: '07:30' },
  allowance: false,
  absent: ['baba'],
  cast: { mourad: 'hanout_front' },
  opening: [N('الشهرية تاع بابا تعطّلت في البنك. ماما تحسب في الكوزينة بصوت واطي.')],
  objectives: [
    talk('mama_money', 'ماما', 'mama', [
      M('أمين، هاذ السيمانة ما كانش مصروف. سامحني يا وليدي.'),
      M('الزيت والسميد قبل كل شي.'),
      choose(
        'react_money',
        opt('ما عليهش يا ماما. عندي شوية في الحصالة.', 'good', {
          if: 'savings>=40',
          fx: { parents: 6, confidence: 3 },
          set: ['offered_savings'],
        }),
        opt('واخا يا ماما.', 'good', { fx: { parents: 3 } }),
        opt('وأنا كيفاش نشري؟ كل صحابي عندهم!', 'bad', { fx: { parents: -4, anger: 4 } }),
      ),
    ]),
    use(
      'piggy',
      'الحصالة',
      'piggy',
      [
        N('في الحصالة كاين ' + 'شوية دراهم مجموعين من شحال من شهر.'),
        choose(
          'use_savings',
          opt('نعطي نص الحصالة لماما للدار.', 'good', {
            fx: { savings: -40, parents: 8, trust: 3 },
            set: ['helped_family_money'],
            then: [M('...لا يا أمين، خلّيهم ليك.'), A('خلّيهم للدار يا ماما. أنا الراجل كيما قال بابا.')],
          }),
          opt('نخلّيهم. ممكن نحتاجهم.', 'neutral', {}),
        ),
      ],
      { if: 'offered_savings' },
    ),
    goto('to_hanout', 'روح للحانوت', 'hanout'),
    use('boxes', 'عمي صالح يحتاج يد', 'boxes', [
      say('salah', 'أمين! السلعة جات والظهر تاعي ما بقاش. تعاوني؟'),
      choose(
        'help_salah',
        opt('نعاونك يا عمي صالح.', 'good', {
          fx: { money: 100, confidence: 3, health: -1 },
          set: ['earned_salah'],
          then: [pass(90), say('salah', 'هاك مية دينار، وخوذ هاذ الخبزة لماماك.'), N('مية دينار وخبزة. أحسن من أي مصروف.')],
        }),
        opt('ما نقدرش اليوم.', 'neutral', {}),
      ),
    ]),
    talk('mourad_money', 'مراد قدام الحانوت', 'mourad', [
      when('earned_salah', [MO('تخدم عند عمي صالح بمية دينار؟ ههه. كمال يعطي خمسمية في ربع ساعة.')], [MO('ما عندكش دراهم؟ كمال يعطي خمسمية في ربع ساعة.')]),
      choose(
        'easy_money',
        opt('دراهم كمال ما نحبهمش.', 'refuse', { set: ['refused_kamel'], fx: { confidence: 3, mourad: -2 } }),
        opt('...غير هاذ المرة، الدار محتاجة.', 'bad', {
          set: ['did_errand', 'kamel_money'],
          fx: { money: 500, risk: 12, honesty: -4 },
          then: [N('أمين قال للروحو: "للدار". بصح الدراهم الموسّخة ما تدخلش للدار نظيفة.')],
        }),
      ),
    ]),
    goto('home', 'ارجع للدار', 'home_kitchen'),
    talk('mama_eve', 'ماما', 'mama', [
      when('earned_salah', [A('ماما، هاذي خبزة من عمي صالح ومية دينار. خدمت معاه.'), M('...ربي يرضى عليك يا وليدي.', { fx: { parents: 6, trust: 4 } })]),
      when('kamel_money', [
        A('ماما، هاذي خمسمية...'),
        M('خمسمية؟ منين جبتهم؟'),
        choose(
          'kamel_money_truth',
          opt('من عند كمال... وصّلتلو حاجة.', 'honest', {
            fx: { trust: -6, honesty: 8, anger: 15 },
            set: ['confessed_errand'],
            then: [M('ما نحبش هاذ الدراهم! رجّعهم! والله ما ندخّلهم!'), N('ماما بكات. أمين فهم بلي ماشي كل دراهم دراهم.'), fx({ money: -500, risk: -6 })],
          }),
          opt('لقيتهم في الطريق.', 'lie', { fx: { honesty: -6 }, then: [M('...'), N('ماما ما صدقتش. بصح ما قالت والو.')] }),
        ),
      ]),
      when('!earned_salah & !kamel_money', [M('الخبز والزيت والحمد لله. ما خصّنا والو.')]),
    ]),
  ],
  closing: [N('سيمانة بلا مصروف. أمين تعلّم بلي الدينار ماشي ديما في الجيب، ساعات في اليد اللي تخدم.')],
};

const ch16: Chapter = {
  id: 16,
  act: 1,
  title: 'الهروب الثاني',
  mission: 'السيبر في المدينة',
  age: 12,
  summary: 'مراد يقترح يوم كامل في سيبر المدينة. وبابا بعيد.',
  start: { spot: 'home_door', time: '07:20' },
  absent: ['baba'],
  cast: { mourad: 'crossroads' },
  opening: [N('عام جديد في المدرسة. اثنا عشر سنة.'), when('promise_made', [N('الوعد لبابا باقي في الراس.')])],
  objectives: [
    talk('mourad_plan', 'مراد في القاطعة', 'mourad', [
      MO('اسمع، فتحو سيبر جديد في وسط المدينة. ألعاب، فيفا، كلش!'),
      MO('ناخذو الحافلة الثمانية ونرجعو مع الخمسة. حتى واحد ما يعرف.'),
      when('promise_made', [A('وعدت بابا...'), MO('باباك في الصحرا يا خو! ما يشوف والو.')]),
      choose(
        'skip2',
        opt('يالله.', 'bad', {
          set: ['skipped_ch16'],
          fx: { attendance: -10, risk: 6, mourad: 6 },
          then: [when('promise_made', [fx({}, { set: ['promise_broken'] })])],
        }),
        opt('لا يا مراد. هاذ المرة لا.', 'refuse', {
          set: ['refused_skip2'],
          fx: { confidence: 5, mourad: -4 },
          then: [when('promise_made', [fx({ trust: 4 }, { set: ['promise_kept'] })])],
        }),
      ),
    ]),
    goto('bus', 'روح لموقف الحافلة', 'bus_stop', { if: 'skipped_ch16' }),
    use(
      'cyber',
      'استنّى الحافلة',
      'bus_sign',
      [
        N('السيبر مظلم، ريحة الدخان. أطفال صغار وشباب كبار.'),
        MO('شفت؟ الجنة!'),
        pass(420),
        N('النهار فات في لحظة. والمصروف حتى هو.'),
        fx({ money: -60, health: -2 }),
        when('promise_broken', [N('في الحافلة، أمين تفكّر في الكلمة: "كلمة رجال".')]),
      ],
      { if: 'skipped_ch16' },
    ),
    goto('school', 'روح للمدرسة', 'school_gate', {
      if: '!skipped_ch16',
      deadline: '08:00',
      onLate: { fx: { attendance: -2 }, note: 'وصلت متأخر.' },
    }),
    use('class', 'ادخل للقسم', 'school_desk', [N('درس العلوم. البراكين.'), fx({ grades: 3 })], { if: '!skipped_ch16', time: 420 }),
    goto('home', 'ارجع للدار', 'home_living'),
    talk('mama_phone', 'ماما في التيليفون مع بابا', 'mama', [
      when(
        'skipped_ch16',
        [
          M('المدرسة عيّطت. نهار كامل غايب. وين كنت؟!'),
          M('باباك في التيليفون... يحب يهدر معاك.'),
          B('(في التيليفون) أمين... كلمة رجال، تفكّرها؟'),
          choose(
            'phone_baba',
            opt('غلطت يا بابا. ما عندي حتى عذر.', 'honest', {
              fx: { trust: -6, honesty: 6, anger: 10 },
              set: ['admitted_skip2'],
              then: [B('...نرجع ونهدرو. وحتى ذاك الوقت، ماماك تقرّر.')],
            }),
            opt('مراد هو اللي جبدني!', 'lie', {
              fx: { trust: -12, honesty: -4, anger: 15 },
              then: [B('مراد جبدك؟ وأنت ما عندكش رجلين؟'), N('بابا قطع.')],
            }),
          ),
          fx({ trust: -6, parents: -4 }, { set: ['allowance_cut'] }),
        ],
        [
          M('باباك عيّط. قالي سلّملي على الراجل تاع الدار.'),
          when('refused_skip2', [A('ماما... مراد حب نهربو للسيبر. قلتلو لا.'), M('نقولها لباباك. راح يفرح.', { fx: { trust: 5, parents: 3 } })]),
        ],
      ),
    ]),
  ],
  closing: [
    when('promise_broken', [N('الوعد تكسّر. ماشي بالضربة، بالحافلة تاع الثمانية.')]),
    when('promise_kept', [N('الوعد صمد. ولو كان يوم واحد، يوم يحسب.')]),
  ],
};

const ch17: Chapter = {
  id: 17,
  act: 1,
  title: 'شكون صاحبي الصح؟',
  mission: 'جوج دعوات',
  age: 12,
  summary: 'نفس العشية: الماتش النهائي تاع الفريق مع وليد، وسهرة "الكبار" مع مراد.',
  start: { spot: 'home_door', time: '15:30' },
  cast: { mourad: 'stairs', walid: 'football', coach: 'football', kamel: 'stairs' },
  opening: [N('جوج ميساجات في نفس الوقت. وليد: "الماتش النهائي على الخمسة!" مراد: "كمال دار سهرة، أرواح."')],
  objectives: [
    goto('crossroad', 'القاطعة — خمّم وين تروح', 'crossroads'),
    use('decide', 'اختار طريقك', 'street_sign', [
      N('من القاطعة، الملعب على اليمين، العمارة على اليسار.'),
      choose(
        'friends_choice',
        opt('الملعب، مع وليد والفريق.', 'good', { set: ['chose_walid_group'], fx: { confidence: 3 } }),
        opt('العمارة، مع مراد.', 'bad', { set: ['chose_mourad_group'], fx: { mourad: 6, risk: 5 } }),
        opt('نروح لمراد ونجبدو معايا للماتش.', 'help', { if: 'mourad>=40', set: ['tried_both'] }),
      ),
    ]),
    goto('stairs_go', 'روح للعمارة', 'stairs', { if: 'chose_mourad_group | tried_both' }),
    talk(
      'stairs_party',
      'مراد مع الكبار',
      'mourad',
      [
        when('tried_both', [
          A('مراد، أرواح نتفرجو في الماتش تاع وليد. الحومة كاملة تما.'),
          choose(
            'pull_mourad',
            opt('أنت كنت أحسن لاعب في الحومة، تفكّر؟', 'good', {
              fx: { mourad: 6 },
              set: ['mourad_came_match'],
              then: [MO('...تفكّرت. يالله، بصح ما تقولش لحتى واحد بلي جيت.'), say('kamel', 'روح روح يا الطفل.')],
            }),
            opt('خلاص، نروح وحدي.', 'neutral', { fx: { mourad: -3 }, set: ['chose_walid_group'] }),
          ),
        ]),
        when('chose_mourad_group', [
          say('kamel', 'هاو جا! قعد قعد.'),
          N('الموزيكا عالية، الدخان، الضحك. مراد يبان مرتاح. أمين ما يعرفش وين يحط يديه.'),
          say('kamel', 'خوذ، جرّب. ولّيت كبير.'),
          choose(
            'party_offer',
            opt('لا، شكرا.', 'refuse', { fx: { confidence: 3 }, set: ['refused_kamel'] }),
            opt('...', 'bad', { fx: { health: -4, risk: 8 }, set: ['tried_smoke_12'] }),
          ),
        ]),
      ],
      { if: 'chose_mourad_group | tried_both' },
    ),
    goto('field', 'روح للملعب', 'football', { if: 'chose_walid_group | mourad_came_match' }),
    talk(
      'final',
      'الماتش النهائي',
      'walid',
      [
        say('walid', 'جيت! المدرب يحتاجك في الوسط!'),
        when('mourad_came_match', [say('walid', 'ومراد؟! ...مرحبا بيك يا مراد.'), MO('...صحّا يا وليد.')]),
        when('joined_team', [N('أمين دخل. باص، جري، والدقيقة الأخيرة... قول!'), fx({ confidence: 8, health: 3 }, { set: ['won_final'] })], [
          N('أمين شجّع من البرا. وليد مارك الهدف تاع الفوز.'),
          fx({ confidence: 3 }),
        ]),
        say('coach', 'هكذا يكون الفريق!'),
      ],
      { if: 'chose_walid_group | mourad_came_match' },
    ),
  ],
  closing: [
    when('chose_walid_group', [N('الصاحب الصح ماشي اللي يضحّكك برك. اللي يخلّيك تكبر.')]),
    when('chose_mourad_group', [N('الليلة، أمين كان مع الكبار. بصح عمرو ما حس روحو صغير كيما الليلة.')]),
    when('mourad_came_match', [N('ومراد، لساعة وحدة، رجع الطفل اللي كان.')]),
  ],
};

const ch18: Chapter = {
  id: 18,
  act: 1,
  title: 'الدخان في الزنقة',
  mission: 'الزنقة',
  age: 12,
  summary: 'في الزنقة ورا الحانوت، الشباب يتكيّفو. ويعرضو على أمين.',
  start: { spot: 'hanout_front', time: '16:30' },
  cast: { mourad: 'alley', kamel: 'alley' },
  opening: [N('الطريق القصير للدار يفوت من الزنقة.')],
  objectives: [
    goto('alley', 'ادخل للزنقة', 'alley'),
    talk('smoke', 'مراد وكمال في الزنقة', 'kamel', [
      say('kamel', 'أمين! تعال. اليوم تولّي راجل.'),
      MO('خوذ نفس، ما يصرا والو.'),
      when('tried_smoke_12', [say('kamel', 'المرة اللي فاتت قحّيت كالشيباني، ههه!')]),
      N('السيجارة قدام وجهو. الريحة تقلّب الكرش.'),
      choose(
        'cigarette',
        opt('لا. ما نحبش.', 'refuse', {
          set: ['refused_smoke_12'],
          fx: { confidence: 6, risk: -3 },
          then: [say('kamel', 'هه، الشاطر.'), A('إيه، الشاطر. وما نخجلش.')],
        }),
        opt('نجرّب نفس واحد.', 'bad', {
          set: ['tried_smoke_12'],
          fx: { health: -5, risk: 8 },
          then: [N('نفس واحد. القحّة، الدوخة. الكل ضحك.'), N('ما كانش فيها حتى حاجة مليحة.')],
        }),
        opt('مراد، أرواح معايا. هنا ماشي بلاصتنا.', 'help', {
          set: ['pulled_mourad_alley'],
          fx: { mourad: 3, confidence: 4 },
          then: [MO('...روح أنت. أنا نلحقك.'), N('مراد ما لحقش. بصح خمّم. أمين شاف هذاك في عينيه.')],
        }),
      ),
    ]),
    use('wall', 'حيط الزنقة', 'alley_wall', [
      N('على الحيط مكتوب بالطباشير: "الحومة ما تنساش".'),
      when('tried_smoke_12', [N('الريحة باقية في الحوايج. ماما راح تشم.')]),
    ]),
    goto('home', 'ارجع للدار', 'home_kitchen'),
    talk('mama_smell', 'ماما في الكوزينة', 'mama', [
      when(
        'tried_smoke_12',
        [
          M('...واش هاذ الريحة؟ أمين؟!'),
          choose(
            'smell',
            opt('جرّبت... وما عجبنيش. ما نعاودش.', 'honest', {
              fx: { trust: -3, honesty: 8, anger: 8 },
              set: ['confessed_smoke'],
              then: [M('عندك اثنا عشر سنة يا أمين! ...على الأقل قلتلي.'), M('جدّك مات خوه بالدخان. هاذي ماشي لعبة.')],
            }),
            opt('الشباب كانو يتكيّفو حدايا.', 'lie', { fx: { honesty: -5 }, then: [M('ابعد عليهم إذن!')] }),
          ),
        ],
        [M('جيت؟ اغسل يديك، العشا واجد.')],
      ),
    ]),
  ],
  closing: [
    when('refused_smoke_12', [N('كلمة "لا" صغيرة. بصح كي تقولها قدام الجماعة، تولّي أثقل من أي حاجة.')]),
    when('tried_smoke_12', [N('نفس واحد ما يولّيش عادة. بصح كل عادة بدات بنفس واحد.')]),
  ],
};

const ch19: Chapter = {
  id: 19,
  act: 1,
  title: 'اعتراف متأخر',
  mission: 'نقول الصح',
  age: 12,
  summary: 'بابا رجع من الجنوب. أمين عندو فرصة يصلّح كذبات قديمة.',
  start: { spot: 'home_bedroom', time: '20:00' },
  opening: [N('بابا رجع. الدار عامرة. والكذبات القديمة تحت الماطلة.')],
  objectives: [
    use('think', 'خمّم في الفراش', 'bed', [
      N('أمين يحسب: شحال من حاجة ما قالهاش؟'),
      when('lied_money & !money_lie_found', [N('الصرف تاع الكورة.')]),
      when('hid_skip_ch1', [N('النهار اللي هرب فيه ورجع.')]),
      when('forged_signature', [N('التوقيع المقلّد.')]),
      when('lied_window', [N('الزاج تاع خالتي فتيحة.')]),
      when('stole_too', [N('الحاجة من الحانوت.')]),
      when('did_errand & !confessed_errand', [N('الكيس تاع كمال.')]),
      when(
        '!lied_money & !hid_skip_ch1 & !forged_signature & !lied_window & !stole_too & !did_errand',
        [N('ما كانش كذبات كبار. بصح مراد عندو سر يثقل عليه، وطلب من أمين يعاونو.'), fx({}, { set: ['no_old_lies'] })],
      ),
    ]),
    talk('confess', 'روح لبابا', 'baba', [
      B('أمين؟ مازال ما رقدتش؟'),
      when(
        'no_old_lies',
        [
          A('بابا، كيفاش واحد يقول لعائلتو حاجة غلط فيها، بلا ما يخاف؟'),
          B('يقولها وخلاص. الخوف يكبر كي تخبّي، ويصغار كي تقول.'),
          B('علاه؟ مراد؟'),
          A('...إيه. نحب نعاونو يهدر مع خالتو.'),
          B('روح معاه. الصاحب يمشي جنب صاحبو في الطريق الصعيب.', { fx: { trust: 3, mourad: 4 } }),
          fx({}, { set: ['helped_mourad_confess'] }),
        ],
        [
          choose(
            'late_confession',
            opt('بابا... عندي حوايج لازم نقولهملك.', 'honest', {
              set: ['confessed_old_lie'],
              unset: ['lied_money', 'hid_skip_ch1', 'lied_window'],
              fx: { honesty: 15, trust: 4, anger: 15 },
              then: [
                N('أمين حكى كلش. الصوت يرعد، بصح ما وقفش.'),
                B('...'),
                B('زعفت؟ إيه. بصح نحب نقولك حاجة: هاذي أصعب حاجة درتها في حياتك، وأحسن حاجة.'),
                B('العقوبة؟ تخلّص لعمي صالح واش لازم، وتعتذر لفتيحة. وأنا نسامحك.'),
                fx({ money: -50 }),
              ],
            }),
            opt('والو بابا، تصبح على خير.', 'neutral', { then: [N('الكذبات رجعو تحت الماطلة. وزادو ثقلو.'), fx({ honesty: -2 })] }),
          ),
        ],
      ),
    ]),
    goto(
      'salah_visit',
      'الصباح — روح لعمي صالح',
      'hanout',
      { if: 'confessed_old_lie & stole_too', skipTo: '09:00' },
    ),
    talk(
      'salah_amends',
      'اعتذر لعمي صالح',
      'salah',
      [
        A('عمي صالح... هذيك المرة، دّيت حاجة بلا ما نخلّص. هاك ثمنها.'),
        say('salah', '...عرفت. ما قلت والو، كنت نستنّى. الحمد لله اللي جيت.'),
        fx({ honesty: 5, trust: 2 }, { set: ['made_amends_salah'] }),
      ],
      { if: 'confessed_old_lie & stole_too' },
    ),
  ],
  closing: [
    when('confessed_old_lie', [N('ليلة طويلة. بصح الماطلة ولات خفيفة.')]),
    when('helped_mourad_confess', [N('غدوة، أمين يمشي مع مراد لخالتو. خطوة صغيرة، في الطريق الصح.')]),
  ],
};

const ch20: Chapter = {
  id: 20,
  act: 1,
  title: 'المسابقة',
  mission: 'فرصة باش تبان',
  age: 12,
  summary: 'مسابقة ثقافية في المدرسة، ودورة كورة بين المدارس. نفس الأسبوع.',
  start: { spot: 'school_courtyard', time: '10:00' },
  cast: { walid: 'school_courtyard', coach: 'football' },
  opening: [N('على لوحة الإعلانات: "مسابقة المعرفة" و"دورة ما بين المدارس".')],
  objectives: [
    use('board', 'اقرا لوحة الإعلانات', 'notice_board', [
      N('المسابقة: فريق من ثلاثة، تحضير أسبوع. الدورة: تدريب كل عشية.'),
      choose(
        'competition',
        opt('نسجّل في مسابقة المعرفة.', 'good', { set: ['chose_quiz'] }),
        opt('نلعب في الدورة.', 'good', { set: ['chose_tournament'] }),
      ),
    ]),
    talk('walid_team', 'كلّم وليد', 'walid', [
      when('chose_quiz', [say('walid', 'المسابقة؟ نجي معاك! ونجيبو ياسين، يعرف الجغرافيا كلها.', { if: 'friends_yacine' })]),
      when('chose_tournament', [say('walid', 'الدورة! أخيرا نلعبو مع بعض ضد المدارس الأخرى!')]),
      say('walid', 'السيمانة هاذي لازم نحضّرو بالجد.'),
    ]),
    use(
      'prepare_quiz',
      'حضّر للمسابقة في المكتب',
      'desk',
      [
        N('عواصم، علماء، تاريخ الجزائر. الأمير عبد القادر، ابن باديس، الثورة.'),
        choose(
          'prep_q',
          opt('نحضّر كل ليلة.', 'good', { fx: { grades: 5 }, set: ['prepared_well'] }),
          opt('نحضّر شوية.', 'neutral', { fx: { grades: 2 } }),
        ),
        pass(120),
      ],
      { if: 'chose_quiz' },
    ),
    use(
      'prepare_t',
      'تدرّب في الملعب',
      'ball',
      [
        N('جري، باصات، تسديد. المدرب ما يرحمش.'),
        choose(
          'prep_t',
          opt('نتدرّب كل عشية.', 'good', { fx: { health: 4, confidence: 3 }, set: ['prepared_well'] }),
          opt('نتدرّب كي نحب.', 'neutral', { fx: { health: 1 } }),
        ),
        pass(120),
      ],
      { if: 'chose_tournament' },
    ),
    goto('event', 'نهار المسابقة — ساحة المدرسة', 'school_courtyard', { skipTo: '10:00' }),
    talk('result', 'النتيجة', 'director', [
      when(
        'prepared_well & grades>=55 & chose_quiz',
        [say('director', 'الفريق الأول: أمين، وليد... مبروك!'), fx({ confidence: 10, grades: 3, trust: 4 }, { set: ['won_competition'] })],
      ),
      when(
        'prepared_well & health>=60 & chose_tournament',
        [say('director', 'الكأس لمدرستنا! وأمين في التشكيلة!'), fx({ confidence: 10, health: 2, trust: 3 }, { set: ['won_competition'] })],
      ),
      when('!won_competition', [say('director', 'المرتبة الثالثة. ماشي عيب، العام الجاي إن شاء الله.'), fx({ confidence: 2 })]),
      when('joined_team & chose_tournament', [say('coach', 'شفتك اليوم. عندك مكان في الفريق كي تكبر.', { fx: { confidence: 3 } })]),
    ]),
  ],
  closing: [
    when('won_competition', [N('أول مرة أمين يطلع على المنصة. بابا صفّق من الصف الأخير.')], [N('ما ربحش. بصح حضّر، وهذا وحدو ربح.')]),
  ],
};

const ch21: Chapter = {
  id: 21,
  act: 1,
  title: 'دار جدّي',
  mission: 'جني الزيتون',
  age: 12,
  summary: 'العطلة عند جدّي الطاهر. الزيتون، الصبر، وحكايات بابا كي كان صغير.',
  start: { spot: 'home_door', time: '08:00' },
  opening: [N('العطلة. بابا قال: "روح عاون جدّك في الزيتون. وتعلّم منو."')],
  objectives: [
    goto('walk', 'روح لدار جدّي في الطرف الفوقاني', 'grandpa'),
    talk('jeddi_hello', 'سلّم على جدّي', 'jeddi', [
      say('jeddi', 'أمين! كبرت يا وليدي. تعال، الزيتونة تستنّاك.'),
      say('jeddi', 'هاذي الزيتونة غرسها جدّ بابا. عندها مية سنة.'),
    ]),
    use('harvest', 'اجني الزيتون مع جدّك', 'olive_tree', [
      N('الصبح كامل تحت الزيتونة. اليدين تبرد، الظهر يوجع.'),
      say('jeddi', 'شوف، الزيتونة ما تعطيش في عام. تستنّى، وتصبر، وتعطي.'),
      choose(
        'harvest_effort',
        opt('نكمّل حتى تكمل الشجرة.', 'good', { fx: { health: 2, confidence: 4 }, set: ['harvested_full'], then: [pass(180)] }),
        opt('نرتاح شوية؟', 'neutral', { then: [pass(90), say('jeddi', 'ارتاح. بصح ما تنساش ترجع.')] }),
      ),
    ]),
    talk('jeddi_talk', 'اقعد حدا جدّك', 'jeddi', [
      say('jeddi', 'باباك كي كان في عمرك، هرب من المدرسة مرة باش يروح للسوق.'),
      A('بابا؟!'),
      say('jeddi', 'إيه. وكي رجع، قالي الصح. ومن هاذاك النهار، ولّيت نثق فيه في كل حاجة.'),
      say('jeddi', 'الغلطة ما تخلّيش الراجل صغير. الكذبة هي اللي تصغّرو.'),
      choose(
        'open_up',
        opt('جدّي، ساعات نغلط ونخاف نقول.', 'honest', {
          fx: { confidence: 5, honesty: 4 },
          set: ['opened_to_jeddi'],
          then: [say('jeddi', 'الخوف طبيعي. قول وأنت خايف. الشجاعة ماشي بلا خوف، الشجاعة مع الخوف.')],
        }),
        opt('نسمعلك يا جدّي.', 'neutral', { fx: { confidence: 2 } }),
      ),
      say('jeddi', 'هاك. خمسمية دينار، حقك من الزيتون. اللي يخدم ياكل.', { fx: { money: 500 } }),
      choose(
        'jeddi_money',
        opt('نحطّهم في الحصالة.', 'good', { if: 'money>=500', fx: { money: -500, savings: 500 }, set: ['saver'] }),
        opt('نشري بيهم حذاء للكورة.', 'neutral', { fx: { money: -400, confidence: 3 } }),
        opt('نخلّيهم في جيبي.', 'neutral', {}),
      ),
    ]),
    goto('home', 'ارجع للدار', 'home_living', { deadline: '19:30', onLate: { fx: { anger: 4 } } }),
  ],
  closing: [N('في الليل، أمين شاف بابا بعينين أخرين. حتى هو كان طفل، وغلط، وتعلّم.')],
};

const ch22: Chapter = {
  id: 22,
  act: 1,
  title: 'نهاية الطفولة',
  mission: 'آخر نهار في المدرسة',
  age: 12,
  summary: 'نهاية الابتدائي. النتائج، الذكريات، والطريق للمتوسطة.',
  start: { spot: 'school_courtyard', time: '10:00' },
  cast: { mourad: 'school_courtyard', walid: 'school_courtyard' },
  opening: [N('آخر نهار في المدرسة الابتدائية. النتائج على الحيط.')],
  objectives: [
    use('results', 'شوف النتائج', 'notice_board', [
      when(
        'grades>=60',
        [N('أمين — ناجح — المعدل 7.5 من 10. ملاحظة: "تحسّن ملحوظ".'), fx({ confidence: 6 }, { set: ['passed_primary_well'] })],
        [
          when(
            'grades>=40',
            [N('أمين — ناجح — المعدل 5.2 من 10. ملاحظة: "يستطيع أكثر".'), fx({ confidence: 1 }, { set: ['passed_primary'] })],
            [N('أمين — ناجح بالإنقاذ — 4.9 من 10. ملاحظة: "غيابات كثيرة".'), fx({ confidence: -6 }, { set: ['passed_primary_rescue'] })],
          ),
        ],
      ),
    ]),
    talk('mourad_end', 'مراد', 'mourad', [
      when(
        'mourad>=50',
        [MO('خلاص، المتوسطة. نكونو في نفس القسم إن شاء الله.'), A('إن شاء الله. بصح هاذ المرة نقراو بالجد، واخا؟'), MO('...واخا.')],
        [MO('ما نقراش في نفس المتوسطة. بابا يحب يبعثني عند عمي.'), A('...تهلّا في روحك يا مراد.')],
      ),
    ]),
    talk('walid_end', 'وليد', 'walid', [
      say('walid', 'العام الجاي، الفريق تاع الأشبال! المدرب قال يحتاجنا.'),
      when('friends_walid | joined_team', [say('walid', 'نتلاقاو في التدريب. وحتى في المراجعة!')]),
    ]),
    goto('home', 'ارجع للدار', 'home_living'),
    talk('family', 'العائلة مجموعة', 'baba', [
      when('passed_primary_well', [B('سبعة ونص! الحلوى على حسابي اليوم!', { fx: { parents: 5, trust: 3 } })]),
      when('passed_primary', [B('نجحت، الحمد لله. والمتوسطة تحتاج جهد أكثر.')]),
      when('passed_primary_rescue', [B('نجحت بالإنقاذ... أمين، الطريق يطوال، وإذا ما بدّلتش، ما تكمّلوش.', { fx: { anger: 4 } })]),
      B('غدوة تولّي في المتوسطة. شاب. واش تحب تكون؟'),
      choose(
        'resolution',
        opt('نحب نكون واحد تثقو فيه.', 'good', { fx: { trust: 4, confidence: 3 }, set: ['resolution_trust'] }),
        opt('نحب نكون لاعب كورة كبير.', 'neutral', { fx: { confidence: 3 }, set: ['dream_football'] }),
        opt('ما نعرفش يا بابا.', 'neutral', {}),
      ),
      M('مهما يكون، احنا معاك.'),
    ]),
  ],
  closing: [
    N('الطفولة ما تكملش في نهار. بصح ساعات، نهار واحد يسكّر الباب بالشوية.'),
    when('trust>=60', [N('أمين داخل للمراهقة وفي ظهرو عائلة تثق فيه.')], [N('أمين داخل للمراهقة، والثقة بينو وبين عائلتو تحتاج ترميم.')]),
  ],
};

export const ACT1B: Chapter[] = [ch6, ch7, ch8, ch9, ch10, ch11, ch12, ch13, ch14, ch15, ch16, ch17, ch18, ch19, ch20, ch21, ch22];
