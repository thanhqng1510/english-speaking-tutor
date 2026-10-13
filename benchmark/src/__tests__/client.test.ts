import { describe, expect, it } from "vitest";
import { getParagraphById } from "../../dataset";
import { CANDIDATE_MODELS, CANDIDATE_MODEL_LIST, getCandidateConfig } from "../candidates";
import { invokeCandidateModel, resolveEndpoint } from "../client";

describe("benchmark client & candidates", () => {
  it("shortlists exactly the 6 verified 2026 Azure candidate models", () => {
    expect(CANDIDATE_MODEL_LIST).toHaveLength(6);
    const ids = CANDIDATE_MODEL_LIST.map((c) => c.id);
    expect(ids).toContain("phi-4-mini-instruct");
    expect(ids).toContain("gpt-6-luna");
    expect(ids).toContain("claude-haiku-5-5");
    expect(ids).toContain("deepseek-v4-1-flash");
    expect(ids).toContain("gpt-6-sol");

    const lunaConfig = getCandidateConfig("gpt-6-luna");
    expect(lunaConfig.name).toBe("GPT-6 Luna");
    expect(lunaConfig.provider).toBe("OpenAI");
  });

  it("verifies accurate 2026 rate cards for all candidates", () => {
    expect(CANDIDATE_MODELS["phi-4-mini-instruct"].rates.inputPer1M).toBe(0.075);
    expect(CANDIDATE_MODELS["phi-4-mini-instruct"].rates.outputPer1M).toBe(0.3);

    expect(CANDIDATE_MODELS["gpt-6-luna"].rates.inputPer1M).toBe(0.1);
    expect(CANDIDATE_MODELS["gpt-6-luna"].rates.cachedInputPer1M).toBe(0.01);

    expect(CANDIDATE_MODELS["claude-haiku-5-5"].rates.inputPer1M).toBe(0.1);
    expect(CANDIDATE_MODELS["claude-haiku-5-5"].rates.outputPer1M).toBe(0.5);

    expect(CANDIDATE_MODELS["deepseek-v4-1-flash"].rates.inputPer1M).toBe(0.2);
    expect(CANDIDATE_MODELS["deepseek-v4-1-flash"].rates.outputPer1M).toBe(0.6);

    expect(CANDIDATE_MODELS["gpt-5-4-nano"].rates.inputPer1M).toBe(0.2);
    expect(CANDIDATE_MODELS["gpt-5-4-nano"].rates.outputPer1M).toBe(1.25);

    expect(CANDIDATE_MODELS["gpt-6-sol"].rates.inputPer1M).toBe(2.0);
    expect(CANDIDATE_MODELS["gpt-6-sol"].rates.outputPer1M).toBe(10.0);
  });

  it("throws a clear configuration error when no endpoint env var is set", () => {
    const origOpenAi = process.env.AZURE_OPENAI_ENDPOINT;
    const origFoundry = process.env.AZURE_AI_FOUNDRY_ENDPOINT;
    delete process.env.AZURE_OPENAI_ENDPOINT;
    delete process.env.AZURE_AI_FOUNDRY_ENDPOINT;
    try {
      expect(() => resolveEndpoint("gpt-6-luna")).toThrow(
        /No Azure endpoint configured for model "gpt-6-luna"/
      );
    } finally {
      if (origOpenAi) process.env.AZURE_OPENAI_ENDPOINT = origOpenAi;
      if (origFoundry) process.env.AZURE_AI_FOUNDRY_ENDPOINT = origFoundry;
    }
  });

  it("resolves endpoint when environment variable is provided", () => {
    process.env.AZURE_OPENAI_ENDPOINT = "https://custom.openai.azure.com";
    try {
      const endpoint = resolveEndpoint("gpt-6-luna");
      expect(endpoint).toBe("https://custom.openai.azure.com");
    } finally {
      delete process.env.AZURE_OPENAI_ENDPOINT;
    }
  });

  it("invokes candidate model and parses telemetry and response successfully", async () => {
    const paragraph = getParagraphById("tune-exam-01")!;
    expect(paragraph).toBeDefined();

    const staticChunkingJson = JSON.stringify({
      chunks: [
        {
          parts: [
            { text: "The growing demand for clean and renewable ", role: "normal" },
            { text: "energy", role: "focus_word" },
          ],
        },
        {
          parts: [
            { text: " has transformed how modern ", role: "normal" },
            { text: "cities", role: "focus_word" },
          ],
        },
        {
          parts: [
            { text: " design their power ", role: "normal" },
            { text: "grids.", role: "focus_word" },
          ],
        },
      ],
    });

    const mockFetch = async () =>
      new Response(
        JSON.stringify({
          choices: [{ message: { content: staticChunkingJson } }],
          usage: {
            prompt_tokens: 120,
            completion_tokens: 45,
            prompt_tokens_details: { cached_tokens: 20 },
          },
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "openai-processing-ms": "142",
          },
        }
      );

    const mockCredential = {
      getToken: async () => ({ token: "mock-token-xyz" }),
    };

    const result = await invokeCandidateModel("claude-haiku-5-5", paragraph, {
      endpoint: "https://mock.azure.cognitiveservices.azure.com",
      fetch: mockFetch as unknown as typeof globalThis.fetch,
      credential: mockCredential,
    });

    expect(result.candidateId).toBe("claude-haiku-5-5");
    expect(result.paragraphId).toBe(paragraph.id);
    expect(result.validation.isValid).toBe(true);
    expect(result.validation.schemaValid).toBe(true);
    expect(result.validation.focusWordValid).toBe(true);
    expect(result.validation.textIntegrityValid).toBe(true);
    expect(result.tokens.promptTokens).toBe(120);
    expect(result.tokens.completionTokens).toBe(45);
    expect(result.tokens.cachedTokens).toBe(20);
    expect(result.serverProcessingMs).toBe(142);
    expect(result.costUsd).toBeGreaterThan(0);
    expect(result.error).toBeNull();
    expect(result.parsed).not.toBeNull();
    expect(result.parsed?.chunks).toHaveLength(3);
  });

  it("handles API error cleanly and returns error invocation result", async () => {
    const paragraph = getParagraphById("tune-exam-01")!;

    const mockFetch = async () =>
      new Response("Capacity exceeded (429)", {
        status: 429,
        statusText: "Too Many Requests",
      });

    const mockCredential = {
      getToken: async () => ({ token: "mock-token-xyz" }),
    };

    const result = await invokeCandidateModel("phi-4-mini-instruct", paragraph, {
      endpoint: "https://mock.azure.cognitiveservices.azure.com",
      fetch: mockFetch as unknown as typeof globalThis.fetch,
      credential: mockCredential,
    });

    expect(result.candidateId).toBe("phi-4-mini-instruct");
    expect(result.validation.isValid).toBe(false);
    expect(result.error).toContain("Azure API error (429 Too Many Requests)");
    expect(result.costUsd).toBe(0);
    expect(result.parsed).toBeNull();
  });
});
