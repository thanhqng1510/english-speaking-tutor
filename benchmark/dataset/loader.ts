import { countWords, createPracticeParagraph } from "./builder";
import { EVALUATION_PARAGRAPHS } from "./evaluation-set";
import { TUNING_PARAGRAPHS } from "./tuning-set";
import type {
  DatasetPartition,
  DatasetSummary,
  LengthTier,
  ParagraphCategory,
  ParagraphFilter,
  PracticeParagraph,
  ProsodicChallengeTag,
} from "./types";

export { countWords, createPracticeParagraph };

/**
 * All 36 benchmark practice paragraphs combining the Tuning (12) and Evaluation (24) sets.
 */
export const BENCHMARK_PARAGRAPHS: readonly PracticeParagraph[] = Object.freeze([
  ...TUNING_PARAGRAPHS,
  ...EVALUATION_PARAGRAPHS,
]);

/**
 * Retrieves practice paragraphs based on optional query filter criteria.
 * Returns a defensive copy to prevent caller mutations.
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
export function getTuningSet(): readonly PracticeParagraph[] {
  return TUNING_PARAGRAPHS;
}

/**
 * Retrieves the 24 paragraphs in the Evaluation Set.
 */
export function getEvaluationSet(): readonly PracticeParagraph[] {
  return EVALUATION_PARAGRAPHS;
}

/**
 * Computes statistical summaries across partitions, categories, length tiers, and challenge tags.
 */
export function getDatasetSummary(
  paragraphs: readonly PracticeParagraph[] = BENCHMARK_PARAGRAPHS
): DatasetSummary {
  const bySet: Record<DatasetPartition, number> = {
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

  const byTag: Record<ProsodicChallengeTag, number> = {
    "long-subject": 0,
    "compound-predicate": 0,
    "numbers-dates": 0,
    dialogue: 0,
    list: 0,
    hesitation: 0,
  };

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
