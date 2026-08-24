import Animated, {
  SharedValue,
  interpolateColor,
  useAnimatedStyle,
  useDerivedValue,
  withTiming,
} from 'react-native-reanimated';
import { Platform, StyleSheet, Text } from 'react-native';

// Must stay in sync with the root background colour in App.tsx.
const PAGE_BG = '#FAF9F7';
const HIGHLIGHT_BG = '#CFE0FF';

type Props = {
  text: string;
  index: number;
  activeIndex: SharedValue<number>;
};

export function GestureToken({ text, index, activeIndex }: Props) {
  const progress = useDerivedValue(() =>
    withTiming(activeIndex.value === index ? 1 : 0, { duration: 120 }),
  );

  const style = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      [PAGE_BG, HIGHLIGHT_BG],
    ),
    transform: [{ scale: 1 + progress.value * 0.08 }],
  }));

  return (
    <Animated.View style={[styles.token, style]}>
      <Text style={styles.text} selectable={false}>
        {text}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  token: { borderRadius: 4, paddingHorizontal: 2 },
  text: {
    color: '#1F1E1D',
    fontSize: 18,
    lineHeight: 30,
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia' }),
  },
});
