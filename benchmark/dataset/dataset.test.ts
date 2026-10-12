import { describe, expect, it } from "vitest";
import { MAX_PRACTICE_CHARACTERS } from "../../src/features/practice/model/practice-session";
import { EVALUATION_PARAGRAPHS } from "./evaluation-set";
import {
  BENCHMARK_PARAGRAPHS,
  countWords,
  getDatasetSummary,
  getEvaluationSet,
  getParagraphById,
  getParagraphs,
  getTuningSet,
} from "./loader";
import { TUNING_PARAGRAPHS } from "./tuning-set";
import type { LengthTier, ParagraphCategory, ProsodicChallengeTag } from "./types";

describe("Benchmark Dataset Specification & Invariants", () => {
  it("contains exactly 36 paragraphs total with 12 tuning and 24 evaluation items", () => {
    expect(BENCHMARK_PARAGRAPHS).toHaveLength(36);
    expect(TUNING_PARAGRAPHS).toHaveLength(12);
    expect(EVALUATION_PARAGRAPHS).toHaveLength(24);

    expect(getTuningSet()).toHaveLength(12);
    expect(getEvaluationSet()).toHaveLength(24);
  });

  it("assigns unique IDs to every paragraph", () => {
    const ids = BENCHMARK_PARAGRAPHS.map((p) => p.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(36);
  });

  it("maintains an exact 1:1:1 category balance across both sets", () => {
    const categories: ParagraphCategory[] = ["exam", "everyday", "learner"];

    for (const category of categories) {
      const tuningCount = TUNING_PARAGRAPHS.filter(
        (p) => p.category === category
      ).length;
      const evalCount = EVALUATION_PARAGRAPHS.filter(
        (p) => p.category === category
      ).length;
      const totalCount = BENCHMARK_PARAGRAPHS.filter(
        (p) => p.category === category
      ).length;

      expect(tuningCount).toBe(4);
      expect(evalCount).toBe(8);
      expect(totalCount).toBe(12);
    }
  });

  it("distributes length tiers correctly across Tuning (3/6/3) and Evaluation (6/10/6/2)", () => {
    const tuningTiers: Record<LengthTier, number> = {
      short: 0,
      medium: 0,
      long: 0,
      ceiling: 0,
    };
    for (const p of TUNING_PARAGRAPHS) {
      tuningTiers[p.lengthTier]++;
    }
    expect(tuningTiers).toEqual({
      short: 3,
      medium: 6,
      long: 3,
      ceiling: 0,
    });

    const evalTiers: Record<LengthTier, number> = {
      short: 0,
      medium: 0,
      long: 0,
      ceiling: 0,
    };
    for (const p of EVALUATION_PARAGRAPHS) {
      evalTiers[p.lengthTier]++;
    }
    expect(evalTiers).toEqual({
      short: 6,
      medium: 10,
      long: 6,
      ceiling: 2,
    });
  });

  it("strictly enforces character bounds per length tier and aligns with MAX_PRACTICE_CHARACTERS", () => {
    const bounds: Record<LengthTier, { min: number; max: number }> = {
      short: { min: 80, max: 180 },
      medium: { min: 200, max: 350 },
      long: { min: 400, max: 500 },
      ceiling: { min: 1000, max: 1200 },
    };

    for (const paragraph of BENCHMARK_PARAGRAPHS) {
      const tierBound = bounds[paragraph.lengthTier];
      expect(paragraph.characterCount).toBeGreaterThanOrEqual(tierBound.min);
      expect(paragraph.characterCount).toBeLessThanOrEqual(tierBound.max);
      expect(paragraph.text.length).toBe(paragraph.characterCount);
      expect(paragraph.characterCount).toBeLessThanOrEqual(MAX_PRACTICE_CHARACTERS);
    }
  });

  it("accurately records characterCount and wordCount for all items", () => {
    for (const p of BENCHMARK_PARAGRAPHS) {
      expect(p.characterCount).toBe(p.text.length);
      expect(p.wordCount).toBe(countWords(p.text));
      expect(p.wordCount).toBeGreaterThan(0);
    }
  });

  it("adheres to plain domain language with no forbidden linguistics jargon", () => {
    const forbiddenPatterns = [
      /thought[ -]group/i,
      /nuclear[ -]stress/i,
      /breath[ -]group/i,
    ];

    for (const p of BENCHMARK_PARAGRAPHS) {
      for (const pattern of forbiddenPatterns) {
        expect(p.text).not.toMatch(pattern);
        expect(p.title).not.toMatch(pattern);
      }
    }
  });

  it("covers all 6 deliberate spoken challenge tags across both Tuning and Evaluation sets", () => {
    const expectedTags: ProsodicChallengeTag[] = [
      "long-subject",
      "compound-predicate",
      "numbers-dates",
      "dialogue",
      "list",
      "hesitation",
    ];

    for (const tag of expectedTags) {
      const tuningMatches = TUNING_PARAGRAPHS.filter((p) =>
        p.tags.includes(tag)
      );
      const evalMatches = EVALUATION_PARAGRAPHS.filter((p) =>
        p.tags.includes(tag)
      );

      expect(tuningMatches.length).toBeGreaterThan(0);
      expect(evalMatches.length).toBeGreaterThan(0);
    }

    // Every paragraph has at least one tag
    for (const p of BENCHMARK_PARAGRAPHS) {
      expect(p.tags.length).toBeGreaterThanOrEqual(1);
    }
  });
});

describe("Benchmark Dataset Query Loader API", () => {
  it("filters paragraphs by set", () => {
    const tuning = getParagraphs({ set: "tuning" });
    expect(tuning).toHaveLength(12);
    expect(tuning.every((p) => p.set === "tuning")).toBe(true);

    const evaluation = getParagraphs({ set: "evaluation" });
    expect(evaluation).toHaveLength(24);
    expect(evaluation.every((p) => p.set === "evaluation")).toBe(true);
  });

  it("filters paragraphs by category", () => {
    const exam = getParagraphs({ category: "exam" });
    expect(exam).toHaveLength(12);
    expect(exam.every((p) => p.category === "exam")).toBe(true);

    const everyday = getParagraphs({ category: "everyday" });
    expect(everyday).toHaveLength(12);

    const learner = getParagraphs({ category: "learner" });
    expect(learner).toHaveLength(12);
  });

  it("filters paragraphs by length tier", () => {
    const shortItems = getParagraphs({ lengthTier: "short" });
    expect(shortItems).toHaveLength(9); // 3 tuning + 6 eval

    const mediumItems = getParagraphs({ lengthTier: "medium" });
    expect(mediumItems).toHaveLength(16); // 6 tuning + 10 eval

    const longItems = getParagraphs({ lengthTier: "long" });
    expect(longItems).toHaveLength(9); // 3 tuning + 6 eval

    const ceilingItems = getParagraphs({ lengthTier: "ceiling" });
    expect(ceilingItems).toHaveLength(2); // 0 tuning + 2 eval
  });

  it("filters paragraphs by single tag", () => {
    const dialogueParagraphs = getParagraphs({ tag: "dialogue" });
    expect(dialogueParagraphs.length).toBeGreaterThan(0);
    expect(
      dialogueParagraphs.every((p) => p.tags.includes("dialogue"))
    ).toBe(true);
  });

  it("filters paragraphs by multiple tags (conjunction / AND match)", () => {
    const multiTagParagraphs = getParagraphs({
      tags: ["compound-predicate", "list"],
    });
    expect(multiTagParagraphs.length).toBeGreaterThan(0);
    for (const p of multiTagParagraphs) {
      expect(p.tags).toContain("compound-predicate");
      expect(p.tags).toContain("list");
    }
  });

  it("filters by character and word count bounds", () => {
    const boundedChars = getParagraphs({ minCharacters: 1000, maxCharacters: 1200 });
    expect(boundedChars).toHaveLength(2);

    const boundedWords = getParagraphs({ minWords: 150 });
    expect(boundedWords).toHaveLength(2);
  });

  it("combines multiple filter criteria", () => {
    const results = getParagraphs({
      set: "tuning",
      category: "exam",
      lengthTier: "medium",
    });
    expect(results).toHaveLength(2);
    expect(results[0].id).toBe("tune-exam-02");
    expect(results[1].id).toBe("tune-exam-03");
  });

  it("looks up paragraphs by id correctly", () => {
    const item = getParagraphById("tune-exam-01");
    expect(item).toBeDefined();
    expect(item?.title).toBe("Renewable energy transition");

    const missing = getParagraphById("non-existent-id");
    expect(missing).toBeUndefined();
  });

  it("produces an accurate dataset summary report", () => {
    const summary = getDatasetSummary();
    expect(summary.totalCount).toBe(36);
    expect(summary.bySet).toEqual({
      tuning: 12,
      evaluation: 24,
    });
    expect(summary.byCategory).toEqual({
      exam: 12,
      everyday: 12,
      learner: 12,
    });
    expect(summary.byTier).toEqual({
      short: 9,
      medium: 16,
      long: 9,
      ceiling: 2,
    });
    expect(summary.byTag["long-subject"]).toBe(13);
    expect(summary.byTag["compound-predicate"]).toBe(17);
    expect(summary.byTag["numbers-dates"]).toBe(12);
    expect(summary.byTag["dialogue"]).toBe(12);
    expect(summary.byTag["list"]).toBe(11);
    expect(summary.byTag["hesitation"]).toBe(10);
  });

  it("returns immutable or defensive copies from queries", () => {
    const paragraphs = getParagraphs();
    paragraphs.pop();
    expect(BENCHMARK_PARAGRAPHS).toHaveLength(36);
    expect(getParagraphs()).toHaveLength(36);
  });
});
