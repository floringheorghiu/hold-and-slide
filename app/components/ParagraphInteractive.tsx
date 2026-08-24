import { GestureDetector, ScrollView } from 'react-native-gesture-handler';
import { useSharedValue } from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';
import { useCallback, useMemo, useRef, useState } from 'react';
import { Platform, Share, StyleSheet, Text, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { GestureToken } from './GestureToken';
import { EdgeMenu } from './EdgeMenu';
import { FloatingControls } from './FloatingControls';
import { ReadingHeader } from './ReadingHeader';
import { ActionRow } from './ActionRow';
import { ReplyBar } from './ReplyBar';
import { useHoldSlideGesture } from '../hooks/useHoldSlideGesture';
import { useSpeech } from '../hooks/useSpeech';
import { Phase } from '../lib/phase';
import type { IconBounds } from '../lib/geometry';
import { splitSentences, sentenceIndexForOffset, tokenOffsets } from '../lib/sentences';
import { getDrawerSlots } from '../lib/drawerSlots';
import { ARTICLE, ARTICLE_TITLE } from '../content/article';

// Paragraphs split on blank lines. Every token keeps a unique index across
// the WHOLE article, not per paragraph, because the gesture and the future
// sentence lookup both depend on a single global index space.
const PARAGRAPHS = ARTICLE.split(/\n\n+/);

let nextIndex = 0;
const PARAGRAPH_TOKENS = PARAGRAPHS.map((paragraph) =>
  paragraph.split(' ').map((text) => ({ text, index: nextIndex++ })),
);

const TOAST_DURATION_MS = 1500;

function Token({
  text,
  index,
  activeIndex,
  phase,
  revealX,
  focusedIndex,
  iconBounds,
  onCommit,
}: {
  text: string;
  index: number;
  activeIndex: SharedValue<number>;
  phase: SharedValue<number>;
  revealX: SharedValue<number>;
  focusedIndex: SharedValue<number>;
  iconBounds: SharedValue<IconBounds[]>;
  onCommit: (iconIndex: number, tokenIndex: number) => void;
}) {
  const { gesture } = useHoldSlideGesture({
    tokenIndex: index,
    activeIndex,
    phase,
    revealX,
    focusedIndex,
    iconBounds,
    onCommit,
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

  const speech = useSpeech(ARTICLE);
  const offsets = useMemo(() => tokenOffsets(ARTICLE), []);
  const sentences = useMemo(() => splitSentences(ARTICLE), []);

  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function showToast(message: string) {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), TOAST_DURATION_MS);
  }

  // The deliberate asymmetry: the bottom row (ActionRow) acts on the whole
  // article. The drawer acts on the one sentence containing the held word.
  //
  // The icon list is variable now (3 slots idle, 4 while playing/paused), so
  // iconIndex no longer has a fixed meaning. Dispatch indexes into the SAME
  // getDrawerSlots(state) array EdgeMenu renders from, rather than a second
  // switch statement that would have to be kept in sync by hand.
  const handleCommit = useCallback(
    (iconIndex: number, tokenIndex: number) => {
      if (tokenIndex < 0 || tokenIndex >= offsets.length) return;
      const charOffset = offsets[tokenIndex];
      const sentenceIndex = sentenceIndexForOffset(sentences, charOffset);
      if (sentenceIndex < 0) return;
      const sentence = sentences[sentenceIndex].text;

      const slot = getDrawerSlots(speech.state)[iconIndex];
      if (!slot) return;

      switch (slot.kind) {
        case 'playFromHere':
          speech.playFromOffset(charOffset);
          break;
        case 'pause':
          speech.pause();
          break;
        case 'stop':
          speech.stop();
          break;
        case 'copy':
          Clipboard.setStringAsync(sentence);
          showToast('Sentence copied');
          break;
        case 'share':
          Share.share({ message: sentence });
          break;
      }
    },
    [offsets, sentences, speech],
  );

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
                onCommit={handleCommit}
              />
            ))}
          </View>
        ))}
        <ActionRow speech={speech} />
        <Text style={styles.disclaimer}>
          Clara is AI and can make mistakes. Please double-check responses.
        </Text>
      </ScrollView>
      <FloatingControls speech={speech} phase={phase} />
      <EdgeMenu
        revealX={revealX}
        focusedIndex={focusedIndex}
        speechState={speech.state}
        onBounds={(b) => { iconBounds.value = b; }}
      />
      {toast && (
        <View style={styles.toast} pointerEvents="none">
          <Text style={styles.toastText}>{toast}</Text>
        </View>
      )}
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
  toast: {
    position: 'absolute',
    bottom: 84,
    alignSelf: 'center',
    backgroundColor: '#1F1E1D',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
  },
  toastText: {
    color: '#FAF9F7',
    fontSize: 13,
  },
});
