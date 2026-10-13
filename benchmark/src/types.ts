import type { LengthTier } from "../dataset";
export type { LengthTier };

export type PartRole = "normal" | "focus_word";

export interface ChunkPart {
  readonly text: string;
  readonly role: PartRole;
}

export interface Chunk {
  readonly parts: readonly ChunkPart[];
}

export interface ChunkingResult {
  readonly chunks: readonly Chunk[];
}

export type CandidateModelId =
  | "phi-4-mini-instruct"
  | "gpt-6-luna"
  | "claude-haiku-5-5"
  | "deepseek-v4-1-flash"
  | "gpt-5-4-nano"
  | "gpt-6-sol";

export type ProviderName = "Microsoft" | "OpenAI" | "Anthropic" | "DeepSeek";

export type DeploymentProvider = "Azure OpenAI" | "Foundry MaaS";

export interface RateCard {
  /** Price in USD per 1 Million input tokens */
  readonly inputPer1M: number;
  /** Price in USD per 1 Million output tokens */
  readonly outputPer1M: number;
  /** Price in USD per 1 Million cached input tokens (if supported, else inputPer1M) */
  readonly cachedInputPer1M: number;
}

export interface CandidateModelConfig {
  readonly id: CandidateModelId;
  readonly name: string;
  readonly provider: ProviderName;
  readonly deploymentType: DeploymentProvider;
  readonly defaultEndpointEnvVar: string;
  readonly rates: RateCard;
  readonly defaultTimeoutMs: number;
}

export interface ChunkLengthIssue {
  readonly chunkIndex: number;
  readonly text: string;
  readonly wordCount: number;
  readonly issue: "under_target" | "over_target";
}

export interface ValidationResult {
  readonly isValid: boolean;
  readonly schemaValid: boolean;
  readonly focusWordValid: boolean;
  readonly textIntegrityValid: boolean;
  readonly chunkLengthBoundsValid: boolean;
  readonly chunkLengthIssues: readonly ChunkLengthIssue[];
  readonly errors: readonly string[];
  readonly parsed: ChunkingResult | null;
}

export interface TokenUsage {
  readonly promptTokens: number;
  readonly completionTokens: number;
  readonly cachedTokens: number;
}

export interface ModelInvocationResult {
  readonly candidateId: CandidateModelId;
  readonly paragraphId: string;
  readonly paragraphTitle: string;
  readonly lengthTier: LengthTier;
  readonly characterCount: number;
  readonly wordCount: number;
  readonly rawResponse: string;
  readonly parsed: ChunkingResult | null;
  readonly validation: ValidationResult | null;
  readonly roundTripMs: number;
  readonly serverProcessingMs: number | null;
  readonly tokens: TokenUsage | null;
  readonly costUsd: number;
  readonly error: string | null;
}

export interface LatencyStats {
  readonly p50: number;
  readonly p95: number;
  readonly min: number;
  readonly max: number;
  readonly mean: number;
}

export interface TokenStats {
  readonly avgPromptTokens: number;
  readonly avgCompletionTokens: number;
  readonly avgCachedTokens: number;
  readonly totalPromptTokens: number;
  readonly totalCompletionTokens: number;
  readonly totalCachedTokens: number;
}

export interface CandidateAggregateMetrics {
  readonly candidateId: CandidateModelId;
  readonly candidateName: string;
  readonly provider: ProviderName;
  readonly deploymentType: DeploymentProvider;
  readonly totalRuns: number;
  readonly passedRuns: number;
  readonly passRatePercent: number;
  readonly latencyMs: LatencyStats;
  readonly serverLatencyMs: LatencyStats | null;
  readonly tokenStats: TokenStats;
  readonly totalCostUsd: number;
  readonly costPer1kRunsUsd: number;
}

export interface LearnerCostTierProjection {
  readonly tier: LengthTier;
  readonly averageCharacters: number;
  readonly estimatedPromptTokens: number;
  readonly estimatedCompletionTokens: number;
  readonly costPerSessionUsd: number;
}

export interface CandidateCostProjection {
  readonly candidateId: CandidateModelId;
  readonly tiers: readonly LearnerCostTierProjection[];
}

export interface BenchmarkRunReportData {
  readonly runId: string;
  readonly timestamp: string;
  readonly datasetPartition: string;
  readonly totalParagraphs: number;
  readonly sequentialDelayMs: number;
  readonly candidates: readonly CandidateAggregateMetrics[];
  readonly costProjections: Record<CandidateModelId, CandidateCostProjection>;
  readonly results: readonly ModelInvocationResult[];
}
