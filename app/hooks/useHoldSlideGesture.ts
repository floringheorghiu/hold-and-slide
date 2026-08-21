import { Gesture } from 'react-native-gesture-handler';
import { useSharedValue, withTiming } from 'react-native-reanimated';
import { Phase } from '../lib/phase';
import {
  LONG_PRESS_MS,
  LONG_PRESS_MAX_DISTANCE,
  MENU_WIDTH,
  REVEAL_THRESHOLD,
  MAX_DRAG,
} from '../lib/constants';

export function useHoldSlideGesture() {
  const armed = useSharedValue(false);
  const phase = useSharedValue<number>(Phase.IDLE);
  const revealX = useSharedValue(0);
  const focusedIndex = useSharedValue(-1);

  function reset() {
    'worklet';
    armed.value = false;
    phase.value = Phase.IDLE;
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

  return { gesture, phase, revealX, focusedIndex };
}
