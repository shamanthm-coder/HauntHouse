const ANDROID = {
  4: 'back',
  19: 'up',
  20: 'down',
  21: 'left',
  22: 'right',
  23: 'ok',
  66: 'ok',
  85: 'ok',
  96: 'ok',
};

const KEYS = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  w: 'up',
  a: 'left',
  s: 'down',
  d: 'right',
  W: 'up',
  A: 'left',
  S: 'down',
  D: 'right',
  Enter: 'ok',
  ' ': 'ok',
  Escape: 'back',
  Backspace: 'back',
  GoBack: 'back',
  BrowserBack: 'back',
};

export function bindInput() {
  const keys = { up: false, down: false, left: false, right: false };
  const padHeld = { up: false, down: false, left: false, right: false };
  const taps = [];
  let ok = false;
  let back = false;

  function tap(action) {
    if (action === 'up' || action === 'down' || action === 'left' || action === 'right') taps.push(action);
  }

  window.addEventListener('keydown', (event) => {
    const action = ANDROID[event.keyCode] || KEYS[event.key];
    if (!action) return;
    event.preventDefault();
    if (event.repeat) return;
    if (action === 'ok') ok = true;
    else if (action === 'back') back = true;
    else if (!keys[action]) {
      keys[action] = true;
      tap(action);
    }
  });

  window.addEventListener('keyup', (event) => {
    const action = ANDROID[event.keyCode] || KEYS[event.key];
    if (keys[action]) keys[action] = false;
  });

  window.addEventListener('blur', () => {
    keys.up = false;
    keys.down = false;
    keys.left = false;
    keys.right = false;
  });

  let previous = [];
  function poll() {
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    const next = { up: false, down: false, left: false, right: false };
    for (const pad of pads) {
      if (!pad) continue;
      const buttons = pad.buttons.map((button) => button.pressed);
      const edge = (index) => buttons[index] && !previous[index];
      next.up = next.up || buttons[12] || (pad.axes[1] || 0) < -0.55;
      next.down = next.down || buttons[13] || (pad.axes[1] || 0) > 0.55;
      next.left = next.left || buttons[14] || (pad.axes[0] || 0) < -0.55;
      next.right = next.right || buttons[15] || (pad.axes[0] || 0) > 0.55;
      if (edge(0)) ok = true;
      if (edge(1)) back = true;
      previous = buttons;
    }
    for (const action of ['up', 'down', 'left', 'right']) {
      if (next[action] && !padHeld[action]) tap(action);
      padHeld[action] = next[action];
    }
    requestAnimationFrame(poll);
  }
  requestAnimationFrame(poll);

  return {
    held: {
      get up() { return keys.up || padHeld.up; },
      get down() { return keys.down || padHeld.down; },
      get left() { return keys.left || padHeld.left; },
      get right() { return keys.right || padHeld.right; },
    },
    takeTap() {
      return taps.shift() || null;
    },
    takeOk() {
      const value = ok;
      ok = false;
      return value;
    },
    takeBack() {
      const value = back;
      back = false;
      return value;
    },
  };
}
