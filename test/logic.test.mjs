import assert from 'node:assert/strict';
import { confirmMenu, createGame, currentSpot, interact, present, submitCode, update, walkable } from '../js/sim.js';
import { SPOTS } from '../js/data.js';

function boot() {
  const state = createGame();
  confirmMenu(state);
  return state;
}

function hold(state, input, seconds) {
  let time = 0;
  while (time < seconds) {
    update(state, input, 0.05);
    time += 0.05;
  }
}

function standAt(state, spot) {
  state.x = spot.x;
  state.z = spot.z + 0.7;
  state.yaw = 0;
}

const started = boot();
assert.equal(started.phase, 'play');
assert.equal(present(started).roomName, 'Foyer');

const moved = boot();
const z0 = moved.z;
hold(moved, { up: true }, 1);
assert.ok(moved.z < z0 - 1, `expected to walk forward, z ${moved.z}`);
assert.equal(moved.phase, 'play');

const blocked = boot();
blocked.x = 2.4;
blocked.z = 2.9;
blocked.yaw = -Math.PI / 2;
hold(blocked, { up: true }, 3);
assert.ok(blocked.x < 3.4, `locked basement should stop you, x ${blocked.x}`);
assert.equal(walkable(6.8, 3, blocked), true);

const key = boot();
standAt(key, SPOTS.find((spot) => spot.id === 'crate'));
assert.equal(currentSpot(key).id, 'crate');
interact(key);
assert.ok(key.inventory.includes('key'));

const caught = boot();
caught.ghost.x = caught.x;
caught.ghost.z = caught.z + 0.2;
update(caught, {}, 0.05);
assert.equal(caught.phase, 'caught');

const safe = boot();
standAt(safe, SPOTS.find((spot) => spot.id === 'bed'));
safe.ghost.x = 6;
safe.ghost.z = 3;
interact(safe);
assert.equal(safe.phase, 'hiding');
hold(safe, {}, 2);
assert.equal(safe.phase, 'hiding');

const escape = boot();
escape.flags.power = true;
escape.flags.tookCode = true;
escape.inventory = ['code'];
standAt(escape, SPOTS.find((spot) => spot.id === 'exit'));
escape.ghost.x = -5;
escape.ghost.z = -15;
interact(escape);
assert.equal(escape.phase, 'keypad');
escape.keypad = [1, 9, 1, 3];
submitCode(escape);
assert.equal(escape.phase, 'escaped');

const patrol = boot();
let outside = 0;
for (let i = 0; i < 400; i += 1) {
  update(patrol, {}, 0.05);
  if (!walkable(patrol.ghost.x, patrol.ghost.z, patrol)) outside += 1;
}
assert.equal(outside, 0, 'ghost left the walkable house');
assert.notEqual(patrol.phase, 'caught');

console.log('logic tests passed');
