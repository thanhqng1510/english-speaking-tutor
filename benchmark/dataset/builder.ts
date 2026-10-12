import type { PracticeParagraph } from "./types";

/**
 * Counts words by splitting on consecutive whitespace after trimming.
 */
export function countWords(text: string): number {
  const trimmed = text.trim();
  if (trimmed.length === 0) return 0;
  return trimmed.split(/\s+/).length;
}

/**
 * Factory helper to construct a PracticeParagraph with automatically calculated
 * characterCount and wordCount to avoid manual duplication and drift.
 */
export function createPracticeParagraph(
  input: Omit<PracticeParagraph, "characterCount" | "wordCount">
): PracticeParagraph {
  return Object.freeze({
    ...input,
    characterCount: input.text.length,
    wordCount: countWords(input.text),
  });
}
