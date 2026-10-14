import { CODE, GRAPH, HELP, ITEMS, MIDNIGHT, PATROL, ROOMS, TUNING } from './data.js';

export { HELP, ROOMS };

const ENDINGS = new Set(['caught', 'escaped', 'midnight']);

export function createGame() {
  return {
    phase: 'title',
    returnPhase: 'title',
    roomId: 'foyer',
    pace: 'sneak',
    inventory: [],
    flags: {
      basementOpen: false,
      power: false,
      tookKey: false,
      tookFuse: false,
      tookCode: false,
    },
    clock: TUNING.startClock,
    awareness: 6,
    focus: 0,
    log: 'The house is waiting.',
    hiding: null,
    hideSeen: false,
    keypad: [0, 0, 0, 0],
    keypadIndex: 0,
    sound: true,
    debug: false,
    ghost: {
      room: 'bedroom',
      state: 'patrol',
      routeIndex: 0,
      stay: PATROL[0].stay,
      target: 'bedroom',
      linger: 0,
      stun: 0,
    },
  };
}

export function neighbors(room, state) {
  return GRAPH[room].filter((next) => {
    const basementEdge = (room === 'hall' && next === 'basement') || (room === 'basement' && next === 'hall');
    return !basementEdge || state.flags.basementOpen;
  });
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

function exitLabel(from, to) {
  if (to === 'basement') return 'Down to the Basement';
  if (from === 'basement') return 'Up to the Hall';
  return `To the ${ROOMS[to].name}`;
}

export function actionList(state) {
  const list = rawActions(state);
  if (!list.length) state.focus = 0;
  else if (state.focus >= list.length || state.focus < 0) state.focus = 0;
  return list;
}

function rawActions(state) {
  if (state.phase === 'title') {
    return [
      { id: 'start', label: 'Wake up' },
      { id: 'help', label: 'How to play' },
    ];
  }
  if (state.phase === 'help') return [{ id: 'back', label: 'Back' }];
  if (state.phase === 'pause') {
    return [
      { id: 'resume', label: 'Resume' },
      { id: 'help', label: 'How to play' },
      { id: 'sound', label: state.sound ? 'Sound: On' : 'Sound: Off' },
      { id: 'restart', label: 'Restart' },
    ];
  }
  if (ENDINGS.has(state.phase)) return [{ id: 'restart', label: 'Play again' }];
  if (state.phase === 'keypad') return [{ id: 'keypad-submit', label: 'Confirm code' }];
  if (state.phase === 'hiding') {
    return [
      { id: 'stay', label: 'Stay still' },
      { id: 'peek', label: 'Peek' },
      { id: 'leave', label: 'Leave hiding' },
    ];
  }

  const room = ROOMS[state.roomId];
  const actions = [{ id: 'look', label: 'Hold still and listen' }];

  if (state.roomId === 'storage' && !state.flags.tookKey) {
    actions.push({ id: 'use:crate', label: 'Pry open the crate' });
  }
  if (state.roomId === 'kitchen' && !state.flags.tookFuse) {
    actions.push({ id: 'use:cabinet', label: 'Search the cabinet' });
  }
  if (state.roomId === 'bedroom' && !state.flags.tookCode) {
    actions.push({ id: 'use:drawer', label: 'Search the nightstand' });
  }
  if (state.roomId === 'hall' && !state.flags.basementOpen) {
    actions.push({ id: 'use:basement-door', label: 'Try the basement door' });
  }
  if (state.roomId === 'basement') {
    actions.push({ id: 'use:fusebox', label: state.flags.power ? 'Check the fuse box' : 'Use the fuse box' });
  }
  if (state.roomId === 'foyer') {
    actions.push({ id: 'use:door', label: 'Use the front door' });
  }
  if (room.hide && !(room.hide.darkOnly && state.flags.power)) {
    actions.push({ id: 'hide', label: room.hide.label });
  }
  if (has(state, 'code')) actions.push({ id: 'read-note', label: 'Read the code note' });

  for (const next of neighbors(state.roomId, state)) {
    actions.push({ id: `go:${next}`, label: exitLabel(state.roomId, next) });
  }
  return actions;
}

function catchPlayer(state, line) {
  state.phase = 'caught';
  state.hiding = null;
  state.hideSeen = false;
  state.focus = 0;
  state.ghost.state = 'chase';
  state.awareness = 100;
  state.log = line;
}

function resetGame(state) {
  const { sound, debug } = state;
  const fresh = createGame();
  fresh.sound = sound;
  fresh.debug = debug;
  for (const key of Object.keys(state)) delete state[key];
  Object.assign(state, fresh);
}

export function moveFocus(state, delta) {
  const list = actionList(state);
  if (!list.length) return state;
  state.focus = (state.focus + delta + list.length) % list.length;
  return state;
}

export function togglePace(state) {
  if (state.phase !== 'play') return state;
  state.pace = state.pace === 'sneak' ? 'walk' : 'sneak';
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

export function pressDigit(state, index) {
  if (state.phase !== 'keypad') return state;
  state.keypadIndex = index;
  state.keypad[index] = (state.keypad[index] + 1) % 10;
  return state;
}

export function goBack(state) {
  if (state.phase === 'keypad') {
    state.phase = 'play';
    state.focus = 0;
    state.log = 'You step back from the keypad.';
    return state;
  }
  if (state.phase === 'help' || state.phase === 'pause') {
    state.phase = state.returnPhase || 'title';
    state.focus = 0;
    return state;
  }
  if (state.phase === 'play' || state.phase === 'hiding') {
    state.returnPhase = state.phase;
    state.phase = 'pause';
    state.focus = 0;
    return state;
  }
  if (ENDINGS.has(state.phase)) resetGame(state);
  return state;
}

export function step(state, id) {
  if (id === 'restart') {
    resetGame(state);
    return state;
  }
  if (id === 'help') {
    state.returnPhase = state.phase;
    state.phase = 'help';
    state.focus = 0;
    return state;
  }
  if (id === 'back' || id === 'resume') {
    state.phase = state.returnPhase || 'title';
    state.focus = 0;
    return state;
  }
  if (id === 'sound') {
    state.sound = !state.sound;
    return state;
  }
  if (id === 'start') {
    if (state.phase !== 'title') return state;
    state.phase = 'play';
    state.focus = 0;
    state.log = 'You wake on the cold boards. The front door will not open. Somewhere above, a clock is already close to midnight.';
    return state;
  }
  if (id === 'read-note') {
    state.log = 'Pencil, torn paper, four digits pressed hard enough to scar it: 1 9 1 3.';
    return state;
  }

  const allowed = new Set(actionList(state).map((action) => action.id));
  if (!allowed.has(id)) return state;

  if (id === 'look') {
    state.log = ROOMS[state.roomId].look;
    tick(state, TUNING.lookDecay, 1, true);
    return state;
  }
  if (id === 'stay') {
    state.log = 'You stay still.';
    tick(state, TUNING.hideDecay, 1, true);
    return state;
  }
  if (id === 'peek') {
    if (state.ghost.room === state.roomId) {
      state.hideSeen = true;
      catchPlayer(state, 'It turns. It saw your eye.');
      return state;
    }
    state.log = 'You lean toward the crack.';
    tick(state, TUNING.peekNoise, 1, false);
    return state;
  }
  if (id === 'leave') {
  state.hiding = null;
  state.hideSeen = false;
  state.phase = 'play';
  state.focus = 0;
  if (state.ghost.room === state.roomId) {
    catchPlayer(state, 'You crawl out. It is still there.');
    return state;
  }
  state.log = 'You crawl back into the room.';
    tick(state, TUNING.leaveNoise, 1, false);
    return state;
  }
  if (id === 'hide') return doHide(state);
  if (id.startsWith('go:')) return moveTo(state, id.slice(3));
  if (id.startsWith('use:')) return useObject(state, id.slice(4));
  if (id === 'keypad-submit') return submitCode(state);
  return state;
}

function doHide(state) {
  const spot = ROOMS[state.roomId].hide;
  if (!spot || (spot.darkOnly && state.flags.power)) {
    state.log = 'There is nowhere here the light will not find you.';
    return state;
  }
  if (state.ghost.room === state.roomId) {
    catchPlayer(state, 'You dive for cover. It watches you do it.');
    return state;
  }
  state.hiding = { id: spot.id, into: spot.into };
  state.hideSeen = false;
  state.phase = 'hiding';
  state.focus = 0;
  state.log = `You hide ${spot.into}. You hold your breath.`;
  tick(state, TUNING.hideNoise, 1, false);
  return state;
}

function moveTo(state, dest) {
  if (!neighbors(state.roomId, state).includes(dest)) return state;
  if (dest === state.ghost.room) {
    state.roomId = dest;
    catchPlayer(state, 'You step through the doorway. It is already there.');
    return state;
  }
  const sneaking = state.pace === 'sneak';
  state.roomId = dest;
  state.focus = 0;
  state.log = ROOMS[dest].enter;
  tick(state, sneaking ? TUNING.sneakNoise : TUNING.walkNoise, sneaking ? TUNING.sneakMinutes : TUNING.walkMinutes, false);
  return state;
}

function useObject(state, objectId) {
  if (objectId === 'crate') {
    state.flags.tookKey = true;
    give(state, 'key');
    state.focus = 0;
    state.log = 'The lid gives. A rusty key, wrapped in a handkerchief gone yellow.';
    tick(state, TUNING.crateNoise, 1, false);
    return state;
  }
  if (objectId === 'cabinet') {
    state.flags.tookFuse = true;
    give(state, 'fuse');
    state.focus = 0;
    state.log = 'Bottles knock together. Your hand closes on a glass fuse, still whole.';
    tick(state, TUNING.cabinetNoise, 1, false);
    return state;
  }
  if (objectId === 'drawer') {
    state.flags.tookCode = true;
    give(state, 'code');
    state.focus = 0;
    state.log = 'The drawer shrieks. Inside, torn paper: 1 9 1 3.';
    tick(state, TUNING.drawerNoise, 1, false);
    return state;
  }
  if (objectId === 'basement-door') {
    if (!has(state, 'key')) {
      state.log = 'The basement door is locked. The keyhole is soft with rust.';
      tick(state, TUNING.doorRattleNoise, 1, false);
      return state;
    }
    state.flags.basementOpen = true;
    take(state, 'key');
    state.focus = 0;
    state.log = 'The key turns. Damp air rolls up the stairs.';
    tick(state, TUNING.keyNoise, 1, false);
    return state;
  }
  if (objectId === 'fusebox') {
    if (state.flags.power) {
      state.log = 'The fuse is seated. The box hums like a throat.';
      return state;
    }
    if (!has(state, 'fuse')) {
      state.log = 'An empty fuse slot. The house has no power.';
      tick(state, 4, 1, false);
      return state;
    }
    take(state, 'fuse');
    state.flags.power = true;
    state.awareness = clamp(state.awareness + TUNING.powerAwareness);
    state.ghost.state = 'investigate';
    state.ghost.target = 'basement';
    state.ghost.linger = 0;
    state.ghost.stun = 2;
    state.focus = 0;
    state.log = 'You seat the fuse. The bulb flares, then settles into a sick yellow. The house goes quiet. Get upstairs.';
    tick(state, TUNING.fuseNoise, 1, false);
    return state;
  }
  if (objectId === 'door') {
    if (!state.flags.power) {
      state.log = 'The keypad is dark. The lock has no power.';
      tick(state, 4, 1, false);
      return state;
    }
    state.phase = 'keypad';
    state.keypadIndex = 0;
    state.focus = 0;
    state.log = 'The keypad wakes, weak green. It wants four digits.';
    return state;
  }
  return state;
}

function submitCode(state) {
  const entered = state.keypad.join('');
  state.phase = 'play';
  state.focus = 0;
  if (entered === CODE) {
    state.phase = 'escaped';
    state.log = 'The lock yields. Rain and night air. You do not look back.';
    return state;
  }
  state.log = 'The keypad flashes red. Somewhere, something turns its head.';
  tick(state, TUNING.wrongCodeNoise, 1, false);
  return state;
}

function tick(state, noise, minutes, quiet) {
  if (ENDINGS.has(state.phase)) return;
  state.clock += minutes;
  if (state.clock >= MIDNIGHT) {
    state.phase = 'midnight';
    state.hiding = null;
    state.focus = 0;
    state.log = 'The clock strikes twelve. Every door locks. It knows the house better than you do.';
    return;
  }
  state.awareness = clamp(quiet ? state.awareness - noise : state.awareness + noise);

  if (state.ghost.stun > 0) {
    state.ghost.stun -= 1;
    return;
  }

  if (!quiet && (noise >= TUNING.investigateAt || state.awareness >= TUNING.huntAt)) {
    state.ghost.state = 'investigate';
    state.ghost.target = state.roomId;
    state.ghost.linger = 0;
  }

  stepGhostOnce(state);
  resolveEncounter(state);
}

function stepGhostOnce(state) {
  const ghost = state.ghost;
  const before = ghost.room;

  if (ghost.state === 'investigate') {
    if (ghost.room !== ghost.target) ghost.room = stepToward(ghost.room, ghost.target, state);
    if (ghost.room === ghost.target) {
      ghost.state = 'search';
      ghost.linger = 1;
    }
  } else if (ghost.state === 'search') {
    if (ghost.linger > 0) ghost.linger -= 1;
    else {
      ghost.state = 'patrol';
      patrolStep(state);
    }
  } else if (ghost.state !== 'chase') {
    patrolStep(state);
  }

  ghost.entered = ghost.room !== before && ghost.room === state.roomId;
}

function patrolStep(state) {
  const ghost = state.ghost;
  const node = PATROL[ghost.routeIndex];
  if (ghost.room !== node.room) {
    ghost.room = stepToward(ghost.room, node.room, state);
    if (ghost.room === node.room) ghost.stay = stayFor(node, state);
    return;
  }
  if (ghost.stay > 0) {
    ghost.stay -= 1;
    return;
  }
  ghost.routeIndex = (ghost.routeIndex + 1) % PATROL.length;
  const next = PATROL[ghost.routeIndex];
  ghost.room = stepToward(ghost.room, next.room, state);
  ghost.stay = ghost.room === next.room ? stayFor(next, state) : 0;
}

function stayFor(node, state) {
  if (!state.flags.power) return node.stay;
  return Math.max(1, node.stay - 1);
}

function stepToward(from, to, state) {
  if (from === to) return from;
  const queue = [from];
  const previous = { [from]: null };
  while (queue.length) {
    const current = queue.shift();
    for (const next of neighbors(current, state)) {
      if (previous[next] !== undefined) continue;
      previous[next] = current;
      if (next === to) {
        let stepRoom = next;
        while (previous[stepRoom] !== from) stepRoom = previous[stepRoom];
        return stepRoom;
      }
      queue.push(next);
    }
  }
  return from;
}

function resolveEncounter(state) {
  if (ENDINGS.has(state.phase)) return;
  if (state.ghost.room !== state.roomId) return;
  if (state.hiding && !state.hideSeen) {
    if (state.ghost.entered) {
      state.ghost.state = 'search';
      state.ghost.linger = 1;
      state.awareness = Math.max(state.awareness, 48);
      state.log = 'A pale shape fills the doorway. It searches. It does not find you.';
    }
    return;
  }
  const line = state.hiding
    ? 'It saw you hide. Cold fingers find your wrist.'
    : 'It is in the room. There is nowhere left to stand.';
  catchPlayer(state, line);
}

function adjacent(state) {
  return neighbors(state.roomId, state).includes(state.ghost.room);
}

export function formatClock(abs) {
  const h24 = Math.floor(abs / 60) % 24;
  const minute = abs % 60;
  const suffix = h24 >= 12 ? 'PM' : 'AM';
  let hour = h24 % 12;
  if (hour === 0) hour = 12;
  return `${hour}:${String(minute).padStart(2, '0')} ${suffix}`;
}

function meterFor(state) {
  let label = 'CALM';
  let level = 'calm';
  if (state.phase === 'caught' || state.ghost.state === 'chase' || (state.ghost.room === state.roomId && !state.hiding)) {
    label = 'SPOTTED';
    level = 'spotted';
  } else if (state.hiding && state.ghost.room === state.roomId) {
    label = 'SUSPECTS';
    level = 'suspects';
  } else if ((state.ghost.state === 'investigate' || state.ghost.state === 'search') && state.ghost.target === state.roomId) {
    label = 'SUSPECTS';
    level = 'suspects';
  } else if (state.awareness >= 35 || adjacent(state) || state.ghost.state === 'search') {
    label = 'HEARD';
    level = 'heard';
  }
  return { label, level, pct: state.awareness };
}

function ghostHint(state) {
  if (ENDINGS.has(state.phase)) return '';
  const where = ROOMS[state.ghost.room].name;
  if (state.hiding && state.ghost.room === state.roomId) return 'It is in the room with you.';
  if (state.ghost.room === state.roomId) return 'It is here.';
  if ((state.ghost.state === 'investigate' || state.ghost.state === 'search') && state.ghost.target === state.roomId) {
    return `It heard you. It is coming from the ${where}.`;
  }
  if (adjacent(state)) return `Footsteps in the ${where}.`;
  return `You hear it in the ${where}.`;
}

function objective(state) {
  const need = [];
  if (!state.flags.tookKey && !state.flags.basementOpen) need.push('rusty key');
  if (!state.flags.tookFuse && !state.flags.power) need.push('fuse');
  if (!state.flags.tookCode) need.push('door code');
  if (need.length === 1) return `Find the ${need[0]}.`;
  if (need.length > 1) return `Find the ${need.slice(0, -1).join(', ')} and ${need.at(-1)}.`;
  if (!state.flags.basementOpen) return 'Use the rusty key on the basement door.';
  if (!state.flags.power) return 'Install the fuse in the basement.';
  return 'Enter the code at the front door before midnight.';
}

export function present(state) {
  const actions = actionList(state);
  return {
    phase: state.phase,
    roomId: state.roomId,
    roomName: ROOMS[state.roomId].name,
    log: state.log,
    objective: objective(state),
    clock: formatClock(state.clock),
    late: state.clock >= 23 * 60 + 50,
    meter: meterFor(state),
    hint: ghostHint(state),
    inventory: state.inventory.map((id) => ITEMS[id].name),
    actions,
    focus: state.focus,
    pace: state.pace,
    power: state.flags.power,
    hiding: state.hiding,
    keypad: state.keypad.slice(),
    keypadIndex: state.keypadIndex,
    sound: state.sound,
    help: HELP,
    debug: state.debug
      ? `ghost ${state.ghost.room} · ${state.ghost.state} · stay ${state.ghost.stay} · awareness ${state.awareness}`
      : '',
    dangerRoom: state.ghost.room === state.roomId || adjacent(state) ? state.ghost.room : null,
    specter: state.ghost.room === state.roomId,
  };
}
