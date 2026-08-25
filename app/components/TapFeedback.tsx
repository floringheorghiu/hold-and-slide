import type { ReactNode } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import type { ViewStyle } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

// #DE7356 as RGB components, so the halo can interpolate its own alpha via
// interpolateColor rather than a separate opacity style — the colour IS the
// fade. Never wrap a colour string in withTiming; withTiming drives the
// numeric `pressed` value below, interpolateColor turns it into a colour.
const ACCENT_RGB = '222, 115, 86';

type Props = {
  onPress?: () => void;
  hitSlop?: number;
  style?: ViewStyle;
  // Peak halo alpha at the pulse's midpoint. The same accent reads very
  // differently alpha-blended onto a near-white background versus a
  // near-black one — see TapFeedback usage sites for the values chosen and
  // the reasoning.
  haloPeakAlpha?: number;
  children: ReactNode;
};

// A tap that outlasts the touch. A real tap lasts roughly 80-120ms — two to
// four frames at 30fps — too brief for a screen recording to reliably show.
// This fires a fixed ~240ms pulse on press-in and ignores press-out
// entirely, so feedback is deterministic and always visible regardless of
// how fast the tap was.
export function TapFeedback({ onPress, hitSlop = 8, style, haloPeakAlpha = 0.35, children }: Props) {
  const pressed = useSharedValue(0);

  function handlePressIn() {
    pressed.value = withSequence(
      withTiming(1, { duration: 60 }),
      withTiming(0, { duration: 180 }),
    );
  }

  const contentStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - pressed.value * 0.14 }],
  }));

  const haloStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      pressed.value,
      [0, 1],
      [`rgba(${ACCENT_RGB}, 0)`, `rgba(${ACCENT_RGB}, ${haloPeakAlpha})`],
    ),
  }));

  return (
    <Pressable style={style} hitSlop={hitSlop} onPress={onPress} onPressIn={handlePressIn}>
      <Animated.View
        style={[StyleSheet.absoluteFill, styles.halo, haloStyle]}
        pointerEvents="none"
      />
      <Animated.View style={contentStyle}>{children}</Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  halo: {
    borderRadius: 999,
  },
});
