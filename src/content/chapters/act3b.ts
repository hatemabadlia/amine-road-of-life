// ACT III — Chapters 58–68: age 17–18. Harvest, decision, and the road of life.
import type { Chapter } from '../../types/game';
import { A, B, M, MO, N, choose, fx, goto, opt, pass, say, talk, act, when } from './dsl';

const BA = (t: string, extra?: Parameters<typeof say>[2]) => say('bachir', t, extra);
const MU = (t: string, extra?: Parameters<typeof say>[2]) => say('mustapha', t, extra);
const J = (t: string, extra?: Parameters<typeof say>[2]) => say('jeddi', t, extra);

const ch58: Chapter = {
  id: 58,
  act: 3,
  title: 'ماضي أمين',
  mission: 'وجوه من الطفولة',
  age: 17,
  summary: 'ياسين، خالتي فتيحة، عمي صالح... الطفولة ترجع بوجوه.',
  start: { spot: 'hanout_front', time: '16:00' },
  cast: { yacine: 'hanout_front', fatiha: 'home_door', salah: 'hanout' },
  opening: [N('ساعات الماضي ما يرجعش كذكرى. يرجع كواحد يسلّم عليك في الطريق.')],
  objectives: [
    talk('yacine', 'ياسين رجع للحومة', 'yacine', [
      say('yacine', 'أمين! أنا في الجامعة دروك، إعلام آلي. جيت نزور.'),
      when(
        'helped_yacine | told_teacher_bully',
        [
          say('yacine', 'تعرف؟ أول نهار في المدرسة، كي رجّعتلي المحفظة... بقيت في الولاية على خاطر ذاك النهار. بابا كان يحب يرجّعني للجنوب.'),
          say('yacine', 'إذا تحتاج حاجة، أي حاجة، أنا هنا.'),
          fx({ confidence: 6 }, { set: ['yacine_ally'] }),
        ],
        [
          when(
            'apologized_yacine',
            [say('yacine', 'الاعتذار تاعك في الإكمالية... بدّل حاجة فيا. شكرا.'), fx({ confidence: 3 }, { set: ['yacine_ally'] })],
            [say('yacine', '...الماضي فات. بالتوفيق يا أمين.'), when('mocked_yacine', [N('أمين حب يقول حاجة. ما قالهاش. وياسين مشى.')])],
          ),
        ],
      ),
    ]),
    talk('fatiha', 'خالتي فتيحة', 'fatiha', [
      say('fatiha', 'أمين، تفكّر الزاج؟ ههه. كبرتو.'),
      when('stayed_window | admitted_window | confessed_old_lie', [say('fatiha', 'أنت الوحيد اللي جا اعتذر ذاك النهار. عمري ما نسيت.'), fx({ confidence: 2 })]),
      when('mourad_recovering', [say('fatiha', 'ومراد... رجعلي وليدي. على خاطرك.'), fx({ mourad: 4 })]),
    ]),
    talk('salah', 'عمي صالح', 'salah', [
      say('salah', 'الحانوت ولات ثقيلة عليّا يا أمين. الظهر ما بقاش.'),
      when('made_amends_salah', [say('salah', 'وتفكّر نهار جيت ترجّع ثمن الشكلاطة؟ من ذاك النهار عرفت بلي أنت ولد نثق فيه.')]),
      when('told_salah_kamel | told_salah_theft', [say('salah', 'وأنت اللي ديما قلتلي الصح، حتى وأنت صغير.')]),
      fx({}, { set: ['salah_tired'] }),
      choose(
        'help_salah_weekends',
        opt('نجي نعاونك الجمعة والسبت، بلا مقابل.', 'help', { set: ['helps_salah'], fx: { confidence: 3, trust: 2 } }),
        opt('ربي يعطيك الصحة يا عمي صالح.', 'neutral', {}),
      ),
    ]),
  ],
  closing: [N('الطفولة ما تموتش. تكبر معاك، وتستنّى تشوف واش درت بيها.')],
};

const ch59: Chapter = {
  id: 59,
  act: 3,
  title: 'الامتحان المصيري',
  mission: 'النهار الكبير',
  age: 18,
  summary: 'البكالوريا، ولا شهادة التكوين، ولا الخدمة الكبيرة في الورشة، ولا أول موسم في السوق.',
  start: { spot: 'home_bedroom', time: '06:30' },
  cast: { bachir: 'workshop', mustapha: 'training_center' },
  opening: [N('ثمنطاش سنة. النهار اللي كل شي يستنّاه.'), M('أمين، كول حاجة قبل ما تخرج. ربي يوفقك.')],
  objectives: [
    goto('to_exam_study', 'روح لمركز الامتحان — الثانوية', 'lycee_class', { if: 'path_study', deadline: '08:00', onLate: { fx: { grades: -5 }, note: 'وصلت متأخر للبكالوريا!' } }),
    act(
      'bac',
      'البكالوريا — اقعد في بلاصتك',
      'lycee_desk',
      [
        N('الورقة قدامك. الرياضيات. الفيزياء. الفلسفة.'),
        when('cheated', [N('الأسئلة اللي شريتهم من سفيان... ما كانوش هوما. كانت حيلة.'), fx({ grades: -8 })]),
        choose(
          'bac_mind',
          opt('نتنفّس، ونبدا بالسهل.', 'good', { fx: { grades: 4 } }),
          opt('نكتب بالزربة.', 'neutral', {}),
        ),
        pass(240),
        when('grades>=58 & attendance>=50', [fx({ confidence: 8 }, { set: ['bac_passed'] })]),
      ],
      { if: 'path_study' },
    ),
    goto('to_exam_voc', 'روح لمركز التكوين — الامتحان التطبيقي', 'training_center', { if: 'path_vocational' }),
    talk(
      'voc_exam',
      'سي مصطفى — لجنة الامتحان',
      'mustapha',
      [
        MU('التمرين: تركيب لوحة كهربائية كاملة لدار. عندك ثلاث ساعات.'),
        choose('voc_focus', opt('نتبع المخطط خطوة بخطوة.', 'good', { fx: { confidence: 5 } }), opt('نخدم كيما نعرف.', 'neutral', {})),
        pass(180),
        when(
          'attendance>=45 & training_commit | attendance>=45 & faced_problem | attendance>=45 & honesty>=50',
          [MU('الضو شعل. والحماية تخدم. مبروك يا أمين. شهادة الكفاءة المهنية.'), fx({ confidence: 8 }, { set: ['training_done'] })],
          [MU('الضو ما شعلش... الحضور والتطبيق ناقصين. تقدر تعاود الدورة الجاية.')],
        ),
      ],
      { if: 'path_vocational' },
    ),
    goto('to_workshop', 'روح للورشة — الخدمة الكبيرة', 'workshop', { if: 'path_craft' }),
    act(
      'craft_test',
      'الباب الخشبي — خدمة المعلّم',
      'workbench',
      [
        BA('هاذا الباب لدار شيخ في الحومة. أنت تخدمو من البداية للآخر. وحدك.'),
        choose('craft_care', opt('نقيس مرتين، نقص مرة.', 'good', { fx: { confidence: 5 }, set: ['craft_care'] }), opt('نخدم بالزربة.', 'bad', {})),
        pass(480),
        when(
          'craft_care & bachir_impressed | craft_care & craft_commit | craft_care & honesty>=55',
          [BA('...'), BA('هاذا باب يعيش خمسين سنة. أنت معلّم يا أمين.'), fx({ confidence: 10 }, { set: ['bachir_trusts'] })],
          [BA('الباب يتسكّر... بصح مايل. مازال عندك ما تتعلّم.')],
        ),
      ],
      { if: 'path_craft' },
    ),
    goto('to_souk', 'روح للسوق — أول نهار في الطبلة', 'souk', { if: 'path_business | path_undecided' }),
    act(
      'market',
      'الطبلة تاعك في السوق',
      'stall',
      [
        when(
          'path_business',
          [
            N('طبلة صغيرة: إكسسوارات تيليفون. السلعة شريتها بالحصالة.'),
            choose('sell_style', opt('سومة معقولة، وكلمة صادقة.', 'good', { fx: { confidence: 4 } }), opt('نزيد في السومة، ما يعرفوش.', 'bad', { fx: { honesty: -6 } })),
            pass(360),
            when(
              'savings>=1500 & business_plan | saved_well & business_plan | savings>=3000',
              [N('آخر النهار: ربح صغير، وزبائن رجعو. "الشاب تاع السوق، ما يغشّش."'), fx({ confidence: 8, money: 3000 }, { set: ['business_ok'] })],
              [N('السلعة ما كفاتش، والدراهم خلصو قبل ما يبدا. التجارة تحتاج راس مال وخطة.'), fx({ confidence: -4 })],
            ),
          ],
          [N('أمين يتفرّج على الطبلات. كل واحد عندو بلاصة. وهو؟'), fx({ confidence: -3 })],
        ),
      ],
      { if: 'path_business | path_undecided' },
    ),
    goto('home', 'ارجع للدار', 'home_living'),
    talk('family', 'العائلة تستنّى', 'mama', [
      when('bac_passed', [M('...ناجح؟ ناجح! يا ربي!'), N('الزغاريد. الجيران. خالتي فتيحة جات تجري.'), fx({ parents: 8 })]),
      when('path_study & !bac_passed', [M('ما عليهش يا وليدي. العام الجاي. ولا طريق آخر.'), fx({ confidence: -4 })]),
      when('training_done', [B('شهادة دولة! الكهربائي تاع العائلة!', { fx: { parents: 6 } })]),
      when('bachir_trusts', [B('بشير عيّطلي. قال "وليدك معلّم". عمرو ما قالها لحتى واحد.', { fx: { parents: 6 } })]),
      when('business_ok', [B('ربحت في أول نهار؟ ههه، طالع لجدّك.', { fx: { parents: 4 } })]),
    ]),
  ],
  closing: [N('النتيجة ماشي نهاية. هي باب.')],
};

const ch60: Chapter = {
  id: 60,
  act: 3,
  title: 'باب الخدمة',
  mission: 'المقابلة',
  age: 18,
  summary: 'مقابلة، تربّص، ولا تسجيل. الباب يتفتح للي يدق.',
  start: { spot: 'home_bedroom', time: '08:00' },
  cast: { bachir: 'workshop', mustapha: 'training_center', salah: 'hanout' },
  opening: [N('القميص الأبيض تاع بابا، شوية واسع. أمين يحاول يربط الكرافاطة.')],
  objectives: [
    goto('door', 'روح للمقابلة', 'training_center'),
    talk('interview', 'سي مصطفى — لجنة التوظيف والتربّص', 'mustapha', [
      MU('أمين. شركة تاع الكهرباء والبناء تحتاج شباب. ولا الجامعة تحتاج ملف. ولا الورشات. اسقسيت عليك.'),
      MU('سؤال واحد: علاه نختارك أنت؟'),
      choose(
        'why_you',
        opt('خاطر نعرف نغلط ونصلّح. وما نخبّيش.', 'honest', { if: 'honesty>=55', fx: { confidence: 6 }, set: ['strong_interview'] }),
        opt('خاطر خدمت من صغري. اليد تعرف.', 'good', { if: 'worked_bachir', fx: { confidence: 5 }, set: ['strong_interview'] }),
        opt('خاطر نحتاج الخدمة.', 'neutral', {}),
      ),
      when('lied_police', [MU('...كاين ملاحظة من الشرطة على اسمك. تحقيق قديم. ما نقدرش نقبل.'), fx({ confidence: -5 }, { set: ['record_issue'] })]),
      when('smuggled & !undid_shortcut', [MU('واسمك طلع في قضية نقل سلعة لقسنطينة. سامحني.'), fx({ confidence: -6 }, { set: ['record_issue'] })]),
      when('strong_interview & !record_issue', [MU('مرحبا بيك. التربّص يبدا الشهر الجاي.'), fx({ money: 0 }, { set: ['got_opportunity'] })]),
    ]),
    talk('salah', 'عمي صالح', 'salah', [
      when('got_opportunity', [say('salah', 'سمعت! مبروك يا وليدي!')], [say('salah', 'ما تقلقش. الباب اللي يتسكّر، يفتح واحد آخر.')]),
      when('salah_tired', [say('salah', 'وأنا... نحب واحد يشد الحانوت شوية. واحد نثق فيه.')]),
    ]),
  ],
  closing: [when('got_opportunity', [N('أول مرة واحد قال لأمين "نحتاجك" على خاطر شكون هو، ماشي على خاطر شكون باباه.')], [N('ماشي اليوم. بصح أمين دق الباب.')])],
};

const ch61: Chapter = {
  id: 61,
  act: 3,
  title: 'العائلة أولاً؟',
  mission: 'الرحيل ولا البقاء',
  age: 18,
  summary: 'فرصة بعيدة. والعائلة هنا، تحتاج.',
  start: { spot: 'home_living', time: '19:00' },
  opening: [N('رسالة: فرصة في العاصمة. جامعة، ولا خدمة، ولا تكوين أعلى. وبابا مازال ما رجعش كيما كان.')],
  objectives: [
    talk('baba', 'بابا', 'baba', [
      B('سمعت على الفرصة. روح يا أمين.'),
      A('وأنتم؟ رجلك، سلمى، الدار...'),
      B('أنا رحت للجنوب ونت صغير. ورجعت. العائلة ما تتبدّلش بالمسافة.'),
      choose(
        'leave_or_stay',
        opt('نروح. ونبعث كل شهر، ونرجع كل عطلة.', 'good', { set: ['left_for_opportunity'], fx: { confidence: 6, parents: 2 } }),
        opt('نبقى. نلقى فرصة هنا، قريب منكم.', 'good', { set: ['stayed_for_family'], fx: { parents: 8, confidence: 2 } }),
        opt('نبقى العام هاذا، ونروح العام الجاي.', 'neutral', { set: ['delayed_leaving'], fx: { parents: 4 } }),
      ),
    ]),
    talk('selma', 'سلمى', 'selma', [
      when('left_for_opportunity', [say('selma', 'تروح؟ ...ومن يدّيني للمدرسة؟'), A('دروك أنتِ كبيرة. وتقدري تعيّطيلي كل نهار.')], [say('selma', 'تبقى؟! يا سلام!')]),
      fx({ parents: 2 }),
    ]),
    talk('mama', 'ماما', 'mama', [
      M('اللي يختار بقلبو وعقلو، ما يندمش. واش ما اخترت، أنا فخورة.'),
      fx({ parents: 4 }),
    ]),
  ],
  closing: [N('العائلة أولا؟ ساعات "أولا" معناها تبقى. وساعات معناها تروح وترجع أحسن.')],
};

const ch62: Chapter = {
  id: 62,
  act: 3,
  title: 'قرار صعب',
  mission: 'الموطو ولا المستقبل',
  age: 18,
  summary: 'موطو مستعملة بثمن مليح. ولا الدراهم للمستقبل.',
  start: { spot: 'square', time: '17:00' },
  cast: { sofiane: 'square', walid: 'square' },
  opening: [N('في الساحة، موطو حمرا. "للبيع — سومة فرصة".')],
  objectives: [
    talk('walid', 'وليد', 'walid', [
      say('walid', 'شفت الموطو؟ تشبح! بصح... الحصالة تاعك كانت للمشروع، لا؟'),
      choose(
        'moto',
        opt('نشريها. ستة عشر سنة نستنّى حاجة ليا.', 'bad', { if: 'savings>=1000', fx: { savings: -100000, confidence: 6, risk: 4 }, set: ['bought_moto'] }),
        opt('لا. الدراهم للأدوات / الكتب / المشروع.', 'good', { set: ['invested_future'], fx: { confidence: 4 } }),
        opt('نشري موطو صغيرة بالكريدي.', 'bad', { set: ['moto_debt'], fx: { risk: 6, money: -1000 } }),
      ),
    ]),
    act('think', 'الفوارة', 'fountain', [
      when('invested_future', [N('أمين شرى الحاجة اللي يحتاجها: أدوات، كتب، ولا سلعة. ماشي فرحة اليوم. فرحة الغد.'), fx({ grades: 3, confidence: 3 })]),
      when('bought_moto', [N('الموطو تجري. الريح في الوجه. والحصالة فارغة.')]),
      when('moto_debt', [N('الكريدي كل شهر. والموطو تحتاج إصلاح.')]),
    ]),
    goto('home', 'ارجع للدار', 'home_living'),
    talk('baba', 'بابا', 'baba', [
      when('bought_moto', [B('موطو؟ ...دراهمك وقرارك. بصح لبس الكاسك، ولا ما تدخلش للدار.'), fx({ anger: 4 })]),
      when('moto_debt', [B('بالكريدي؟ أمين... الدين يركب معاك على الموطو.'), fx({ anger: 6, trust: -3 })]),
      when('invested_future', [B('سمعت من وليد. خلّيت الموطو وشريت الأدوات. هاذا تفكير راجل.', { fx: { trust: 4 } })]),
    ]),
  ],
  closing: [N('اليوم ولا غدوة؟ هاذا هو السؤال الأقدم في الدنيا.')],
};

const ch63: Chapter = {
  id: 63,
  act: 3,
  title: 'رسالة لمراد',
  mission: 'الرسالة',
  age: 18,
  summary: 'أمين يكتب لمراد. واش يقول لصاحب الطفولة؟',
  start: { spot: 'home_bedroom', time: '22:00' },
  opening: [N('ورقة بيضا. قلم. وعشرة سنين من الصحبة.'), N('من الطاقة، القاطعة فارغة. الضو تاع العمود يرمش.')],
  objectives: [
    act('write', 'اكتب الرسالة في المكتب', 'desk', [
      when('mourad_recovering', [N('مراد في الشهر العاشر من التعافي. يخدم في ورشة تاع المركز.')]),
      when('mourad_relapsed', [N('مراد رجع للطريق. ما ردّش على الميساجات من شهرين.')]),
      when('!mourad_recovering & !mourad_relapsed', [N('مراد... وين راه؟ آخر مرة شافو في الساحة، ضعيف، وحدو.')]),
      choose(
        'letter',
        opt('"تفكّر الكورة المقطوعة؟ أنت كنت أحسن لاعب. ومازلت. أنا هنا، ديما."', 'help', {
          fx: { mourad: 12 },
          set: ['warm_letter'],
        }),
        opt('"نحبك يا خو. بصح ما نقدرش نعيش حياتك في بلاصتك. الباب مفتوح كي تقرّر."', 'honest', {
          fx: { mourad: 6, confidence: 3 },
          set: ['honest_letter'],
        }),
        opt('"كل واحد وطريقو. بالتوفيق."', 'neutral', { fx: { mourad: -10 }, set: ['cold_letter'] }),
        opt('ما نكتبش. ما عندي ما نقول.', 'neutral', { fx: { mourad: -6 } }),
      ),
    ]),
    goto('deliver', 'الصباح — عطي الرسالة لخالتي فتيحة', 'home_door', { skipTo: '09:00', if: 'warm_letter | honest_letter | cold_letter' }),
    talk('fatiha', 'خالتي فتيحة', 'fatiha', [
      say('fatiha', 'رسالة لمراد؟ نوصّلهالو بيدي.'),
      say('fatiha', 'تعرف يا أمين؟ كي كنتو صغار، كنت نشوفكم من الطاقة تلعبو حتى الليل. ونقول: هاذو خاوة.'),
      A('مازلنا خاوة يا خالتي. حتى كي الطريق يفرّقنا.'),
      when('mourad_relapsed & warm_letter', [say('fatiha', 'يمكن هاذي اللي ترجّعو.'), fx({ mourad: 4 })]),
    ], { if: 'warm_letter | honest_letter | cold_letter' }),
  ],
  closing: [N('الكلمة المكتوبة تبقى. حتى كي اللي كتبها يمشي.')],
};

const ch64: Chapter = {
  id: 64,
  act: 3,
  title: 'رد الجميل',
  mission: 'عمي صالح',
  age: 18,
  summary: 'عمي صالح في السبيطار. الحانوت مسكّر، والحومة بلا خبز الصباح.',
  start: { spot: 'hanout_front', time: '07:00' },
  allowance: false,
  absent: ['salah'],
  cast: { fatiha: 'hanout_front' },
  opening: [N('الحانوت مسكّر. لأول مرة من ثلاثين سنة.')],
  objectives: [
    talk('fatiha', 'خالتي فتيحة', 'fatiha', [
      say('fatiha', 'عمي صالح طاح البارح. القلب. راه في السبيطار. والحانوت؟ عندو المفتاح ولدو في فرنسا.'),
      say('fatiha', 'قال: "قولو لأمين."'),
      choose(
        'run_shop',
        opt('نشد الحانوت حتى يرجع. بلا مقابل.', 'help', { set: ['ran_hanout'], fx: { confidence: 6 } }),
        opt('ما عنديش الوقت...', 'neutral', { fx: { confidence: -3 } }),
      ),
    ]),
    act(
      'shop',
      'افتح الحانوت',
      'counter',
      [
        N('السبعة تاع الصباح. الخبز، الحليب. الناس يدخلو ويستغربو: "أمين؟"'),
        N('في الكونطوار، الكرّاس تاع الكريدي. أسماء، أرقام. عمي صالح يكتب بخط صغير.'),
        choose(
          'credit_book',
          opt('نكتب كل دينار، ونخلّي الكاسة كاملة لعمي صالح.', 'good', { set: ['honest_shop'], fx: { honesty: 8, trust: 4 } }),
          opt('ناخذ شوية مقابل الوقت تاعي.', 'bad', { fx: { money: 1500, honesty: -10 }, set: ['took_from_shop'] }),
        ),
        pass(600),
      ],
      { if: 'ran_hanout' },
    ),
    talk(
      'yacine',
      'ياسين جا يعاون',
      'yacine',
      [
        say('yacine', 'سمعت. جيت نعاونك. ودرتلك برنامج في التيليفون للحسابات.'),
        A('...ياسين.'),
        say('yacine', 'رد الجميل يا أمين. أنت بديت.'),
        fx({ confidence: 4 }),
      ],
      { if: 'ran_hanout & yacine_ally' },
    ),
    goto('hospital', 'العشية — زور عمي صالح (المركز الصحي في الطرف الفوقاني)', 'center', { if: 'ran_hanout' }),
    talk(
      'salah_visit',
      'عمي صالح',
      'samia',
      [
        say('samia', 'عمي صالح في الغرفة الثالثة. قلت نسلّم عليك، المركز حدا قسم القلب.'),
        N('عمي صالح في الفراش. يضحك كي يشوف أمين.'),
        when('honest_shop', [N('أمين عطاه الكرّاس والكاسة. عمي صالح حسب... ودمّع.'), say('narrator', '"ثلاثين سنة نحسب. أول مرة واحد يجيبلي أكثر من واش نستنّى."'), fx({ trust: 4 }, { set: ['salah_heir'] })]),
        when('took_from_shop', [N('عمي صالح حسب. سكت. وقال: "يعطيك الصحة على الوقت."'), N('أمين ما قدرش يشوف في عينيه.')]),
      ],
      { if: 'ran_hanout' },
    ),
  ],
  closing: [when('salah_heir', [N('عمي صالح قال لولدو في التيليفون: "إذا بعت الحانوت، بيعها لأمين بالكريدي. هو يعرف معنى الكريدي."')], [N('الجميل كيما الدين. ساعات تخلّصو، وساعات يبقى.')])],
};

const ch65: Chapter = {
  id: 65,
  act: 3,
  title: 'آخر مواجهة',
  mission: 'كمال',
  age: 18,
  summary: 'كمال خرج من الحبس. وعندو حساب قديم.',
  start: { spot: 'home_door', time: '20:00' },
  cast: { kamel: 'stairs', mourad: 'crossroads' },
  opening: [N('كمال خرج. الحومة كاملة تعرف. ويقولو بلي يسقسي على أمين.')],
  objectives: [
    goto('stairs', 'روح للدروج — ما تهربش', 'stairs'),
    talk('kamel', 'كمال', 'kamel', [
      say('kamel', 'أمين. الشاهد. تعرف شحال عطاوني على خاطر هدرتك؟'),
      when('testified', [A('عطاوك على خاطر واش درت. ماشي على خاطر واش قلت.')], [A('ما قلت والو عليك. بصح كنت نقدر.')]),
      say('kamel', 'نحتاج دراهم باش نبدا من جديد. عشرين ألف. ولا الحومة تعرف كل واش درت وأنت صغير.'),
      choose(
        'blackmail',
        opt('قول للحومة واش تحب. عائلتي تعرف كلش. ما عنديش ما نخبّي.', 'honest', {
          if: 'full_truth | confessed_old_lie | family_knows_help | clean_record',
          set: ['stood_firm'],
          fx: { confidence: 10 },
          then: [say('kamel', '...'), N('كمال ما لقاش واش يقول. التهديد ما عندوش قوة قدام واحد ما يخبّيش.')],
        }),
        opt('نروح للشرطة دروك.', 'good', { set: ['reported_kamel'], fx: { confidence: 6, risk: -4 }, then: [N('أمين خرج التيليفون. كمال رجع للور. "أوكي، أوكي..."')] }),
        opt('هاك واش عندي، وخلّيني.', 'bad', { if: 'money>=500', set: ['paid_kamel'], fx: { money: -100000, confidence: -8, risk: 6 } }),
      ),
      when('stood_firm | reported_kamel', [
        say('kamel', '...تعرف؟ كنت نحب نكون كيفك. عندك عائلة تستنّاك.'),
        choose(
          'kamel_mercy',
          opt('مركز الإصغاء يقبل حتى الكبار. والتكوين المهني. إذا تحب تبدا من جديد بالصح.', 'help', { set: ['offered_kamel_help'], fx: { confidence: 4 } }),
          opt('روح يا كمال.', 'neutral', {}),
        ),
      ]),
    ]),
    talk('mourad', 'مراد في القاطعة', 'mourad', [
      when('mourad_recovering', [MO('سمعت بلي كمال يدوّر عليك. جيت. ما نخلّيكش وحدك، كيما ما خلّيتنيش.', { fx: { mourad: 6 } })], [MO('...سمعت على كمال. لاباس؟')]),
    ]),
  ],
  closing: [when('stood_firm', [N('آخر مواجهة. ماشي بالضرب. بالحقيقة. والحقيقة ما عندهاش ثمن يتخلّص.')], [N('الدروج سكتو. والحومة رقدت.')])],
};

const ch66: Chapter = {
  id: 66,
  act: 3,
  title: 'حصاد السنوات',
  mission: 'الحصاد',
  age: 18,
  summary: 'عند جدّي، في موسم الزيتون. ثمنطاش سنة من الاختيارات.',
  start: { spot: 'grandpa', time: '09:00' },
  cast: { baba: 'grandpa', jeddi: 'grandpa' },
  opening: [N('جدّي الطاهر كبر بزاف. بصح الزيتونة مازالت تعطي.')],
  objectives: [
    act('harvest', 'اجني الزيتون مع جدّك وبابا', 'olive_tree', [
      J('تفكّر كي كنت صغير وتعيا بعد ساعة؟'),
      A('نتفكّر يا جدّي. دروك نعيا بعد ساعتين.'),
      J('ههه. هاذا هو الكبر.'),
      pass(180),
    ]),
    talk('jeddi', 'جدّي يحب يهدر معاك', 'jeddi', [
      J('أمين. احكيلي. واش زرعت في هاذ السنين؟'),
      when('honesty>=65', [J('نسمع من باباك بلي ولّيت تقول الصح حتى كي يوجع. هاذي أحسن زيتونة.')]),
      when('honesty<40', [J('الكذبة كيما الشوك في الزيتونة. تجرح اللي يجني.')]),
      when('trust>=65', [J('وباباك يثق فيك. هاذي ما تتشراش.')]),
      when('trust<40', [J('وباباك... ما زال يستنّى. الثقة كالزيتونة، تحتاج وقت.')]),
      when('mourad_recovering', [J('وصاحبك مراد؟ سمعت بلي ما خلّيتوش. الوفاء نادر يا وليدي.')]),
      when('amine_sought_help', [J('وسمعت على المركز. طلبت العاون. جدّك، في زمانو، ما كانش يعرف يطلب. وخسرنا بزاف على هاذ الشي.')]),
      when('risk>=60', [J('بصح كاين شوك بزاف في الطريق تاعك. مازال الوقت تقلعو.')]),
      choose(
        'harvest_reflect',
        opt('غلطت بزاف يا جدّي. بصح تعلّمت من كل غلطة.', 'honest', { fx: { confidence: 4 } }),
        opt('ما نعرفش واش زرعت. نخاف من الحصاد.', 'neutral', { fx: { confidence: -2 } }),
      ),
      J('هاك. هاذي الزيتونة الصغيرة. ازرعها في دارك. وكي يكون عندك وليد، ورّيهالو.'),
    ]),
    talk('baba', 'بابا تحت الزيتونة', 'baba', [
      B('أمين... كي كنت صغير، كنت نخاف عليك من كلش. الحومة، الصحاب، الطريق.'),
      when('rebuilt_trust | trust>=65', [B('دروك ما نخافش. نثق.')], [B('دروك... مازال نخاف شوية. بصح نشوفك تحاول.')]),
    ]),
  ],
  closing: [N('الحصاد ما يكذبش. واش زرعت، تجني. بصح الزيتونة تاع جدّي علّمتهم حاجة أخرى: كل عام، موسم جديد.')],
};

const ch67: Chapter = {
  id: 67,
  act: 3,
  title: 'ليلة القرار',
  mission: 'الليلة',
  age: 18,
  summary: 'ليلة وحدة. قرار واحد. المستقبل.',
  start: { spot: 'home_bedroom', time: '22:00' },
  opening: [N('الليل. الحومة ساكتة. الزيتونة الصغيرة في طاسة فوق الطاقة.')],
  objectives: [
    act('think', 'المكتب — الورقة الأخيرة', 'desk', [
      N('أمين كتب في ورقة: "شكون نحب نكون؟"'),
      when('bac_passed', [N('ملف الجامعة واجد. الطب؟ الهندسة؟ الإعلام الآلي؟')]),
      when('training_done', [N('الشهادة المهنية في الدرج. وعرض من شركة كهرباء.')]),
      when('bachir_trusts', [N('عمي بشير قال: "الورشة تاعك كي نتقاعد."')]),
      when('business_ok', [N('الطبلة في السوق تربح. وعمي صالح يحب يبيع الحانوت.', { if: 'salah_heir' })]),
      choose(
        'final_commit',
        opt('نكمّل في الطريق اللي بديتو. للآخر.', 'good', { set: ['committed_path'], fx: { confidence: 6 } }),
        opt('نبدّل. نبدا من جديد في حاجة أخرى.', 'neutral', { set: ['restart_path'], unset: ['path_study', 'path_vocational', 'path_craft', 'path_business'] }),
        opt('نقعد نشوف. ما كانش زربة.', 'neutral', { set: ['wait_path'] }),
      ),
    ]),
    act(
      'restart',
      'البداية الجديدة',
      'bed',
      [
        N('بداية جديدة في ثمنطاش سنة. ماشي متأخر.'),
        choose(
          'restart_choice',
          opt('التكوين المهني، الدورة الجاية.', 'good', { set: ['path_vocational'] }),
          opt('مع عمي بشير.', 'good', { set: ['path_craft'] }),
          opt('ما نعرفش بعد.', 'neutral', { set: ['path_undecided'] }),
        ),
      ],
      { if: 'restart_path' },
    ),
    talk('mama', 'ماما ما رقدتش', 'mama', [
      M('ضو بيتك مشعول. ما رقدتش؟'),
      A('نخمّم يا ماما.'),
      M('كي كنت صغير، كنت نعيّطلك كل صباح "نوض يا وليدي، راك تتأخر". تفكّر؟'),
      A('نتفكّر. كل صباح.'),
      M('دروك، ما نحتاجش نعيّط. تنوض وحدك.'),
      fx({ parents: 4 }),
    ]),
  ],
  closing: [N('ليلة القرار. والصباح جاي.')],
};

const ch68: Chapter = {
  id: 68,
  act: 3,
  title: 'طريق الحياة',
  mission: 'طريق الحياة',
  age: 18,
  summary: 'آخر فصل. ماشي نهاية. طريق.',
  start: { spot: 'home_bedroom', time: '07:00' },
  cast: { mourad: 'crossroads', walid: 'football', fatiha: 'home_door' },
  opening: [M('أمين...'), N('...بصح أمين كان ناض من قبل.')],
  objectives: [
    talk('family', 'الفطور مع العائلة', 'mama', [
      N('نفس الطابلة. نفس القهوة بالحليب. بصح كلش تبدّل.'),
      say('selma', 'أمين! اليوم تديني؟ وقولّي... كيفاش نكون كيفك كي نكبر؟'),
      choose(
        'advice_selma',
        opt('قولي الصح، حتى كي يوجع.', 'honest', { set: ['advice_truth'] }),
        opt('اختاري صحابك مليح.', 'good', { set: ['advice_friends'] }),
        opt('ما تكونيش كيفي. كوني خير مني.', 'neutral', { set: ['advice_better'] }),
      ),
      when('trust>=60', [B('روح يا وليدي. ونحنا هنا.', { cam: 'close' })], [B('...روح. ورد بالك على روحك.')]),
    ]),
    goto('street', 'اخرج للحومة', 'home_door'),
    talk('fatiha', 'خالتي فتيحة', 'fatiha', [say('fatiha', 'صباح الخير يا أمين. الحومة كاملة تدعيلك.')]),
    talk('mourad', 'القاطعة', 'mourad', [
      when(
        'mourad_recovering & mourad>=55',
        [MO('أمين! سنة كاملة نظيف اليوم. سنة.', { cam: 'close' }), MO('تفكّر نهار قلتلك "غير ساعة ونرجعو"؟'), A('نتفكّر.'), MO('دروك نقولك: نروحو مع بعض. للخدمة.'), fx({}, { set: ['end_mourad_together'] })],
        [
          when(
            'mourad_recovering',
            [MO('...أمين. راني نتعالج. في مدينة أخرى. جيت نسلّم برك.'), MO('ما بقيناش كيما كنا. بصح شكرا.'), fx({}, { set: ['end_mourad_apart'] })],
            [
              when(
                'mourad>=35',
                [MO('...واش يا خو.'), N('مراد ضعيف. العينين تعبانين. بصح سلّم.'), A('الباب مازال مفتوح يا مراد. ديما.'), MO('...نعرف.'), fx({}, { set: ['end_mourad_crisis'] })],
                [N('القاطعة فارغة. مراد ما بقاش يجي للحومة. الناس يقولو راه في مدينة أخرى، ولا ما يعرفوش.', { cam: 'wide' }), fx({}, { set: ['end_mourad_gone'] })],
              ),
            ],
          ),
        ],
      ),
    ]),
    goto('final', 'امشي في طريقك', 'football'),
    talk('walid', 'وليد في الملعب', 'walid', [
      say('walid', 'تفكّر الكورة المقطوعة؟'),
      A('نتفكّر كلش.'),
      N('الكورة جات لرجلين أمين. شاط. الصغار يجريو وراها.', { cam: 'wide' }),
    ]),
  ],
  closing: [N('طريق الحياة ما عندوش نهاية. عندو غير المحطة الجاية.')],
};

export const ACT3B: Chapter[] = [ch58, ch59, ch60, ch61, ch62, ch63, ch64, ch65, ch66, ch67, ch68];
