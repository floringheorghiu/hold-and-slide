export type Sentence = { text: string; start: number; end: number };

// Note: abbreviations like "Dr." or "e.g." will split incorrectly—acceptable for this prototype.

export function splitSentences(text: string): Sentence[] {
  // First pass: find all sentence end positions in the original text
  const sentenceEnds: number[] = [];

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const isEndPunctuation = char === '.' || char === '!' || char === '?';

    if (isEndPunctuation) {
      const nextChar = i + 1 < text.length ? text[i + 1] : undefined;
      const isEndOfSentence = nextChar === undefined || /\s/.test(nextChar);

      if (isEndOfSentence) {
        sentenceEnds.push(i);
      }
    }
  }

  if (sentenceEnds.length === 0) {
    // No punctuation found, treat entire trimmed text as one sentence
    const trimmed = text.trim();
    if (!trimmed) {
      return [];
    }
    const start = text.indexOf(trimmed);
    const end = start + trimmed.length;
    return [{ text: trimmed, start, end }];
  }

  const sentences: Sentence[] = [];
  let prevEnd = 0;

  for (let endIdx = 0; endIdx < sentenceEnds.length; endIdx++) {
    const punctEnd = sentenceEnds[endIdx] + 1; // Position after punctuation

    // Find the start of the sentence (skip leading whitespace)
    let start = prevEnd;
    while (start < punctEnd && /\s/.test(text[start])) {
      start++;
    }

    if (start >= punctEnd) {
      // This shouldn't happen, but safety check
      prevEnd = punctEnd;
      continue;
    }

    // The sentence text is from start to punctEnd
    const sentenceText = text.slice(start, punctEnd);

    sentences.push({
      text: sentenceText,
      start,
      end: punctEnd,
    });

    prevEnd = punctEnd;
  }

  return sentences;
}

export function sentenceIndexForOffset(sentences: Sentence[], charOffset: number): number {
  if (sentences.length === 0) {
    return -1;
  }

  // Find the sentence containing the offset
  for (let i = 0; i < sentences.length; i++) {
    const sentence = sentences[i];
    // Include the character at position start to end-1
    if (charOffset >= sentence.start && charOffset < sentence.end) {
      return i;
    }
    // If offset is in the gap between sentences, return next sentence
    if (charOffset >= sentence.end && (i + 1 < sentences.length && charOffset < sentences[i + 1].start)) {
      return i + 1;
    }
  }

  // If offset is past the end or at the end, return the last sentence index
  return sentences.length - 1;
}

export function tokenOffsets(text: string): number[] {
  const offsets: number[] = [];
  let inToken = false;
  let tokenStart = 0;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const isWhitespace = /\s/.test(char);

    if (!isWhitespace && !inToken) {
      // Start of a new token
      inToken = true;
      tokenStart = i;
      offsets.push(i);
    } else if (isWhitespace && inToken) {
      // End of current token
      inToken = false;
    }
  }

  return offsets;
}
