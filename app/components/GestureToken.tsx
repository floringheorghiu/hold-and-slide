import Animated, {
  SharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { StyleSheet, Text } from 'react-native';

type Props = {
  text: string;
  index: number;
  activeIndex: SharedValue<number>;
};

export function GestureToken({ text, index, activeIndex }: Props) {
  const style = useAnimatedStyle(() => {
    const active = activeIndex.value === index;
    return {
      backgroundColor: withTiming(active ? '#3b4260' : 'transparent', {
        duration: 120,
      }),
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
  token: { borderRadius: 4, paddingHorizontal: 2 },
  text: { color: '#e6e8ef', fontSize: 18, lineHeight: 28 },
});
