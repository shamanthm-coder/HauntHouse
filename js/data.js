// Map, items, and difficulty. Coordinates are meters: +X east, -Z deeper into the house.

export const CODE = '1913';
export const MIDNIGHT = 24 * 60;
export const PLAYER_RADIUS = 0.36;

export const TUNING = {
  startClock: 23 * 60 + 5,
  secondsPerMinute: 14,
  walkSpeed: 2.35,
  backSpeed: 1.5,
  turnSpeed: 2.15,
  ghostPatrol: 1.2,
  ghostHunt: 2.15,
  catchDistance: 1.28,
  hideSeenDistance: 3.1,
  awarenessWalk: 2.4,
  awarenessDecay: 5,
  huntAt: 88,
};

export const PATROL = [
  { room: 'bedroom', stay: 10 },
  { room: 'hall', stay: 3 },
  { room: 'kitchen', stay: 9 },
  { room: 'hall', stay: 3 },
  { room: 'storage', stay: 9 },
  { room: 'hall', stay: 3 },
  { room: 'foyer', stay: 8 },
  { room: 'hall', stay: 3 },
];

export const ROOMS = {
  foyer: { name: 'Foyer', x: -3.6, z: 0, w: 7.2, d: 6.4 },
  hall: { name: 'Hall', x: -2.2, z: -12, w: 4.4, d: 12 },
  bedroom: { name: 'Bedroom', x: -3.6, z: -18.4, w: 7.2, d: 6.4 },
  kitchen: { name: 'Kitchen', x: 2.2, z: -8.2, w: 6.6, d: 6.2 },
  storage: { name: 'Storage', x: -8.8, z: -8.2, w: 6.6, d: 6.2 },
  basement: { name: 'Basement', x: 3.6, z: 0.4, w: 6.4, d: 5.6 },
};

export const CENTERS = {
  foyer: { x: 0, z: 3.2 },
  hall: { x: 0, z: -6 },
  bedroom: { x: 0.8, z: -15 },
  kitchen: { x: 5, z: -3.8 },
  storage: { x: -5.2, z: -4.6 },
  basement: { x: 6.8, z: 3 },
};

// Passages between rooms. Locked passages are not walkable until the door is open.
export const LINKS = [
  { a: 'hall', b: 'foyer', x: 0, z: 0, rect: { x: -1.35, z: -0.75, w: 2.7, d: 1.5 } },
  { a: 'hall', b: 'bedroom', x: 0, z: -12, rect: { x: -1.35, z: -12.75, w: 2.7, d: 1.5 } },
  { a: 'hall', b: 'kitchen', x: 2.2, z: -5, rect: { x: 1.45, z: -6.45, w: 1.6, d: 2.9 } },
  { a: 'hall', b: 'storage', x: -2.2, z: -5, rect: { x: -3.05, z: -6.45, w: 1.6, d: 2.9 } },
  { a: 'foyer', b: 'basement', x: 3.55, z: 2.9, locked: true, rect: { x: 2.85, z: 1.55, w: 1.6, d: 2.7 } },
];

// Solid furniture. Values are the minimum corner.
export const BLOCKS = [
  { id: 'bed', x: -3.15, z: -17.55, w: 2.35, d: 1.45 },
  { id: 'nightstand', x: 1.85, z: -16.35, w: 0.9, d: 0.7 },
  { id: 'wardrobe', x: -8.35, z: -8.05, w: 1.55, d: 2.15 },
  { id: 'table', x: 4.25, z: -6.15, w: 1.8, d: 1.15 },
  { id: 'cabinet', x: 6.35, z: -8.05, w: 2.15, d: 0.7 },
  { id: 'crate', x: -8.15, z: -4.45, w: 1.05, d: 0.95 },
  { id: 'closet', x: -3.45, z: 0.95, w: 0.7, d: 1.55 },
];

export const SPOTS = [
  { id: 'crate', x: -6.4, z: -3.95, radius: 1.6, label: 'Pry open the crate' },
  { id: 'cabinet', x: 7.45, z: -6.5, radius: 1.6, label: 'Search the cabinet' },
  { id: 'drawer', x: 2.3, z: -14.9, radius: 1.5, label: 'Search the nightstand' },
  { id: 'bed', x: -1.95, z: -15.35, radius: 1.55, label: 'Hide under the bed' },
  { id: 'wardrobe', x: -7.5, z: -5.05, radius: 1.55, label: 'Hide in the wardrobe' },
  { id: 'table', x: 6.85, z: -5.55, radius: 1.55, label: 'Hide under the table' },
  { id: 'closet', x: -1.9, z: 1.75, radius: 1.5, label: 'Hide in the coat closet' },
  { id: 'basement-door', x: 2.9, z: 2.9, radius: 1.65, label: 'Try the basement door' },
  { id: 'fusebox', x: 9.1, z: 3.1, radius: 1.55, label: 'Use the fuse box' },
  { id: 'exit', x: 0, z: 5.6, radius: 1.6, label: 'Use the front door' },
];

export const SKIP_WALL = {
  hall: ['n', 's'],
  kitchen: ['w'],
  storage: ['e'],
  basement: ['w'],
};

export const GAPS = {
  foyer: { n: [[-1.35, 1.35]], e: [[1.55, 4.25]], s: [[-0.75, 0.75]] },
  hall: { e: [[-6.45, -3.55]], w: [[-6.45, -3.55]] },
  bedroom: { s: [[-1.35, 1.35]] },
  kitchen: {},
  storage: {},
  basement: {},
};

export const ITEMS = {
  key: { name: 'Rusty key' },
  fuse: { name: 'Fuse' },
  code: { name: 'Code 1913' },
};

export const HELP = [
  'Arrow up walks forward. Arrow down steps back. Left and right turn.',
  'OK uses whatever is in front of you: a drawer, a door, a hiding place.',
  'Find the rusty key, the fuse, and the door code. The code is written on the note.',
  'Hide under the bed, under the table, in the wardrobe, or in the unlit coat closet before the ghost reaches you.',
  'If it sees you hide, it pulls you out. The line at the bottom names the room it is in.',
  'The key opens the basement. The fuse restores power. Then enter the code on the front door.',
];
