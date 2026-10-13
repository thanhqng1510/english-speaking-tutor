import type {
  CandidateAggregateMetrics,
  CandidateCostProjection,
  CandidateModelConfig,
  LatencyStats,
  LearnerCostTierProjection,
  LearnerMonthlyVolumeProjection,
  LengthTier,
  ModelInvocationResult,
  RateCard,
  ServerLatencyStats,
  TokenStats,
  TokenUsage,
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
 * Calculates a percentile (0 to 100) from a sorted array of numbers.
 */
export function calculatePercentile(sortedValues: number[], percentile: number): number {
  if (sortedValues.length === 0) return 0;
  if (sortedValues.length === 1) return sortedValues[0];

  const p = Math.max(0, Math.min(100, percentile)) / 100;
  const index = (sortedValues.length - 1) * p;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index - lower;

  if (lower === upper) {
    return sortedValues[lower];
  }
  return sortedValues[lower] * (1 - weight) + sortedValues[upper] * weight;
}

/**
 * Computes standard latency statistics (min, max, mean, p50, p95).
 */
export function computeLatencyStats(values: number[]): LatencyStats {
  if (values.length === 0) {
    return { min: 0, max: 0, mean: 0, p50: 0, p95: 0 };
  }

  const sorted = [...values].sort((a, b) => a - b);
  const sum = sorted.reduce((acc, val) => acc + val, 0);
  const mean = Math.round((sum / sorted.length) * 10) / 10;
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const p50 = Math.round(calculatePercentile(sorted, 50));
  const p95 = Math.round(calculatePercentile(sorted, 95));

  return { min, max, mean, p50, p95 };
}

/**
 * Computes optional server-side latency statistics.
 */
export function computeServerLatencyStats(values: (number | null)[]): ServerLatencyStats {
  const validNumbers = values.filter((v): v is number => v !== null && !isNaN(v));
  if (validNumbers.length === 0) {
    return { min: null, max: null, mean: null, p50: null, p95: null };
  }

  const stats = computeLatencyStats(validNumbers);
  return {
    min: stats.min,
    max: stats.max,
    mean: stats.mean,
    p50: stats.p50,
    p95: stats.p95,
  };
}

/**
 * Computes token aggregate statistics.
 */
export function computeTokenStats(results: readonly ModelInvocationResult[]): TokenStats {
  if (results.length === 0) {
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

  for (const r of results) {
    totalPrompt += r.tokens.promptTokens;
    totalCompletion += r.tokens.completionTokens;
    totalCached += r.tokens.cachedTokens;
  }

  const count = results.length;
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
  const passedRuns = results.filter((r) => r.validation.isValid).length;
  const passRatePercent =
    totalRuns > 0 ? Math.round((passedRuns / totalRuns) * 1000) / 10 : 0;

  const latencies = results.map((r) => r.roundTripMs);
  const serverLatencies = results.map((r) => r.serverProcessingMs);

  const latencyMs = computeLatencyStats(latencies);
  const serverLatencyMs = computeServerLatencyStats(serverLatencies);
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
 * Standard learner volumes for monthly projections.
 * Assumes 150 practice sessions per learner per month (5 submissions/day * 30 days).
 */
export const MONTHLY_VOLUME_TIERS: readonly number[] = [100, 500, 1000, 5000];
export const SESSIONS_PER_LEARNER_MONTH = 150;

/**
 * Calculates Learner Cost Projections across length tiers and monthly volume scales.
 */
export function calculateLearnerCostProjections(
  config: CandidateModelConfig,
  results: readonly ModelInvocationResult[]
): CandidateCostProjection {
  const tiers: LearnerCostTierProjection[] = (["short", "medium", "long", "ceiling"] as LengthTier[]).map(
    (tier) => {
      const tierResults = results.filter((r) => r.lengthTier === tier);
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

  // Compute blended average session cost across tiers (weighted 40% short, 40% medium, 15% long, 5% ceiling)
  const blendedSessionCost =
    tiers.find((t) => t.tier === "short")!.costPerSessionUsd * 0.4 +
    tiers.find((t) => t.tier === "medium")!.costPerSessionUsd * 0.4 +
    tiers.find((t) => t.tier === "long")!.costPerSessionUsd * 0.15 +
    tiers.find((t) => t.tier === "ceiling")!.costPerSessionUsd * 0.05;

  const volumes: LearnerMonthlyVolumeProjection[] = MONTHLY_VOLUME_TIERS.map((activeLearners) => {
    const totalSessions = activeLearners * SESSIONS_PER_LEARNER_MONTH;
    const monthlyCostUsd = totalSessions * blendedSessionCost;

    return {
      activeLearners,
      sessionsPerMonth: totalSessions,
      monthlyCostUsd: Math.round(monthlyCostUsd * 100) / 100,
    };
  });

  return {
    candidateId: config.id,
    tiers,
    volumes,
  };
}
