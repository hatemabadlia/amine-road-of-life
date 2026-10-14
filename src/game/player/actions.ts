// Where and how Amine uses the furniture he interacts with: the hip position and
// facing for each seat, and the short sequences of postures that take him there
// (sit down, lie down, get up). Yaw: 0 faces +z, π/2 faces +x, π faces -z.
import type { Pose } from './Humanoid';

export interface Place {
  x: number;
  z: number;
  yaw: number;
  /** hip height above the floor (metres) when resting on furniture */
  seat?: number;
}

export interface Step extends Place {
  pose: Pose;
  /** seconds to glide from the previous step */
  dur: number;
}

/** Amine's bed: lying with the head on the pillow (west), sitting on the edge, standing beside it. */
export const BED = {
  lie: { x: -28.15, z: -25.5, yaw: Math.PI / 2, seat: 0.74 },
  edge: { x: -27.85, z: -25.1, yaw: 0, seat: 0.68 },
  out: { x: -27.85, z: -24.45, yaw: 0 },
};

interface Seat extends Place {
  pose: Pose;
}

const SEATS: Record<string, Seat> = {
  desk: { x: -21.6, z: -26.15, yaw: Math.PI, seat: 0.56, pose: 'sit' },
  kitchen_table: { x: -14.5, z: -10.65, yaw: Math.PI, seat: 0.5, pose: 'sit' },
  school_desk: { x: -20.5, z: 30.4, yaw: 0, seat: 0.52, pose: 'sit' },
  lycee_desk: { x: -57.5, z: 30.4, yaw: 0, seat: 0.52, pose: 'sit' },
  exam_desk: { x: 73.5, z: 18.62, yaw: 0, seat: 0.54, pose: 'sit' },
  cyber_pc: { x: 16.2, z: -63.2, yaw: Math.PI, seat: 0.56, pose: 'sit' },
  tutor_table: { x: 14.5, z: -75.35, yaw: Math.PI, seat: 0.45, pose: 'sit' },
  stadium_bench: { x: 52.5, z: 64, yaw: Math.PI / 2, seat: 0.58, pose: 'sit' },
  sink: { x: -17.5, z: -26.75, yaw: Math.PI, pose: 'bend' },
  // Amine's place in the first row, facing the mihrab
  prayer_row: { x: 35, z: -50.2, yaw: Math.PI, pose: 'julus' },
};

/** Objects used where Amine stands, facing them. */
const IN_PLACE: Record<string, Pose> = {
  wudu: 'bend',
  boxes: 'bend',
  garden_plot: 'kneel',
  olive_tree: 'kneel',
};

export const hasAction = (id: string) => id === 'bed' || id in SEATS || id in IN_PLACE;

const back = (p: Place, d: number): Place => ({ x: p.x - Math.sin(p.yaw) * d, z: p.z - Math.cos(p.yaw) * d, yaw: p.yaw });

/**
 * Steps to start using an object. `here` is where Amine stands, `target` the
 * object's position, `inBed` whether he is already lying in bed, `hour` the
 * time of day (the bed is for sleeping at night, for sitting during the day).
 */
export function enterSteps(id: string, here: Place, target: { x: number; z: number }, inBed: boolean, hour: number): Step[] {
  if (id === 'bed') {
    if (inBed) return [];
    const steps: Step[] = [
      { pose: 'stand', ...BED.out, dur: 0.5 },
      { pose: 'sit', ...BED.edge, dur: 0.9 },
    ];
    if (hour >= 19 || hour < 5) steps.push({ pose: 'lie', ...BED.lie, dur: 1.4 });
    return steps;
  }
  const seat = SEATS[id];
  if (seat) {
    const stand = seat.pose === 'sit' ? back(seat, 0.35) : seat;
    return [
      { pose: 'stand', ...stand, seat: undefined, dur: 0.5 },
      { ...seat, dur: seat.pose === 'julus' ? 1.1 : 0.8 },
    ];
  }
  const yaw = Math.atan2(target.x - here.x, target.z - here.z);
  return [{ pose: IN_PLACE[id], x: here.x, z: here.z, yaw, dur: 0.7 }];
}

/** Steps to get up again, from the posture `pose` at `at`. */
export function exitSteps(id: string, pose: Pose, at: Place): Step[] {
  if (id === 'bed') {
    const steps: Step[] = [];
    if (pose === 'lie') {
      steps.push({ pose: 'sitLong', ...BED.lie, seat: 0.7, dur: 1.0 });
      steps.push({ pose: 'sit', ...BED.edge, dur: 1.1 });
    }
    steps.push({ pose: 'stand', ...BED.out, dur: 0.8 });
    return steps;
  }
  if (pose === 'sit') return [{ pose: 'stand', ...back(at, 0.4), dur: 0.8 }];
  return [{ pose: 'stand', ...at, seat: undefined, dur: pose === 'julus' || pose === 'kneel' ? 0.9 : 0.6 }];
}
