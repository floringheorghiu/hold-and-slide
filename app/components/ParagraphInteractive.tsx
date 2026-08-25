import { GestureDetector, ScrollView } from 'react-native-gesture-handler';
import { useAnimatedReaction, useSharedValue } from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';
import { runOnJS } from 'react-native-worklets';
import { useCallback, useMemo, useRef, useState } from 'react';
import { LayoutChangeEvent, Platform, Share, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useOverlayLayout } from '../hooks/useOverlayLayout';
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
import { tokenSentenceIndices } from '../lib/tokenSentences';
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

// Token index -> paragraph index, built from the same ranges as
// PARAGRAPH_TOKENS above so it can never disagree with what actually renders.
const TOKEN_PARAGRAPH: number[] = [];
PARAGRAPH_TOKENS.forEach((tokens, pIndex) => {
  tokens.forEach(() => TOKEN_PARAGRAPH.push(pIndex));
});

const TOAST_DURATION_MS = 1500;
// How far below the header's bottom edge a paragraph's first line should
// land once scrolled into view.
const SCROLL_OFFSET = 20;

function Token({
  text,
  index,
  sentenceIndex,
  activeIndex,
  phase,
  revealX,
  focusedIndex,
  iconBounds,
  readingSentence,
  onCommit,
}: {
  text: string;
  index: number;
  sentenceIndex: number;
  activeIndex: SharedValue<number>;
  phase: SharedValue<number>;
  revealX: SharedValue<number>;
  focusedIndex: SharedValue<number>;
  iconBounds: SharedValue<IconBounds[]>;
  readingSentence: SharedValue<number>;
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
        <GestureToken
          text={text}
          index={index}
          sentenceIndex={sentenceIndex}
          activeIndex={activeIndex}
          readingSentence={readingSentence}
        />
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
  const tokenSentences = useMemo(() => tokenSentenceIndices(ARTICLE), []);

  // For each sentence, the paragraph containing its first token — derived
  // from the same token->sentence and token->paragraph data everything else
  // uses, not a separate hand-maintained mapping.
  const sentenceToParagraph = useMemo(() => {
    const map: number[] = [];
    for (let t = 0; t < tokenSentences.length; t++) {
      const s = tokenSentences[t];
      if (s >= 0 && map[s] === undefined) {
        map[s] = TOKEN_PARAGRAPH[t];
      }
    }
    return map;
  }, [tokenSentences]);

  const insets = useSafeAreaInsets();
  const overlay = useOverlayLayout();

  const scrollRef = useRef<ScrollView>(null);
  const paragraphY = useRef<number[]>([]);
  const headerHeight = useRef(0);
  const lastScrolledParagraph = useRef(-1);
  const scrollViewWidth = useRef<number | null>(null);

  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function showToast(message: string) {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), TOAST_DURATION_MS);
  }

  function handleHeaderLayout(e: LayoutChangeEvent) {
    headerHeight.current = e.nativeEvent.layout.height;
  }

  function handleParagraphLayout(pIndex: number, e: LayoutChangeEvent) {
    paragraphY.current[pIndex] = e.nativeEvent.layout.y;
  }

  // paragraphY re-measures on rotation because onLayout fires again, but
  // lastScrolledParagraph does not know its old value is now stale, so the
  // paragraph being read would not re-centre after a rotation. A width
  // change is the thing that actually matters — it also covers split-screen
  // and foldables, not just a 90-degree rotation — so reset on that rather
  // than listening for orientation specifically.
  function handleScrollViewLayout(e: LayoutChangeEvent) {
    const width = e.nativeEvent.layout.width;
    if (scrollViewWidth.current !== null && scrollViewWidth.current !== width) {
      lastScrolledParagraph.current = -1;
    }
    scrollViewWidth.current = width;
  }

  // The header is a fixed sibling directly above the ScrollView, not part of
  // its scrollable content, so the ScrollView's own viewport top already
  // coincides on screen with the header's bottom edge. Scrolling this
  // paragraph 20px below the header is therefore the same target as
  // scrolling it 20px below the ScrollView's own top: contentY - 20.
  // headerHeight is captured (not hardcoded, since it varies with each
  // device's safe-area inset) but does not appear in this formula — it
  // cancels out because nothing sits between the header and the ScrollView.
  const scrollToSentence = useCallback(
    (sentenceIndex: number) => {
      const pIndex = sentenceToParagraph[sentenceIndex];
      if (pIndex === undefined || pIndex === lastScrolledParagraph.current) return;

      const y = paragraphY.current[pIndex];
      if (y === undefined) return;

      lastScrolledParagraph.current = pIndex;
      scrollRef.current?.scrollTo({ y: Math.max(0, y - SCROLL_OFFSET), animated: true });
    },
    [sentenceToParagraph],
  );

  // Fires only on a discrete sentence change, never per frame, and never
  // re-renders the ~700-token tree — the same discipline as the gesture
  // haptics. Scrolling only happens when the PARAGRAPH changes inside
  // scrollToSentence's own guard, so a run of sentences within one
  // paragraph triggers this reaction repeatedly but scrolls nothing.
  useAnimatedReaction(
    () => speech.readingSentence.value,
    (current, previous) => {
      if (current !== previous && current >= 0) {
        runOnJS(scrollToSentence)(current);
      }
    },
  );

  // The deliberate asymmetry: the bottom row (ActionRow) acts on the whole
  // article. The drawer acts on the one sentence containing the held word.
  //
  // The drawer's three slots are fixed in every playback state — the
  // floating pill owns pause and stop persistently. Dispatch still indexes
  // into the SAME getDrawerSlots() array EdgeMenu renders from, rather than
  // a second switch statement that would have to be kept in sync by hand.
  //
  // playFromHere runs in every state, including while audio is already
  // playing — speech.playFromOffset ultimately calls play(), whose
  // generation counter (see useSpeech) makes interrupting live playback
  // safe: the superseded utterance's late onDone is ignored rather than
  // advancing the cursor past the sentence just started.
  const handleCommit = useCallback(
    (iconIndex: number, tokenIndex: number) => {
      if (tokenIndex < 0 || tokenIndex >= offsets.length) return;
      const charOffset = offsets[tokenIndex];
      const sentenceIndex = sentenceIndexForOffset(sentences, charOffset);
      if (sentenceIndex < 0) return;
      const sentence = sentences[sentenceIndex].text;

      const slot = getDrawerSlots()[iconIndex];
      if (!slot) return;

      switch (slot.kind) {
        case 'playFromHere':
          speech.playFromOffset(charOffset);
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
      <View onLayout={handleHeaderLayout}>
        <ReadingHeader />
      </View>
      <ScrollView
        ref={scrollRef}
        onLayout={handleScrollViewLayout}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingLeft: Math.max(24, insets.left), paddingRight: Math.max(24, insets.right) },
        ]}
      >
        <Text style={styles.title}>{ARTICLE_TITLE}</Text>
        {PARAGRAPH_TOKENS.map((tokens, pIndex) => (
          <View
            key={pIndex}
            style={styles.paragraph}
            onLayout={(e) => handleParagraphLayout(pIndex, e)}
          >
            {tokens.map(({ text, index }) => (
              <Token
                key={index}
                text={text}
                index={index}
                sentenceIndex={tokenSentences[index] ?? -1}
                activeIndex={activeIndex}
                phase={phase}
                revealX={revealX}
                focusedIndex={focusedIndex}
                iconBounds={iconBounds}
                readingSentence={speech.readingSentence}
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
        onBounds={(b) => { iconBounds.value = b; }}
      />
      {toast && (
        <View style={[styles.toast, { bottom: overlay.bottom, left: overlay.left }]} pointerEvents="none">
          <Text style={styles.toastText}>{toast}</Text>
        </View>
      )}
      <ReplyBar />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: '#FAF9F7' },
  // maxWidth/alignSelf apply to this content container only — the article
  // column. The ScrollView itself still fills the screen; the header, reply
  // bar, edge drawer, and floating controls are chrome and stay full-width
  // or edge-anchored, not wrapped in this constraint.
  scrollContent: { paddingBottom: 12, maxWidth: 600, alignSelf: 'center' },
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
    // Same row as the transport pill, flush with the reply bar's left edge.
    // Vertical offset comes from useOverlayLayout so the two cannot drift.
    position: 'absolute',
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
