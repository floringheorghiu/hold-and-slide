import { splitSentences, sentenceIndexForOffset, tokenOffsets } from './sentences';

export function tokenSentenceIndices(text: string): number[] {
  const offsets = tokenOffsets(text);

  if (offsets.length === 0) {
    return [];
  }

  const sentences = splitSentences(text);

  if (sentences.length === 0) {
    return [];
  }

  // Map each token offset to its sentence index
  const indices: number[] = [];
  for (let i = 0; i < offsets.length; i++) {
    const tokenOffset = offsets[i];
    const sentenceIndex = sentenceIndexForOffset(sentences, tokenOffset);
    indices.push(sentenceIndex);
  }

  return indices;
}
