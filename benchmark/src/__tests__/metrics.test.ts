import { describe, expect, it } from "vitest";
import { CANDIDATE_MODELS } from "../candidates";
import {
  aggregateCandidateMetrics,
  calculateCallCost,
  calculateLearnerCostProjections,
  calculatePercentile,
  computeLatencyStats,
  computeServerLatencyStats,
} from "../metrics";
import type { ModelInvocationResult } from "../types";

describe("benchmark metrics and cost calculations", () => {
  describe("calculateCallCost", () => {
    it("calculates cost accurately with uncached and completion tokens", () => {
      // Rates: $0.10 input / 1M, $0.50 output / 1M, $0.01 cached / 1M
      const rates = {
        inputPer1M: 0.1,
        outputPer1M: 0.5,
        cachedInputPer1M: 0.01,
      };

      const tokens = {
        promptTokens: 1000,
        completionTokens: 200,
        cachedTokens: 0,
      };

      // 1000 * 0.10 / 1M = 0.00010
      // 200 * 0.50 / 1M  = 0.00010
      // Total = 0.00020
      const cost = calculateCallCost(rates, tokens);
      expect(cost).toBeCloseTo(0.0002, 6);
    });

    it("applies cached token discounts accurately", () => {
      const rates = {
        inputPer1M: 0.1,
        outputPer1M: 0.5,
        cachedInputPer1M: 0.01, // 90% discount
      };

      const tokens = {
        promptTokens: 1000,
        completionTokens: 200,
        cachedTokens: 800, // 800 cached, 200 uncached
      };

      // Uncached: 200 * 0.10 / 1M = 0.000020
      // Cached:   800 * 0.01 / 1M = 0.000008
      // Output:   200 * 0.50 / 1M = 0.000100
      // Total = 0.000128
      const cost = calculateCallCost(rates, tokens);
      expect(cost).toBeCloseTo(0.000128, 6);
    });
  });

  describe("percentiles & latency stats", () => {
    it("calculates p50 and p95 percentiles", () => {
      const values = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
      const p50 = calculatePercentile(values, 50);
      const p95 = calculatePercentile(values, 95);

      expect(p50).toBe(50);
      expect(p95).toBe(100);
    });

    it("computes complete latency stats", () => {
      const values = [100, 120, 130, 140, 200];
      const stats = computeLatencyStats(values);

      expect(stats.min).toBe(100);
      expect(stats.max).toBe(200);
      expect(stats.p50).toBe(130);
      expect(stats.mean).toBe(138);
    });

    it("handles nulls in server latency stats", () => {
      const values = [null, 100, null, 120, 140];
      const stats = computeServerLatencyStats(values);

      expect(stats.p50).toBe(120);
      expect(stats.mean).toBe(120);
      expect(stats.min).toBe(100);
      expect(stats.max).toBe(140);
    });

    it("returns nulls when no server timings exist", () => {
      const stats = computeServerLatencyStats([null, null]);
      expect(stats.p50).toBeNull();
      expect(stats.mean).toBeNull();
    });
  });

  describe("aggregateCandidateMetrics", () => {
    const config = CANDIDATE_MODELS["gpt-6-luna"];

    it("computes aggregate pass rate and cost per 1k runs", () => {
      const mockResults: ModelInvocationResult[] = [
        {
          candidateId: "gpt-6-luna",
          paragraphId: "p1",
          paragraphTitle: "Title 1",
          lengthTier: "short",
          characterCount: 150,
          wordCount: 30,
          rawResponse: "{}",
          parsed: null,
          validation: {
            isValid: true,
            schemaValid: true,
            focusWordValid: true,
            textIntegrityValid: true,
            chunkLengthBoundsValid: true,
            chunkLengthIssues: [],
            errors: [],
          },
          roundTripMs: 180,
          serverProcessingMs: 120,
          tokens: { promptTokens: 150, completionTokens: 60, cachedTokens: 0 },
          costUsd: 0.000045,
          error: null,
        },
        {
          candidateId: "gpt-6-luna",
          paragraphId: "p2",
          paragraphTitle: "Title 2",
          lengthTier: "medium",
          characterCount: 300,
          wordCount: 60,
          rawResponse: "{}",
          parsed: null,
          validation: {
            isValid: false,
            schemaValid: true,
            focusWordValid: false,
            textIntegrityValid: true,
            chunkLengthBoundsValid: true,
            chunkLengthIssues: [],
            errors: ["Focus Word missing"],
          },
          roundTripMs: 220,
          serverProcessingMs: 150,
          tokens: { promptTokens: 250, completionTokens: 110, cachedTokens: 0 },
          costUsd: 0.00008,
          error: null,
        },
      ];

      const metrics = aggregateCandidateMetrics(config, mockResults);
      expect(metrics.totalRuns).toBe(2);
      expect(metrics.passedRuns).toBe(1);
      expect(metrics.passRatePercent).toBe(50);
      expect(metrics.latencyMs.p50).toBe(180);
      expect(metrics.serverLatencyMs.p50).toBe(120);
      expect(metrics.costPer1kRunsUsd).toBeCloseTo(0.0625, 3);
    });
  });

  describe("calculateLearnerCostProjections", () => {
    const config = CANDIDATE_MODELS["phi-4-mini-instruct"];

    it("projects costs across 4 tiers and active learner volumes", () => {
      const proj = calculateLearnerCostProjections(config, []);

      expect(proj.tiers).toHaveLength(4);
      expect(proj.tiers.map((t) => t.tier)).toEqual(["short", "medium", "long", "ceiling"]);
      for (const t of proj.tiers) {
        expect(t.costPerSessionUsd).toBeGreaterThan(0);
      }

      expect(proj.volumes).toHaveLength(4);
      expect(proj.volumes.map((v) => v.activeLearners)).toEqual([100, 500, 1000, 5000]);
      for (const v of proj.volumes) {
        expect(v.monthlyCostUsd).toBeGreaterThan(0);
        expect(v.sessionsPerMonth).toBe(v.activeLearners * 150);
      }
    });
  });
});
