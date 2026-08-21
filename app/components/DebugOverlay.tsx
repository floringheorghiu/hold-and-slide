import Animated, { useAnimatedProps, SharedValue } from 'react-native-reanimated';
import { StyleSheet, TextInput } from 'react-native';
import { phaseName } from '../lib/phase';

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

type Props = {
  phase: SharedValue<number>;
  revealX: SharedValue<number>;
  focusedIndex: SharedValue<number>;
};

export function DebugOverlay({ phase, revealX, focusedIndex }: Props) {
  const props = useAnimatedProps(() => {
    const text = `${phaseName(phase.value)}  x=${Math.round(revealX.value)}  i=${focusedIndex.value}`;
    return { text, defaultValue: text };
  });

  return (
    <AnimatedTextInput
      style={styles.readout}
      editable={false}
      underlineColorAndroid="transparent"
      animatedProps={props as never}
    />
  );
}

const styles = StyleSheet.create({
  readout: {
    position: 'absolute',
    top: 60,
    alignSelf: 'center',
    color: '#7ee787',
    fontFamily: 'Courier',
    fontSize: 14,
    padding: 0,
  },
});
