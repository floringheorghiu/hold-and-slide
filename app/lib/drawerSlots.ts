// Single source of truth for the edge drawer's icon list. EdgeMenu uses this
// to render, and ParagraphInteractive's commit handler uses the SAME
// derivation to dispatch — so the two can never fall out of sync on which
// slot index means what.
//
// Fixed at three passage-scoped actions, in every playback state. The
// floating pill owns pause and stop persistently, so the drawer does not
// need to duplicate them — two clean roles instead of one overloaded one.

export type DrawerSlotKind = 'playFromHere' | 'copy' | 'share';

export type DrawerSlot = {
  kind: DrawerSlotKind;
  icon: 'play' | 'copy' | 'share';
};

export function getDrawerSlots(): DrawerSlot[] {
  return [
    { kind: 'playFromHere', icon: 'play' },
    { kind: 'copy', icon: 'copy' },
    { kind: 'share', icon: 'share' },
  ];
}
