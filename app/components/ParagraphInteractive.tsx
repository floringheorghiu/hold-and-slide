import { GestureDetector, ScrollView } from 'react-native-gesture-handler';
import { useSharedValue } from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { GestureToken } from './GestureToken';
import { EdgeMenu } from './EdgeMenu';
import { ReadingHeader } from './ReadingHeader';
import { ActionRow } from './ActionRow';
import { ReplyBar } from './ReplyBar';
import { useHoldSlideGesture } from '../hooks/useHoldSlideGesture';
import { Phase } from '../lib/phase';
import type { IconBounds } from '../lib/geometry';
import { ARTICLE, ARTICLE_TITLE } from '../content/article';

// Paragraphs split on blank lines. Every token keeps a unique index across
// the WHOLE article, not per paragraph, because the gesture and the future
// sentence lookup both depend on a single global index space.
const PARAGRAPHS = ARTICLE.split(/\n\n+/);

let nextIndex = 0;
const PARAGRAPH_TOKENS = PARAGRAPHS.map((paragraph) =>
  paragraph.split(' ').map((text) => ({ text, index: nextIndex++ })),
);

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
      <ReadingHeader />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>{ARTICLE_TITLE}</Text>
        {PARAGRAPH_TOKENS.map((tokens, pIndex) => (
          <View key={pIndex} style={styles.paragraph}>
            {tokens.map(({ text, index }) => (
              <Token
                key={index}
                text={text}
                index={index}
                activeIndex={activeIndex}
                phase={phase}
                revealX={revealX}
                focusedIndex={focusedIndex}
                iconBounds={iconBounds}
              />
            ))}
          </View>
        ))}
        <ActionRow />
        <Text style={styles.disclaimer}>
          Claude is AI and can make mistakes. Please double-check responses.
        </Text>
      </ScrollView>
      <EdgeMenu
        revealX={revealX}
        focusedIndex={focusedIndex}
        onBounds={(b) => { iconBounds.value = b; }}
      />
      <ReplyBar />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: '#FAF9F7' },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 12 },
  title: {
    color: '#1F1E1D',
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '600',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia' }),
    marginBottom: 20,
  },
  paragraph: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 20 },
  disclaimer: {
    color: '#8A8680',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 16,
    marginBottom: 24,
  },
});
