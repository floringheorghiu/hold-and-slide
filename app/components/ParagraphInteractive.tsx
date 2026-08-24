import { GestureDetector, ScrollView } from 'react-native-gesture-handler';
import { useSharedValue } from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';
import { StyleSheet, View } from 'react-native';
import { GestureToken } from './GestureToken';
import { EdgeMenu } from './EdgeMenu';
import { DebugOverlay } from './DebugOverlay';
import { useHoldSlideGesture } from '../hooks/useHoldSlideGesture';
import { Phase } from '../lib/phase';
import type { IconBounds } from '../lib/geometry';

const PARAGRAPH =
  'Hold any word in this paragraph, then slide left to reveal the menu and scrub through the icons.';

// Spike only: repeated so the content is clearly taller than the screen,
// to test the pan gesture against a scrolling view.
const REPEAT_COUNT = 8;
const TOKENS = Array.from({ length: REPEAT_COUNT }, () => PARAGRAPH.split(' ')).flat();

function Token({
  text,
  index,
  activeIndex,
  phase,
  revealX,
  focusedIndex,
  iconBounds,
}: {
  text: string;
  index: number;
  activeIndex: SharedValue<number>;
  phase: SharedValue<number>;
  revealX: SharedValue<number>;
  focusedIndex: SharedValue<number>;
  iconBounds: SharedValue<IconBounds[]>;
}) {
  const { gesture } = useHoldSlideGesture({
    tokenIndex: index,
    activeIndex,
    phase,
    revealX,
    focusedIndex,
    iconBounds,
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
  const iconBounds = useSharedValue<IconBounds[]>([]);

  return (
    <View style={styles.wrap}>
      <DebugOverlay phase={phase} revealX={revealX} focusedIndex={focusedIndex} activeIndex={activeIndex} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
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
              iconBounds={iconBounds}
            />
          ))}
        </View>
      </ScrollView>
      <EdgeMenu
        revealX={revealX}
        focusedIndex={focusedIndex}
        onBounds={(b) => { iconBounds.value = b; }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  scrollContent: { paddingTop: 80 },
  paragraph: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 24 },
});
