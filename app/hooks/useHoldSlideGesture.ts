import { Gesture } from 'react-native-gesture-handler';
import { useSharedValue, withTiming } from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';
import { Phase } from '../lib/phase';
import {
  LONG_PRESS_MS,
  LONG_PRESS_MAX_DISTANCE,
  MENU_WIDTH,
  REVEAL_THRESHOLD,
  MAX_DRAG,
} from '../lib/constants';

type Args = {
  tokenIndex: number;
  activeIndex: SharedValue<number>;
  phase: SharedValue<number>;
  revealX: SharedValue<number>;
  focusedIndex: SharedValue<number>;
};

export function useHoldSlideGesture({
  tokenIndex,
  activeIndex,
  phase,
  revealX,
  focusedIndex,
}: Args) {
  const armed = useSharedValue(false);

  function reset() {
    'worklet';
    armed.value = false;
    phase.value = Phase.IDLE;
    activeIndex.value = -1;
    focusedIndex.value = -1;
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
    });

  const pan = Gesture.Pan()
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

      revealX.value = Math.min(Math.max(dragged, 0), MENU_WIDTH);
      phase.value =
        revealX.value > REVEAL_THRESHOLD ? Phase.MENU_OPEN : Phase.DRAGGING;
    })
    .onEnd(() => {
      reset();
    })
    .onFinalize(() => {
      if (armed.value) reset();
    });

  const gesture = Gesture.Simultaneous(longPress, pan);

  return { gesture };
}
