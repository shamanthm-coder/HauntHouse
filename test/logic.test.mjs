import assert from 'node:assert/strict';
import { createGame, present, step } from '../js/logic.js';
import { MIDNIGHT } from '../js/data.js';

function boot() {
  const state = createGame();
  step(state, 'start');
  return state;
}

function play(ids, state = boot()) {
  const lines = [];
  for (const id of ids) {
    const before = `${state.phase} @ ${state.roomId} | ghost ${state.ghost.room}/${state.ghost.state} stay ${state.ghost.stay}`;
    step(state, id);
    lines.push(`${before} --${id}--> ${state.phase} @ ${state.roomId} | ghost ${state.ghost.room}/${state.ghost.state} | ${state.log}`);
    if (state.phase === 'caught' || state.phase === 'midnight') break;
  }
  return { state, lines };
}

const started = boot();
assert.equal(started.phase, 'play');
assert.equal(started.roomId, 'foyer');
assert.match(present(started).objective, /key|fuse|code/i);

const walkedIn = boot();
walkedIn.roomId = 'hall';
walkedIn.ghost.room = 'kitchen';
step(walkedIn, 'go:kitchen');
assert.equal(walkedIn.phase, 'caught');

const seenHide = boot();
seenHide.roomId = 'bedroom';
seenHide.ghost.room = 'bedroom';
step(seenHide, 'hide');
assert.equal(seenHide.phase, 'caught');

const safeHide = boot();
safeHide.roomId = 'bedroom';
safeHide.ghost.room = 'hall';
safeHide.ghost.state = 'investigate';
safeHide.ghost.target = 'bedroom';
step(safeHide, 'hide');
assert.equal(safeHide.phase, 'hiding');
assert.equal(safeHide.ghost.room, 'bedroom');
step(safeHide, 'stay');
assert.notEqual(safeHide.phase, 'caught');

const timedOut = boot();
timedOut.clock = MIDNIGHT - 1;
step(timedOut, 'look');
assert.equal(timedOut.phase, 'midnight');

const escape = boot();
escape.roomId = 'foyer';
escape.flags.power = true;
escape.flags.tookCode = true;
escape.flags.tookKey = true;
escape.flags.tookFuse = true;
escape.flags.basementOpen = true;
escape.inventory = ['code'];
step(escape, 'use:door');
assert.equal(escape.phase, 'keypad');
escape.keypad = [1, 9, 1, 3];
step(escape, 'keypad-submit');
assert.equal(escape.phase, 'escaped');

const wrong = boot();
wrong.roomId = 'foyer';
wrong.flags.power = true;
wrong.ghost.room = 'bedroom';
wrong.ghost.state = 'patrol';
step(wrong, 'use:door');
wrong.keypad = [0, 0, 0, 0];
step(wrong, 'keypad-submit');
assert.equal(wrong.phase, 'play');
assert.match(wrong.log, /red/i);

const route = [
  'go:hall',
  'go:storage',
  'use:crate',
  'hide',
  'stay',
  'stay',
  'stay',
  'leave',
  'go:hall',
  'go:kitchen',
  'use:cabinet',
  'hide',
  'stay',
  'stay',
  'leave',
  'go:hall',
  'go:foyer',
  'look',
  'look',
  'look',
  'look',
  'go:hall',
  'go:bedroom',
  'use:drawer',
  'hide',
  'stay',
  'stay',
  'leave',
  'go:hall',
  'use:basement-door',
  'go:basement',
  'use:fusebox',
  'go:hall',
  'go:foyer',
  'use:door',
];

const demo = play(route);
if (demo.state.phase !== 'keypad') {
  console.error(demo.lines.join('\n'));
}
assert.equal(demo.state.phase, 'keypad', demo.state.log);
demo.state.keypad = [1, 9, 1, 3];
step(demo.state, 'keypad-submit');
assert.equal(demo.state.phase, 'escaped', demo.state.log);
assert.deepEqual(
  present(boot()).actions.map((action) => action.label).slice(0, 2),
  ['Hold still and listen', 'Use the front door'],
);

console.log('logic tests passed');
