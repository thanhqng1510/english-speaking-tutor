import { DefaultAzureCredential } from "@azure/identity";
import type { PracticeParagraph } from "../dataset";
import { getCandidateConfig } from "./candidates";
import { calculateCallCost } from "./metrics";
import {
  CHUNKING_JSON_SCHEMA,
  CHUNKING_SYSTEM_PROMPT,
  buildChunkingUserPrompt,
} from "./prompt";
import type {
  CandidateModelId,
  ModelInvocationResult,
  TokenUsage,
} from "./types";
import { validateChunkingOutput } from "./validator";

export const AZURE_OPENAI_API_VERSION = "2024-10-21";
export const AZURE_FOUNDRY_API_VERSION = "2024-05-01-preview";
export const AZURE_COGNITIVE_SERVICES_SCOPE = "https://cognitiveservices.azure.com/.default";
export const HEADER_OPENAI_PROCESSING_MS = "openai-processing-ms";

export interface ModelClientOptions {
  readonly endpoint?: string;
  readonly timeoutMs?: number;
  readonly fetch?: typeof globalThis.fetch;
  readonly credential?: { getToken: (scope: string) => Promise<{ token: string }> };
}

// Cached credential instance for keyless Entra ID auth across calls
let sharedCredential: DefaultAzureCredential | null = null;

function getCredential(): DefaultAzureCredential {
  if (!sharedCredential) {
    sharedCredential = new DefaultAzureCredential();
  }
  return sharedCredential;
}

/**
 * Resolves endpoint URL for a given candidate model.
 * Supports:
 * 1. Full endpoint URLs (containing /chat/completions) directly from specific model env vars.
 * 2. Shared base endpoint URLs (e.g. https://<resource>.cognitiveservices.azure.com or .openai.azure.com),
 *    automatically appending standard Azure deployment chat completions path.
 */
export function resolveEndpoint(candidateId: CandidateModelId): string {
  const config = getCandidateConfig(candidateId);
  const rawUrl = process.env[config.defaultEndpointEnvVar] || process.env.AZURE_AI_ENDPOINT;

  if (!rawUrl) {
    throw new Error(
      `No Azure endpoint configured for model "${candidateId}". Please set AZURE_AI_ENDPOINT or ${config.defaultEndpointEnvVar}.`
    );
  }

  // If already a full chat completions URL, use as-is
  if (rawUrl.includes("/chat/completions")) {
    return rawUrl;
  }

  // Append model-appropriate deployment path
  const baseUrl = rawUrl.replace(/\/+$/, "");
  if (config.deploymentType === "Azure OpenAI") {
    return `${baseUrl}/openai/deployments/${candidateId}/chat/completions?api-version=${AZURE_OPENAI_API_VERSION}`;
  }
  return `${baseUrl}/models/chat/completions?api-version=${AZURE_FOUNDRY_API_VERSION}`;
}

interface AzureChatCompletionResponse {
  choices?: Array<{ message?: { content?: string } }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    prompt_tokens_details?: { cached_tokens?: number };
  };
}

/**
 * Builds standard chat completion request payload with uniform prompt and JSON schema.
 */
export function buildChatCompletionPayload(candidateId: CandidateModelId, text: string) {
  return {
    model: candidateId,
    messages: [
      { role: "system", content: CHUNKING_SYSTEM_PROMPT },
      { role: "user", content: buildChunkingUserPrompt(text) },
    ],
    response_format: {
      type: "json_schema",
      json_schema: CHUNKING_JSON_SCHEMA,
    },
    temperature: 0,
  };
}

/**
 * Extracts and validates token usage telemetry from Azure API response.
 */
export function extractTokenUsage(usage: unknown): TokenUsage {
  const u = usage as {
    prompt_tokens?: number;
    completion_tokens?: number;
    prompt_tokens_details?: { cached_tokens?: number };
  } | undefined;

  if (typeof u?.prompt_tokens !== "number" || typeof u?.completion_tokens !== "number") {
    throw new Error(
      "Azure API response is missing token usage telemetry (data.usage.prompt_tokens / data.usage.completion_tokens)"
    );
  }

  return {
    promptTokens: u.prompt_tokens,
    completionTokens: u.completion_tokens,
    cachedTokens: u.prompt_tokens_details?.cached_tokens ?? 0,
  };
}

/**
 * Parses optional server-side processing latency header from Azure response.
 */
export function parseServerProcessingMs(response: Response): number | null {
  const header = response.headers.get(HEADER_OPENAI_PROCESSING_MS);
  return header ? parseInt(header, 10) : null;
}

/**
 * Executes HTTP request with timeout protection and returns parsed JSON.
 */
async function executeHttpCall(
  endpoint: string,
  authToken: string,
  payload: unknown,
  options: { timeoutMs: number; fetchFn: typeof globalThis.fetch }
): Promise<{ data: AzureChatCompletionResponse; serverProcessingMs: number | null }> {
  const controller = new AbortController();
  const timeoutHandle = setTimeout(() => controller.abort(), options.timeoutMs);

  try {
    const response = await options.fetchFn(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Azure API error (${response.status} ${response.statusText}): ${errorText}`);
    }

    const serverProcessingMs = parseServerProcessingMs(response);
    const data = (await response.json()) as AzureChatCompletionResponse;
    return { data, serverProcessingMs };
  } finally {
    clearTimeout(timeoutHandle);
  }
}

/**
 * Constructs a structured ModelInvocationResult for invocation errors.
 */
export function createInvocationFailureResult(
  candidateId: CandidateModelId,
  paragraph: PracticeParagraph,
  roundTripMs: number,
  errorMessage: string
): ModelInvocationResult {
  return {
    candidateId,
    paragraphId: paragraph.id,
    paragraphTitle: paragraph.title,
    lengthTier: paragraph.lengthTier,
    characterCount: paragraph.characterCount,
    wordCount: paragraph.wordCount,
    rawResponse: "",
    parsed: null,
    validation: null,
    roundTripMs,
    serverProcessingMs: null,
    tokens: null,
    costUsd: 0,
    error: errorMessage,
  };
}

/**
 * Invokes a candidate model with uniform prompt and strict schema.
 */
export async function invokeCandidateModel(
  candidateId: CandidateModelId,
  paragraph: PracticeParagraph,
  options: ModelClientOptions = {}
): Promise<ModelInvocationResult> {
  const config = getCandidateConfig(candidateId);
  const timeoutMs = options.timeoutMs ?? config.defaultTimeoutMs;
  const fetchFn = options.fetch ?? globalThis.fetch;
  const endpoint = options.endpoint ?? resolveEndpoint(candidateId);
  const startTime = performance.now();

  try {
    const credential = options.credential ?? getCredential();
    const tokenResponse = await credential.getToken(AZURE_COGNITIVE_SERVICES_SCOPE);

    const payload = buildChatCompletionPayload(candidateId, paragraph.text);
    const { data, serverProcessingMs } = await executeHttpCall(endpoint, tokenResponse.token, payload, {
      timeoutMs,
      fetchFn,
    });

    const roundTripMs = Math.round(performance.now() - startTime);
    const rawContent = data.choices?.[0]?.message?.content || "";
    const tokens = extractTokenUsage(data.usage);
    const costUsd = calculateCallCost(config.rates, tokens);
    const validation = validateChunkingOutput(rawContent, paragraph.text);

    return {
      candidateId,
      paragraphId: paragraph.id,
      paragraphTitle: paragraph.title,
      lengthTier: paragraph.lengthTier,
      characterCount: paragraph.characterCount,
      wordCount: paragraph.wordCount,
      rawResponse: rawContent,
      parsed: validation.parsed,
      validation,
      roundTripMs,
      serverProcessingMs,
      tokens,
      costUsd,
      error: null,
    };
  } catch (err) {
    const roundTripMs = Math.round(performance.now() - startTime);
    const errorMessage = err instanceof Error ? err.message : String(err);
    return createInvocationFailureResult(candidateId, paragraph, roundTripMs, errorMessage);
  }
}
