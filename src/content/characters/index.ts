// Cast of characters. Appearance values drive the procedural 3D models.

export interface Look {
  skin: string;
  shirt: string;
  pants: string;
  hair: string;
  /** body scale (1 = adult male) */
  scale: number;
  hijab?: string;
  beard?: boolean;
  cap?: string;
  /** hair shape */
  style?: 'short' | 'bald' | 'curly' | 'long';
}

export interface AmbientRule {
  if?: string;
  lines: string[];
}

export interface Character {
  id: string;
  name: string;
  role: string;
  /** default position [x, z] when the chapter does not override it */
  home: [number, number];
  /** appear only for these ages (inclusive) */
  ages?: [number, number];
  color: string;
  look: Look;
  ambient: AmbientRule[];
}

export const NARRATOR = 'narrator';
export const PLAYER = 'amine';

export const CHARACTERS: Character[] = [
  {
    id: 'mama',
    name: 'ماما',
    role: 'أم أمين',
    home: [-12.5, -15],
    color: '#c0577c',
    look: { skin: '#d9a77c', shirt: '#7d3c5c', pants: '#5a2c44', hair: '#2b1b14', scale: 0.95, hijab: '#e8d7c3' },
    ambient: [
      { if: 'anger>=50', lines: ['ما نحبش نهدر معاك دروك يا أمين.', 'روح لبيتك وخمّم في واش درت.'] },
      { if: 'parents>=70', lines: ['ربي يحفظك يا وليدي.', 'كليت مليح؟ راك ضعفت.', 'تحب نديرلك كاس حليب؟'] },
      { lines: ['رد بالك على روحك برا.', 'ما تبطاش، الماكلة قريب تطيب.', 'شفت الكراس تاعك؟ راهو فوق الطابلة.'] },
    ],
  },
  {
    id: 'baba',
    name: 'بابا',
    role: 'أب أمين — يخدم في الشانطي',
    home: [-26, -11.5],
    color: '#3f6fb5',
    look: { skin: '#c99670', shirt: '#4a5a6a', pants: '#2e3440', hair: '#3a3a3a', scale: 1.05, beard: true, style: 'short' },
    ambient: [
      { if: 'trust<30', lines: ['...', 'كي تولي تقول الصح، نولي نسمعلك.'] },
      { if: 'trust>=70', lines: ['راني فخور بيك يا أمين.', 'الراجل يتعرف بكلمتو.'] },
      { lines: ['الخدمة اليوم كانت صعيبة، الحمد لله.', 'القراية هي السلاح تاعك يا وليدي.', 'شوف الأخبار معايا شوية.'] },
    ],
  },
  {
    id: 'selma',
    name: 'سلمى',
    role: 'أخت أمين الصغيرة',
    home: [-22.5, -15.5],
    color: '#e48a2c',
    look: { skin: '#dcae85', shirt: '#f2a541', pants: '#b23a48', hair: '#3b2416', scale: 0.62, style: 'long' },
    ambient: [
      { lines: ['أمين! تلعب معايا؟', 'جبتلي حلوة؟', 'ماما قالتلك ما تبطاش!'] },
    ],
  },
  {
    id: 'mourad',
    name: 'مراد',
    role: 'صاحب أمين من الصغر',
    home: [-7, 7.5],
    color: '#d1453b',
    look: { skin: '#c48b62', shirt: '#c0392b', pants: '#34495e', hair: '#1a1a1a', scale: 0.82, cap: '#222', style: 'short' },
    ambient: [
      { if: 'mourad_recovering', lines: ['راني نحاول يا خو، نهار بنهار.', 'شكرا خاطر ما خليتنيش.'] },
      { if: 'mourad<30', lines: ['واش تحب؟', 'روح مع صحابك الجداد.'] },
      { lines: ['واش يا خو، لاباس؟', 'نلعبو ماتش من بعد؟', 'الحومة ما فيهاش غيرنا.'] },
    ],
  },
  {
    id: 'walid',
    name: 'وليد',
    role: 'صاحب مجتهد يحب الكورة',
    home: [19, 21],
    color: '#2e9e5b',
    look: { skin: '#d8a578', shirt: '#27ae60', pants: '#1f3a5f', hair: '#2a1a10', scale: 0.82, style: 'curly' },
    ambient: [
      { lines: ['المدرب قال كاين تجربة الأسبوع الجاي!', 'تحب نراجعو مع بعض؟', 'الكورة والقراية، يمشيو مع بعض.'] },
    ],
  },
  {
    id: 'teacher',
    name: 'سي لخضر',
    role: 'المعلم',
    home: [-26.5, 36],
    color: '#8e6c3a',
    look: { skin: '#c9946b', shirt: '#e5e0d5', pants: '#4b4b4b', hair: '#777', scale: 1.0, style: 'bald' },
    ambient: [
      { lines: ['الصبر مفتاح الفرج، والقراية مفتاح المستقبل.', 'ما تنساش الواجب تاع غدوة.'] },
    ],
  },
  {
    id: 'director',
    name: 'المدير',
    role: 'مدير المدرسة',
    home: [-29, 24],
    color: '#555f6d',
    look: { skin: '#c48d64', shirt: '#2f3b4c', pants: '#22272e', hair: '#555', scale: 1.05, style: 'short' },
    ambient: [{ lines: ['النظام قبل كل شي.', 'وين راك رايح في وقت القراية؟'] }],
  },
  {
    id: 'salah',
    name: 'عمي صالح',
    role: 'مول الحانوت',
    home: [13, -17],
    color: '#a0522d',
    look: { skin: '#c18a5f', shirt: '#f0e6d2', pants: '#5b4a3a', hair: '#ddd', scale: 1.0, beard: true, cap: '#fff' },
    ambient: [
      { lines: ['مرحبا يا وليدي، واش تحتاج؟', 'الكريدي ممنوع، بصح الكلمة الطيبة مرحبا بيها.', 'سلّملي على باباك.'] },
    ],
  },
  {
    id: 'kamel',
    name: 'كمال',
    role: 'شاب كبير من العمارة',
    home: [32, -12],
    color: '#6c3483',
    look: { skin: '#bf8a62', shirt: '#2c2c2c', pants: '#3d3d3d', hair: '#111', scale: 1.0, cap: '#5b2c6f', style: 'short' },
    ambient: [
      { if: 'refused_kamel', lines: ['آه، الشاطر...', 'روح روح، ماكش منّا.'] },
      { lines: ['واش يا الصغير؟', 'هنا بلاصة الكبار.'] },
    ],
  },
  {
    id: 'yacine',
    name: 'ياسين',
    role: 'تلميذ جديد',
    home: [-20, 22],
    color: '#3498db',
    look: { skin: '#e0b48c', shirt: '#5dade2', pants: '#2c3e50', hair: '#6b4423', scale: 0.8, style: 'short' },
    ambient: [
      { if: 'helped_yacine', lines: ['صحة يا أمين، ما ننساش واش درت معايا.'] },
      { lines: ['...السلام.', 'ما نعرف حتى واحد هنا.'] },
    ],
  },
  {
    id: 'bachir',
    name: 'عمي بشير',
    role: 'معلّم في النجارة والحدادة',
    home: [56, 18.5],
    color: '#7f6a4f',
    look: { skin: '#b9825a', shirt: '#6e5a3e', pants: '#3e3428', hair: '#999', scale: 1.05, beard: true, style: 'short' },
    ambient: [
      { lines: ['اليد اللي تخدم ما تجوعش.', 'قيس مرتين وقص مرة.', 'الصنعة إذا ما غناتش تستر.'] },
    ],
  },
  {
    id: 'jeddi',
    name: 'جدّي الطاهر',
    role: 'جدّ أمين',
    home: [-21, -56.5],
    color: '#9b8b6e',
    look: { skin: '#b98a63', shirt: '#d8cfbd', pants: '#8a7b63', hair: '#eee', scale: 0.98, beard: true, cap: '#f5f5f5' },
    ambient: [{ lines: ['تعال يا وليدي، اقعد حدايا.', 'الزيتونة كيما الراجل، تكبر بالصبر.'] }],
  },
  {
    id: 'samia',
    name: 'الدكتورة سامية',
    role: 'أخصائية نفسانية في مركز الإصغاء',
    home: [14, -45],
    ages: [13, 18],
    color: '#16a085',
    look: { skin: '#dcae85', shirt: '#ecf0f1', pants: '#34495e', hair: '#3b2a20', scale: 0.95, hijab: '#5d8aa8' },
    ambient: [{ lines: ['الباب مفتوح ديما.', 'طلب المساعدة شجاعة، ماشي ضعف.'] }],
  },
  {
    id: 'coach',
    name: 'المدرب حسين',
    role: 'مدرب فريق الحومة',
    home: [13, 16],
    color: '#f1c40f',
    look: { skin: '#c48d64', shirt: '#f1c40f', pants: '#1c2833', hair: '#222', scale: 1.0, style: 'short' },
    ambient: [{ lines: ['اللي يغيب على التدريب، يقعد في البانك.', 'الموهبة بلا انضباط ما تسوى والو.'] }],
  },
  {
    id: 'fatiha',
    name: 'خالتي فتيحة',
    role: 'الجارة',
    home: [-36, -5.5],
    color: '#b9770e',
    look: { skin: '#d6a37a', shirt: '#a04000', pants: '#6e2c00', hair: '#222', scale: 0.92, hijab: '#f0f0f0' },
    ambient: [
      { lines: ['يا أمين، قوللي لماماك نجيها العشية.', 'الحومة كلها تعرف كل شي يا وليدي.', 'ربي يهديك ويهدي صحابك.'] },
    ],
  },
  {
    id: 'nadia',
    name: 'الأستاذة نادية',
    role: 'أستاذة الرياضيات في الثانوية',
    home: [-63, 36],
    ages: [13, 18],
    color: '#8e44ad',
    look: { skin: '#e2b48d', shirt: '#7d5ba6', pants: '#2c2c54', hair: '#2b1b14', scale: 0.92, hijab: '#2c2c54' },
    ambient: [{ lines: ['التمرين الثالث، شكون حلّو؟', 'الغلطة في الرياضيات تعلّمك أكثر من الصح.'] }],
  },
  {
    id: 'mustapha',
    name: 'سي مصطفى',
    role: 'مكوّن في مركز التكوين المهني',
    home: [-58, -25],
    ages: [15, 18],
    color: '#2874a6',
    look: { skin: '#c18e66', shirt: '#2874a6', pants: '#1b2631', hair: '#444', scale: 1.0, style: 'short' },
    ambient: [{ lines: ['الكهرباء، التلحيم، الإعلام الآلي... اختار واش يناسبك.', 'التكوين المهني ماشي فشل، هو طريق.'] }],
  },
  {
    id: 'sofiane',
    name: 'سفيان',
    role: 'راس الشلة في الإكمالية',
    home: [-66, 21],
    ages: [13, 18],
    color: '#d35400',
    look: { skin: '#c99670', shirt: '#1c1c1c', pants: '#2e86c1', hair: '#111', scale: 0.95, cap: '#d35400', style: 'short' },
    ambient: [
      { if: 'joined_crew', lines: ['واش يا خو، الليلة نتلاقاو؟', 'الشلة ما تخلّيش صاحبها.'] },
      { lines: ['شكون أنت؟', 'هههه، الشاطر تاع القسم.'] },
    ],
  },
  {
    id: 'imene',
    name: 'إيمان',
    role: 'زميلة في الثانوية',
    home: [-58, 22],
    ages: [13, 18],
    color: '#c0392b',
    look: { skin: '#e3b590', shirt: '#e8daef', pants: '#4a235a', hair: '#2b1b14', scale: 0.86, hijab: '#a9cce3' },
    ambient: [{ lines: ['عندك الدروس تاع البارح؟', 'نحضّرو المشروع مع بعض؟'] }],
  },
];

export const characterById = new Map(CHARACTERS.map((c) => [c.id, c]));

export function speakerName(id: string): string {
  if (id === PLAYER) return 'أمين';
  if (id === NARRATOR) return '';
  return characterById.get(id)?.name ?? id;
}

export function speakerColor(id: string): string {
  if (id === PLAYER) return '#e2b04a';
  return characterById.get(id)?.color ?? '#999';
}
