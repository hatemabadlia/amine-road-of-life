// Single source of truth for the neighborhood map. Pure data — used by the 3D
// world, the minimap, the interaction system and the content validator.
// Coordinates: x = east, z = south, metres. Playable bounds ±WORLD_HALF.

export const WORLD_HALF = 80;

export interface Spot {
  id: string;
  name: string;
  x: number;
  z: number;
  r: number;
}

export interface WorldObject {
  id: string;
  name: string;
  /** verb shown in the interaction prompt */
  verb: string;
  x: number;
  z: number;
}

export interface Footprint {
  id: string;
  name: string;
  x0: number;
  z0: number;
  x1: number;
  z1: number;
  kind: 'house' | 'school' | 'shop' | 'public' | 'field' | 'plaza' | 'deco';
}

const spot = (id: string, name: string, x: number, z: number, r = 2.5): Spot => ({ id, name, x, z, r });

export const SPOTS: Spot[] = [
  spot('home_bedroom', 'بيت أمين', -25, -23, 2.5),
  spot('home_bathroom', 'بيت الما', -17.5, -24, 1.8),
  spot('home_kitchen', 'الكوزينة', -15, -13, 2.5),
  spot('home_living', 'الصالون', -25, -13, 3),
  spot('home_door', 'باب الدار', -24, -5.5, 2.5),
  spot('crossroads', 'القاطعة', -6, 6, 3.5),
  spot('hanout', 'حانوت عمي صالح', 13, -12, 2.5),
  spot('hanout_front', 'قدام الحانوت', 13, -5.5, 2.5),
  spot('alley', 'الزنقة', 21, -20, 2.5),
  spot('stairs', 'تحت الدروج', 31, -11, 2.5),
  spot('square', 'الساحة', 59, -17, 5),
  spot('souk', 'السوق', 54, -24, 3.5),
  spot('school_gate', 'باب المدرسة', -24, 7.5, 3),
  spot('school_courtyard', 'ساحة المدرسة', -24, 20, 5),
  spot('classroom', 'القسم', -24, 33, 3),
  spot('football', 'الملعب', 25, 27, 8),
  spot('workshop_front', 'قدام الورشة', 55, 7, 2.5),
  spot('workshop', 'ورشة عمي بشير', 55, 16, 3),
  spot('bus_stop', 'موقف الحافلة', 30, 6, 2.5),
  spot('lycee_gate', 'باب الثانوية', -61, 7.5, 3),
  spot('lycee_courtyard', 'ساحة الثانوية', -61, 20, 5),
  spot('lycee_class', 'قسم الثانوية', -61, 33, 3),
  spot('training_center', 'مركز التكوين المهني', -60, -22, 3),
  spot('center', 'مركز الإصغاء', 15, -44, 3),
  spot('mosque_front', 'قدام الجامع', 35, -37.5, 3),
  spot('grandpa', 'دار جدّي', -22, -56, 3.5),
];

const obj = (id: string, name: string, verb: string, x: number, z: number): WorldObject => ({ id, name, verb, x, z });

export const OBJECTS: WorldObject[] = [
  obj('bed', 'الفراش', 'نوض من الفراش', -28, -25.5),
  obj('desk', 'المكتب', 'اقرا شوية', -21.8, -26.8),
  obj('piggy', 'الحصالة', 'افتح الحصالة', -21.8, -20),
  obj('sink', 'المغسل', 'اغسل وجهك', -17.5, -27.2),
  obj('kitchen_table', 'الطابلة', 'اقعد تفطر', -14.5, -11.5),
  obj('tv', 'التلفزيون', 'شوف التلفزيون', -29.2, -13),
  obj('notice_board', 'لوحة الإعلانات', 'اقرا الإعلان', -32, 15),
  obj('school_desk', 'الطاولة', 'اقعد في بلاصتك', -22, 32),
  obj('board', 'السبورة', 'روح للسبورة', -24, 37.4),
  obj('counter', 'الكونطوار', 'اشري', 13, -15.5),
  obj('boxes', 'الكراطن', 'عاون في الكراطن', 16.5, -10.5),
  obj('ball', 'الكورة', 'العب الكورة', 25, 22),
  obj('under_stairs', 'تحت الدروج', 'شوف واش كاين', 33, -12.5),
  obj('alley_wall', 'حيط الزنقة', 'شوف', 21, -24),
  obj('fountain', 'الفوارة', 'اقعد ترتاح', 59, -17),
  obj('stall', 'طبلة السوق', 'شوف السلعة', 54, -26.5),
  obj('workbench', 'الطاولة تاع الخدمة', 'اخدم', 58, 19),
  obj('lycee_desk', 'طاولة الثانوية', 'اقعد في بلاصتك', -59, 32),
  obj('center_desk', 'الاستقبال', 'كلّم الاستقبال', 15, -47),
  obj('training_desk', 'مكتب التسجيل', 'سجّل', -60, -26),
  obj('olive_tree', 'زيتونة جدّي', 'عاون جدّك', -16, -60),
  obj('street_sign', 'لافتة الطريق', 'خمّم وين تروح', -7.5, 5.6),
  obj('bus_sign', 'لافتة الحافلة', 'استنى الحافلة', 31, 5.2),
  obj('mosque_door', 'باب الجامع', 'ادخل', 35, -40.3),
];

export const FOOTPRINTS: Footprint[] = [
  { id: 'home', name: 'الدار', x0: -30, z0: -28, x1: -10, z1: -8, kind: 'house' },
  { id: 'neighbor1', name: '', x0: -40, z0: -28, x1: -33, z1: -8, kind: 'deco' },
  { id: 'hanout', name: 'الحانوت', x0: 8, z0: -18, x1: 18, z1: -8, kind: 'shop' },
  { id: 'apartments', name: 'العمارة', x0: 24, z0: -28, x1: 38, z1: -8, kind: 'deco' },
  { id: 'square', name: 'الساحة', x0: 46, z0: -30, x1: 72, z1: -8, kind: 'plaza' },
  { id: 'school', name: 'المدرسة', x0: -38, z0: 10, x1: -10, z1: 40, kind: 'school' },
  { id: 'lycee', name: 'الثانوية', x0: -74, z0: 10, x1: -48, z1: 40, kind: 'school' },
  { id: 'field', name: 'الملعب', x0: 10, z0: 12, x1: 40, z1: 42, kind: 'field' },
  { id: 'workshop', name: 'الورشة', x0: 48, z0: 10, x1: 62, z1: 22, kind: 'shop' },
  { id: 'training', name: 'التكوين المهني', x0: -72, z0: -32, x1: -48, z1: -12, kind: 'public' },
  { id: 'center', name: 'مركز الإصغاء', x0: 8, z0: -52, x1: 22, z1: -38, kind: 'public' },
  { id: 'mosque', name: 'الجامع', x0: 29, z0: -56, x1: 41, z1: -40, kind: 'public' },
  { id: 'grandpa', name: 'دار جدّي', x0: -30, z0: -66, x1: -14, z1: -50, kind: 'house' },
  { id: 'block_se', name: '', x0: 48, z0: 28, x1: 72, z1: 48, kind: 'deco' },
  { id: 'block_sw', name: '', x0: -46, z0: 48, x1: -10, z1: 66, kind: 'deco' },
  { id: 'block_nw', name: '', x0: -72, z0: -66, x1: -48, z1: -40, kind: 'deco' },
  { id: 'block_s', name: '', x0: 10, z0: 50, x1: 40, z1: 66, kind: 'deco' },
  { id: 'block_ne', name: '', x0: 50, z0: -66, x1: 72, z1: -40, kind: 'deco' },
];

/** Roads: [x0, z0, x1, z1] asphalt rectangles. */
export const ROADS: [number, number, number, number][] = [
  [-80, -4, 80, 4], // main street
  [-4, -80, 4, 80], // cross street
  [-80, 42.5, 80, 47], // south street
  [-46, -36, 46, -32.5], // north street
  [-46, -48, -42, -4], // west lane
  [42, -48, 46, 4], // east lane
];

export const spotById = new Map(SPOTS.map((s) => [s.id, s]));
export const objectById = new Map(OBJECTS.map((o) => [o.id, o]));

export function insideFootprint(id: string, x: number, z: number, pad = 0): boolean {
  const f = FOOTPRINTS.find((p) => p.id === id);
  if (!f) return false;
  return x > f.x0 - pad && x < f.x1 + pad && z > f.z0 - pad && z < f.z1 + pad;
}
