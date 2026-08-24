// Single source of truth for the edge drawer's icon list. EdgeMenu uses this
// to render, and ParagraphInteractive's commit handler uses the SAME
// derivation to dispatch — so the two can never fall out of sync on which
// slot index means what.

export type DrawerSpeechState = 'idle' | 'playing' | 'paused';

export type DrawerSlotKind = 'playFromHere' | 'pause' | 'stop' | 'copy' | 'share';

export type DrawerSlot = {
  kind: DrawerSlotKind;
  icon: 'play' | 'pause' | 'square' | 'copy' | 'share';
};

export function getDrawerSlots(state: DrawerSpeechState): DrawerSlot[] {
  if (state === 'playing') {
    return [
      { kind: 'pause', icon: 'pause' },
      { kind: 'stop', icon: 'square' },
      { kind: 'copy', icon: 'copy' },
      { kind: 'share', icon: 'share' },
    ];
  }

  if (state === 'paused') {
    return [
      { kind: 'playFromHere', icon: 'play' },
      { kind: 'stop', icon: 'square' },
      { kind: 'copy', icon: 'copy' },
      { kind: 'share', icon: 'share' },
    ];
  }

  return [
    { kind: 'playFromHere', icon: 'play' },
    { kind: 'copy', icon: 'copy' },
    { kind: 'share', icon: 'share' },
  ];
}
