import { splitSentences, sentenceIndexForOffset, tokenOffsets, Sentence } from '../sentences';

describe('splitSentences', () => {
  it('splits a simple three-sentence string', () => {
    const text = 'First sentence. Second sentence! Third sentence?';
    const result = splitSentences(text);
    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({ text: 'First sentence.', start: 0, end: 15 });
    expect(result[1]).toEqual({ text: 'Second sentence!', start: 16, end: 32 });
    expect(result[2]).toEqual({ text: 'Third sentence?', start: 33, end: 48 });
  });

  it('handles a string with no final punctuation', () => {
    const text = 'Single sentence without punctuation';
    const result = splitSentences(text);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ text: 'Single sentence without punctuation', start: 0, end: 35 });
  });

  it('distinguishes question and exclamation marks', () => {
    const text = 'Is this a question? Yes, it is!';
    const result = splitSentences(text);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ text: 'Is this a question?', start: 0, end: 19 });
    expect(result[1]).toEqual({ text: 'Yes, it is!', start: 20, end: 31 });
  });

  it('handles multiple spaces between sentences', () => {
    const text = 'First.   Second.';
    const result = splitSentences(text);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ text: 'First.', start: 0, end: 6 });
    expect(result[1]).toEqual({ text: 'Second.', start: 9, end: 16 });
  });

  it('handles newlines as whitespace', () => {
    const text = 'First sentence.\nSecond sentence.';
    const result = splitSentences(text);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ text: 'First sentence.', start: 0, end: 15 });
    expect(result[1]).toEqual({ text: 'Second sentence.', start: 16, end: 32 });
  });

  it('excludes leading and trailing whitespace from sentence text and bounds', () => {
    const text = '  First sentence.   Second sentence.  ';
    const result = splitSentences(text);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ text: 'First sentence.', start: 2, end: 17 });
    expect(result[1]).toEqual({ text: 'Second sentence.', start: 20, end: 36 });
  });

  it('returns an empty array for an empty string', () => {
    const result = splitSentences('');
    expect(result).toEqual([]);
  });

  it('returns an empty array for whitespace-only input', () => {
    const result = splitSentences('   \n  \t  ');
    expect(result).toEqual([]);
  });

  it('keeps terminating punctuation attached to the sentence', () => {
    const text = 'One. Two? Three!';
    const result = splitSentences(text);
    expect(result[0].text).toBe('One.');
    expect(result[1].text).toBe('Two?');
    expect(result[2].text).toBe('Three!');
  });

  it('handles mixed punctuation and spacing', () => {
    const text = 'Hello world!   How are you? I am fine.';
    const result = splitSentences(text);
    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({ text: 'Hello world!', start: 0, end: 12 });
    expect(result[1]).toEqual({ text: 'How are you?', start: 15, end: 27 });
    expect(result[2]).toEqual({ text: 'I am fine.', start: 28, end: 38 });
  });
});

describe('sentenceIndexForOffset', () => {
  const sentences: Sentence[] = [
    { text: 'First.', start: 0, end: 6 },
    { text: 'Second.', start: 7, end: 14 },
    { text: 'Third.', start: 15, end: 21 },
  ];

  it('returns the index of a sentence containing the offset', () => {
    expect(sentenceIndexForOffset(sentences, 0)).toBe(0);
    expect(sentenceIndexForOffset(sentences, 3)).toBe(0);
    expect(sentenceIndexForOffset(sentences, 5)).toBe(0);
  });

  it('returns the index of the second sentence for its offset', () => {
    expect(sentenceIndexForOffset(sentences, 7)).toBe(1);
    expect(sentenceIndexForOffset(sentences, 10)).toBe(1);
    expect(sentenceIndexForOffset(sentences, 13)).toBe(1);
  });

  it('returns the index of the third sentence for its offset', () => {
    expect(sentenceIndexForOffset(sentences, 15)).toBe(2);
    expect(sentenceIndexForOffset(sentences, 18)).toBe(2);
    expect(sentenceIndexForOffset(sentences, 20)).toBe(2);
  });

  it('returns the index of the next sentence when offset lands in whitespace gap', () => {
    expect(sentenceIndexForOffset(sentences, 6)).toBe(1); // gap between sentence 0 and 1
    expect(sentenceIndexForOffset(sentences, 14)).toBe(2); // gap between sentence 1 and 2
  });

  it('returns the last sentence index when offset is past the end', () => {
    expect(sentenceIndexForOffset(sentences, 100)).toBe(2);
  });

  it('returns -1 for an empty array', () => {
    expect(sentenceIndexForOffset([], 0)).toBe(-1);
  });

  it('handles a single sentence', () => {
    const single: Sentence[] = [{ text: 'Only.', start: 0, end: 5 }];
    expect(sentenceIndexForOffset(single, 0)).toBe(0);
    expect(sentenceIndexForOffset(single, 2)).toBe(0);
    expect(sentenceIndexForOffset(single, 4)).toBe(0);
    expect(sentenceIndexForOffset(single, 5)).toBe(0); // at end, still returns last
    expect(sentenceIndexForOffset(single, 100)).toBe(0);
  });

  it('handles offset at exact sentence boundaries', () => {
    // offset at start of first sentence
    expect(sentenceIndexForOffset(sentences, 0)).toBe(0);
    // offset at end of first sentence
    expect(sentenceIndexForOffset(sentences, 5)).toBe(0);
  });
});

describe('tokenOffsets', () => {
  it('returns starting indices of tokens in a simple string', () => {
    const result = tokenOffsets('Hi there');
    expect(result).toEqual([0, 3]);
  });

  it('handles a single token', () => {
    const result = tokenOffsets('Hello');
    expect(result).toEqual([0]);
  });

  it('handles double spaces and produces no empty tokens', () => {
    const result = tokenOffsets('Hi  there');
    expect(result).toEqual([0, 4]);
  });

  it('handles leading whitespace', () => {
    const result = tokenOffsets('  Hello world');
    expect(result).toEqual([2, 8]);
  });

  it('handles trailing whitespace', () => {
    const result = tokenOffsets('Hello world  ');
    expect(result).toEqual([0, 6]);
  });

  it('handles tabs and newlines as whitespace', () => {
    const result = tokenOffsets('Hello\tworld\nfoo');
    expect(result).toEqual([0, 6, 12]);
  });

  it('returns empty array for empty or whitespace-only input', () => {
    expect(tokenOffsets('')).toEqual([]);
    expect(tokenOffsets('   ')).toEqual([]);
    expect(tokenOffsets('\n\t ')).toEqual([]);
  });

  it('handles multiple spaces between tokens', () => {
    const result = tokenOffsets('one   two   three');
    expect(result).toEqual([0, 6, 12]);
  });

  it('handles a longer sentence', () => {
    const result = tokenOffsets('The quick brown fox');
    expect(result).toEqual([0, 4, 10, 16]);
  });
});
