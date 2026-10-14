function esc(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[char]));
}

function sceneArt(view) {
  const hot = (room) => (view.dangerRoom === room ? 'hot' : '');
  const props = {
    foyer: `
      <div class="moon"></div>
      <div class="doors"></div>
      <div class="closet"></div>
      <div class="arch ${hot('hall')}"></div>`,
    hall: `
      <div class="corridor"></div>
      <div class="side left ${hot('bedroom')}"></div>
      <div class="side right ${hot('kitchen')}"></div>
      <div class="far ${hot('storage')}"></div>
      <div class="hatch ${hot('basement')}"></div>
      <div class="backdoor ${hot('foyer')}"></div>`,
    bedroom: `
      <div class="window"></div>
      <div class="bed"></div>
      <div class="stand"></div>
      <div class="arch ${hot('hall')}"></div>`,
    kitchen: `
      <div class="window"></div>
      <div class="cabinets"></div>
      <div class="table"></div>
      <div class="arch ${hot('hall')}"></div>`,
    storage: `
      <div class="shelves"></div>
      <div class="wardrobe"></div>
      <div class="crate"></div>
      <div class="arch ${hot('hall')}"></div>`,
    basement: `
      <div class="pipes"></div>
      <div class="box"></div>
      <div class="stairs ${hot('hall')}"></div>`,
  };
  return `
    <div class="scene scene-${esc(view.roomId)} ${view.power ? 'power' : 'dark'} ${view.hiding ? 'is-hiding' : ''} ${view.meter.level}">
      <div class="room-art">${props[view.roomId] || ''}</div>
      <div class="bulb"></div>
      ${view.specter ? '<div class="specter" aria-hidden="true"></div>' : ''}
      <div class="vignette"></div>
    </div>`;
}

function actions(view) {
  if (view.phase === 'keypad') {
    const digits = view.keypad.map((digit, index) => `
      <button type="button" class="digit ${index === view.keypadIndex ? 'is-focus' : ''}" data-digit="${index}">
        ${digit}
      </button>`).join('');
    return `
      <div class="keypad">
        <p>Front door code</p>
        <div class="digits">${digits}</div>
        <button type="button" class="action" data-action="keypad-submit">Confirm code</button>
      </div>`;
  }
  return view.actions.map((action, index) => `
    <button type="button" class="action ${index === view.focus ? 'is-focus' : ''}" data-action="${esc(action.id)}" ${index === view.focus ? 'data-focused="true"' : ''}>
      <span class="chev" aria-hidden="true">${index === view.focus ? '▸' : '·'}</span>
      <span>${esc(action.label)}</span>
    </button>`).join('');
}

function hints(phase) {
  if (phase === 'keypad') return '▲▼ Digit   ◀▶ Move   Select Confirm   Back Cancel';
  if (phase === 'hiding') return '▲▼ Choose   Select   Back Pause';
  if (phase === 'pause' || phase === 'help' || phase === 'title') return '▲▼ Choose   Select   Back';
  return '▲▼ Choose   ◀▶ Pace   Select   Back Pause';
}

function screen(title, copy, actionsHtml, extra = '') {
  return `
    <section class="screen">
      <p class="brand">HauntHouse</p>
      <h1>${esc(title)}</h1>
      ${extra}
      <div class="copy">${copy}</div>
      <div class="actions">${actionsHtml}</div>
      <p class="control-hints">${hints('title')}</p>
    </section>`;
}

export function render(view) {
  if (view.phase === 'title') {
    return screen(
      'Escape the Ghost',
      '<p class="tagline">Find the items. Outsmart the ghost. Escape before midnight.</p>',
      actions(view),
      '<div class="house" aria-hidden="true"><span></span><span></span><span></span></div>',
    );
  }
  if (view.phase === 'help') {
    const lines = view.help.map((line) => `<p>${esc(line)}</p>`).join('');
    return screen('How to play', lines, actions(view));
  }

  const items = view.inventory.length ? view.inventory.map(esc).join('  ·  ') : 'Nothing yet';
  const blocking = ['pause', 'caught', 'midnight', 'escaped'].includes(view.phase);
  const overlay = overlayFor(view);
  return `
    <section class="game ${view.meter.level} ${view.phase}">
      <header>
        <p class="brand">HauntHouse</p>
        <h1>${esc(view.roomName)}</h1>
        <p class="clock ${view.late ? 'late' : ''}">${esc(view.clock)}</p>
      </header>
      <p class="objective">${esc(view.objective)}</p>
      <div class="stage">
        ${sceneArt(view)}
        <p class="log" aria-live="polite">${esc(view.log)}</p>
      </div>
      <p class="hint">${esc(view.hint)}</p>
      <div class="actions">${blocking ? '' : actions(view)}</div>
      <footer>
        <p class="items"><span>Items</span> ${items}</p>
        <div class="meter meter-${view.meter.level}">
          <span>${esc(view.meter.label)}</span>
          <div class="bar" aria-hidden="true"><i style="width:${view.meter.pct}%"></i></div>
        </div>
        <button type="button" class="pace" data-command="pace">Pace: ${view.pace === 'sneak' ? 'Sneak' : 'Walk'}</button>
        <p class="control-hints">${hints(view.phase)}</p>
      </footer>
      ${view.debug ? `<p class="debug">${esc(view.debug)}</p>` : ''}
      ${overlay}
    </section>`;
}

function overlayFor(view) {
  if (view.phase === 'pause') {
    return `
      <div class="overlay">
        <div class="panel">
          <h2>Paused</h2>
          <div class="actions">${actions(view)}</div>
        </div>
      </div>`;
  }
  if (view.phase === 'caught') {
    return `
      <div class="overlay ending">
        <div class="panel">
          <h2>Caught</h2>
          <p>${esc(view.log)}</p>
          <div class="actions">${actions(view)}</div>
        </div>
      </div>`;
  }
  if (view.phase === 'midnight') {
    return `
      <div class="overlay ending">
        <div class="panel">
          <h2>Midnight</h2>
          <p>${esc(view.log)}</p>
          <div class="actions">${actions(view)}</div>
        </div>
      </div>`;
  }
  if (view.phase === 'escaped') {
    return `
      <div class="overlay ending escaped">
        <div class="panel">
          <h2>You escaped</h2>
          <p>${esc(view.log)}</p>
          <div class="actions">${actions(view)}</div>
        </div>
      </div>`;
  }
  return '';
}

export function focusSelection(root) {
  const selected = root.querySelector('[data-focused="true"]');
  if (!selected) return;
  selected.focus({ preventScroll: true });
  const list = selected.closest('.actions');
  if (!list) return;
  const listRect = list.getBoundingClientRect();
  const rect = selected.getBoundingClientRect();
  if (rect.top < listRect.top) list.scrollTop -= listRect.top - rect.top;
  else if (rect.bottom > listRect.bottom) list.scrollTop += rect.bottom - listRect.bottom;
}
