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
  Chunk,
  ChunkPart,
  ChunkingResult,
  ModelInvocationResult,
  TokenUsage,
} from "./types";
import { validateChunkingOutput } from "./validator";

export interface ModelClientOptions {
  readonly dryRun?: boolean;
  readonly timeoutMs?: number;
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
 * Looks up custom environment variables first, then standard Azure endpoints.
 */
export function resolveEndpoint(candidateId: CandidateModelId): string {
  const config = getCandidateConfig(candidateId);
  const specificEnv = process.env[config.defaultEndpointEnvVar];
  if (specificEnv) return specificEnv;

  const foundryEndpoint = process.env.AZURE_AI_FOUNDRY_ENDPOINT;
  if (foundryEndpoint) return foundryEndpoint;

  const openAiEndpoint = process.env.AZURE_OPENAI_ENDPOINT;
  if (openAiEndpoint) return openAiEndpoint;

  throw new Error(
    `No Azure endpoint configured for model "${candidateId}". Please set ${config.defaultEndpointEnvVar}, AZURE_AI_FOUNDRY_ENDPOINT, or AZURE_OPENAI_ENDPOINT.`
  );
}

/**
 * Creates realistic mock chunking for offline testing and --dry-run mode.
 */
export function generateMockChunking(paragraphText: string): ChunkingResult {
  // Split paragraph by sentences and clause punctuation (commas, semicolons, em-dashes)
  const segments = paragraphText
    .split(/(?<=[.,!?;—])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  const chunks: Chunk[] = [];

  for (const seg of segments) {
    const words = seg.split(/\s+/);
    if (words.length <= 8) {
      chunks.push(createMockChunk(words));
    } else {
      // Split into 4-6 word sub-chunks
      const mid = Math.ceil(words.length / 2);
      chunks.push(createMockChunk(words.slice(0, mid)));
      chunks.push(createMockChunk(words.slice(mid)));
    }
  }

  // Ensure whitespace between chunks joins cleanly
  const refinedChunks: Chunk[] = [];

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const prefix = i === 0 ? "" : " ";

    // Re-assign parts with proper prefix space on first part
    const parts: ChunkPart[] = chunk.parts.map((p, pIdx) => ({
      text: pIdx === 0 ? prefix + p.text.trim() : " " + p.text.trim(),
      role: p.role,
    }));
    refinedChunks.push({ parts });
  }

  return { chunks: refinedChunks };
}

function createMockChunk(words: string[]): Chunk {
  if (words.length === 0) {
    return { parts: [{ text: "", role: "normal" }, { text: "", role: "focus_word" }] };
  }

  // Pick a content word toward the end of the chunk as the focus word
  const focusIndex = Math.max(0, words.length - 1);
  const parts: ChunkPart[] = words.map((w, i) => ({
    text: i === 0 ? w : ` ${w}`,
    role: i === focusIndex ? "focus_word" : "normal",
  }));

  return { parts };
}

/**
 * Invokes a candidate model (or mock fixture in dry-run mode) with uniform prompt and schema.
 */
export async function invokeCandidateModel(
  candidateId: CandidateModelId,
  paragraph: PracticeParagraph,
  options: ModelClientOptions = {}
): Promise<ModelInvocationResult> {
  const config = getCandidateConfig(candidateId);
  const timeoutMs = options.timeoutMs ?? config.defaultTimeoutMs;

  if (options.dryRun) {
    return executeDryRunInvocation(candidateId, paragraph, config);
  }

  const endpoint = resolveEndpoint(candidateId);
  const startTime = performance.now();

  try {
    const credential = getCredential();
    const tokenResponse = await credential.getToken("https://cognitiveservices.azure.com/.default");

    const payload = {
      model: candidateId,
      messages: [
        { role: "system", content: CHUNKING_SYSTEM_PROMPT },
        { role: "user", content: buildChunkingUserPrompt(paragraph.text) },
      ],
      response_format: {
        type: "json_schema",
        json_schema: CHUNKING_JSON_SCHEMA,
      },
      temperature: 0,
    };

    const controller = new AbortController();
    const timeoutHandle = setTimeout(() => controller.abort(), timeoutMs);

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${tokenResponse.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutHandle);
    const roundTripMs = Math.round(performance.now() - startTime);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Azure API error (${response.status} ${response.statusText}): ${errorText}`);
    }

    const serverHeader = response.headers.get("openai-processing-ms");
    const serverProcessingMs = serverHeader ? parseInt(serverHeader, 10) : null;

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
      usage?: {
        prompt_tokens?: number;
        completion_tokens?: number;
        prompt_tokens_details?: { cached_tokens?: number };
      };
    };

    const rawContent = data.choices?.[0]?.message?.content || "";
    if (
      typeof data.usage?.prompt_tokens !== "number" ||
      typeof data.usage?.completion_tokens !== "number"
    ) {
      throw new Error(
        "Azure API response is missing token usage telemetry (data.usage.prompt_tokens / data.usage.completion_tokens)"
      );
    }
    const promptTokens = data.usage.prompt_tokens;
    const completionTokens = data.usage.completion_tokens;
    const cachedTokens = data.usage.prompt_tokens_details?.cached_tokens ?? 0;

    const tokens: TokenUsage = { promptTokens, completionTokens, cachedTokens };
    const costUsd = calculateCallCost(config.rates, tokens);
    const validation = validateChunkingOutput(rawContent, paragraph.text);

    let parsedResult: ChunkingResult | null = null;
    try {
      parsedResult = JSON.parse(rawContent) as ChunkingResult;
    } catch {
      // Handled by validation
    }

    return {
      candidateId,
      paragraphId: paragraph.id,
      paragraphTitle: paragraph.title,
      lengthTier: paragraph.lengthTier,
      characterCount: paragraph.characterCount,
      wordCount: paragraph.wordCount,
      rawResponse: rawContent,
      parsed: parsedResult,
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

    return {
      candidateId,
      paragraphId: paragraph.id,
      paragraphTitle: paragraph.title,
      lengthTier: paragraph.lengthTier,
      characterCount: paragraph.characterCount,
      wordCount: paragraph.wordCount,
      rawResponse: "",
      parsed: null,
      validation: {
        isValid: false,
        schemaValid: false,
        focusWordValid: false,
        textIntegrityValid: false,
        chunkLengthBoundsValid: false,
        chunkLengthIssues: [],
        errors: [`Model invocation failed: ${errorMessage}`],
      },
      roundTripMs,
      serverProcessingMs: null,
      tokens: { promptTokens: 0, completionTokens: 0, cachedTokens: 0 },
      costUsd: 0,
      error: errorMessage,
    };
  }
}

function executeDryRunInvocation(
  candidateId: CandidateModelId,
  paragraph: PracticeParagraph,
  config: ReturnType<typeof getCandidateConfig>
): ModelInvocationResult {
  const mockResult = generateMockChunking(paragraph.text);
  const rawResponse = JSON.stringify(mockResult, null, 2);

  // Model-specific realistic simulated latency ranges
  const baseLatency =
    candidateId === "phi-4-mini-instruct"
      ? 140
      : candidateId === "gpt-5-4-nano"
      ? 160
      : candidateId === "gpt-6-luna"
      ? 190
      : candidateId === "claude-haiku-5-5"
      ? 210
      : candidateId === "deepseek-v4-1-flash"
      ? 230
      : 420; // gpt-6-sol

  const roundTripMs = baseLatency + Math.round((paragraph.characterCount / 10) * (0.8 + Math.random() * 0.4));
  const serverProcessingMs = Math.round(roundTripMs * 0.75);

  const promptTokens = Math.round(paragraph.characterCount / 3.8) + 120; // paragraph + system prompt
  const completionTokens = Math.round(paragraph.characterCount / 3.4) + 40;
  const cachedTokens = config.rates.cachedInputPer1M < config.rates.inputPer1M ? 100 : 0;

  const tokens: TokenUsage = { promptTokens, completionTokens, cachedTokens };
  const costUsd = calculateCallCost(config.rates, tokens);
  const validation = validateChunkingOutput(mockResult, paragraph.text);

  return {
    candidateId,
    paragraphId: paragraph.id,
    paragraphTitle: paragraph.title,
    lengthTier: paragraph.lengthTier,
    characterCount: paragraph.characterCount,
    wordCount: paragraph.wordCount,
    rawResponse,
    parsed: mockResult,
    validation,
    roundTripMs,
    serverProcessingMs,
    tokens,
    costUsd,
    error: null,
  };
}
