import Animated, {
  SharedValue,
  interpolateColor,
  useAnimatedStyle,
  useDerivedValue,
  withTiming,
} from 'react-native-reanimated';
import { StyleSheet, Text } from 'react-native';

const PAGE_BG = '#11131a';
const HIGHLIGHT_BG = '#5b6699';

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
  text: { color: '#e6e8ef', fontSize: 18, lineHeight: 28 },
});
