import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as Speech from 'expo-speech';
import { splitSentences, sentenceIndexForOffset } from '../lib/sentences';

export type SpeechState = 'idle' | 'playing' | 'paused';

export function useSpeech(fullText: string) {
  const sentences = useMemo(() => splitSentences(fullText), [fullText]);
  const [state, setState] = useState<SpeechState>('idle');
  const cursor = useRef(0);
  // Guards against expo-speech's Android quirk: Speech.stop() can itself
  // trigger onDone rather than onStopped. Without this, pausing would
  // immediately start speaking the next sentence — the opposite of pausing.
  const cancelled = useRef(false);

  const speakFrom = useCallback(
    (index: number) => {
      if (index < 0 || index >= sentences.length) {
        cursor.current = 0;
        setState('idle');
        return;
      }

      cursor.current = index;
      cancelled.current = false;
      setState('playing');

      Speech.speak(sentences[index].text, {
        onDone: () => {
          if (cancelled.current) return;
          speakFrom(cursor.current + 1);
        },
        onError: () => {
          if (cancelled.current) return;
          setState('idle');
        },
      });
    },
    [sentences],
  );

  const play = useCallback(
    (fromIndex: number = 0) => {
      cancelled.current = true;
      Speech.stop();
      speakFrom(fromIndex);
    },
    [speakFrom],
  );

  const pause = useCallback(() => {
    cancelled.current = true;
    Speech.stop();
    setState('paused');
  }, []);

  const resume = useCallback(() => {
    speakFrom(cursor.current);
  }, [speakFrom]);

  const stop = useCallback(() => {
    cancelled.current = true;
    Speech.stop();
    cursor.current = 0;
    setState('idle');
  }, []);

  const playFromOffset = useCallback(
    (charOffset: number) => {
      const index = sentenceIndexForOffset(sentences, charOffset);
      if (index < 0) return;
      play(index);
    },
    [sentences, play],
  );

  useEffect(() => {
    return () => {
      cancelled.current = true;
      Speech.stop();
    };
  }, []);

  return { state, play, pause, resume, stop, playFromOffset };
}
