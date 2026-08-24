import { Gesture } from 'react-native-gesture-handler';
import { useSharedValue, withTiming } from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';
import { runOnJS } from 'react-native-worklets';
import { Phase } from '../lib/phase';
import { hitTest, clamp, IconBounds } from '../lib/geometry';
import { triggerHaptic } from '../lib/haptics';
import {
  LONG_PRESS_MS,
  LONG_PRESS_MAX_DISTANCE,
  REVEAL_DISTANCE,
  REVEAL_THRESHOLD,
  MAX_DRAG,
  HIT_PADDING,
} from '../lib/constants';

function commitAction(index: number) {
  console.log('[commit] icon', index);
}

type Args = {
  tokenIndex: number;
  activeIndex: SharedValue<number>;
  phase: SharedValue<number>;
  revealX: SharedValue<number>;
  focusedIndex: SharedValue<number>;
  iconBounds: SharedValue<IconBounds[]>;
};

export function useHoldSlideGesture({
  tokenIndex,
  activeIndex,
  phase,
  revealX,
  focusedIndex,
  iconBounds,
}: Args) {
  const armed = useSharedValue(false);
  const hasRevealed = useSharedValue(false);

  function reset() {
    'worklet';
    armed.value = false;
    phase.value = Phase.IDLE;
    activeIndex.value = -1;
    focusedIndex.value = -1;
    hasRevealed.value = false;
    revealX.value = withTiming(0, { duration: 180 });
  }

  const longPress = Gesture.LongPress()
    .minDuration(LONG_PRESS_MS)
    .maxDistance(LONG_PRESS_MAX_DISTANCE)
    .onBegin(() => {
      phase.value = Phase.PRESSING;
    })
    .onStart(() => {
      armed.value = true;
      phase.value = Phase.ARMED;
      activeIndex.value = tokenIndex;
      runOnJS(triggerHaptic)('armed');
    });

  const pan = Gesture.Pan()
    .activeOffsetX([-15, 15])
    .onUpdate((e) => {
      if (!armed.value) return;

      if (e.translationX > 12) {
        reset();
        return;
      }

      const dragged = -e.translationX;
      if (dragged > MAX_DRAG) {
        reset();
        return;
      }

      revealX.value = clamp(dragged, 0, REVEAL_DISTANCE);

      if (revealX.value > REVEAL_THRESHOLD) {
        if (!hasRevealed.value) {
          hasRevealed.value = true;
          runOnJS(triggerHaptic)('reveal');
        }

        const idx = hitTest(e.absoluteY, iconBounds.value, HIT_PADDING);
        if (idx !== focusedIndex.value) {
          focusedIndex.value = idx;
          if (idx >= 0) runOnJS(triggerHaptic)('focusChange');
        }
        phase.value = Phase.SCRUBBING;
      } else {
        focusedIndex.value = -1;
        phase.value = Phase.DRAGGING;
      }
    })
    .onEnd(() => {
      if (phase.value === Phase.SCRUBBING && focusedIndex.value >= 0) {
        runOnJS(commitAction)(focusedIndex.value);
        runOnJS(triggerHaptic)('commit');
      }
      reset();
    })
    .onFinalize(() => {
      if (armed.value) reset();
    });

  const gesture = Gesture.Simultaneous(longPress, pan);

  return { gesture };
}
