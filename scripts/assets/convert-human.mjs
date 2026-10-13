// usage: node scripts/assets/convert-human.mjs "Animated Human.fbx" public/models/human.glb
// Convert Quaternius "Animated Human" (CC0) FBX → compact GLB for the game.
import fs from 'node:fs';
globalThis.self = globalThis;
globalThis.FileReader = class {
  readAsArrayBuffer(blob) { blob.arrayBuffer().then((b) => { this.result = b; this.onloadend?.(); this.onload?.(); }); }
  readAsDataURL(blob) { blob.arrayBuffer().then((b) => { this.result = 'data:application/octet-stream;base64,' + Buffer.from(b).toString('base64'); this.onloadend?.(); this.onload?.(); }); }
};
const root = process.cwd() + '/node_modules/three';
const THREE = await import(root + '/build/three.module.js');
const { FBXLoader } = await import(root + '/examples/jsm/loaders/FBXLoader.js');
const { GLTFExporter } = await import(root + '/examples/jsm/exporters/GLTFExporter.js');
const buf = fs.readFileSync(process.argv[2]);
const loader = new FBXLoader();
loader.manager.setURLModifier(() => 'data:,');
const obj = loader.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength), '');
const keep = { Idle: 'Idle', Walk: 'Walk', Run: 'Run', Jump: 'Jump', Working: 'Work' };
const clips = obj.animations
  .map((c) => { const n = c.name.split('|')[1]; if (!keep[n]) return null; c.name = keep[n]; return c; })
  .filter(Boolean);
let uvInfo = '';
obj.traverse((o) => {
  if (o.isSkinnedMesh) {
    o.material = new THREE.MeshStandardMaterial({ name: 'Body', color: 0xffffff, roughness: 0.8 });
    const uv = o.geometry.attributes.uv, pos = o.geometry.attributes.position;
    let hi = { y: -1e9 }, lo = { y: 1e9 };
    for (let i = 0; i < pos.count; i++) { const y = pos.getY(i); if (y > hi.y) hi = { y, v: uv.getY(i) }; if (y < lo.y) lo = { y, v: uv.getY(i) }; }
    uvInfo = `top-of-head v=${hi.v.toFixed(3)} feet v=${lo.v.toFixed(3)}`;
  }
});
console.log(uvInfo, clips.map((c) => c.name));
const exporter = new GLTFExporter();
const glb = await exporter.parseAsync(obj, { binary: true, animations: clips, onlyVisible: true });
fs.writeFileSync(process.argv[3], Buffer.from(glb));
console.log('wrote', process.argv[3], (fs.statSync(process.argv[3]).size / 1024).toFixed(0), 'KB');
