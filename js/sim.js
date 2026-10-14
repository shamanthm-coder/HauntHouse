import {
  BLOCKS,
  CENTERS,
  CODE,
  HELP,
  ITEMS,
  LINKS,
  MIDNIGHT,
  PATROL,
  PLAYER_RADIUS,
  ROOMS,
  SPOTS,
  TUNING,
} from './data.js';

const ENDINGS = new Set(['caught', 'escaped', 'midnight']);

export function createGame() {
  const ghostStart = CENTERS.bedroom;
  return {
    phase: 'title',
    returnPhase: 'title',
    menuIndex: 0,
    x: 0,
    z: 4.1,
    yaw: 0,
    moving: false,
    hiding: false,
    hideSeen: false,
    inventory: [],
    flags: {
      basementOpen: false,
      power: false,
      tookKey: false,
      tookFuse: false,
      tookCode: false,
    },
    clock: TUNING.startClock,
    awareness: 4,
    log: 'The house is waiting.',
    keypad: [0, 0, 0, 0],
    keypadIndex: 0,
    sound: true,
    debug: false,
    ghost: {
      x: ghostStart.x,
      z: ghostStart.z,
      room: 'bedroom',
      state: 'patrol',
      routeIndex: 0,
      wait: 10,
      target: 'bedroom',
      path: [],
      stun: 0,
    },
  };
}

function has(state, id) {
  return state.inventory.includes(id);
}

function give(state, id) {
  if (!has(state, id)) state.inventory.push(id);
}

function take(state, id) {
  state.inventory = state.inventory.filter((item) => item !== id);
}

function clamp(n) {
  return Math.max(0, Math.min(100, n));
}

export function forward(yaw) {
  return { x: -Math.sin(yaw), z: -Math.cos(yaw) };
}

function inside(rect, x, z, pad = 0) {
  return x >= rect.x + pad && x <= rect.x + rect.w - pad && z >= rect.z + pad && z <= rect.z + rect.d - pad;
}

function hitsBlock(x, z) {
  const pad = 0.28;
  return BLOCKS.some((block) => x > block.x - pad && x < block.x + block.w + pad && z > block.z - pad && z < block.z + block.d + pad);
}

export function walkable(x, z, state) {
  if (hitsBlock(x, z)) return false;
  for (const room of Object.values(ROOMS)) {
    if (inside(room, x, z, PLAYER_RADIUS)) return true;
  }
  for (const link of LINKS) {
    if (link.locked && !state.flags.basementOpen) continue;
    if (inside(link.rect, x, z, 0)) return true;
  }
  return false;
}

export function roomAt(x, z) {
  let best = 'hall';
  let bestDist = Infinity;
  for (const [id, room] of Object.entries(ROOMS)) {
    if (!inside(room, x, z, -0.2)) continue;
    const center = CENTERS[id];
    const dist = Math.hypot(x - center.x, z - center.z);
    if (dist < bestDist) {
      bestDist = dist;
      best = id;
    }
  }
  return best;
}

function neighbors(room, state) {
  const names = new Set();
  for (const link of LINKS) {
    if (link.locked && !state.flags.basementOpen) continue;
    if (link.a === room) names.add(link.b);
    if (link.b === room) names.add(link.a);
  }
  return [...names];
}

function doorBetween(from, to) {
  const link = LINKS.find((item) => (item.a === from && item.b === to) || (item.a === to && item.b === from));
  return link ? { x: link.x, z: link.z } : CENTERS[to];
}

function pathTo(state, from, to) {
  if (!from || !to) return [];
  if (from === to) return [{ ...CENTERS[to] }];
  const queue = [from];
  const previous = { [from]: null };
  while (queue.length) {
    const current = queue.shift();
    for (const next of neighbors(current, state)) {
      if (previous[next] !== undefined) continue;
      previous[next] = current;
      queue.push(next);
    }
  }
  if (previous[to] === undefined) return [{ ...CENTERS[to] }];
  const rooms = [to];
  let cursor = to;
  while (previous[cursor]) {
    cursor = previous[cursor];
    rooms.push(cursor);
  }
  rooms.reverse();
  const points = [];
  for (let i = 0; i < rooms.length - 1; i += 1) points.push(doorBetween(rooms[i], rooms[i + 1]));
  points.push({ ...CENTERS[rooms[rooms.length - 1]] });
  return points;
}

function tryMove(state, dx, dz) {
  const nx = state.x + dx;
  const nz = state.z + dz;
  if (walkable(nx, nz, state)) {
    state.x = nx;
    state.z = nz;
    return;
  }
  if (walkable(nx, state.z, state)) state.x = nx;
  else if (walkable(state.x, nz, state)) state.z = nz;
}

function stepGhost(state, dt, speed) {
  const ghost = state.ghost;
  if (!ghost.path.length) return true;
  const target = ghost.path[0];
  const dx = target.x - ghost.x;
  const dz = target.z - ghost.z;
  const dist = Math.hypot(dx, dz);
  if (dist < 0.12) {
    ghost.path.shift();
    ghost.room = roomAt(ghost.x, ghost.z);
    ghost.stuck = 0;
    return ghost.path.length === 0;
  }
  const step = Math.min(dist, speed * dt);
  const nx = ghost.x + (dx / dist) * step;
  const nz = ghost.z + (dz / dist) * step;
  if (walkable(nx, nz, state)) {
    ghost.x = nx;
    ghost.z = nz;
    ghost.stuck = 0;
  } else if (walkable(nx, ghost.z, state)) {
    ghost.x = nx;
    ghost.stuck = 0;
  } else if (walkable(ghost.x, nz, state)) {
    ghost.z = nz;
    ghost.stuck = 0;
  } else {
    ghost.stuck = (ghost.stuck || 0) + dt;
    if (ghost.stuck > 0.8) {
      ghost.x = target.x;
      ghost.z = target.z;
      ghost.path.shift();
      ghost.stuck = 0;
    }
  }
  ghost.room = roomAt(ghost.x, ghost.z);
  return ghost.path.length === 0 && dist < 0.12;
}

function alertGhost(state, room) {
  const ghost = state.ghost;
  if (ghost.stun > 0) {
    ghost.target = room;
    ghost.state = 'investigate';
    return;
  }
  if (ghost.state === 'investigate' && ghost.target === room && ghost.path.length) return;
  ghost.state = 'investigate';
  ghost.target = room;
  ghost.wait = 0;
  ghost.path = pathTo(state, roomAt(ghost.x, ghost.z), room);
}

function updateGhost(state, dt) {
  const ghost = state.ghost;
  if (ghost.stun > 0) {
    ghost.stun -= dt;
    if (ghost.stun <= 0) ghost.path = pathTo(state, roomAt(ghost.x, ghost.z), ghost.target);
    return;
  }
  if (ghost.state === 'investigate') {
    const arrived = stepGhost(state, dt, state.flags.power ? TUNING.ghostHunt + 0.35 : TUNING.ghostHunt);
    if (arrived) {
      ghost.state = 'search';
      ghost.room = ghost.target;
      ghost.wait = 4.2;
      ghost.path = [];
    }
    return;
  }
  if (ghost.state === 'search') {
    ghost.wait -= dt;
    if (ghost.wait <= 0) {
      ghost.state = 'patrol';
      ghost.path = [];
    }
    return;
  }
  if (ghost.wait > 0) {
    ghost.wait -= dt;
    return;
  }
  if (!ghost.path.length) {
    const dest = PATROL[ghost.routeIndex].room;
    if (ghost.room === dest) {
      ghost.routeIndex = (ghost.routeIndex + 1) % PATROL.length;
      ghost.path = pathTo(state, ghost.room, PATROL[ghost.routeIndex].room);
      return;
    }
    ghost.path = pathTo(state, ghost.room, dest);
  }
  const speed = state.flags.power ? TUNING.ghostPatrol + 0.45 : TUNING.ghostPatrol;
  if (stepGhost(state, dt, speed)) {
    const dest = PATROL[ghost.routeIndex].room;
    ghost.room = dest;
    ghost.wait = PATROL[ghost.routeIndex].stay;
    ghost.routeIndex = (ghost.routeIndex + 1) % PATROL.length;
    ghost.path = [];
  }
}

function ghostDistance(state) {
  return Math.hypot(state.ghost.x - state.x, state.ghost.z - state.z);
}

function threatens(state) {
  const dist = ghostDistance(state);
  if (dist < TUNING.catchDistance) return true;
  return dist < 1.75 && roomAt(state.x, state.z) === state.ghost.room;
}

function catchPlayer(state, line) {
  state.phase = 'caught';
  state.hiding = false;
  state.moving = false;
  state.ghost.state = 'chase';
  state.awareness = 100;
  state.log = line;
  state.menuIndex = 0;
}

function advanceClock(state, dt) {
  state.clock += dt / TUNING.secondsPerMinute;
  if (state.clock >= MIDNIGHT && (state.phase === 'play' || state.phase === 'hiding' || state.phase === 'keypad')) {
    state.phase = 'midnight';
    state.hiding = false;
    state.menuIndex = 0;
    state.log = 'The clock strikes twelve. Every door locks. It knows the house better than you do.';
  }
}

export function update(state, input, dt) {
  dt = Math.min(0.05, Math.max(0, dt || 0));
  if (state.phase === 'title' || state.phase === 'pause' || state.phase === 'help' || ENDINGS.has(state.phase)) return state;

  advanceClock(state, dt);
  if (ENDINGS.has(state.phase)) return state;
  updateGhost(state, dt);
  if (ENDINGS.has(state.phase)) return state;

  if (state.phase === 'hiding') {
    state.moving = false;
    state.awareness = clamp(state.awareness - TUNING.awarenessDecay * dt);
    if (state.hideSeen && threatens(state)) catchPlayer(state, 'It saw you hide. Cold fingers find your wrist.');
    return state;
  }

  if (state.phase === 'keypad') {
    state.moving = false;
    if (threatens(state)) catchPlayer(state, 'It finds you at the door.');
    return state;
  }

  let move = 0;
  if (input.left) state.yaw += TUNING.turnSpeed * dt;
  if (input.right) state.yaw -= TUNING.turnSpeed * dt;
  if (input.up) move += 1;
  if (input.down) move -= TUNING.backSpeed / TUNING.walkSpeed;
  state.moving = move !== 0;
  if (move !== 0) {
    const face = forward(state.yaw);
    const speed = TUNING.walkSpeed * move * dt;
    tryMove(state, face.x * speed, face.z * speed);
    state.awareness = clamp(state.awareness + TUNING.awarenessWalk * dt);
  } else {
    state.awareness = clamp(state.awareness - TUNING.awarenessDecay * dt);
  }
  if (state.awareness >= TUNING.huntAt) alertGhost(state, roomAt(state.x, state.z));
  if (threatens(state)) catchPlayer(state, 'It is on you. There is nowhere left to stand.');
  return state;
}

function spotAvailable(state, spot) {
  if (spot.id === 'crate') return !state.flags.tookKey;
  if (spot.id === 'cabinet') return !state.flags.tookFuse;
  if (spot.id === 'drawer') return !state.flags.tookCode;
  if (spot.id === 'closet') return !state.flags.power;
  if (spot.id === 'basement-door') return !state.flags.basementOpen;
  return true;
}

function spotLabel(state, spot) {
  if (spot.id === 'basement-door' && has(state, 'key')) return 'Unlock the basement';
  if (spot.id === 'fusebox' && has(state, 'fuse') && !state.flags.power) return 'Install the fuse';
  if (spot.id === 'fusebox' && state.flags.power) return 'Check the fuse box';
  if (spot.id === 'exit' && state.flags.power) return 'Use the keypad';
  return spot.label;
}

export function currentSpot(state) {
  if (state.phase === 'hiding') {
    if (ghostDistance(state) < 2.5 && roomAt(state.ghost.x, state.ghost.z) === roomAt(state.x, state.z)) return null;
    return { id: 'leave', label: 'Crawl out' };
  }
  if (state.phase !== 'play') return null;
  const face = forward(state.yaw);
  let best = null;
  let bestDist = Infinity;
  for (const spot of SPOTS) {
    if (!spotAvailable(state, spot)) continue;
    const dx = spot.x - state.x;
    const dz = spot.z - state.z;
    const dist = Math.hypot(dx, dz);
    if (dist > spot.radius || dist > bestDist) continue;
    const dot = dist < 0.001 ? 1 : (dx / dist) * face.x + (dz / dist) * face.z;
    if (dot < 0.25 && dist > 1.05) continue;
    bestDist = dist;
    best = spot;
  }
  return best ? { id: best.id, label: spotLabel(state, best) } : null;
}

function noise(state, amount, room) {
  state.awareness = clamp(state.awareness + amount);
  if (amount >= 14 || state.awareness >= TUNING.huntAt) alertGhost(state, room || roomAt(state.x, state.z));
}

export function interact(state) {
  if (state.phase === 'hiding') {
    const spot = currentSpot(state);
    if (!spot) {
      state.log = 'You stay hidden.';
      return state;
    }
    state.hiding = false;
    state.hideSeen = false;
    state.phase = 'play';
    if (threatens(state)) {
      catchPlayer(state, 'You crawl out. It is still there.');
      return state;
    }
    state.log = 'You crawl back into the room.';
    noise(state, 8);
    return state;
  }
  if (state.phase !== 'play') return state;
  const spot = currentSpot(state);
  if (!spot) return state;
  const here = roomAt(state.x, state.z);
  if (spot.id === 'crate') {
    state.flags.tookKey = true;
    give(state, 'key');
    state.log = 'The lid gives. A rusty key, wrapped in a yellowed handkerchief.';
    noise(state, 18, here);
  } else if (spot.id === 'cabinet') {
    state.flags.tookFuse = true;
    give(state, 'fuse');
    state.log = 'Bottles knock together. Your hand closes on a glass fuse.';
    noise(state, 22, here);
  } else if (spot.id === 'drawer') {
    state.flags.tookCode = true;
    give(state, 'code');
    state.log = 'The drawer shrieks. Torn paper inside: 1 9 1 3.';
    noise(state, 16, here);
  } else if (spot.id === 'bed' || spot.id === 'wardrobe' || spot.id === 'table' || spot.id === 'closet') {
    if (ghostDistance(state) < 1.5) {
      catchPlayer(state, 'You dive for cover. It watches you do it.');
      return state;
    }
    state.hiding = true;
    state.hideSeen = ghostDistance(state) < TUNING.hideSeenDistance;
    state.phase = 'hiding';
    state.log = state.hideSeen ? 'You hide, but it was close enough to see you.' : 'You hide and hold your breath.';
    if (state.hideSeen && threatens(state)) catchPlayer(state, 'It saw you hide. Cold fingers find your wrist.');
    else noise(state, 6, here);
  } else if (spot.id === 'basement-door') {
    if (!has(state, 'key')) {
      state.log = 'The basement door is locked. The keyhole is soft with rust.';
      noise(state, 14, here);
    } else {
      state.flags.basementOpen = true;
      take(state, 'key');
      state.log = 'The key turns. Damp air rolls up from the stairs.';
      noise(state, 6, here);
    }
  } else if (spot.id === 'fusebox') {
    if (state.flags.power) state.log = 'The fuse is seated. The box hums.';
    else if (!has(state, 'fuse')) {
      state.log = 'An empty fuse slot. The house has no power.';
      noise(state, 4, here);
    } else {
      take(state, 'fuse');
      state.flags.power = true;
      state.awareness = clamp(state.awareness + 18);
      state.ghost.stun = 6;
      state.ghost.state = 'investigate';
      state.ghost.target = 'basement';
      state.ghost.path = [];
      state.log = 'You seat the fuse. The lights flare sick yellow. Get upstairs.';
    }
  } else if (spot.id === 'exit') {
    if (!state.flags.power) {
      state.log = 'The keypad is dark. The lock has no power.';
      noise(state, 4, here);
    } else {
      state.phase = 'keypad';
      state.keypadIndex = 0;
      state.log = 'The keypad wakes, weak green. It wants four digits.';
    }
  }
  if (state.phase === 'play' && threatens(state)) catchPlayer(state, 'It is on you. There is nowhere left to stand.');
  return state;
}

export function keypadVertical(state, dir) {
  if (state.phase !== 'keypad') return state;
  const index = state.keypadIndex;
  state.keypad[index] = (state.keypad[index] + dir + 10) % 10;
  return state;
}

export function keypadHorizontal(state, dir) {
  if (state.phase !== 'keypad') return state;
  state.keypadIndex = (state.keypadIndex + dir + 4) % 4;
  return state;
}

export function submitCode(state) {
  if (state.phase !== 'keypad') return state;
  const entered = state.keypad.join('');
  state.phase = 'play';
  if (entered === CODE) {
    state.phase = 'escaped';
    state.menuIndex = 0;
    state.log = 'The lock yields. Rain and night air. You do not look back.';
    return state;
  }
  state.log = 'The keypad flashes red. Somewhere, something turns its head.';
  noise(state, 22, 'foyer');
  if (threatens(state)) catchPlayer(state, 'It finds you at the door.');
  return state;
}

export function goBack(state) {
  if (state.phase === 'keypad') {
    state.phase = 'play';
    state.log = 'You step back from the keypad.';
    return state;
  }
  if (state.phase === 'help' || state.phase === 'pause') {
    state.phase = state.returnPhase || 'title';
    state.menuIndex = 0;
    return state;
  }
  if (state.phase === 'play' || state.phase === 'hiding') {
    state.returnPhase = state.phase;
    state.phase = 'pause';
    state.menuIndex = 0;
    return state;
  }
  if (ENDINGS.has(state.phase)) resetGame(state);
  return state;
}

export function menuItems(state) {
  if (state.phase === 'title') return ['Wake up', 'How to play'];
  if (state.phase === 'help') return ['Back'];
  if (state.phase === 'pause') return ['Resume', 'How to play', state.sound ? 'Sound: On' : 'Sound: Off', 'Restart'];
  if (ENDINGS.has(state.phase)) return ['Play again'];
  return [];
}

export function moveMenu(state, delta) {
  const items = menuItems(state);
  if (!items.length) return state;
  state.menuIndex = (state.menuIndex + delta + items.length) % items.length;
  return state;
}

function resetGame(state) {
  const { sound, debug } = state;
  const fresh = createGame();
  fresh.sound = sound;
  fresh.debug = debug;
  for (const key of Object.keys(state)) delete state[key];
  Object.assign(state, fresh);
}

export function confirmMenu(state) {
  const items = menuItems(state);
  const label = items[state.menuIndex];
  if (label === 'Wake up') {
    state.phase = 'play';
    state.log = 'You wake on the cold boards. The front door is behind you. Somewhere above, a clock is close to midnight.';
    return state;
  }
  if (label === 'How to play') {
    state.returnPhase = state.phase;
    state.phase = 'help';
    state.menuIndex = 0;
    return state;
  }
  if (label === 'Back' || label === 'Resume') {
    state.phase = state.returnPhase || 'title';
    state.menuIndex = 0;
    return state;
  }
  if (label === 'Sound: On' || label === 'Sound: Off') {
    state.sound = !state.sound;
    return state;
  }
  if (label === 'Restart' || label === 'Play again') resetGame(state);
  return state;
}

export function formatClock(abs) {
  const total = Math.floor(abs);
  const h24 = Math.floor(total / 60) % 24;
  const minute = total % 60;
  const suffix = h24 >= 12 ? 'PM' : 'AM';
  let hour = h24 % 12;
  if (hour === 0) hour = 12;
  return `${hour}:${String(minute).padStart(2, '0')} ${suffix}`;
}

function meterFor(state) {
  let label = 'CALM';
  let level = 'calm';
  if (state.phase === 'caught' || state.ghost.state === 'chase' || (threatens(state) && !state.hiding)) {
    label = 'SPOTTED';
    level = 'spotted';
  } else if (state.ghost.state === 'investigate' && state.ghost.target === roomAt(state.x, state.z)) {
    label = 'SUSPECTS';
    level = 'suspects';
  } else if (state.ghost.state === 'search' || state.awareness >= 32 || ghostDistance(state) < 7) {
    label = 'HEARD';
    level = 'heard';
  }
  return { label, level, pct: state.awareness };
}

function ghostHint(state) {
  if (ENDINGS.has(state.phase)) return '';
  const where = ROOMS[state.ghost.room] ? ROOMS[state.ghost.room].name : 'house';
  const here = roomAt(state.x, state.z);
  if (state.hiding && threatens(state)) return 'It is in the room with you. Stay still.';
  if (state.ghost.state === 'investigate' && state.ghost.target === here) {
    return `It heard you. It is coming from the ${where}.`;
  }
  if (state.ghost.room === here) return 'It is in this room.';
  return `You hear it in the ${where}.`;
}

function objective(state) {
  const need = [];
  if (!state.flags.tookKey && !state.flags.basementOpen) need.push('rusty key');
  if (!state.flags.tookFuse && !state.flags.power) need.push('fuse');
  if (!state.flags.tookCode) need.push('door code');
  if (need.length === 1) return `Find the ${need[0]}.`;
  if (need.length > 1) {
    const parts = need.map((item) => `the ${item}`);
    return `Find ${parts.slice(0, -1).join(', ')} and ${parts.at(-1)}.`;
  }
  if (!state.flags.basementOpen) return 'Use the rusty key on the basement door.';
  if (!state.flags.power) return 'Install the fuse in the basement.';
  return 'Enter the code on the front door before midnight.';
}

export function present(state) {
  const roomId = roomAt(state.x, state.z);
  const spot = currentSpot(state);
  return {
    phase: state.phase,
    roomName: ROOMS[roomId].name,
    log: state.log,
    objective: objective(state),
    clock: formatClock(state.clock),
    late: state.clock >= 23 * 60 + 50,
    meter: meterFor(state),
    hint: ghostHint(state),
    prompt: spot ? spot.label : '',
    inventory: state.inventory.map((id) => ITEMS[id].name),
    keypad: state.keypad.slice(),
    keypadIndex: state.keypadIndex,
    menu: menuItems(state),
    menuIndex: state.menuIndex,
    help: HELP,
    power: state.flags.power,
    hiding: state.hiding,
    debug: state.debug
      ? `ghost ${state.ghost.room} ${state.ghost.state}  you ${roomId}  ${state.x.toFixed(1)},${state.z.toFixed(1)}`
      : '',
  };
}
