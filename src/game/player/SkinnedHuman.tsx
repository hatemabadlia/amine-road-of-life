// Rigged, animated character built from one shared CC0 model (Quaternius
// "Animated Human"). Every character gets its own colours by repainting the
// model's 5-band palette texture, plus accessories (hijab, cap, beard, shoes)
// attached to bones. Animations: idle, walk, run, jump, work, cross-faded.
import { forwardRef, Suspense, useEffect, useImperativeHandle, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { clone as cloneSkinned } from 'three/examples/jsm/utils/SkeletonUtils.js';
import type { Look } from '../../content/characters';
import { radialTexture } from '../world/materials';
import { Humanoid, type HumanoidHandle } from './Humanoid';

export const HUMAN_URL = `${import.meta.env.BASE_URL}models/human.glb`;
const MODEL_HEIGHT = 525; // model units (cm) from feet to top of head
const UNIT = 1.8 / MODEL_HEIGHT; // model units → metres for an adult (scale 1)

/** Palette rows of the source texture (32 px tall): skin, eyes, hair, shirt, pants. */
const BANDS: [number, number][] = [
  [0, 6],
  [6, 11],
  [11, 17],
  [17, 23],
  [23, 32],
];
const paletteCache = new Map<string, THREE.Texture>();
/** Outfits that reach the ankles (the legs underneath take the robe colour). */
const LONG = new Set(['qamis', 'djellaba', 'jebba', 'haik']);

function paletteTexture(look: Look): THREE.Texture {
  const robe = look.robe ?? look.shirt;
  const veiled = look.outfit === 'haik';
  const hair = look.style === 'bald' ? look.skin : veiled ? robe : look.hijab ?? look.hair;
  const shirt = look.outfit ? robe : look.shirt;
  const pants = look.outfit && LONG.has(look.outfit) ? robe : look.pants;
  const colours = [look.skin, '#211a16', hair, shirt, pants];
  const shoes = look.shoes ?? (look.scale < 0.85 ? '#e8e8e8' : '#2b2622');
  const key = [...colours, shoes].join('|');
  const hit = paletteCache.get(key);
  if (hit) return hit;
  const c = document.createElement('canvas');
  c.width = 8;
  c.height = 32;
  const g = c.getContext('2d')!;
  BANDS.forEach(([a, b], i) => {
    g.fillStyle = colours[i];
    g.fillRect(0, a, 4, b - a);
  });
  // right half: shoes (feet vertices are remapped there, see remapFeet)
  g.fillStyle = shoes;
  g.fillRect(4, 0, 4, 32);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.magFilter = THREE.NearestFilter;
  t.minFilter = THREE.NearestFilter;
  t.generateMipmaps = false;
  paletteCache.set(key, t);
  return t;
}

/** Point every vertex at the left (clothes) half of the palette, and the feet at the right (shoes) half. Runs once on the shared geometry. */
const remapped = new WeakSet<THREE.BufferGeometry>();
function remapFeet(mesh: THREE.SkinnedMesh) {
  const geo = mesh.geometry;
  if (remapped.has(geo)) return;
  remapped.add(geo);
  const feet = new Set(mesh.skeleton.bones.flatMap((b, i) => (/Foot|Toe/.test(b.name) ? [i] : [])));
  const uv = geo.attributes.uv as THREE.BufferAttribute;
  const si = geo.attributes.skinIndex as THREE.BufferAttribute;
  const sw = geo.attributes.skinWeight as THREE.BufferAttribute;
  for (let i = 0; i < uv.count; i++) {
    let w = 0;
    for (let k = 0; k < 4; k++) if (feet.has(si.getComponent(i, k))) w += sw.getComponent(i, k);
    uv.setX(i, w > 0.5 ? 0.75 : 0.25);
  }
  uv.needsUpdate = true;
}

const BLOB = new THREE.MeshBasicMaterial({ map: radialTexture('rgba(0,0,0,0.45)', 'rgba(0,0,0,0)'), transparent: true, depthWrite: false });
const BLOB_GEO = new THREE.CircleGeometry(0.42, 20);

/** Clips without per-bone scale/translation, so bones can be re-proportioned (children's heads). */
const cleanClips = new WeakMap<THREE.AnimationClip[], THREE.AnimationClip[]>();
function prepareClips(src: THREE.AnimationClip[]): THREE.AnimationClip[] {
  const hit = cleanClips.get(src);
  if (hit) return hit;
  const out = src.map((c) => {
    const k = c.clone();
    k.tracks = k.tracks.filter((t) => !t.name.endsWith('.scale') && (!t.name.endsWith('.position') || t.name.startsWith('Hips.')));
    return k;
  });
  // a relaxed standing pose taken from the walk cycle (the model's own idle is a wide crouch)
  const walk = out.find((c) => c.name === 'Walk');
  if (walk) {
    const stand = walk.clone();
    stand.name = 'Stand';
    out.push(stand);
  }
  cleanClips.set(src, out);
  return out;
}

type Act = 'Stand' | 'Walk' | 'Run' | 'Jump' | 'Work';
/** walk-cycle time with both feet down, used as the standing pose */
const STAND_TIME = 0.12;

interface Props {
  look: Look;
  /** idle pose for characters doing a job (shopkeeper, carpenter, grandfather in the grove) */
  working?: boolean;
}

const SkinnedBody = forwardRef<HumanoidHandle, Props>(function SkinnedBody({ look, working = false }, ref) {
  const { scene, animations } = useGLTF(HUMAN_URL);
  const root = useRef<THREE.Group>(null);
  const blob = useRef<THREE.Mesh>(null);
  const state = useRef<HumanoidHandle>({ speed: 0, air: false, talking: false, group: null });
  const kid = look.scale < 0.85;

  const { model, mixer, actions, head, spine, rightArm } = useMemo(() => {
    const model = cloneSkinned(scene) as THREE.Group;
    const material = new THREE.MeshStandardMaterial({ map: paletteTexture(look), roughness: 0.78 });
    model.traverse((o) => {
      const m = o as THREE.SkinnedMesh;
      if (m.isSkinnedMesh) {
        remapFeet(m);
        m.material = material;
        m.castShadow = true;
        m.frustumCulled = false;
      }
    });
    const head = model.getObjectByName('Head')!;
    const spine = model.getObjectByName('Spine1')!;
    const rightArm = model.getObjectByName('RightArm')!;
    // children have proportionally bigger heads
    if (kid) head.scale.setScalar(1.18);
    const mixer = new THREE.AnimationMixer(model);
    const actions = Object.fromEntries(prepareClips(animations).map((c) => [c.name, mixer.clipAction(c)])) as Record<Act, THREE.AnimationAction>;
    return { model, mixer, actions, head, spine, rightArm };
  }, [scene, animations, look, kid]);

  const current = useRef<Act>('Stand');
  const phase = useRef(Math.random() * 10);
  useEffect(() => {
    const first: Act = working ? 'Work' : 'Stand';
    current.current = first;
    actions.Stand.timeScale = 0;
    actions[first].reset().play();
    actions.Stand.time = STAND_TIME;
    // desynchronise work loops between characters
    if (working) actions.Work.time = Math.random() * 5;
    return () => {
      mixer.stopAllAction();
    };
  }, [actions, mixer, working]);

  useImperativeHandle(ref, () => {
    state.current.group = root.current;
    return state.current;
  });

  const accessories = useMemo(() => buildAccessories(look), [look]);
  const robe = useMemo(() => buildRobe(look), [look]);
  useEffect(() => {
    head.add(accessories);
    return () => {
      head.remove(accessories);
    };
  }, [head, accessories]);

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.1);
    const st = state.current;
    const sp = st.speed;
    const want: Act = st.air ? 'Jump' : sp > 4.2 ? 'Run' : sp > 0.15 ? 'Walk' : working ? 'Work' : 'Stand';
    if (want !== current.current) {
      const next = actions[want];
      next.reset().setEffectiveWeight(1).play();
      if (want === 'Stand') next.time = STAND_TIME;
      next.crossFadeFrom(actions[current.current], want === 'Jump' ? 0.12 : 0.25, false);
      current.current = want;
    }
    // match the stride to the actual speed (scaled by body size)
    const size = look.scale;
    if (want === 'Walk') actions.Walk.timeScale = THREE.MathUtils.clamp(sp / (1.35 * size), 0.6, 1.8);
    if (want === 'Run') actions.Run.timeScale = THREE.MathUtils.clamp(sp / (5.2 * size), 0.7, 1.5);
    mixer.update(dt);
    // breathing while standing
    if (want === 'Stand') spine.rotation.x += Math.sin(phase.current * 1.6) * 0.015;
    // talking: small nods and a hand gesture layered on top of the animation
    phase.current += dt;
    if (st.talking && want !== 'Run') {
      head.rotation.x += Math.sin(phase.current * 5.3) * 0.06;
      spine.rotation.y += Math.sin(phase.current * 1.7) * 0.05;
      rightArm.rotation.z += (Math.sin(phase.current * 2.4) * 0.5 + 0.5) * 0.25;
    }
    if (blob.current) blob.current.visible = !st.air;
  });

  return (
    <group ref={root} scale={look.scale}>
      <mesh ref={blob} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} material={BLOB} geometry={BLOB_GEO} renderOrder={1} />
      <primitive object={model} scale={UNIT} />
      {robe && <primitive object={robe} />}
    </group>
  );
});

// The head bone's bind frame: y up, +z forward; one bone unit is 0.2372 m.
// Measured head (in metres, bone space): centre (0, 0.154, -0.012), half-size (0.12, 0.155, 0.155).
const HEAD_UNIT = 0.2372;
const HC = new THREE.Vector3(0, 0.154, -0.012);
const low = (color: string) => new THREE.MeshStandardMaterial({ color, roughness: 0.85, flatShading: true });

/** Hijab, cap, beard and long hair fitted to the model's head (built in metres). */
function buildAccessories(look: Look): THREE.Group {
  const g = new THREE.Group();
  g.scale.setScalar(1 / HEAD_UNIT);
  const add = (geo: THREE.BufferGeometry, m: THREE.Material, p: [number, number, number], s: [number, number, number] = [1, 1, 1], r: [number, number, number] = [0, 0, 0]) => {
    const mesh = new THREE.Mesh(geo, m);
    mesh.position.set(HC.x + p[0], HC.y + p[1], HC.z + p[2]);
    mesh.scale.set(...s);
    mesh.rotation.set(...r);
    mesh.castShadow = true;
    g.add(mesh);
  };
  if (look.hijab) {
    const m = low(look.hijab);
    // shell over the top, sides and back of the head, open at the face
    add(new THREE.SphereGeometry(1, 14, 10, Math.PI / 2 + 0.95, Math.PI * 2 - 1.9, 0, Math.PI * 0.78), m, [0, 0.005, -0.01], [0.135, 0.172, 0.17]);
    add(new THREE.SphereGeometry(1, 14, 6, 0, Math.PI * 2, 0, Math.PI * 0.32), m, [0, 0.008, -0.005], [0.134, 0.172, 0.17]);
    // falls over the neck and shoulders
    add(new THREE.CylinderGeometry(0.12, 0.2, 0.2, 14, 1, true), m, [0, -0.2, -0.02]);
  }
  if (look.beard) {
    add(new THREE.SphereGeometry(1, 12, 8, Math.PI * 0.15, Math.PI * 0.7, Math.PI * 0.58, Math.PI * 0.36), low(look.hair), [0, -0.05, 0.02], [0.118, 0.12, 0.13]);
  }
  if (look.cap) {
    const m = low(look.cap);
    // chechia / taqiya-style cap
    add(new THREE.SphereGeometry(1, 14, 6, 0, Math.PI * 2, 0, Math.PI * 0.42), m, [0, 0.03, -0.01], [0.13, 0.15, 0.16]);
  }
  if (look.outfit === 'djellaba') {
    // the pointed hood hanging down the back
    const m = low(look.robe ?? look.shirt);
    add(new THREE.ConeGeometry(0.13, 0.3, 10, 1, true), m, [0, -0.12, -0.13], [1, 1, 0.55], [Math.PI + 0.35, 0, 0]);
  }
  if (look.outfit === 'haik') {
    const m = low(look.robe ?? look.shirt);
    // the haik drawn over the head like a hood, and the white face veil (3ajar) below the eyes
    add(new THREE.SphereGeometry(1, 14, 10, Math.PI / 2 + 0.9, Math.PI * 2 - 1.8, 0, Math.PI * 0.8), m, [0, 0.008, -0.012], [0.142, 0.18, 0.178]);
    add(new THREE.CylinderGeometry(0.14, 0.24, 0.24, 14, 1, true), m, [0, -0.22, -0.02]);
    add(new THREE.SphereGeometry(1, 12, 6, Math.PI * 0.18, Math.PI * 0.64, Math.PI * 0.52, Math.PI * 0.3), low('#f7f5ef'), [0, -0.03, 0.014], [0.128, 0.15, 0.16]);
  }
  if (look.style === 'long' && !look.hijab) {
    add(new THREE.CapsuleGeometry(0.1, 0.14, 4, 10), low(look.hair), [0, -0.1, -0.11], [1.15, 1, 0.45]);
  }
  return g;
}

/**
 * The skirt of an outfit, in metres for an adult (the character group scales it):
 * long robes fall from the waist to the ankles, the smock to mid-thigh. It hangs
 * from the body root, so it sways with the walk without needing its own bones.
 */
function buildRobe(look: Look): THREE.Group | null {
  if (!look.outfit) return null;
  const colour = look.robe ?? look.shirt;
  const m = new THREE.MeshStandardMaterial({ color: colour, roughness: 0.9, side: THREE.DoubleSide, flatShading: true });
  const g = new THREE.Group();
  const long = LONG.has(look.outfit);
  const top = 1.06;
  const bottom = long ? 0.07 : 0.68;
  const rTop = 0.165;
  const rBottom = long ? (look.outfit === 'haik' ? 0.34 : 0.29) : 0.215;
  const skirt = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBottom, top - bottom, 18, 1, true), m);
  skirt.position.y = (top + bottom) / 2;
  skirt.scale.z = 0.78;
  skirt.castShadow = true;
  g.add(skirt);
  // a darker hem on robes and a row of buttons on smocks
  const trim = new THREE.MeshStandardMaterial({ color: new THREE.Color(colour).multiplyScalar(0.7), roughness: 0.9 });
  if (long) {
    const hem = new THREE.Mesh(new THREE.CylinderGeometry(rBottom + 0.004, rBottom + 0.006, 0.05, 18, 1, true), trim);
    hem.position.y = bottom + 0.03;
    hem.scale.z = 0.78;
    g.add(hem);
  } else {
    for (let i = 0; i < 3; i++) {
      const b = new THREE.Mesh(new THREE.SphereGeometry(0.012, 6, 4), trim);
      b.position.set(0, 0.98 - i * 0.1, 0.13 + i * 0.006);
      g.add(b);
    }
  }
  return g;
}

/** Animated character; shows the procedural figure until the model has loaded. */
export const Character = forwardRef<HumanoidHandle, Props>(function Character(props, ref) {
  return (
    <Suspense fallback={<Humanoid ref={ref} look={props.look} />}>
      <SkinnedBody ref={ref} {...props} />
    </Suspense>
  );
});

useGLTF.preload(HUMAN_URL);
