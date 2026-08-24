import { tokenSentenceIndices } from '../tokenSentences';

describe('tokenSentenceIndices', () => {
  it('maps tokens in a two-sentence string to their sentence indices', () => {
    const text = 'One two. Three four five.';
    const result = tokenSentenceIndices(text);
    expect(result).toEqual([0, 0, 1, 1, 1]);
  });

  it('handles a single sentence with no terminating punctuation', () => {
    const text = 'Single sentence without punctuation';
    const result = tokenSentenceIndices(text);
    expect(result).toHaveLength(4);
    expect(result).toEqual([0, 0, 0, 0]);
  });

  it('correctly maps boundary tokens between three sentences', () => {
    const text = 'First token. Second sentence here. Last sentence.';
    const result = tokenSentenceIndices(text);
    // First: [0, 0], Second: [1, 1, 1], Last: [2, 2]
    expect(result).toEqual([0, 0, 1, 1, 1, 2, 2]);
    // Verify boundaries: last token of sentence 0 is 0, first token of sentence 1 is 1
    expect(result[1]).toBe(0);
    expect(result[2]).toBe(1);
    // Last token of sentence 1 is 1, first token of sentence 2 is 2
    expect(result[4]).toBe(1);
    expect(result[5]).toBe(2);
  });

  it('handles newlines between sentences', () => {
    const text = 'First sentence.\nSecond sentence.';
    const result = tokenSentenceIndices(text);
    expect(result).toEqual([0, 0, 1, 1]);
  });

  it('returns an empty array for empty string', () => {
    const result = tokenSentenceIndices('');
    expect(result).toEqual([]);
  });

  it('returns an empty array for whitespace-only string', () => {
    const result = tokenSentenceIndices('   \n  \t  ');
    expect(result).toEqual([]);
  });

  it('maintains length invariant: result length equals token count', () => {
    const text = 'One two three. Four five. Six.';
    const result = tokenSentenceIndices(text);
    // Manual token count: "One", "two", "three", "Four", "five", "Six" = 6 tokens
    expect(result).toHaveLength(6);
    const tokenCount = text.split(/\s+/).filter(t => t.length > 0).length;
    expect(result.length).toBe(tokenCount);
  });

  it('correctly maps a question and exclamation mark sentence', () => {
    const text = 'Is this a question? Yes it is! Absolutely.';
    const result = tokenSentenceIndices(text);
    // "Is", "this", "a", "question?" → [0, 0, 0, 0]
    // "Yes", "it", "is!" → [1, 1, 1]
    // "Absolutely." → [2]
    expect(result).toEqual([0, 0, 0, 0, 1, 1, 1, 2]);
  });

  it('handles multiple spaces between tokens and sentences', () => {
    const text = 'One  two.   Three    four.';
    const result = tokenSentenceIndices(text);
    // Tokens: "One", "two", "Three", "four"
    expect(result).toEqual([0, 0, 1, 1]);
  });

  it('handles leading and trailing whitespace', () => {
    const text = '  First token. Second token.  ';
    const result = tokenSentenceIndices(text);
    // Tokens: "First", "token", "Second", "token"
    expect(result).toEqual([0, 0, 1, 1]);
  });

  it('maps all tokens in a multi-sentence string correctly', () => {
    const text = 'The quick brown fox. Jumps over the lazy dog. Runs fast.';
    const result = tokenSentenceIndices(text);
    // Sentence 0: "The", "quick", "brown", "fox" → [0, 0, 0, 0]
    // Sentence 1: "Jumps", "over", "the", "lazy", "dog" → [1, 1, 1, 1, 1]
    // Sentence 2: "Runs", "fast" → [2, 2]
    expect(result).toEqual([0, 0, 0, 0, 1, 1, 1, 1, 1, 2, 2]);
  });
});
