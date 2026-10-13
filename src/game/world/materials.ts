// Shared materials and procedural canvas textures (no image assets needed).
import * as THREE from 'three';

const cache = new Map<string, THREE.Material>();

export function mat(color: string, opts: { rough?: number; metal?: number; emissive?: string; ei?: number; map?: THREE.Texture; transparent?: boolean; opacity?: number; side?: THREE.Side } = {}): THREE.MeshStandardMaterial {
  const key = JSON.stringify([color, opts.rough, opts.metal, opts.emissive, opts.ei, opts.map?.uuid, opts.opacity, opts.side]);
  let m = cache.get(key) as THREE.MeshStandardMaterial | undefined;
  if (!m) {
    const params: THREE.MeshStandardMaterialParameters = {
      color,
      roughness: opts.rough ?? 0.9,
      metalness: opts.metal ?? 0,
      transparent: opts.transparent ?? false,
      opacity: opts.opacity ?? 1,
      side: opts.side ?? THREE.FrontSide,
    };
    if (opts.emissive) {
      params.emissive = new THREE.Color(opts.emissive);
      params.emissiveIntensity = opts.ei ?? 1;
    }
    if (opts.map) params.map = opts.map;
    m = new THREE.MeshStandardMaterial(params);
    cache.set(key, m);
  }
  return m;
}

export const PALETTE = {
  wallWhite: '#efe6d6',
  wallCream: '#e8d6b5',
  wallOchre: '#d9b47c',
  wallPink: '#e3c1b0',
  wallBlue: '#c9d6df',
  shutterBlue: '#2f6f9f',
  doorGreen: '#2e6b4f',
  doorBrown: '#6b4a2f',
  tile: '#c9b79a',
  floor: '#d8cbb3',
  asphalt: '#3d3f44',
  sidewalk: '#b8ad9c',
  dirt: '#cdb48d',
  grass: '#6f9a4a',
  pitch: '#5c8f3c',
  wood: '#8a5a33',
  metal: '#8b9198',
  roof: '#d8cdb9',
};

const texCache = new Map<string, THREE.Texture>();

function canvasTex(key: string, w: number, h: number, draw: (g: CanvasRenderingContext2D) => void, repeat?: [number, number]): THREE.Texture {
  const hit = texCache.get(key);
  if (hit) return hit;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d')!;
  draw(g);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  if (repeat) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(repeat[0], repeat[1]);
  }
  texCache.set(key, t);
  return t;
}

/** Text sign rendered with the browser's own Arabic shaping. */
export function signTexture(text: string, bg = '#1f4e79', fg = '#ffffff', w = 512, h = 128): THREE.Texture {
  return canvasTex(`sign:${text}:${bg}:${fg}:${w}x${h}`, w, h, (g) => {
    g.fillStyle = bg;
    g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(255,255,255,0.35)';
    g.lineWidth = 6;
    g.strokeRect(6, 6, w - 12, h - 12);
    g.fillStyle = fg;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.direction = 'rtl';
    let size = h * 0.5;
    g.font = `700 ${size}px "Cairo", "Noto Kufi Arabic", "Geeza Pro", sans-serif`;
    while (g.measureText(text).width > w - 40 && size > 12) {
      size -= 2;
      g.font = `700 ${size}px "Cairo", "Noto Kufi Arabic", "Geeza Pro", sans-serif`;
    }
    g.fillText(text, w / 2, h / 2 + 4);
  });
}

/** Deterministic pseudo-random generator so procedural textures look the same every load. */
export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function speckle(g: CanvasRenderingContext2D, w: number, h: number, n: number, size: number, dark: string, light: string, alpha: number, seed: number) {
  const r = rng(seed);
  for (let i = 0; i < n; i++) {
    g.fillStyle = `rgba(${r() > 0.5 ? dark : light},${r() * alpha})`;
    const s = 1 + r() * size;
    g.fillRect(r() * w, r() * h, s, s);
  }
}

/** Materials whose emissive glow follows the time of day (lit windows, lamps). */
export const nightGlow: { m: THREE.MeshStandardMaterial; day: number; night: number }[] = [];
export function glowAtNight<M extends THREE.MeshStandardMaterial>(m: M, night: number, day = 0): M {
  if (!nightGlow.some((g) => g.m === m)) nightGlow.push({ m, day, night });
  return m;
}

// window cell layout inside a 128×128 facade cell
const WIN = { x: 44, y: 30, w: 40, h: 56 };

/**
 * Facade texture made of 4×2 window cells: blue shutters in different states,
 * air-conditioners, plants and laundry, with a matching emissive map where
 * some windows are lit at night. Repeat is set in window units so cells
 * always line up with the building edges.
 */
function facadeTiles(wall: string, seed: number): { map: THREE.Texture; glow: THREE.Texture } {
  const map = canvasTex(`facade:${wall}:${seed}`, 512, 256, (g) => {
    const r = rng(seed * 97 + 13);
    g.fillStyle = wall;
    g.fillRect(0, 0, 512, 256);
    // plaster blotches + grime
    speckle(g, 512, 256, 1400, 3, '60,45,30', '255,250,240', 0.07, seed);
    for (let row = 0; row < 2; row++) {
      const y0 = row * 128;
      // rain streaks under the slab
      const grad = g.createLinearGradient(0, y0 + 96, 0, y0 + 128);
      grad.addColorStop(0, 'rgba(0,0,0,0)');
      grad.addColorStop(1, 'rgba(60,45,30,0.12)');
      g.fillStyle = grad;
      g.fillRect(0, y0 + 96, 512, 32);
      g.fillStyle = 'rgba(0,0,0,0.16)';
      g.fillRect(0, y0 + 122, 512, 6);
      g.fillStyle = 'rgba(255,255,255,0.18)';
      g.fillRect(0, y0 + 120, 512, 2);
      for (let col = 0; col < 4; col++) {
        const x0 = col * 128;
        const { x, y, w, h } = WIN;
        const state = r();
        // frame and recess
        g.fillStyle = 'rgba(0,0,0,0.22)';
        g.fillRect(x0 + x - 3, y0 + y - 3, w + 6, h + 6);
        g.fillStyle = '#26323c';
        g.fillRect(x0 + x, y0 + y, w, h);
        // glass reflection + mullion
        const gl = g.createLinearGradient(x0 + x, y0 + y, x0 + x + w, y0 + y + h);
        gl.addColorStop(0, 'rgba(190,220,240,0.45)');
        gl.addColorStop(0.5, 'rgba(120,160,190,0.12)');
        gl.addColorStop(1, 'rgba(190,220,240,0.3)');
        g.fillStyle = gl;
        g.fillRect(x0 + x, y0 + y, w, h);
        g.fillStyle = '#e9e4da';
        g.fillRect(x0 + x + w / 2 - 1, y0 + y, 2, h);
        // curtains
        if (state > 0.3) {
          g.fillStyle = ['rgba(240,230,210,0.85)', 'rgba(200,120,110,0.8)', 'rgba(150,180,200,0.8)'][Math.floor(r() * 3)];
          g.fillRect(x0 + x + 2, y0 + y + 2, 9, h - 4);
          g.fillRect(x0 + x + w - 11, y0 + y + 2, 9, h - 4);
        }
        // shutters: open, half-closed or closed
        const shutter = (sx: number, sw: number, sy: number, sh: number) => {
          g.fillStyle = PALETTE.shutterBlue;
          g.fillRect(sx, sy, sw, sh);
          g.fillStyle = 'rgba(0,0,0,0.28)';
          for (let yy = sy + 3; yy < sy + sh; yy += 5) g.fillRect(sx, yy, sw, 1.5);
          g.fillStyle = 'rgba(255,255,255,0.12)';
          g.fillRect(sx, sy, 2, sh);
        };
        if (state < 0.18) shutter(x0 + x, w, y0 + y, h);
        else if (state < 0.4) {
          shutter(x0 + x, w, y0 + y, h * 0.55);
          shutter(x0 + x - 16, 14, y0 + y, h);
        } else {
          shutter(x0 + x - 16, 14, y0 + y, h);
          shutter(x0 + x + w + 2, 14, y0 + y, h);
        }
        // sill
        g.fillStyle = '#f4efe6';
        g.fillRect(x0 + x - 6, y0 + y + h, w + 12, 5);
        g.fillStyle = 'rgba(0,0,0,0.2)';
        g.fillRect(x0 + x - 6, y0 + y + h + 5, w + 12, 2);
        const extra = r();
        if (extra < 0.22) {
          // air-conditioner
          g.fillStyle = '#eef0f1';
          g.fillRect(x0 + x + w - 6, y0 + y + h + 9, 26, 15);
          g.fillStyle = 'rgba(0,0,0,0.25)';
          for (let k = 0; k < 4; k++) g.fillRect(x0 + x + w - 3, y0 + y + h + 12 + k * 3, 20, 1);
        } else if (extra < 0.38) {
          // potted geranium on the sill
          g.fillStyle = '#b5532e';
          g.fillRect(x0 + x + 4, y0 + y + h - 8, 10, 8);
          g.fillStyle = '#3f7a33';
          g.fillRect(x0 + x + 2, y0 + y + h - 14, 14, 7);
          g.fillStyle = '#e04a5a';
          g.fillRect(x0 + x + 6, y0 + y + h - 16, 4, 4);
        } else if (extra < 0.5 && row === 0) {
          // laundry line
          g.strokeStyle = 'rgba(40,40,40,0.6)';
          g.lineWidth = 1;
          g.beginPath();
          g.moveTo(x0 + x - 10, y0 + y + h + 10);
          g.lineTo(x0 + x + w + 10, y0 + y + h + 10);
          g.stroke();
          ['#d24d57', '#f2f2f2', '#3b7dd8', '#f0c419'].forEach((c, k) => {
            g.fillStyle = c;
            g.fillRect(x0 + x - 6 + k * 13, y0 + y + h + 10, 9, 12 + (k % 2) * 4);
          });
        }
      }
    }
  });
  const glow = canvasTex(`facadeglow:${seed}`, 512, 256, (g) => {
    const r = rng(seed * 31 + 7);
    g.fillStyle = '#000';
    g.fillRect(0, 0, 512, 256);
    for (let row = 0; row < 2; row++)
      for (let col = 0; col < 4; col++) {
        if (r() > 0.45) continue;
        const { x, y, w, h } = WIN;
        const warm = r() > 0.25;
        const grad = g.createRadialGradient(col * 128 + x + w / 2, row * 128 + y + h / 2, 4, col * 128 + x + w / 2, row * 128 + y + h / 2, h * 0.7);
        grad.addColorStop(0, warm ? '#ffd9a0' : '#cfe3ff');
        grad.addColorStop(1, warm ? '#b0702a' : '#5a7ab0');
        g.fillStyle = grad;
        g.fillRect(col * 128 + x + 1, row * 128 + y + 1, w - 2, h - 2);
      }
  });
  return { map, glow };
}

/** Facade material for a block: `cols`×`floors` windows, lit at night. */
export function facadeMaterial(wall: string, floors: number, cols: number, seed = 1): THREE.MeshStandardMaterial {
  const key = `facadeMat:${wall}:${floors}:${cols}:${seed}`;
  const hit = cache.get(key) as THREE.MeshStandardMaterial | undefined;
  if (hit) return hit;
  const { map, glow } = facadeTiles(wall, seed);
  const m2 = map.clone();
  const g2 = glow.clone();
  for (const t of [m2, g2]) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(cols / 4, floors / 2);
    t.needsUpdate = true;
  }
  const m = new THREE.MeshStandardMaterial({ color: '#ffffff', map: m2, emissive: '#ffffff', emissiveMap: g2, emissiveIntensity: 0, roughness: 0.92 });
  cache.set(key, m);
  return glowAtNight(m, 1.4);
}

/** Kept for compatibility: a facade texture with windows and shutters. */
export function facadeTexture(wall: string, floors: number, cols: number): THREE.Texture {
  return facadeMaterial(wall, floors, cols).map!;
}

export function groundTexture(kind: 'tiles' | 'dirt' | 'pitch' | 'asphalt' | 'sidewalk', repeat: [number, number]): THREE.Texture {
  const t = canvasTex(`ground:${kind}`, 256, 256, (g) => {
    if (kind === 'tiles') {
      g.fillStyle = '#cdbfa6';
      g.fillRect(0, 0, 256, 256);
      const r = rng(5);
      for (let y = 0; y < 256; y += 64)
        for (let x = 0; x < 256; x += 64) {
          const v = Math.floor(r() * 18) - 9;
          g.fillStyle = `rgb(${205 + v},${191 + v},${166 + v})`;
          g.fillRect(x + 2, y + 2, 60, 60);
          // simple star pattern typical of Maghreb floor tiles
          g.fillStyle = 'rgba(150,110,70,0.18)';
          g.beginPath();
          g.moveTo(x + 32, y + 14);
          g.lineTo(x + 50, y + 32);
          g.lineTo(x + 32, y + 50);
          g.lineTo(x + 14, y + 32);
          g.closePath();
          g.fill();
        }
      speckle(g, 256, 256, 900, 2, '80,60,40', '255,250,235', 0.08, 6);
      g.strokeStyle = 'rgba(90,70,50,0.35)';
      g.lineWidth = 3;
      for (let i = 0; i <= 256; i += 64) {
        g.beginPath();
        g.moveTo(i, 0);
        g.lineTo(i, 256);
        g.moveTo(0, i);
        g.lineTo(256, i);
        g.stroke();
      }
    } else if (kind === 'pitch') {
      for (let i = 0; i < 8; i++) {
        g.fillStyle = i % 2 ? '#7fb55a' : '#74a851';
        g.fillRect(0, i * 32, 256, 32);
      }
      speckle(g, 256, 256, 5000, 1.5, '40,70,20', '200,230,150', 0.18, 9);
      // worn patches
      const r = rng(4);
      for (let i = 0; i < 6; i++) {
        const gx = r() * 256;
        const gy = r() * 256;
        const rad = g.createRadialGradient(gx, gy, 2, gx, gy, 20 + r() * 25);
        rad.addColorStop(0, 'rgba(190,160,110,0.45)');
        rad.addColorStop(1, 'rgba(190,160,110,0)');
        g.fillStyle = rad;
        g.fillRect(0, 0, 256, 256);
      }
    } else if (kind === 'asphalt') {
      g.fillStyle = '#5d6066';
      g.fillRect(0, 0, 256, 256);
      speckle(g, 256, 256, 6000, 1.5, '20,20,25', '230,230,230', 0.12, 3);
      // patched repairs and cracks
      const r = rng(8);
      for (let i = 0; i < 3; i++) {
        g.fillStyle = 'rgba(30,30,35,0.18)';
        g.fillRect(r() * 220, r() * 220, 20 + r() * 40, 14 + r() * 30);
      }
      g.strokeStyle = 'rgba(25,25,28,0.35)';
      g.lineWidth = 1;
      for (let i = 0; i < 5; i++) {
        let x = r() * 256;
        let y = r() * 256;
        g.beginPath();
        g.moveTo(x, y);
        for (let k = 0; k < 6; k++) {
          x += (r() - 0.5) * 30;
          y += (r() - 0.5) * 30;
          g.lineTo(x, y);
        }
        g.stroke();
      }
    } else if (kind === 'sidewalk') {
      g.fillStyle = '#bdb3a2';
      g.fillRect(0, 0, 256, 256);
      const r = rng(11);
      for (let y = 0; y < 256; y += 32)
        for (let x = 0; x < 256; x += 32) {
          const v = Math.floor(r() * 16) - 8;
          g.fillStyle = `rgb(${189 + v},${179 + v},${162 + v})`;
          g.fillRect(x + 1, y + 1, 30, 30);
        }
      speckle(g, 256, 256, 1500, 1.5, '70,60,50', '255,255,245', 0.1, 12);
    } else {
      g.fillStyle = '#cfb58e';
      g.fillRect(0, 0, 256, 256);
      const r = rng(2);
      // large soft colour variation
      for (let i = 0; i < 40; i++) {
        const gx = r() * 256;
        const gy = r() * 256;
        const rad = g.createRadialGradient(gx, gy, 1, gx, gy, 20 + r() * 50);
        const c = r() > 0.5 ? '170,140,100' : '230,210,170';
        rad.addColorStop(0, `rgba(${c},0.35)`);
        rad.addColorStop(1, `rgba(${c},0)`);
        g.fillStyle = rad;
        g.fillRect(0, 0, 256, 256);
      }
      speckle(g, 256, 256, 4000, 2, '90,70,40', '255,240,210', 0.16, 1);
      // pebbles
      for (let i = 0; i < 120; i++) {
        g.fillStyle = `rgba(${r() > 0.5 ? '120,105,85' : '235,225,205'},0.6)`;
        g.beginPath();
        g.arc(r() * 256, r() * 256, 0.8 + r() * 1.6, 0, Math.PI * 2);
        g.fill();
      }
    }
  });
  const c = t.clone();
  c.wrapS = c.wrapT = THREE.RepeatWrapping;
  c.repeat.set(repeat[0], repeat[1]);
  c.needsUpdate = true;
  return c;
}

/** Soft round gradient (blob shadows, light pools, glows). */
export function radialTexture(inner = 'rgba(255,255,255,1)', outer = 'rgba(255,255,255,0)', size = 128): THREE.Texture {
  return canvasTex(`radial:${inner}:${outer}:${size}`, size, size, (g) => {
    const rad = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    rad.addColorStop(0, inner);
    rad.addColorStop(1, outer);
    g.fillStyle = rad;
    g.fillRect(0, 0, size, size);
  });
}

/** Neutral plaster: soft blotches, a grimy base and a lighter top edge. Tinted by the wall colour. */
function plasterTexture(base: boolean): THREE.Texture {
  return canvasTex(`plaster:${base}`, 128, 128, (g) => {
    g.fillStyle = '#f2f2f2';
    g.fillRect(0, 0, 128, 128);
    const r = rng(base ? 21 : 22);
    for (let i = 0; i < 26; i++) {
      const x = r() * 128;
      const y = r() * 128;
      const rad = g.createRadialGradient(x, y, 1, x, y, 10 + r() * 26);
      const c = r() > 0.5 ? '120,110,95' : '255,255,255';
      rad.addColorStop(0, `rgba(${c},0.14)`);
      rad.addColorStop(1, `rgba(${c},0)`);
      g.fillStyle = rad;
      g.fillRect(0, 0, 128, 128);
    }
    speckle(g, 128, 128, 700, 1.5, '90,80,70', '255,255,255', 0.1, base ? 23 : 24);
    if (base) {
      const grad = g.createLinearGradient(0, 128, 0, 92);
      grad.addColorStop(0, 'rgba(95,75,55,0.42)');
      grad.addColorStop(0.25, 'rgba(95,75,55,0.18)');
      grad.addColorStop(1, 'rgba(95,75,55,0)');
      g.fillStyle = grad;
      g.fillRect(0, 92, 128, 36);
      g.fillStyle = 'rgba(255,255,255,0.25)';
      g.fillRect(0, 0, 128, 3);
    }
  });
}

/** Painted plaster wall material in the given colour (`base` adds grime near the ground). */
export function wallMat(color: string, base = true): THREE.MeshStandardMaterial {
  return mat(color, { map: plasterTexture(base), rough: 0.95 });
}

/** Additive materials (light pools, glows) whose opacity follows the night. */
export const nightFade: { m: THREE.Material; max: number }[] = [];
export function fadeAtNight<M extends THREE.Material>(m: M, max: number): M {
  if (!nightFade.some((g) => g.m === m)) nightFade.push({ m, max });
  return m;
}

/** Flat-shaded low-poly material (foliage, rocks, mountains). */
export function flatMat(color: string, rough = 0.95): THREE.MeshStandardMaterial {
  const key = `flat:${color}:${rough}`;
  let m = cache.get(key) as THREE.MeshStandardMaterial | undefined;
  if (!m) {
    m = new THREE.MeshStandardMaterial({ color, roughness: rough, flatShading: true });
    cache.set(key, m);
  }
  return m;
}
