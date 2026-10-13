// Time-of-day lighting driven by the game clock: gradient sky with sun and
// moon, drifting clouds, sun/moon light with shadows, fog, lit windows/lamps.
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import { livePose, useGame } from '../store';
import { mat, nightFade, nightGlow, rng } from './materials';
import { sound } from '../audio/sound';

interface Key {
  h: number;
  top: string;
  horizon: string;
  sun: string;
  sunI: number;
  sky: string;
  ground: string;
  hemiI: number;
  cloud: string;
}

// keyframes over the day (hour → palette); interpolated every frame
const NIGHT_KEY = { top: '#0a1230', horizon: '#26335c', sun: '#a9bcff', sunI: 0.75, sky: '#7484c4', ground: '#3a3a52', hemiI: 1.8, cloud: '#3a4468' };
const KEYS: Key[] = [
  { h: 0, ...NIGHT_KEY },
  { h: 5, ...NIGHT_KEY, top: '#101a40', horizon: '#34406a', cloud: '#47507a' },
  { h: 6.2, top: '#3e5d92', horizon: '#f0a674', sun: '#ffb27a', sunI: 1.5, sky: '#c2b8dc', ground: '#8a6d55', hemiI: 1.35, cloud: '#f2b9a0' },
  { h: 7.6, top: '#5b93d2', horizon: '#f1d6b6', sun: '#ffe2bd', sunI: 2.3, sky: '#d6e6fb', ground: '#ab9475', hemiI: 1.45, cloud: '#fff1e2' },
  { h: 12, top: '#4a8ad6', horizon: '#cfe2f2', sun: '#fff5e6', sunI: 2.6, sky: '#dfeeff', ground: '#b9a27e', hemiI: 1.55, cloud: '#ffffff' },
  { h: 16.8, top: '#5590d0', horizon: '#e6dbc6', sun: '#ffe4b8', sunI: 2.5, sky: '#dfeaf8', ground: '#b49a74', hemiI: 1.5, cloud: '#fff6e8' },
  { h: 18.7, top: '#46609a', horizon: '#f59a5c', sun: '#ff9550', sunI: 1.9, sky: '#d9b4b0', ground: '#8a6650', hemiI: 1.5, cloud: '#ff9f7a' },
  { h: 19.8, top: '#1f2a58', horizon: '#7e5370', sun: '#a9a8e8', sunI: 0.8, sky: '#9a96d4', ground: '#463c52', hemiI: 1.7, cloud: '#6a4f72' },
  { h: 21, ...NIGHT_KEY },
  { h: 24, ...NIGHT_KEY },
];
const COLOR_KEYS = ['top', 'horizon', 'sun', 'sky', 'ground', 'cloud'] as const;
type ColorKey = (typeof COLOR_KEYS)[number];
const C = KEYS.map((k) => ({ ...k, c: Object.fromEntries(COLOR_KEYS.map((n) => [n, new THREE.Color(k[n])])) as Record<ColorKey, THREE.Color> }));

const out = { ...(Object.fromEntries(COLOR_KEYS.map((n) => [n, new THREE.Color()])) as Record<ColorKey, THREE.Color>), sunI: 1, hemiI: 1 };
function sample(hour: number) {
  let i = 0;
  while (i < C.length - 2 && C[i + 1].h <= hour) i++;
  const a = C[i];
  const b = C[i + 1];
  const t = THREE.MathUtils.smoothstep(hour, a.h, b.h);
  for (const n of COLOR_KEYS) out[n].copy(a.c[n]).lerp(b.c[n], t);
  out.sunI = THREE.MathUtils.lerp(a.sunI, b.sunI, t);
  out.hemiI = THREE.MathUtils.lerp(a.hemiI, b.hemiI, t);
  return out;
}

const skyVert = /* glsl */ `
varying vec3 vDir;
void main() {
  vDir = normalize(position);
  vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  gl_Position = p.xyww;
}`;
const skyFrag = /* glsl */ `
uniform vec3 uTop;
uniform vec3 uHorizon;
uniform vec3 uSunColor;
uniform vec3 uSunDir;
uniform vec3 uMoonDir;
uniform float uDay;
uniform float uNight;
varying vec3 vDir;
void main() {
  vec3 d = normalize(vDir);
  float h = d.y;
  vec3 col = mix(uHorizon, uTop, pow(clamp(h, 0.0, 1.0), 0.45));
  col = mix(col, uHorizon * 0.92, smoothstep(0.0, -0.2, h));
  float s = max(dot(d, uSunDir), 0.0);
  // sun disc, halo and broad horizon glow
  col += uSunColor * (smoothstep(0.9993, 0.9997, s) * 6.0 * uDay + pow(s, 24.0) * 0.45 * uDay + pow(s, 4.0) * 0.18 * uDay * (1.0 - clamp(h * 2.0, 0.0, 1.0)));
  // moon
  float m = max(dot(d, uMoonDir), 0.0);
  col += vec3(0.9, 0.93, 1.0) * (smoothstep(0.9995, 0.99975, m) * 2.4 + pow(m, 60.0) * 0.12) * uNight;
  gl_FragColor = vec4(col, 1.0);
  #include <colorspace_fragment>
}`;

function Sky({ uniforms }: { uniforms: Record<string, THREE.IUniform> }) {
  const ref = useRef<THREE.Mesh>(null);
  const { camera } = useThree();
  useFrame(() => ref.current?.position.copy(camera.position));
  return (
    <mesh ref={ref} renderOrder={-10} frustumCulled={false}>
      <sphereGeometry args={[300, 32, 16]} />
      <shaderMaterial vertexShader={skyVert} fragmentShader={skyFrag} uniforms={uniforms} side={THREE.BackSide} depthWrite={false} fog={false} />
    </mesh>
  );
}

/** Low-poly cumulus clouds drifting slowly across the sky. */
function Clouds({ material }: { material: THREE.Material }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const puffs = useMemo(() => {
    const r = rng(77);
    const list: { cx: number; cz: number; y: number; ox: number; oy: number; oz: number; s: number }[] = [];
    for (let c = 0; c < 16; c++) {
      const a = r() * Math.PI * 2;
      const dist = 90 + r() * 140;
      const cx = Math.cos(a) * dist;
      const cz = Math.sin(a) * dist;
      const y = 55 + r() * 30;
      const n = 4 + Math.floor(r() * 4);
      for (let i = 0; i < n; i++) list.push({ cx, cz, y, ox: (i - n / 2) * 5 + r() * 3, oy: r() * 3, oz: (r() - 0.5) * 6, s: 4 + r() * 4 });
    }
    return list;
  }, []);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  useFrame(({ clock }) => {
    const m = ref.current;
    if (!m) return;
    const drift = clock.elapsedTime * 0.6;
    puffs.forEach((p, i) => {
      const x = ((p.cx + p.ox + drift + 260) % 520) - 260;
      dummy.position.set(x, p.y + p.oy, p.cz + p.oz);
      dummy.scale.set(p.s * 1.3, p.s * 0.7, p.s);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    });
    m.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, puffs.length]} material={material} frustumCulled={false}>
      <icosahedronGeometry args={[1, 1]} />
    </instancedMesh>
  );
}

export function DayNight() {
  const sun = useRef<THREE.DirectionalLight>(null);
  const hemi = useRef<THREE.HemisphereLight>(null);
  const fill = useRef<THREE.PointLight>(null);
  const starsRef = useRef<THREE.Group>(null);
  const { scene } = useThree();
  const quality = useGame((s) => s.settings.quality);
  const shadows = useGame((s) => s.settings.shadows);
  const lamp = useMemo(() => mat('#fff6d8', { emissive: '#ffd27a', ei: 0.6 }), []);
  const fog = useMemo(() => new THREE.Fog('#cfe2f2', 60, 210), []);
  const cloudMat = useMemo(() => new THREE.MeshLambertMaterial({ color: '#ffffff', flatShading: true, fog: false, emissive: '#ffffff', emissiveIntensity: 0.35 }), []);
  const uniforms = useMemo(
    () => ({
      uTop: { value: new THREE.Color() },
      uHorizon: { value: new THREE.Color() },
      uSunColor: { value: new THREE.Color() },
      uSunDir: { value: new THREE.Vector3(0, 1, 0) },
      uMoonDir: { value: new THREE.Vector3(0, 1, 0) },
      uDay: { value: 1 },
      uNight: { value: 0 },
    }),
    [],
  );
  const dir = useMemo(() => new THREE.Vector3(), []);
  useEffect(() => {
    scene.fog = fog;
    scene.background = null;
    return () => {
      scene.fog = null;
    };
  }, [scene, fog]);

  useFrame(() => {
    const st = useGame.getState();
    const hour = ((st.game?.time ?? 600) % 1440) / 60;
    const k = sample(hour);
    // sun path: rises in the east (+x) around 6:00, sets in the west around 19:30
    const dayT = (hour - 6) / 13.5;
    const elev = Math.sin(THREE.MathUtils.clamp(dayT, 0, 1) * Math.PI);
    const isDay = dayT > -0.02 && dayT < 1.02;
    const az = THREE.MathUtils.clamp(dayT, 0, 1) * Math.PI;
    const sunDir = uniforms.uSunDir.value.set(Math.cos(az), Math.max(-0.1, Math.sin(az) * 0.85 + (isDay ? 0 : -0.3)), -0.35).normalize();
    // the moon follows its own arc during the night
    const nightT = ((hour + 24 - 19.5) % 24) / 10.5;
    const maz = THREE.MathUtils.clamp(nightT, 0, 1) * Math.PI;
    const moonDir = uniforms.uMoonDir.value.set(Math.cos(maz) * 0.9, Math.sin(maz) * 0.75 + 0.15, 0.4).normalize();
    const dayAmt = THREE.MathUtils.smoothstep(elev, 0.0, 0.12) * (isDay ? 1 : 0);
    const nightAmt = 1 - THREE.MathUtils.smoothstep(dayT, -0.06, 0.04) + THREE.MathUtils.smoothstep(dayT, 0.96, 1.08);
    uniforms.uTop.value.copy(k.top);
    uniforms.uHorizon.value.copy(k.horizon);
    uniforms.uSunColor.value.copy(k.sun);
    uniforms.uDay.value = dayAmt;
    uniforms.uNight.value = THREE.MathUtils.clamp(nightAmt, 0, 1);
    fog.color.copy(k.horizon);
    cloudMat.color.copy(k.cloud);
    cloudMat.emissive.copy(k.cloud).multiplyScalar(0.55);

    // the shadow-casting light is the sun by day and the moon by night
    dir.copy(dayAmt > 0.02 ? sunDir : moonDir);
    if (dir.y < 0.25) dir.y = 0.25;
    dir.normalize();
    if (sun.current) {
      sun.current.position.set(livePose.x + dir.x * 60, dir.y * 60, livePose.z + dir.z * 60);
      sun.current.target.position.set(livePose.x, 0, livePose.z);
      sun.current.target.updateMatrixWorld();
      sun.current.intensity = k.sunI;
      sun.current.color.copy(k.sun);
    }
    if (hemi.current) {
      hemi.current.intensity = k.hemiI;
      hemi.current.color.copy(k.sky);
      hemi.current.groundColor.copy(k.ground);
    }
    // lamps and windows glow from dusk to dawn
    const glow = THREE.MathUtils.clamp(1 - dayAmt * 1.6, 0, 1);
    lamp.emissiveIntensity = 0.3 + glow * 2.6;
    for (const g of nightGlow) g.m.emissiveIntensity = THREE.MathUtils.lerp(g.day, g.night, glow);
    for (const f of nightFade) {
      f.m.opacity = f.max * glow;
      f.m.visible = glow > 0.02;
    }
    // soft moonlit fill around Amine so he never turns into a silhouette at night
    if (fill.current) {
      fill.current.position.set(livePose.x + 1.2, livePose.y + 2.6, livePose.z + 1.2);
      fill.current.intensity = glow * 6;
    }
    if (starsRef.current) starsRef.current.visible = glow > 0.6;
    sound.setNight(glow > 0.6);
  });

  const mapSize = quality === 'high' ? 2048 : 1024;
  return (
    <>
      <Sky uniforms={uniforms} />
      {quality !== 'low' && <Clouds material={cloudMat} />}
      <hemisphereLight ref={hemi} args={['#dfeeff', '#b9a27e', 0.9]} />
      <directionalLight
        ref={sun}
        castShadow={shadows && quality !== 'low'}
        intensity={2}
        shadow-mapSize-width={mapSize}
        shadow-mapSize-height={mapSize}
        shadow-camera-left={-40}
        shadow-camera-right={40}
        shadow-camera-top={40}
        shadow-camera-bottom={-40}
        shadow-camera-near={1}
        shadow-camera-far={160}
        shadow-bias={-0.0004}
        shadow-normalBias={0.035}
      />
      <pointLight ref={fill} color="#c9d6ff" distance={9} decay={1.6} intensity={0} />
      <group ref={starsRef}>
        <Stars radius={200} depth={40} count={2000} factor={4} saturation={0.2} fade />
      </group>
    </>
  );
}
