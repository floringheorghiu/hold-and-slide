import { Phase, phaseName, isDragPhase, isMenuPhase } from '../phase';

describe('phase', () => {
  it('names each phase', () => {
    expect(phaseName(Phase.IDLE)).toBe('IDLE');
    expect(phaseName(Phase.SCRUBBING)).toBe('SCRUBBING');
  });

  it('returns UNKNOWN for an out-of-range value', () => {
    expect(phaseName(99)).toBe('UNKNOWN');
  });

  it('treats ARMED and DRAGGING as drag phases', () => {
    expect(isDragPhase(Phase.ARMED)).toBe(true);
    expect(isDragPhase(Phase.DRAGGING)).toBe(true);
    expect(isDragPhase(Phase.MENU_OPEN)).toBe(false);
  });

  it('treats MENU_OPEN and SCRUBBING as menu phases', () => {
    expect(isMenuPhase(Phase.MENU_OPEN)).toBe(true);
    expect(isMenuPhase(Phase.SCRUBBING)).toBe(true);
    expect(isMenuPhase(Phase.IDLE)).toBe(false);
  });
});
