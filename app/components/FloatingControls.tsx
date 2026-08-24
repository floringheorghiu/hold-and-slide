import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { SharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import type { useSpeech } from '../hooks/useSpeech';
import { Phase } from '../lib/phase';

type Props = {
  speech: ReturnType<typeof useSpeech>;
  phase: SharedValue<number>;
};

// Persistent playback control, visible only while audio is active. Yields to
// the drawer during the hold-and-slide gesture: fades out and stops
// intercepting touches, then fades back once the gesture returns to IDLE.
export function FloatingControls({ speech, phase }: Props) {
  const fadeStyle = useAnimatedStyle(() => {
    // Any phase other than IDLE means a gesture is in progress somewhere on
    // the article — this control has nothing to do with which token, only
    // whether a gesture is active at all.
    const hidden = phase.value !== Phase.IDLE;
    return {
      opacity: withTiming(hidden ? 0 : 1, { duration: 140 }),
      // Plain style values set alongside animated ones update immediately,
      // not interpolated — pointerEvents flips the instant the gesture
      // starts, it does not fade. Opacity alone does not stop touches, so
      // without this the invisible pill would still intercept taps meant
      // for the drawer underneath it.
      pointerEvents: hidden ? 'none' : 'auto',
    };
  });

  if (speech.state === 'idle') return null;

  const isPlaying = speech.state === 'playing';

  return (
    <View style={styles.wrap} pointerEvents="box-none">
      <Animated.View style={[styles.pill, fadeStyle]}>
        <Pressable
          style={styles.button}
          hitSlop={8}
          onPress={isPlaying ? speech.pause : speech.resume}
        >
          <Feather name={isPlaying ? 'pause' : 'play'} size={20} color="#FFFFFF" />
        </Pressable>
        <Pressable style={styles.button} hitSlop={8} onPress={speech.stop}>
          <Feather name="square" size={20} color="#FFFFFF" />
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 140,
    alignItems: 'center',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#D8D5CE',
    borderRadius: 28,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  button: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1F1E1D',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
