import { useEffect, useRef, useState } from 'react';
import { Share, StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { TapFeedback } from './TapFeedback';
import type { useSpeech } from '../hooks/useSpeech';
import { ARTICLE } from '../content/article';

const DEFAULT_COLOR = '#8A8680';
const FLASH_COLOR = '#DE7356';
const COPIED_DURATION_MS = 1500;
const FLASH_DURATION_MS = 900;
// ActionRow sits on the light #FAF9F7 chrome, where the #DE7356 halo reads
// clearly even at a modest alpha — see TapFeedback.
const HALO_ALPHA = 0.35;

type MockKey = 'thumbs-up' | 'thumbs-down' | 'retry';

type Props = {
  speech: ReturnType<typeof useSpeech>;
};

// thumbs-up, thumbs-down, and retry are mocked: a momentary colour
// acknowledgement and nothing else. No state, no storage.
export function ActionRow({ speech }: Props) {
  const { state, play, pause, resume, stop } = speech;
  const [copied, setCopied] = useState(false);
  const [flashedKey, setFlashedKey] = useState<MockKey | null>(null);
  const copiedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copiedTimer.current) clearTimeout(copiedTimer.current);
      if (flashTimer.current) clearTimeout(flashTimer.current);
    };
  }, []);

  async function handleCopy() {
    await Clipboard.setStringAsync(ARTICLE);
    setCopied(true);
    if (copiedTimer.current) clearTimeout(copiedTimer.current);
    copiedTimer.current = setTimeout(() => setCopied(false), COPIED_DURATION_MS);
  }

  async function handleShare() {
    await Share.share({ message: ARTICLE });
  }

  function handleMock(key: MockKey) {
    setFlashedKey(key);
    if (flashTimer.current) clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setFlashedKey(null), FLASH_DURATION_MS);
  }

  function handlePlayPause() {
    if (state === 'playing') {
      pause();
    } else if (state === 'paused') {
      resume();
    } else {
      play(0);
    }
  }

  const playPauseIcon = state === 'playing' ? 'pause' : 'play';
  const showStop = state === 'playing' || state === 'paused';

  return (
    <View style={styles.row}>
      <TapFeedback style={styles.button} hitSlop={8} onPress={handleCopy} haloPeakAlpha={HALO_ALPHA}>
        <Feather
          name={copied ? 'check' : 'copy'}
          size={20}
          color={copied ? FLASH_COLOR : DEFAULT_COLOR}
        />
      </TapFeedback>
      <TapFeedback style={styles.button} hitSlop={8} onPress={handleShare} haloPeakAlpha={HALO_ALPHA}>
        <Feather name="share" size={20} color={DEFAULT_COLOR} />
      </TapFeedback>
      <TapFeedback style={styles.button} hitSlop={8} onPress={handlePlayPause} haloPeakAlpha={HALO_ALPHA}>
        <Feather name={playPauseIcon} size={20} color={DEFAULT_COLOR} />
      </TapFeedback>
      {showStop && (
        <TapFeedback style={styles.button} hitSlop={8} onPress={stop} haloPeakAlpha={HALO_ALPHA}>
          <Feather name="square" size={20} color={DEFAULT_COLOR} />
        </TapFeedback>
      )}
      <TapFeedback
        style={styles.button}
        hitSlop={8}
        onPress={() => handleMock('thumbs-up')}
        haloPeakAlpha={HALO_ALPHA}
      >
        <Feather
          name="thumbs-up"
          size={20}
          color={flashedKey === 'thumbs-up' ? FLASH_COLOR : DEFAULT_COLOR}
        />
      </TapFeedback>
      <TapFeedback
        style={styles.button}
        hitSlop={8}
        onPress={() => handleMock('thumbs-down')}
        haloPeakAlpha={HALO_ALPHA}
      >
        <Feather
          name="thumbs-down"
          size={20}
          color={flashedKey === 'thumbs-down' ? FLASH_COLOR : DEFAULT_COLOR}
        />
      </TapFeedback>
      <TapFeedback
        style={styles.button}
        hitSlop={8}
        onPress={() => handleMock('retry')}
        haloPeakAlpha={HALO_ALPHA}
      >
        <Feather
          name="rotate-cw"
          size={20}
          color={flashedKey === 'retry' ? FLASH_COLOR : DEFAULT_COLOR}
        />
      </TapFeedback>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
  },
  button: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
