import {
  ALL_LENGTH_TIERS,
  type CandidateAggregateMetrics,
  type CandidateCostProjection,
  type CandidateModelConfig,
  type LatencyStats,
  type LearnerCostTierProjection,
  type LengthTier,
  type ModelInvocationResult,
  type RateCard,
  type TokenStats,
  type TokenUsage,
} from "./types";

/**
 * Calculates dollar cost for an invocation using the model's 2026 Azure rate card.
 */
export function calculateCallCost(rates: RateCard, tokens: TokenUsage): number {
  const cached = Math.min(tokens.promptTokens, Math.max(0, tokens.cachedTokens));
  const uncachedPrompt = Math.max(0, tokens.promptTokens - cached);

  const uncachedCost = (uncachedPrompt / 1_000_000) * rates.inputPer1M;
  const cachedCost = (cached / 1_000_000) * rates.cachedInputPer1M;
  const completionCost = (tokens.completionTokens / 1_000_000) * rates.outputPer1M;

  return uncachedCost + cachedCost + completionCost;
}

/**
 * Calculates a percentile (0 to 100) from a sorted array of numbers using the nearest-rank method.
 */
export function calculatePercentile(sortedValues: number[], percentile: number): number {
  if (sortedValues.length === 0) return 0;
  const p = Math.max(0, Math.min(100, percentile)) / 100;
  const rank = Math.ceil(p * sortedValues.length);
  const index = Math.max(0, Math.min(sortedValues.length - 1, rank - 1));
  return sortedValues[index];
}

/**
 * Computes standard latency statistics (min, max, mean, p50, p95) from numeric values,
 * ignoring null or invalid values. Returns null if no valid numeric values exist.
 */
export function computeLatencyStats(
  values: readonly (number | null | undefined)[]
): LatencyStats | null {
  const valid = values.filter((v): v is number => typeof v === "number" && !isNaN(v));
  if (valid.length === 0) {
    return null;
  }

  const sorted = [...valid].sort((a, b) => a - b);
  const sum = sorted.reduce((acc, val) => acc + val, 0);
  const mean = Math.round((sum / sorted.length) * 10) / 10;
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const p50 = Math.round(calculatePercentile(sorted, 50));
  const p95 = Math.round(calculatePercentile(sorted, 95));

  return { min, max, mean, p50, p95 };
}

/**
 * Computes token aggregate statistics.
 */
export function computeTokenStats(results: readonly ModelInvocationResult[]): TokenStats {
  const runsWithTokens = results.filter(
    (r): r is ModelInvocationResult & { tokens: TokenUsage } => r.tokens !== null
  );

  if (runsWithTokens.length === 0) {
    return {
      avgPromptTokens: 0,
      avgCompletionTokens: 0,
      avgCachedTokens: 0,
      totalPromptTokens: 0,
      totalCompletionTokens: 0,
      totalCachedTokens: 0,
    };
  }

  let totalPrompt = 0;
  let totalCompletion = 0;
  let totalCached = 0;

  for (const r of runsWithTokens) {
    totalPrompt += r.tokens.promptTokens;
    totalCompletion += r.tokens.completionTokens;
    totalCached += r.tokens.cachedTokens;
  }

  const count = runsWithTokens.length;
  return {
    avgPromptTokens: Math.round(totalPrompt / count),
    avgCompletionTokens: Math.round(totalCompletion / count),
    avgCachedTokens: Math.round(totalCached / count),
    totalPromptTokens: totalPrompt,
    totalCompletionTokens: totalCompletion,
    totalCachedTokens: totalCached,
  };
}

/**
 * Aggregates all model invocation results for a candidate into a scorecard summary.
 */
export function aggregateCandidateMetrics(
  config: CandidateModelConfig,
  results: readonly ModelInvocationResult[]
): CandidateAggregateMetrics {
  const totalRuns = results.length;
  const passedRuns = results.filter((r) => r.validation?.isValid === true).length;
  const passRatePercent =
    totalRuns > 0 ? Math.round((passedRuns / totalRuns) * 1000) / 10 : 0;

  const latencies = results.map((r) => r.roundTripMs);
  const serverLatencies = results.map((r) => r.serverProcessingMs);

  const latencyMs =
    computeLatencyStats(latencies) ?? { min: 0, max: 0, mean: 0, p50: 0, p95: 0 };
  const serverLatencyMs = computeLatencyStats(serverLatencies);
  const tokenStats = computeTokenStats(results);

  const totalCostUsd = results.reduce((acc, r) => acc + r.costUsd, 0);
  const costPer1kRunsUsd =
    totalRuns > 0 ? Math.round((totalCostUsd / totalRuns) * 1000 * 10000) / 10000 : 0;

  return {
    candidateId: config.id,
    candidateName: config.name,
    provider: config.provider,
    deploymentType: config.deploymentType,
    totalRuns,
    passedRuns,
    passRatePercent,
    latencyMs,
    serverLatencyMs,
    tokenStats,
    totalCostUsd: Math.round(totalCostUsd * 100000) / 100000,
    costPer1kRunsUsd,
  };
}

/**
 * Standard character and estimated token profiles for the 4 Length Tiers.
 */
export const TIER_PROFILES: Record<
  LengthTier,
  { averageCharacters: number; defaultPromptTokens: number; defaultCompletionTokens: number }
> = {
  short: { averageCharacters: 150, defaultPromptTokens: 160, defaultCompletionTokens: 60 },
  medium: { averageCharacters: 300, defaultPromptTokens: 230, defaultCompletionTokens: 110 },
  long: { averageCharacters: 500, defaultPromptTokens: 310, defaultCompletionTokens: 180 },
  ceiling: { averageCharacters: 1200, defaultPromptTokens: 560, defaultCompletionTokens: 420 },
};

/**
 * Calculates Learner Cost Projections across length tiers.
 */
export function calculateLearnerCostProjections(
  config: CandidateModelConfig,
  results: readonly ModelInvocationResult[]
): CandidateCostProjection {
  const tiers: LearnerCostTierProjection[] = ALL_LENGTH_TIERS.map((tier) => {
      const tierResults = results.filter(
        (r): r is ModelInvocationResult & { tokens: TokenUsage } =>
          r.lengthTier === tier && r.tokens !== null
      );
      let promptTokens = TIER_PROFILES[tier].defaultPromptTokens;
      let completionTokens = TIER_PROFILES[tier].defaultCompletionTokens;
      let cachedTokens = 0;

      if (tierResults.length > 0) {
        promptTokens = Math.round(
          tierResults.reduce((sum, r) => sum + r.tokens.promptTokens, 0) / tierResults.length
        );
        completionTokens = Math.round(
          tierResults.reduce((sum, r) => sum + r.tokens.completionTokens, 0) / tierResults.length
        );
        cachedTokens = Math.round(
          tierResults.reduce((sum, r) => sum + r.tokens.cachedTokens, 0) / tierResults.length
        );
      }

      const costPerSessionUsd = calculateCallCost(config.rates, {
        promptTokens,
        completionTokens,
        cachedTokens,
      });

      return {
        tier,
        averageCharacters: TIER_PROFILES[tier].averageCharacters,
        estimatedPromptTokens: promptTokens,
        estimatedCompletionTokens: completionTokens,
        costPerSessionUsd: Math.round(costPerSessionUsd * 1000000) / 1000000,
      };
    }
  );

  return {
    candidateId: config.id,
    tiers,
  };
}
