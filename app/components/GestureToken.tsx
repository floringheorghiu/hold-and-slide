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
// Pale wash of the #DE7356 accent — distinct from the blue hold highlight
// and quiet enough to read through.
const READING_BG = '#FBEAE3';

type Props = {
  text: string;
  index: number;
  sentenceIndex: number;
  activeIndex: SharedValue<number>;
  readingSentence: SharedValue<number>;
};

export function GestureToken({ text, index, sentenceIndex, activeIndex, readingSentence }: Props) {
  const progress = useDerivedValue(() =>
    withTiming(activeIndex.value === index ? 1 : 0, { duration: 120 }),
  );

  const readProgress = useDerivedValue(() =>
    withTiming(readingSentence.value === sentenceIndex ? 1 : 0, { duration: 160 }),
  );

  // Layered, not flattened into one ternary: the reading tint covers the
  // whole sentence, and a held word's blue highlight sits on top of it.
  // Both need to animate independently, hold winning when both are active.
  const style = useAnimatedStyle(() => {
    const base = interpolateColor(readProgress.value, [0, 1], [PAGE_BG, READING_BG]);
    return {
      backgroundColor: interpolateColor(progress.value, [0, 1], [base, HIGHLIGHT_BG]),
      transform: [{ scale: 1 + progress.value * 0.08 }],
    };
  });

  return (
    <Animated.View style={[styles.token, style]}>
      <Text style={styles.text} selectable={false}>
        {text}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  // No borderRadius: rounded corners on adjacent tokens leave visible gaps
  // between the words of a highlighted sentence, which reads as distracting
  // speckling rather than one continuous band.
  token: { paddingHorizontal: 2 },
  text: {
    color: '#1F1E1D',
    fontSize: 18,
    lineHeight: 30,
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia' }),
  },
});
