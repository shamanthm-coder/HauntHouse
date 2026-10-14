import * as THREE from '../node_modules/three/build/three.module.js';
import { react, unlock } from './audio.js';
import { createHouse, syncHouse } from './house.js';
import { bindInput } from './input.js';
import {
  confirmMenu,
  createGame,
  goBack,
  interact,
  keypadHorizontal,
  keypadVertical,
  moveMenu,
  present,
  submitCode,
  update,
} from './sim.js';

const canvas = document.querySelector('#view');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x070406);
scene.fog = new THREE.FogExp2(0x070406, 0.032);
scene.add(new THREE.HemisphereLight(0x243044, 0x1a0c10, 0.18));
scene.add(new THREE.AmbientLight(0x221218, 0.05));

const camera = new THREE.PerspectiveCamera(68, window.innerWidth / window.innerHeight, 0.08, 40);
const flash = new THREE.SpotLight(0xffe2b8, 340, 24, 0.72, 0.4, 1);
camera.add(flash);
camera.add(flash.target);
flash.target.position.set(0, -0.08, -1);
scene.add(camera);

const world = createHouse(scene);
const state = createGame();
state.debug = new URLSearchParams(location.search).has('debug');
const input = bindInput();
const clock = new THREE.Clock();
let bob = 0;
let audioReady = false;

const hud = {
  root: document.querySelector('#hud'),
  reticle: document.querySelector('#reticle'),
  room: document.querySelector('#room'),
  clock: document.querySelector('#clock'),
  objective: document.querySelector('#objective'),
  hint: document.querySelector('#hint'),
  log: document.querySelector('#log'),
  prompt: document.querySelector('#prompt'),
  items: document.querySelector('#items'),
  meter: document.querySelector('#meter'),
  bar: document.querySelector('#bar'),
  controls: document.querySelector('#controls'),
  debug: document.querySelector('#debug'),
  overlay: document.querySelector('#overlay'),
  panel: document.querySelector('#panel'),
};

function resize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener('resize', resize);

function arm() {
  if (!audioReady) {
    audioReady = true;
    unlock();
  }
}

function overlayMarkup(view) {
  if (view.phase === 'title') {
    return `
      <p class="brand">HauntHouse</p>
      <h1>Escape the Ghost</h1>
      <div class="house"></div>
      <p class="tagline">Walk the house. Press OK to use what you face.</p>
      ${menuButtons(view)}
      <p class="control-hints">Arrows choose · OK confirm</p>`;
  }
  if (view.phase === 'help') {
    return `
      <p class="brand">HauntHouse</p>
      <h1>How to play</h1>
      <div class="copy">${view.help.map((line) => `<p>${line}</p>`).join('')}</div>
      ${menuButtons(view)}`;
  }
  if (view.phase === 'pause') {
    return `<h2>Paused</h2>${menuButtons(view)}<p class="control-hints">OK confirm · Back resume</p>`;
  }
  if (view.phase === 'keypad') {
    const digits = view.keypad.map((digit, index) => `<span class="digit ${index === view.keypadIndex ? 'is-on' : ''}">${digit}</span>`).join('');
    return `<h2>Front door</h2><p>${view.log}</p><div class="digits">${digits}</div><p class="control-hints">Up and down change the digit · Left and right move · OK confirms · Back cancels</p>`;
  }
  if (view.phase === 'caught') return `<h2>Caught</h2><p>${view.log}</p>${menuButtons(view)}`;
  if (view.phase === 'midnight') return `<h2>Midnight</h2><p>${view.log}</p>${menuButtons(view)}`;
  if (view.phase === 'escaped') return `<h2>You escaped</h2><p>${view.log}</p>${menuButtons(view)}`;
  return '';
}

function menuButtons(view) {
  return `<div class="menu">${view.menu.map((label, index) => `<button type="button" data-menu="${index}" class="${index === view.menuIndex ? 'is-on' : ''}">${label}</button>`).join('')}</div>`;
}

let overlayKey = '';
function drawHud(view) {
  const playing = view.phase === 'play' || view.phase === 'hiding' || view.phase === 'keypad';
  hud.root.classList.toggle('hidden', !playing);
  hud.reticle.classList.toggle('hidden', view.phase !== 'play');
  document.body.classList.toggle('hiding', view.phase === 'hiding');
  if (playing) {
    hud.room.textContent = view.roomName;
    hud.clock.textContent = view.clock;
    hud.clock.classList.toggle('late', view.late);
    hud.objective.textContent = view.objective;
    hud.hint.textContent = view.hint;
    hud.log.textContent = view.log;
    hud.prompt.textContent = view.prompt ? `OK  ${view.prompt}` : '';
    hud.items.textContent = view.inventory.length ? view.inventory.join('  ·  ') : 'Nothing yet';
    hud.meter.textContent = view.meter.label;
    hud.meter.className = `meter meter-${view.meter.level}`;
    hud.bar.style.width = `${view.meter.pct}%`;
    hud.controls.textContent = view.phase === 'hiding'
      ? 'Stay still · OK crawls out when it leaves · Back pause'
      : 'Arrows move · OK use · Back pause';
    hud.debug.textContent = view.debug;
  }
  const key = `${view.phase}|${view.menuIndex}|${view.keypad.join('')}|${view.keypadIndex}|${view.menu.join('|')}`;
  if (key === overlayKey) return;
  overlayKey = key;
  const markup = overlayMarkup(view);
  hud.overlay.classList.toggle('hidden', !markup);
  hud.overlay.classList.toggle('ending', view.phase === 'caught' || view.phase === 'midnight');
  hud.overlay.classList.toggle('escaped', view.phase === 'escaped');
  hud.panel.innerHTML = markup;
}

function handleTap(action) {
  if (state.phase === 'keypad') {
    if (action === 'up') keypadVertical(state, 1);
    if (action === 'down') keypadVertical(state, -1);
    if (action === 'left') keypadHorizontal(state, -1);
    if (action === 'right') keypadHorizontal(state, 1);
    return;
  }
  if (state.phase === 'play' || state.phase === 'hiding') return;
  if (action === 'up') moveMenu(state, -1);
  if (action === 'down') moveMenu(state, 1);
}

function frame() {
  const dt = clock.getDelta();
  const previous = state.phase;
  if (input.takeBack()) goBack(state);
  let tap = input.takeTap();
  while (tap) {
    handleTap(tap);
    tap = input.takeTap();
  }
  if (input.takeOk()) {
    arm();
    if (state.phase === 'keypad') submitCode(state);
    else if (state.phase === 'play' || state.phase === 'hiding') interact(state);
    else confirmMenu(state);
  }
  update(state, input.held, dt);
  if (state.phase !== previous) react(previous, state);

  bob += dt * (state.moving ? 9 : 0);
  const eye = state.hiding ? 0.48 : 1.58 + Math.sin(bob) * 0.025;
  camera.position.set(state.x, eye, state.z);
  camera.rotation.set(state.hiding ? 0.55 : 0, state.yaw, 0);
  syncHouse(world, state, clock.elapsedTime);
  drawHud(present(state));
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}

hud.overlay.addEventListener('click', (event) => {
  const button = event.target.closest('[data-menu]');
  if (!button) return;
  arm();
  state.menuIndex = Number(button.dataset.menu);
  confirmMenu(state);
  overlayKey = '';
});

resize();
drawHud(present(state));
requestAnimationFrame(frame);
