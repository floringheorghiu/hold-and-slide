export type IconBounds = { centerY: number; halfHeight: number };

export function clamp(v: number, min: number, max: number): number {
  'worklet';
  return Math.min(Math.max(v, min), max);
}

export function hitTest(
  absoluteY: number,
  bounds: IconBounds[],
  padding: number,
): number {
  'worklet';
  let best = -1;
  let bestDistance = Number.POSITIVE_INFINITY;

  for (let i = 0; i < bounds.length; i++) {
    const b = bounds[i];
    const reach = b.halfHeight + padding;
    const distance = Math.abs(absoluteY - b.centerY);
    if (distance <= reach && distance < bestDistance) {
      best = i;
      bestDistance = distance;
    }
  }

  return best;
}
