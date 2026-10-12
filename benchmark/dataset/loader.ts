import { EVALUATION_PARAGRAPHS } from "./evaluation-set";
import { TUNING_PARAGRAPHS } from "./tuning-set";
import type {
  DatasetSet,
  DatasetSummary,
  LengthTier,
  ParagraphCategory,
  ParagraphFilter,
  PracticeParagraph,
} from "./types";

/**
 * All 36 benchmark practice paragraphs combining the Tuning (12) and Evaluation (24) sets.
 */
export const BENCHMARK_PARAGRAPHS: readonly PracticeParagraph[] = Object.freeze([
  ...TUNING_PARAGRAPHS,
  ...EVALUATION_PARAGRAPHS,
]);

/**
 * Counts words by splitting on consecutive whitespace after trimming.
 */
export function countWords(text: string): number {
  const trimmed = text.trim();
  if (trimmed.length === 0) return 0;
  return trimmed.split(/\s+/).length;
}

/**
 * Retrieves practice paragraphs based on optional query filter criteria.
 * Returns a defensive copy to prevent mutations.
 */
export function getParagraphs(
  filter: ParagraphFilter = {}
): PracticeParagraph[] {
  return BENCHMARK_PARAGRAPHS.filter((paragraph) => {
    if (filter.set !== undefined && paragraph.set !== filter.set) {
      return false;
    }

    if (
      filter.category !== undefined &&
      paragraph.category !== filter.category
    ) {
      return false;
    }

    if (
      filter.lengthTier !== undefined &&
      paragraph.lengthTier !== filter.lengthTier
    ) {
      return false;
    }

    if (filter.tag !== undefined && !paragraph.tags.includes(filter.tag)) {
      return false;
    }

    if (filter.tags !== undefined && filter.tags.length > 0) {
      const hasAllTags = filter.tags.every((t) => paragraph.tags.includes(t));
      if (!hasAllTags) {
        return false;
      }
    }

    if (
      filter.minCharacters !== undefined &&
      paragraph.characterCount < filter.minCharacters
    ) {
      return false;
    }

    if (
      filter.maxCharacters !== undefined &&
      paragraph.characterCount > filter.maxCharacters
    ) {
      return false;
    }

    if (
      filter.minWords !== undefined &&
      paragraph.wordCount < filter.minWords
    ) {
      return false;
    }

    if (
      filter.maxWords !== undefined &&
      paragraph.wordCount > filter.maxWords
    ) {
      return false;
    }

    return true;
  });
}

/**
 * Finds a single practice paragraph by its unique ID.
 */
export function getParagraphById(id: string): PracticeParagraph | undefined {
  return BENCHMARK_PARAGRAPHS.find((p) => p.id === id);
}

/**
 * Retrieves the 12 paragraphs in the Tuning Set.
 */
export function getTuningSet(): PracticeParagraph[] {
  return getParagraphs({ set: "tuning" });
}

/**
 * Retrieves the 24 paragraphs in the Evaluation Set.
 */
export function getEvaluationSet(): PracticeParagraph[] {
  return getParagraphs({ set: "evaluation" });
}

/**
 * Computes statistical summaries across sets, categories, length tiers, and challenge tags.
 */
export function getDatasetSummary(
  paragraphs: readonly PracticeParagraph[] = BENCHMARK_PARAGRAPHS
): DatasetSummary {
  const bySet: Record<DatasetSet, number> = {
    tuning: 0,
    evaluation: 0,
  };

  const byCategory: Record<ParagraphCategory, number> = {
    exam: 0,
    everyday: 0,
    learner: 0,
  };

  const byTier: Record<LengthTier, number> = {
    short: 0,
    medium: 0,
    long: 0,
    ceiling: 0,
  };

  const byTag: Record<string, number> = {};

  for (const p of paragraphs) {
    bySet[p.set] = (bySet[p.set] || 0) + 1;
    byCategory[p.category] = (byCategory[p.category] || 0) + 1;
    byTier[p.lengthTier] = (byTier[p.lengthTier] || 0) + 1;

    for (const tag of p.tags) {
      byTag[tag] = (byTag[tag] || 0) + 1;
    }
  }

  return {
    totalCount: paragraphs.length,
    bySet,
    byCategory,
    byTier,
    byTag,
  };
}
