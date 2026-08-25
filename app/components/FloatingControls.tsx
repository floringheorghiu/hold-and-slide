import { StyleSheet, View } from 'react-native';
import { useOverlayLayout } from '../hooks/useOverlayLayout';
import Animated, { SharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { TapFeedback } from './TapFeedback';
import type { useSpeech } from '../hooks/useSpeech';
import { Phase } from '../lib/phase';

type Props = {
  speech: ReturnType<typeof useSpeech>;
  phase: SharedValue<number>;
};

// The dark #1F1E1D circles need a stronger halo than ActionRow's light
// chrome — the same #DE7356 alpha-blended onto near-black comes out much
// darker and less distinct than the same blend onto near-white. See
// TapFeedback.
// Full alpha, not a wash: the halo covers the whole button, so at 1 the dark
// circle reads as a solid colour swap to the accent rather than a tint over
// it. Chosen for screen-recording legibility, and it matches the drawer,
// where #DE7356 already means "this one is active".
const HALO_ALPHA = 1;

// Persistent playback control, visible only while audio is active. Yields to
// the drawer during the hold-and-slide gesture: fades out and stops
// intercepting touches, then fades back once the gesture returns to IDLE.
export function FloatingControls({ speech, phase }: Props) {
  const { bottom, right } = useOverlayLayout();

  const fadeStyle = useAnimatedStyle(() => {
    // Yield only once the gesture has actually ARMED, not merely begun.
    // PRESSING is ambiguous: every touch passes through it, including the
    // start of an ordinary scroll. Hiding on PRESSING made the control
    // vanish whenever the user scrolled. It yields to the drawer, and to
    // nothing else.
    const hidden = phase.value >= Phase.ARMED;
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
    <View style={[styles.wrap, { bottom, right }]} pointerEvents="box-none">
      <Animated.View style={[styles.pill, fadeStyle]}>
        <TapFeedback
          style={styles.button}
          hitSlop={8}
          onPress={isPlaying ? speech.pause : speech.resume}
          haloPeakAlpha={HALO_ALPHA}
        >
          <Feather name={isPlaying ? 'pause' : 'play'} size={20} color="#FFFFFF" />
        </TapFeedback>
        <TapFeedback style={styles.button} hitSlop={8} onPress={speech.stop} haloPeakAlpha={HALO_ALPHA}>
          <Feather name="square" size={20} color="#FFFFFF" />
        </TapFeedback>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    // Anchored to the right only, so the layer hugs the pill instead of
    // spanning the screen. Flush with the reply bar's right edge.
    position: 'absolute',
    alignItems: 'flex-end',
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
    // Lifts the pill off the article it floats over. iOS reads the shadow*
    // properties; Android ignores them entirely and needs elevation, so both
    // are set. Kept low so it reads as depth rather than as a drop shadow.
    shadowColor: '#1F1E1D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
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
