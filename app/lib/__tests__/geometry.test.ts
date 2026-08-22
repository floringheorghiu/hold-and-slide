import { clamp, hitTest, IconBounds } from '../geometry';

const BOUNDS: IconBounds[] = [
  { centerY: 100, halfHeight: 20 },
  { centerY: 160, halfHeight: 20 },
  { centerY: 220, halfHeight: 20 },
];

describe('clamp', () => {
  it('passes through a value in range', () => {
    expect(clamp(5, 0, 10)).toBe(5);
  });

  it('clamps below and above', () => {
    expect(clamp(-3, 0, 10)).toBe(0);
    expect(clamp(42, 0, 10)).toBe(10);
  });
});

describe('hitTest', () => {
  it('finds the icon under an exact centre', () => {
    expect(hitTest(160, BOUNDS, 0)).toBe(1);
  });

  it('finds an icon inside its half-height', () => {
    expect(hitTest(115, BOUNDS, 0)).toBe(0);
  });

  it('returns -1 when the touch is outside every icon', () => {
    expect(hitTest(400, BOUNDS, 0)).toBe(-1);
  });

  it('uses padding to widen the hit zone beyond the icon', () => {
    expect(hitTest(130, BOUNDS, 0)).toBe(-1);
    expect(hitTest(130, BOUNDS, 12)).toBe(0);
  });

  it('returns -1 for empty bounds', () => {
    expect(hitTest(100, [], 12)).toBe(-1);
  });

  it('picks the nearest centre when padded zones overlap', () => {
    // Centres 100 and 160 -> midpoint 130. Padding 40 makes both zones reach y=130,
    // so this asserts the tie is broken by distance, not by array order.
    expect(hitTest(129, BOUNDS, 40)).toBe(0);
    expect(hitTest(131, BOUNDS, 40)).toBe(1);
  });
});
