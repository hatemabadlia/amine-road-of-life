// Neighbourhood life: townspeople with daily routines driven by the game clock.
// They walk real paths between the shop, the square, the souk, the bus stop and
// the mosque; men go to the mosque around prayer times; kids play on the pitch
// in the afternoon; at night most people go home and the streets empty.
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { CapsuleCollider, RigidBody, type RapierRigidBody } from '@react-three/rapier';
import type { Look } from '../../content/characters';
import type { HumanoidHandle } from '../player/Humanoid';
import { Character } from '../player/SkinnedHuman';
import { useGame } from '../store';
import { agents, arrived, face, makeAgent, stepAgent, walkTo, type Agent } from './agents';
import { spotById } from './layout';
import { nav } from './nav';
import { rng } from './materials';

type Role = 'man' | 'woman' | 'elder' | 'kid';

interface Person {
  look: Look;
  role: Role;
}

const PEOPLE: Person[] = [
  { role: 'man', look: { skin: '#c99670', shirt: '#7f8c8d', pants: '#2c3e50', hair: '#222', scale: 1, style: 'short' } },
  { role: 'woman', look: { skin: '#d9a77c', shirt: '#a04000', pants: '#4a235a', hair: '#111', scale: 0.95, hijab: '#f5cba7' } },
  { role: 'elder', look: { skin: '#b98a63', shirt: '#f5f5f5', pants: '#7b7d7d', hair: '#ddd', scale: 0.98, beard: true, cap: '#fff' } },
  { role: 'man', look: { skin: '#c48b62', shirt: '#117a65', pants: '#212f3d', hair: '#111', scale: 1.02, style: 'short' } },
  { role: 'woman', look: { skin: '#e0b48c', shirt: '#884ea0', pants: '#1b2631', hair: '#2b1b14', scale: 0.92, hijab: '#2c3e50' } },
  { role: 'kid', look: { skin: '#c99670', shirt: '#e74c3c', pants: '#ecf0f1', hair: '#111', scale: 0.68, style: 'short' } },
  { role: 'kid', look: { skin: '#dcae85', shirt: '#27ae60', pants: '#ecf0f1', hair: '#3b2416', scale: 0.72, style: 'curly' } },
  { role: 'man', look: { skin: '#bf8a62', shirt: '#34495e', pants: '#1c1c1c', hair: '#151515', scale: 1.0, beard: true } },
  { role: 'elder', look: { skin: '#b07a55', shirt: '#6e5a45', pants: '#3e3428', hair: '#cfcfcf', scale: 0.96, cap: '#7b241c' } },
  { role: 'woman', look: { skin: '#d8a47a', shirt: '#2e86c1', pants: '#1a252f', hair: '#111', scale: 0.93, hijab: '#f0e6d2' } },
  { role: 'kid', look: { skin: '#c48b62', shirt: '#2471a3', pants: '#1c2833', hair: '#3b2a20', scale: 0.7, style: 'short' } },
  { role: 'man', look: { skin: '#d1a07a', shirt: '#b9770e', pants: '#2c3e50', hair: '#222', scale: 0.98, style: 'curly' } },
  { role: 'woman', look: { skin: '#c99670', shirt: '#1e8449', pants: '#17202a', hair: '#111', scale: 0.94, hijab: '#7b241c' } },
  { role: 'kid', look: { skin: '#e0b48c', shirt: '#f1c40f', pants: '#2e4053', hair: '#2b1b14', scale: 0.66, style: 'short' } },
];

// public places each role likes to visit during the day
const PLACES: Record<Role, string[]> = {
  man: ['hanout_front', 'square', 'souk', 'bus_stop', 'crossroads', 'workshop_front', 'mosque_front'],
  woman: ['hanout_front', 'souk', 'square', 'bus_stop', 'center', 'school_gate', 'dar_chabab_front'],
  elder: ['square', 'mosque_front', 'hanout_front', 'souk'],
  kid: ['crossroads', 'hanout_front', 'school_gate', 'football', 'football', 'dar_yard'],
};
// building entrances where people disappear indoors at night and come out in the morning
const DOORS: [number, number][] = [
  [-36.5, -7.2],
  [31, -7.3],
  [60, 27.3],
  [-28, 47.7],
  [25, 49.6],
  [61, -39.6],
  [-60, -39.6],
  [-44, 7.3],
];
// prayer times (hours) when men and elders head to the mosque
const PRAYERS = [12.75, 16.3, 19.1, 20.5];

function hourOf(): number {
  return ((useGame.getState().game?.time ?? 600) % 1440) / 60;
}

function spotPoint(id: string, r: () => number): [number, number] {
  const s = spotById.get(id)!;
  const a = r() * Math.PI * 2;
  const d = r() * Math.max(0.5, s.r * 0.8);
  return [s.x + Math.cos(a) * d, s.z + Math.sin(a) * d];
}

type Plan = 'go' | 'stay' | 'home' | 'indoors';

function Townsperson({ person, index }: { person: Person; index: number }) {
  const r = useMemo(() => rng(1000 + index * 17), [index]);
  const start = DOORS[index % DOORS.length];
  const agent = useMemo<Agent>(() => makeAgent(start[0], start[1], person.role === 'kid' ? 1.9 : person.role === 'elder' ? 1.05 : 1.3 + r() * 0.2), [start, person, r]);
  const body = useRef<RapierRigidBody>(null);
  const group = useRef<THREE.Group>(null);
  const model = useRef<HumanoidHandle>(null);
  const plan = useRef<{ kind: Plan; until: number; place: string | null }>({ kind: 'stay', until: index * 0.6, place: null });
  const clock = useRef(0);

  useEffect(() => {
    agents.add(agent);
    return () => {
      agents.delete(agent);
    };
  }, [agent]);

  const choose = () => {
    const h = hourOf();
    const p = plan.current;
    if (!nav.ready) {
      // wait until the navigation grid is built
      p.until = clock.current + 0.5;
      return;
    }
    const night = h >= 22.5 || h < 6.2;
    // dusk: kids go home first, then everyone
    const curfew = night || (person.role === 'kid' && h >= 20);
    if (curfew) {
      if (p.kind === 'indoors') return;
      const door = DOORS[Math.floor(r() * DOORS.length)];
      walkTo(agent, door[0], door[1]);
      p.kind = 'home';
      return;
    }
    if (p.kind === 'indoors') {
      // morning: come out of a door
      const door = DOORS[Math.floor(r() * DOORS.length)];
      agent.x = door[0];
      agent.z = door[1];
    }
    let place: string;
    const praying = (person.role === 'man' || person.role === 'elder') && PRAYERS.some((t) => h > t - 0.35 && h < t + 0.25);
    if (praying) place = 'mosque_front';
    else if (person.role === 'kid' && h >= 15 && h < 19.5) place = 'football';
    else {
      const list = PLACES[person.role].filter((x) => x !== p.place);
      place = list[Math.floor(r() * list.length)];
    }
    const [x, z] = spotPoint(place, r);
    if (walkTo(agent, x, z)) {
      p.kind = 'go';
      p.place = place;
    } else {
      p.kind = 'stay';
      p.until = clock.current + 3;
    }
  };

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.1);
    const st = useGame.getState();
    if (st.paused || st.card) return;
    clock.current += dt;
    const p = plan.current;
    if (p.kind === 'go' || p.kind === 'home') {
      stepAgent(agent, dt);
      if (arrived(agent)) {
        if (p.kind === 'home') {
          p.kind = 'indoors';
          p.until = clock.current + 20;
        } else {
          p.kind = 'stay';
          // linger: shoppers briefly, worshippers until prayer ends, kids play longer
          p.until = clock.current + (p.place === 'football' ? 25 : p.place === 'mosque_front' ? 30 : 6 + r() * 12);
        }
      }
    } else {
      agent.speed = 0;
      if (clock.current > p.until) choose();
    }
    // chat with whoever is standing close by
    let partner: Agent | null = null;
    if (p.kind === 'stay')
      for (const o of agents)
        if (o !== agent && arrived(o) && Math.hypot(o.x - agent.x, o.z - agent.z) < 1.8) {
          partner = o;
          break;
        }
    if (partner) face(agent, partner.x, partner.z, dt, 3);
    const hidden = p.kind === 'indoors';
    body.current?.setNextKinematicTranslation({ x: agent.x, y: hidden ? -20 : 0.9 * person.look.scale, z: agent.z });
    if (group.current) {
      group.current.visible = !hidden;
      group.current.position.set(agent.x, 0, agent.z);
      group.current.rotation.y = agent.yaw;
    }
    if (model.current) {
      model.current.speed = agent.speed;
      model.current.talking = !!partner && Math.sin(clock.current * 0.7 + index) > 0;
    }
  });

  return (
    <>
      <RigidBody ref={body} type="kinematicPosition" colliders={false} position={[start[0], -20, start[1]]}>
        <CapsuleCollider args={[0.9 * person.look.scale - 0.28, 0.28]} />
      </RigidBody>
      <group ref={group} visible={false}>
        <Character ref={model} look={person.look} />
      </group>
    </>
  );
}

export function Townsfolk() {
  const quality = useGame((s) => s.settings.quality);
  // fewer people on low quality (phones)
  const people = quality === 'low' ? PEOPLE.slice(0, 8) : PEOPLE;
  return (
    <>
      {people.map((p, i) => (
        <Townsperson key={i} person={p} index={i} />
      ))}
    </>
  );
}
