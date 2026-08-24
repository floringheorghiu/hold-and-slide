import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSharedValue } from 'react-native-reanimated';
import * as Speech from 'expo-speech';
import { setAudioModeAsync } from 'expo-audio';
import { splitSentences, sentenceIndexForOffset } from '../lib/sentences';

export type SpeechState = 'idle' | 'playing' | 'paused';

export function useSpeech(fullText: string) {
  const sentences = useMemo(() => splitSentences(fullText), [fullText]);
  const [state, setState] = useState<SpeechState>('idle');
  const cursor = useRef(0);
  // Which sentence is currently being spoken, or -1 when there is none to
  // show. A shared value, not React state: ~700 tokens read this inside
  // their own useAnimatedStyle, and a sentence changes up to 48 times per
  // article — React state here would re-render the whole tree that often.
  // Not cleared on pause(): a paused reader still wants to see where they
  // stopped.
  const readingSentence = useSharedValue(-1);
  // Guards against expo-speech's Android quirk: Speech.stop() can itself
  // trigger onDone rather than onStopped. Without this, pausing would
  // immediately start speaking the next sentence — the opposite of pausing.
  //
  // A generation counter rather than a boolean, because Speech.stop() is async.
  // A boolean cleared by the next utterance cannot tell "cancelled" apart from
  // "cancelled, then restarted", so a late callback from the stopped utterance
  // would pass the guard and advance the cursor past the sentence just started.
  // Every utterance captures its generation; a callback whose generation is
  // stale is ignored no matter when it arrives.
  const generation = useRef(0);

  const speakFrom = useCallback(
    (index: number) => {
      if (index < 0 || index >= sentences.length) {
        cursor.current = 0;
        readingSentence.value = -1;
        setState('idle');
        return;
      }

      cursor.current = index;
      readingSentence.value = index;
      const myGeneration = ++generation.current;
      setState('playing');

      Speech.speak(sentences[index].text, {
        onDone: () => {
          if (myGeneration !== generation.current) return;
          speakFrom(cursor.current + 1);
        },
        onError: () => {
          if (myGeneration !== generation.current) return;
          setState('idle');
        },
      });
    },
    [sentences],
  );

  const play = useCallback(
    (fromIndex: number = 0) => {
      generation.current++;
      Speech.stop();
      speakFrom(fromIndex);
    },
    [speakFrom],
  );

  const pause = useCallback(() => {
    generation.current++;
    Speech.stop();
    setState('paused');
  }, []);

  const resume = useCallback(() => {
    speakFrom(cursor.current);
  }, [speakFrom]);

  const stop = useCallback(() => {
    generation.current++;
    Speech.stop();
    cursor.current = 0;
    readingSentence.value = -1;
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
    // iOS's speech audio category otherwise obeys the silent switch,
    // regardless of volume, so playback would be silent with it flipped.
    setAudioModeAsync({ playsInSilentMode: true });

    return () => {
      generation.current++;
      Speech.stop();
    };
  }, []);

  return { state, play, pause, resume, stop, playFromOffset, readingSentence };
}
