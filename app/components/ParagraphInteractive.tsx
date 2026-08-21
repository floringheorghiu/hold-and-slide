import { GestureDetector } from 'react-native-gesture-handler';
import { useSharedValue } from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';
import { StyleSheet, View } from 'react-native';
import { GestureToken } from './GestureToken';
import { useHoldSlideGesture } from '../hooks/useHoldSlideGesture';
import { DebugOverlay } from './DebugOverlay';
import { Phase } from '../lib/phase';

const PARAGRAPH =
  'Hold any word in this paragraph, then slide left to reveal the menu and scrub through the icons.';

const TOKENS = PARAGRAPH.split(' ');

function Token({
  text,
  index,
  activeIndex,
  phase,
  revealX,
  focusedIndex,
}: {
  text: string;
  index: number;
  activeIndex: SharedValue<number>;
  phase: SharedValue<number>;
  revealX: SharedValue<number>;
  focusedIndex: SharedValue<number>;
}) {
  const { gesture } = useHoldSlideGesture({
    tokenIndex: index,
    activeIndex,
    phase,
    revealX,
    focusedIndex,
  });

  return (
    <GestureDetector gesture={gesture}>
      <View>
        <GestureToken text={text} index={index} activeIndex={activeIndex} />
      </View>
    </GestureDetector>
  );
}

export function ParagraphInteractive() {
  const activeIndex = useSharedValue(-1);
  const phase = useSharedValue<number>(Phase.IDLE);
  const revealX = useSharedValue(0);
  const focusedIndex = useSharedValue(-1);

  return (
    <View style={styles.wrap}>
      <DebugOverlay phase={phase} revealX={revealX} focusedIndex={focusedIndex} />
      <View style={styles.paragraph}>
        {TOKENS.map((t, i) => (
          <Token
            key={i}
            text={t}
            index={i}
            activeIndex={activeIndex}
            phase={phase}
            revealX={revealX}
            focusedIndex={focusedIndex}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, justifyContent: 'center' },
  paragraph: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 24 },
});
