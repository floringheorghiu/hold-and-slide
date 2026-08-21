export const Phase = {
  IDLE: 0,
  PRESSING: 1,
  ARMED: 2,
  DRAGGING: 3,
  MENU_OPEN: 4,
  SCRUBBING: 5,
} as const;

export type PhaseValue = (typeof Phase)[keyof typeof Phase];

const NAMES = ['IDLE', 'PRESSING', 'ARMED', 'DRAGGING', 'MENU_OPEN', 'SCRUBBING'];

export function phaseName(p: number): string {
  'worklet';
  return NAMES[p] ?? 'UNKNOWN';
}

export function isDragPhase(p: number): boolean {
  'worklet';
  return p === Phase.ARMED || p === Phase.DRAGGING;
}

export function isMenuPhase(p: number): boolean {
  'worklet';
  return p === Phase.MENU_OPEN || p === Phase.SCRUBBING;
}
