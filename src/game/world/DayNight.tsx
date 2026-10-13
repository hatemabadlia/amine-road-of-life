// Time-of-day lighting driven by the game clock.
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import { livePose, useGame } from '../store';
import { mat } from './materials';
import { sound } from '../audio/sound';

const DAY = new THREE.Color('#a9cbe8');
const DUSK = new THREE.Color('#e9a46a');
const NIGHT = new THREE.Color('#1a2648');
const tmp = new THREE.Color();

export function DayNight() {
  const sun = useRef<THREE.DirectionalLight>(null);
  const hemi = useRef<THREE.HemisphereLight>(null);
  const starsRef = useRef<THREE.Group>(null);
  const { scene } = useThree();
  const quality = useGame((s) => s.settings.quality);
  const shadows = useGame((s) => s.settings.shadows);
  const lamp = useMemo(() => mat('#fff6d8', { emissive: '#ffd27a', ei: 0.6 }), []);
  const fog = useMemo(() => new THREE.Fog('#a9cbe8', 70, 230), []);
  useEffect(() => {
    scene.fog = fog;
    return () => {
      scene.fog = null;
    };
  }, [scene, fog]);

  useFrame(() => {
    const st = useGame.getState();
    const minutes = (st.game?.time ?? 600) % 1440;
    const hour = minutes / 60;
    // daylight factor 0..1, sunrise ~6, sunset ~19:30
    const dayT = THREE.MathUtils.clamp((hour - 5.5) / 14, 0, 1);
    const elev = Math.sin(dayT * Math.PI);
    const light = THREE.MathUtils.clamp(elev * 1.6, 0, 1);
    const duskness = THREE.MathUtils.clamp(1 - Math.abs(elev - 0.18) / 0.22, 0, 1) * (hour > 4 && hour < 21 ? 1 : 0);
    tmp.copy(NIGHT).lerp(DAY, light).lerp(DUSK, duskness * 0.6);
    scene.background = tmp.clone();
    fog.color.copy(tmp);
    const az = dayT * Math.PI;
    if (sun.current) {
      const dir = new THREE.Vector3(Math.cos(az) * 0.8, Math.max(0.15, elev), -0.45).normalize();
      sun.current.position.set(livePose.x + dir.x * 60, dir.y * 60, livePose.z + dir.z * 60);
      sun.current.target.position.set(livePose.x, 0, livePose.z);
      sun.current.target.updateMatrixWorld();
      // moonlight keeps the night playable
      sun.current.intensity = 0.55 + light * 2.0;
      sun.current.color.set(duskness > 0.3 ? '#ffc58a' : light < 0.2 ? '#8fa3d9' : '#fff3df');
    }
    if (hemi.current) {
      hemi.current.intensity = 0.8 + light * 0.3;
      hemi.current.color.set(light < 0.25 ? '#7d8fc9' : '#dfeeff');
      hemi.current.groundColor.set(light < 0.25 ? '#3a3a52' : '#b9a27e');
    }
    lamp.emissiveIntensity = light < 0.35 ? 2.2 : 0.3;
    if (starsRef.current) starsRef.current.visible = light < 0.2;
    sound.setNight(light < 0.2);
  });

  const mapSize = quality === 'high' ? 2048 : 1024;
  return (
    <>
      <hemisphereLight ref={hemi} args={['#dfeeff', '#b9a27e', 0.9]} />
      <directionalLight
        ref={sun}
        castShadow={shadows && quality !== 'low'}
        intensity={2}
        shadow-mapSize-width={mapSize}
        shadow-mapSize-height={mapSize}
        shadow-camera-left={-38}
        shadow-camera-right={38}
        shadow-camera-top={38}
        shadow-camera-bottom={-38}
        shadow-camera-near={1}
        shadow-camera-far={150}
        shadow-bias={-0.0005}
        shadow-normalBias={0.04}
      />
      <group ref={starsRef}>
        <Stars radius={200} depth={40} count={1500} factor={4} fade />
      </group>
    </>
  );
}
