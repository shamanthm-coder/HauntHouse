const ANDROID = {
  4: 'back',
  19: 'up',
  20: 'down',
  21: 'left',
  22: 'right',
  23: 'select',
  66: 'select',
  85: 'select',
  96: 'select',
};

export function bindInput(handlers) {
  window.addEventListener('keydown', (event) => {
    const mapped = ANDROID[event.keyCode];
    const key = mapped || event.key;
    const arrow = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'up', 'down', 'left', 'right'].includes(key)
      || ['w', 'a', 's', 'd', 'W', 'A', 'S', 'D'].includes(event.key);
    const select = key === 'select' || event.key === 'Enter' || event.key === ' ';
    const back = key === 'back' || event.key === 'Escape' || event.key === 'Backspace' || event.key === 'GoBack' || event.key === 'BrowserBack';

    if (arrow || select || back) event.preventDefault();
    if (event.repeat && (select || event.key === 'ArrowLeft' || event.key === 'ArrowRight' || event.key === 'a' || event.key === 'd')) return;

    if (key === 'up' || event.key === 'ArrowUp' || event.key === 'w' || event.key === 'W') handlers.up();
    else if (key === 'down' || event.key === 'ArrowDown' || event.key === 's' || event.key === 'S') handlers.down();
    else if (key === 'left' || event.key === 'ArrowLeft' || event.key === 'a' || event.key === 'A') handlers.left();
    else if (key === 'right' || event.key === 'ArrowRight' || event.key === 'd' || event.key === 'D') handlers.right();
    else if (select) handlers.select();
    else if (back) handlers.back();
  });

  let previous = [];
  function poll() {
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    for (const pad of pads) {
      if (!pad) continue;
      const buttons = pad.buttons.map((button) => button.pressed);
      const edge = (index) => buttons[index] && !previous[index];
      if (edge(12)) handlers.up();
      if (edge(13)) handlers.down();
      if (edge(14)) handlers.left();
      if (edge(15)) handlers.right();
      if (edge(0)) handlers.select();
      if (edge(1)) handlers.back();
      const x = pad.axes[0] || 0;
      const y = pad.axes[1] || 0;
      if (edge(16) || (y < -0.7 && !(previous.up))) handlers.up();
      if (y > 0.7 && !previous.down) handlers.down();
      if (x < -0.7 && !previous.left) handlers.left();
      if (x > 0.7 && !previous.right) handlers.right();
      previous = buttons;
      previous.up = y < -0.7;
      previous.down = y > 0.7;
      previous.left = x < -0.7;
      previous.right = x > 0.7;
    }
    requestAnimationFrame(poll);
  }
  requestAnimationFrame(poll);
}
