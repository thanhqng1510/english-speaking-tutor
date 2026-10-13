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
  ChunkingResult,
  ModelInvocationResult,
  TokenUsage,
} from "./types";
import { validateChunkingOutput } from "./validator";

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

    const response = await fetchFn(endpoint, {
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
