import { blip, react, unlock } from './audio.js';
import { bindInput } from './input.js';
import {
  createGame,
  goBack,
  keypadHorizontal,
  keypadVertical,
  moveFocus,
  present,
  pressDigit,
  step,
  togglePace,
} from './logic.js';
import { focusSelection, render } from './ui.js';

const app = document.querySelector('#app');
const state = createGame();
state.debug = new URLSearchParams(location.search).has('debug');

let audioReady = false;

function draw() {
  const view = present(state);
  app.innerHTML = render(view);
  focusSelection(app);
}

function afterStep(previous) {
  react(previous, state);
  draw();
}

function act(id) {
  const previous = state.phase;
  step(state, id);
  afterStep(previous);
}

function arm() {
  if (!audioReady) {
    audioReady = true;
    unlock();
  }
}

bindInput({
  up() {
    arm();
    blip();
    if (state.phase === 'keypad') keypadVertical(state, 1);
    else moveFocus(state, -1);
    draw();
  },
  down() {
    arm();
    blip();
    if (state.phase === 'keypad') keypadVertical(state, -1);
    else moveFocus(state, 1);
    draw();
  },
  left() {
    arm();
    if (state.phase === 'keypad') keypadHorizontal(state, -1);
    else if (state.phase === 'play') togglePace(state);
    else moveFocus(state, -1);
    draw();
  },
  right() {
    arm();
    if (state.phase === 'keypad') keypadHorizontal(state, 1);
    else if (state.phase === 'play') togglePace(state);
    else moveFocus(state, 1);
    draw();
  },
  select() {
    arm();
    if (state.phase === 'keypad') {
      act('keypad-submit');
      return;
    }
    const view = present(state);
    const action = view.actions[view.focus];
    if (action) act(action.id);
  },
  back() {
    arm();
    const previous = state.phase;
    goBack(state);
    afterStep(previous);
  },
});

app.addEventListener('click', (event) => {
  const command = event.target.closest('[data-command]');
  if (command?.dataset.command === 'pace') {
    arm();
    togglePace(state);
    draw();
    return;
  }
  const digit = event.target.closest('[data-digit]');
  if (digit) {
    arm();
    pressDigit(state, Number(digit.dataset.digit));
    draw();
    return;
  }
  const action = event.target.closest('[data-action]');
  if (!action) return;
  arm();
  act(action.dataset.action);
});

draw();
