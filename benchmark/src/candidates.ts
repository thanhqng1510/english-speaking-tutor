import {
  CANDIDATE_MODEL_IDS,
  type CandidateModelConfig,
  type CandidateModelId,
} from "./types";

const DEFAULT_TIMEOUT_MS = 15000;
const REASONING_MODEL_TIMEOUT_MS = 25000;

export const DEFAULT_CANDIDATE_IDS: readonly CandidateModelId[] = CANDIDATE_MODEL_IDS;

export const CANDIDATE_MODELS: Record<CandidateModelId, CandidateModelConfig> = {
  "phi-4-mini-instruct": {
    id: "phi-4-mini-instruct",
    name: "Phi-4-mini-instruct",
    provider: "Microsoft",
    deploymentType: "Foundry MaaS",
    defaultEndpointEnvVar: "AZURE_PHI_4_MINI_ENDPOINT",
    rates: {
      inputPer1M: 0.075,
      outputPer1M: 0.3,
      cachedInputPer1M: 0.075,
    },
    defaultTimeoutMs: DEFAULT_TIMEOUT_MS,
  },
  "gpt-6-luna": {
    id: "gpt-6-luna",
    name: "GPT-6 Luna",
    provider: "OpenAI",
    deploymentType: "Azure OpenAI",
    defaultEndpointEnvVar: "AZURE_OPENAI_ENDPOINT",
    rates: {
      inputPer1M: 0.1,
      outputPer1M: 0.5,
      cachedInputPer1M: 0.01,
    },
    defaultTimeoutMs: DEFAULT_TIMEOUT_MS,
  },
  "claude-haiku-5-5": {
    id: "claude-haiku-5-5",
    name: "Claude Haiku 5.5",
    provider: "Anthropic",
    deploymentType: "Foundry MaaS",
    defaultEndpointEnvVar: "AZURE_CLAUDE_HAIKU_ENDPOINT",
    rates: {
      inputPer1M: 0.1,
      outputPer1M: 0.5,
      cachedInputPer1M: 0.01,
    },
    defaultTimeoutMs: DEFAULT_TIMEOUT_MS,
  },
  "deepseek-v4-1-flash": {
    id: "deepseek-v4-1-flash",
    name: "DeepSeek-V4.1-Flash",
    provider: "DeepSeek",
    deploymentType: "Foundry MaaS",
    defaultEndpointEnvVar: "AZURE_DEEPSEEK_FLASH_ENDPOINT",
    rates: {
      inputPer1M: 0.2,
      outputPer1M: 0.6,
      cachedInputPer1M: 0.028,
    },
    defaultTimeoutMs: DEFAULT_TIMEOUT_MS,
  },
  "gpt-5-4-nano": {
    id: "gpt-5-4-nano",
    name: "GPT-5.4-nano",
    provider: "OpenAI",
    deploymentType: "Azure OpenAI",
    defaultEndpointEnvVar: "AZURE_OPENAI_ENDPOINT",
    rates: {
      inputPer1M: 0.2,
      outputPer1M: 1.25,
      cachedInputPer1M: 0.02,
    },
    defaultTimeoutMs: DEFAULT_TIMEOUT_MS,
  },
  "gpt-6-sol": {
    id: "gpt-6-sol",
    name: "GPT-6 Sol",
    provider: "OpenAI",
    deploymentType: "Azure OpenAI",
    defaultEndpointEnvVar: "AZURE_OPENAI_ENDPOINT",
    rates: {
      inputPer1M: 2.0,
      outputPer1M: 10.0,
      cachedInputPer1M: 0.2,
    },
    defaultTimeoutMs: REASONING_MODEL_TIMEOUT_MS,
  },
};

export const CANDIDATE_MODEL_LIST: readonly CandidateModelConfig[] = Object.values(CANDIDATE_MODELS);

export function getCandidateConfig(id: CandidateModelId): CandidateModelConfig {
  const config = CANDIDATE_MODELS[id];
  if (!config) {
    throw new Error(`Unknown candidate model id: "${id}". Supported models: ${Object.keys(CANDIDATE_MODELS).join(", ")}`);
  }
  return config;
}
