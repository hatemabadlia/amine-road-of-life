// 2D map renderer shared by the minimap and the full neighbourhood map.
import { FOOTPRINTS, ROADS, SPOTS } from '../world/layout';

const KIND_COLOURS: Record<string, string> = {
  house: '#e0c79a',
  school: '#d7a35b',
  shop: '#e8a87c',
  public: '#9fc5e8',
  field: '#5c9c45',
  plaza: '#cbb89a',
  deco: '#8c8174',
};

export interface MapOpts {
  cx: number;
  cz: number;
  radius: number;
  player: { x: number; z: number; yaw: number };
  target: [number, number] | null;
  rotateWithCamera?: boolean;
  camYaw?: number;
  labels?: boolean;
}

export function drawMap(c: HTMLCanvasElement, o: MapOpts) {
  const g = c.getContext('2d');
  if (!g) return;
  const W = c.width;
  const H = c.height;
  const s = Math.min(W, H) / 2 / o.radius;
  let F: [number, number] = [0, -1];
  let R: [number, number] = [1, 0];
  if (o.rotateWithCamera && o.camYaw !== undefined) {
    F = [-Math.sin(o.camYaw), -Math.cos(o.camYaw)];
    R = [Math.cos(o.camYaw), -Math.sin(o.camYaw)];
  }
  const toScreen = (x: number, z: number): [number, number] => {
    const dx = x - o.cx;
    const dz = z - o.cz;
    const u = dx * R[0] + dz * R[1];
    const v = dx * F[0] + dz * F[1];
    return [W / 2 + u * s, H / 2 - v * s];
  };
  const poly = (x0: number, z0: number, x1: number, z1: number) => {
    const pts = [toScreen(x0, z0), toScreen(x1, z0), toScreen(x1, z1), toScreen(x0, z1)];
    g.beginPath();
    g.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < 4; i++) g.lineTo(pts[i][0], pts[i][1]);
    g.closePath();
  };

  g.fillStyle = '#b89f7c';
  g.fillRect(0, 0, W, H);
  g.fillStyle = '#4b4f57';
  for (const [x0, z0, x1, z1] of ROADS) {
    poly(x0, z0, x1, z1);
    g.fill();
  }
  for (const f of FOOTPRINTS) {
    g.fillStyle = KIND_COLOURS[f.kind] ?? '#999';
    poly(f.x0, f.z0, f.x1, f.z1);
    g.fill();
    if (f.id === 'home') {
      g.strokeStyle = '#2f6f9f';
      g.lineWidth = 3;
      g.stroke();
    }
  }
  if (o.labels) {
    g.font = `700 ${Math.max(11, W / 60)}px Cairo, "Geeza Pro", sans-serif`;
    g.textAlign = 'center';
    g.direction = 'rtl';
    for (const f of FOOTPRINTS) {
      if (!f.name) continue;
      const [x, y] = toScreen((f.x0 + f.x1) / 2, (f.z0 + f.z1) / 2);
      g.fillStyle = 'rgba(0,0,0,0.55)';
      const w = g.measureText(f.name).width + 10;
      g.fillRect(x - w / 2, y - 10, w, 20);
      g.fillStyle = '#fff';
      g.fillText(f.name, x, y + 5);
    }
    for (const sp of SPOTS.filter((x) => ['crossroads', 'alley', 'stairs', 'bus_stop', 'souk'].includes(x.id))) {
      const [x, y] = toScreen(sp.x, sp.z);
      g.fillStyle = 'rgba(255,255,255,0.85)';
      g.fillText(sp.name, x, y - 6);
    }
  }

  // objective
  if (o.target) {
    let [tx, ty] = toScreen(o.target[0], o.target[1]);
    const r = Math.min(W, H) / 2 - 10;
    const ddx = tx - W / 2;
    const ddy = ty - H / 2;
    const d = Math.hypot(ddx, ddy);
    if (d > r) {
      tx = W / 2 + (ddx / d) * r;
      ty = H / 2 + (ddy / d) * r;
    }
    g.fillStyle = '#f2b705';
    g.strokeStyle = '#000';
    g.lineWidth = 2;
    g.beginPath();
    g.arc(tx, ty, 7, 0, Math.PI * 2);
    g.fill();
    g.stroke();
  }

  // player arrow
  const [px, py] = toScreen(o.player.x, o.player.z);
  const P: [number, number] = [Math.sin(o.player.yaw), Math.cos(o.player.yaw)];
  const pu = P[0] * R[0] + P[1] * R[1];
  const pv = P[0] * F[0] + P[1] * F[1];
  const ang = Math.atan2(pu, pv);
  g.save();
  g.translate(px, py);
  g.rotate(ang);
  g.fillStyle = '#ffffff';
  g.strokeStyle = '#c4552d';
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(0, -10);
  g.lineTo(7, 8);
  g.lineTo(0, 4);
  g.lineTo(-7, 8);
  g.closePath();
  g.fill();
  g.stroke();
  g.restore();
}
