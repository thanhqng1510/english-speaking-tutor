import { describe, expect, it } from "vitest";
import { getParagraphById } from "../../dataset";
import { CANDIDATE_MODELS, CANDIDATE_MODEL_LIST, getCandidateConfig } from "../candidates";
import { generateMockChunking, invokeCandidateModel, resolveEndpoint } from "../client";
import { validateChunkingOutput } from "../validator";

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

  it("resolves endpoint with custom env var or fallback", () => {
    const endpoint = resolveEndpoint("gpt-6-luna");
    expect(endpoint).toBeDefined();
    expect(typeof endpoint).toBe("string");
  });

  it("generates valid mock chunking that passes all 4 automated checks", () => {
    const paragraph = getParagraphById("tune-exam-01");
    expect(paragraph).toBeDefined();

    const mockChunks = generateMockChunking(paragraph!.text);
    expect(mockChunks.chunks.length).toBeGreaterThan(0);

    const validation = validateChunkingOutput(mockChunks, paragraph!.text);
    expect(validation.isValid).toBe(true);
    expect(validation.schemaValid).toBe(true);
    expect(validation.focusWordValid).toBe(true);
    expect(validation.textIntegrityValid).toBe(true);
  });

  it("executes dry-run model invocation returning valid result", async () => {
    const paragraph = getParagraphById("tune-everyday-02")!;
    const result = await invokeCandidateModel("claude-haiku-5-5", paragraph, { dryRun: true });

    expect(result.candidateId).toBe("claude-haiku-5-5");
    expect(result.paragraphId).toBe(paragraph.id);
    expect(result.validation.isValid).toBe(true);
    expect(result.roundTripMs).toBeGreaterThan(0);
    expect(result.tokens.promptTokens).toBeGreaterThan(0);
    expect(result.tokens.completionTokens).toBeGreaterThan(0);
    expect(result.costUsd).toBeGreaterThan(0);
    expect(result.parsed).not.toBeNull();
  });
});
