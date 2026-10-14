// Difficulty, map, and copy. Tune numbers here without touching the rules.

export const CODE = '1913';
export const MIDNIGHT = 24 * 60;

export const TUNING = {
  startClock: 23 * 60 + 5,
  sneakNoise: 5,
  walkNoise: 26,
  sneakMinutes: 2,
  walkMinutes: 1,
  hideNoise: 6,
  leaveNoise: 8,
  peekNoise: 18,
  lookDecay: 12,
  hideDecay: 14,
  investigateAt: 14,
  huntAt: 100,
  crateNoise: 18,
  drawerNoise: 16,
  cabinetNoise: 22,
  doorRattleNoise: 14,
  keyNoise: 6,
  fuseNoise: 8,
  wrongCodeNoise: 22,
  powerAwareness: 18,
};

// The ghost stands in a room, then crosses the hall. Longer stays are quieter nights.
export const PATROL = [
  { room: 'bedroom', stay: 3 },
  { room: 'hall', stay: 1 },
  { room: 'kitchen', stay: 3 },
  { room: 'hall', stay: 1 },
  { room: 'storage', stay: 3 },
  { room: 'hall', stay: 1 },
  { room: 'foyer', stay: 3 },
  { room: 'hall', stay: 1 },
];

export const ITEMS = {
  key: { name: 'Rusty key' },
  fuse: { name: 'Fuse' },
  code: { name: 'Code 1913' },
};

export const ROOMS = {
  foyer: {
    name: 'Foyer',
    enter: 'Moonlight stripes the locked front door. A coat closet sits in the dark to the left.',
    look: 'The keypad beside the door is dead glass. Cold air slides in from the hall.',
    hide: { id: 'closet', into: 'in the coat closet', label: 'Hide in the coat closet', darkOnly: true },
  },
  hall: {
    name: 'Hall',
    enter: 'A long hall. The wallpaper has stained itself into almost-faces.',
    look: 'Doors to the bedroom, kitchen, and storage. The basement door is at the far end.',
    hide: null,
  },
  bedroom: {
    name: 'Bedroom',
    enter: 'A narrow bed, sheets pulled tight. The window is nailed shut.',
    look: 'The nightstand drawer is shut. There is just enough room under the bed.',
    hide: { id: 'bed', into: 'under the bed', label: 'Hide under the bed' },
  },
  kitchen: {
    name: 'Kitchen',
    enter: 'The kitchen smells of wet ash. Most cabinets hang open. One does not.',
    look: 'Bottles crowd the shut cabinet. The table sits low enough to crawl under.',
    hide: { id: 'table', into: 'under the table', label: 'Hide under the table' },
  },
  storage: {
    name: 'Storage',
    enter: 'Mildewed linen, a wardrobe tall enough for a person, and a badly nailed crate.',
    look: 'The wardrobe door is ajar. The crate lid gives if you pull.',
    hide: { id: 'wardrobe', into: 'in the wardrobe', label: 'Hide in the wardrobe' },
  },
  basement: {
    name: 'Basement',
    enter: 'Damp stairs, dead pipes, and a metal fuse box on the wall.',
    look: 'One fuse slot is empty. Upstairs is the only way back.',
    hide: null,
  },
};

export const GRAPH = {
  foyer: ['hall'],
  hall: ['foyer', 'bedroom', 'kitchen', 'storage', 'basement'],
  bedroom: ['hall'],
  kitchen: ['hall'],
  storage: ['hall'],
  basement: ['hall'],
};

export const HELP = [
  'D-pad moves the highlight. Select confirms. Back pauses.',
  'Left and right set your pace. Sneak is quiet and costs more time. Walk is faster and loud.',
  'Find the rusty key, the fuse, and the door code.',
  'Hide under the bed, under the kitchen table, in the wardrobe, or in the unlit coat closet before the ghost enters the room.',
  'If it sees you step into a hiding place, it pulls you out. Noise brings it. A line under the scene names the room it is in — do not walk in.',
  'The key opens the basement. The fuse restores power. The code opens the front door. Leave before midnight.',
];
