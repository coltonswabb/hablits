// ============================================
// PET MOTIONS
// ============================================
// How each pet moves when it is idle. Every pet gets its own, so they are
// told apart by how they move as well as how they look: the fish swims, the
// butterfly flutters, the car rumbles, the star twinkles.
//
// A motion is one loop, described by five keyframes per property (start,
// quarter, half, three-quarters, end). The first and last must match so the
// loop has no seam. Distances are in the pet's own 64-unit canvas, so they
// scale with the pet's size.
// ============================================

export type PetMotion =
  | 'breathe'
  | 'step'
  | 'sway'
  | 'tick'
  | 'stretch'
  | 'jiggle'
  | 'rumble'
  | 'hover'
  | 'swim'
  | 'flutter'
  | 'twinkle'
  | 'nod'
  | 'prowl'
  | 'puff'
  | 'bob'
  | 'drift';

export type Keyframes = [number, number, number, number, number];

export type MotionSpec = {
  /** Length of one loop, in milliseconds */
  duration: number;
  translateX?: Keyframes;
  translateY?: Keyframes;
  /** Degrees */
  rotate?: Keyframes;
  scaleX?: Keyframes;
  scaleY?: Keyframes;
};

export const MOTION_INPUT_RANGE: Keyframes = [0, 0.25, 0.5, 0.75, 1];

export const MOTIONS: Record<PetMotion, MotionSpec> = {
  // Blob: slow, soft breathing
  breathe: { duration: 3600, scaleX: [1, 1.02, 1, 0.99, 1], scaleY: [1, 0.98, 1, 1.02, 1] },
  // Pixel pet: a quick hop, then a rest
  step: { duration: 1000, translateY: [0, -3, 0, 0, 0] },
  // Paper: tilts like a sheet in a draught
  sway: { duration: 3200, rotate: [0, 4, 0, -4, 0] },
  // Robot: small mechanical tilts
  tick: { duration: 1600, rotate: [0, 3, 0, -3, 0], translateY: [0, 0, -1, 0, 0] },
  // Droplet: stretches tall, then settles
  stretch: { duration: 2200, scaleX: [1, 0.95, 1, 1.03, 1], scaleY: [1, 1.07, 1, 0.96, 1] },
  // Slime: wobbles wide and flat
  jiggle: { duration: 1500, scaleX: [1, 1.07, 1, 0.95, 1], scaleY: [1, 0.94, 1, 1.04, 1] },
  // Car: an engine idling
  rumble: { duration: 280, translateX: [0, 0.7, 0, -0.7, 0] },
  // Navi: floats well clear of the ground
  hover: { duration: 2800, translateY: [0, -3, -5, -3, 0] },
  // Fish: weaves from side to side
  swim: { duration: 2400, translateX: [0, 3, 0, -3, 0], rotate: [0, -4, 0, 4, 0] },
  // Butterfly: wings beat
  flutter: { duration: 700, scaleX: [1, 0.78, 1, 0.78, 1], translateY: [0, -2, 0, -2, 0] },
  // Star: turns a little and swells
  twinkle: { duration: 2600, rotate: [0, 8, 0, -8, 0], scaleX: [1, 1.08, 1, 1.08, 1], scaleY: [1, 1.08, 1, 1.08, 1] },
  // Deer: dips its head now and then
  nod: { duration: 3000, rotate: [0, 0, 5, 0, 0], translateY: [0, 0, 1, 0, 0] },
  // Tiger: paces a step each way
  prowl: { duration: 2000, translateX: [0, 2, 0, -2, 0], translateY: [0, -1, 0, -1, 0] },
  // Lion: the mane swells
  puff: { duration: 2400, scaleX: [1, 1.05, 1, 1.05, 1], rotate: [0, -2, 0, 2, 0] },
  // Hawk: quick dips of the head
  bob: { duration: 1100, translateY: [0, 1.5, 0, 1.5, 0] },
  // Dragon: drifts and leans
  drift: { duration: 3400, translateY: [0, -2, -3, -2, 0], rotate: [0, 2, 0, -2, 0] },
};
