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

/** Repeating facade with windows and blue shutters. One texture per wall colour. */
export function facadeTexture(wall: string, floors: number, cols: number): THREE.Texture {
  const key = `facade:${wall}`;
  const base = canvasTex(key, 128, 128, (g) => {
    g.fillStyle = wall;
    g.fillRect(0, 0, 128, 128);
    // subtle plaster noise
    for (let i = 0; i < 300; i++) {
      g.fillStyle = `rgba(0,0,0,${Math.random() * 0.05})`;
      g.fillRect(Math.random() * 128, Math.random() * 128, 2, 2);
    }
    // window
    g.fillStyle = '#2b3a46';
    g.fillRect(44, 34, 40, 52);
    g.fillStyle = 'rgba(160,200,230,0.35)';
    g.fillRect(48, 38, 15, 44);
    // shutters
    g.fillStyle = PALETTE.shutterBlue;
    g.fillRect(28, 34, 14, 52);
    g.fillRect(86, 34, 14, 52);
    g.fillStyle = 'rgba(0,0,0,0.25)';
    for (let y = 36; y < 86; y += 5) {
      g.fillRect(28, y, 14, 1);
      g.fillRect(86, y, 14, 1);
    }
    // sill + slab line
    g.fillStyle = 'rgba(255,255,255,0.6)';
    g.fillRect(40, 86, 48, 4);
    g.fillStyle = 'rgba(0,0,0,0.12)';
    g.fillRect(0, 124, 128, 4);
  });
  const t = base.clone();
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(cols, floors);
  t.needsUpdate = true;
  return t;
}

export function groundTexture(kind: 'tiles' | 'dirt' | 'pitch' | 'asphalt', repeat: [number, number]): THREE.Texture {
  const t = canvasTex(`ground:${kind}`, 128, 128, (g) => {
    if (kind === 'tiles') {
      g.fillStyle = '#c8bba4';
      g.fillRect(0, 0, 128, 128);
      g.strokeStyle = 'rgba(80,60,40,0.25)';
      g.lineWidth = 2;
      for (let i = 0; i <= 128; i += 32) {
        g.beginPath();
        g.moveTo(i, 0);
        g.lineTo(i, 128);
        g.moveTo(0, i);
        g.lineTo(128, i);
        g.stroke();
      }
    } else if (kind === 'pitch') {
      for (let i = 0; i < 8; i++) {
        g.fillStyle = i % 2 ? '#5f9440' : '#57893a';
        g.fillRect(0, i * 16, 128, 16);
      }
    } else if (kind === 'asphalt') {
      g.fillStyle = '#5b5e64';
      g.fillRect(0, 0, 128, 128);
      for (let i = 0; i < 500; i++) {
        g.fillStyle = `rgba(255,255,255,${Math.random() * 0.06})`;
        g.fillRect(Math.random() * 128, Math.random() * 128, 1, 1);
      }
    } else {
      g.fillStyle = PALETTE.dirt;
      g.fillRect(0, 0, 128, 128);
      for (let i = 0; i < 800; i++) {
        g.fillStyle = `rgba(${Math.random() > 0.5 ? '90,70,40' : '255,240,210'},${Math.random() * 0.12})`;
        g.fillRect(Math.random() * 128, Math.random() * 128, 2, 2);
      }
    }
  });
  const c = t.clone();
  c.wrapS = c.wrapT = THREE.RepeatWrapping;
  c.repeat.set(repeat[0], repeat[1]);
  c.needsUpdate = true;
  return c;
}
