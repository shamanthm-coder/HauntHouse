import * as THREE from '../node_modules/three/build/three.module.js';
import { BLOCKS, GAPS, ROOMS, SKIP_WALL } from './data.js';

function woodTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#3a2418';
  ctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 8; i += 1) {
    ctx.fillStyle = i % 2 ? '#2a1810' : '#4a3020';
    ctx.fillRect(0, i * 32, 256, 30);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function ranges(start, end, gaps) {
  const cuts = (gaps || []).slice().sort((a, b) => a[0] - b[0]);
  const out = [];
  let cursor = start;
  for (const [gapStart, gapEnd] of cuts) {
    if (gapStart > cursor + 0.04) out.push([cursor, gapStart]);
    cursor = Math.max(cursor, gapEnd);
  }
  if (end > cursor + 0.04) out.push([cursor, end]);
  return out;
}

function addWall(scene, material, x1, z1, x2, z2) {
  const dx = x2 - x1;
  const dz = z2 - z1;
  const length = Math.hypot(dx, dz);
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(length, 2.9, 0.2), material);
  mesh.position.set((x1 + x2) / 2, 1.45, (z1 + z2) / 2);
  mesh.rotation.y = Math.atan2(-dz, dx);
  scene.add(mesh);
}

function addBox(scene, material, x, z, w, h, d) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  mesh.position.set(x + w / 2, h / 2, z + d / 2);
  scene.add(mesh);
  return mesh;
}

function makeGhost() {
  const material = new THREE.MeshStandardMaterial({
    color: 0xd7e6ee,
    emissive: 0x9fc4d4,
    emissiveIntensity: 0.55,
    transparent: true,
    opacity: 0.9,
    roughness: 0.35,
  });
  const group = new THREE.Group();
  const robe = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.48, 1.7, 10), material);
  robe.position.y = 1.05;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 14, 12), material);
  head.position.y = 2.02;
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0x111418 });
  const left = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 8), eyeMat);
  const right = left.clone();
  left.position.set(-0.07, 2.06, -0.16);
  right.position.set(0.07, 2.06, -0.16);
  group.add(robe, head, left, right);
  return group;
}

export function createHouse(scene) {
  const floorTex = woodTexture();
  floorTex.repeat.set(3, 3);
  const floorMat = new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.9, metalness: 0 });
  const wallMat = new THREE.MeshStandardMaterial({ color: 0x6a5048, roughness: 0.88 });
  const trimMat = new THREE.MeshStandardMaterial({ color: 0x5a4034, roughness: 0.8 });
  const clothMat = new THREE.MeshStandardMaterial({ color: 0x1b2430, roughness: 0.95 });
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x6a4328, roughness: 0.75 });
  const metalMat = new THREE.MeshStandardMaterial({ color: 0x8d928c, roughness: 0.4, metalness: 0.6 });
  const doorMat = new THREE.MeshStandardMaterial({ color: 0x140c0e, roughness: 0.7 });

  for (const room of Object.values(ROOMS)) {
    const floor = new THREE.Mesh(new THREE.BoxGeometry(room.w, 0.2, room.d), floorMat);
    floor.position.set(room.x + room.w / 2, -0.1, room.z + room.d / 2);
    scene.add(floor);
    const ceiling = new THREE.Mesh(new THREE.BoxGeometry(room.w, 0.12, room.d), wallMat);
    ceiling.position.set(room.x + room.w / 2, 2.95, room.z + room.d / 2);
    scene.add(ceiling);
  }

  for (const [id, room] of Object.entries(ROOMS)) {
    const skip = new Set(SKIP_WALL[id] || []);
    const gaps = GAPS[id] || {};
    const x0 = room.x;
    const x1 = room.x + room.w;
    const z0 = room.z;
    const z1 = room.z + room.d;
    if (!skip.has('n')) for (const [a, b] of ranges(x0, x1, gaps.n)) addWall(scene, wallMat, a, z0, b, z0);
    if (!skip.has('s')) for (const [a, b] of ranges(x0, x1, gaps.s)) addWall(scene, wallMat, a, z1, b, z1);
    if (!skip.has('w')) for (const [a, b] of ranges(z0, z1, gaps.w)) addWall(scene, wallMat, x0, a, x0, b);
    if (!skip.has('e')) for (const [a, b] of ranges(z0, z1, gaps.e)) addWall(scene, wallMat, x1, a, x1, b);
  }

  for (const block of BLOCKS) {
    const material = block.id === 'bed' ? clothMat : block.id === 'crate' ? woodMat : trimMat;
    const height = block.id === 'wardrobe' || block.id === 'closet' || block.id === 'cabinet' ? 1.8 : block.id === 'bed' ? 0.5 : 0.55;
    addBox(scene, material, block.x, block.z, block.w, height, block.d);
  }

  const frontDoor = addBox(scene, doorMat, -0.7, 6.15, 1.4, 2.3, 0.12);
  frontDoor.position.y = 1.15;
  const basementDoor = addBox(scene, doorMat, 3.48, 1.55, 0.12, 2.2, 2.7);
  basementDoor.position.y = 1.1;

  const fuse = addBox(scene, metalMat, 9.35, 2.7, 0.16, 0.7, 0.5);
  fuse.position.y = 1.3;

  const windowMat = new THREE.MeshBasicMaterial({ color: 0xb7cfe0 });
  const window = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.8), windowMat);
  window.position.set(0, 1.8, 6.28);
  scene.add(window);

  const markerMat = new THREE.MeshStandardMaterial({ color: 0xe6b15a, emissive: 0xe6b15a, emissiveIntensity: 0.7 });
  const markers = {
    crate: new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 8), markerMat),
    cabinet: new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 8), markerMat),
    drawer: new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 8), markerMat),
  };
  markers.crate.position.set(-6.4, 0.7, -3.95);
  markers.cabinet.position.set(7.45, 1.2, -6.5);
  markers.drawer.position.set(2.3, 0.7, -14.9);
  scene.add(markers.crate, markers.cabinet, markers.drawer);

  const bulbs = [];
  for (const center of [ROOMS.foyer, ROOMS.hall, ROOMS.bedroom, ROOMS.kitchen, ROOMS.storage, ROOMS.basement]) {
    const light = new THREE.PointLight(0xe6b15a, 0, 9, 2);
    light.position.set(center.x + center.w / 2, 2.5, center.z + center.d / 2);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), new THREE.MeshBasicMaterial({ color: 0x3a3328 }));
    bulb.position.copy(light.position);
    scene.add(light, bulb);
    bulbs.push({ light, bulb });
  }

  const moon = new THREE.SpotLight(0xb7cfe0, 80, 16, 0.8, 0.5, 1);
  moon.position.set(0, 2.5, 7.4);
  moon.target.position.set(0, 1.2, 2);
  scene.add(moon, moon.target);

  const ghost = makeGhost();
  scene.add(ghost);

  return { ghost, basementDoor, markers, bulbs };
}

export function syncHouse(world, state, time) {
  world.ghost.position.set(state.ghost.x, Math.sin(time * 2) * 0.04, state.ghost.z);
  world.ghost.lookAt(state.x, 1.4, state.z);
  world.basementDoor.visible = !state.flags.basementOpen;
  world.markers.crate.visible = !state.flags.tookKey;
  world.markers.cabinet.visible = !state.flags.tookFuse;
  world.markers.drawer.visible = !state.flags.tookCode;
  for (const bulb of world.bulbs) {
    bulb.light.intensity = state.flags.power ? 55 : 0;
    bulb.bulb.material.color.set(state.flags.power ? 0xf2d48a : 0x3a3328);
  }
}
