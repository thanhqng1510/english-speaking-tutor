import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { describe, expect, it } from "vitest";
import { parseCliArguments, runBenchmark } from "../run";

describe("benchmark CLI runner", () => {
  it("parses CLI arguments accurately", () => {
    const args = [
      "--dry-run",
      "--set",
      "tuning",
      "--models",
      "gpt-6-luna,phi-4-mini-instruct",
      "--delay",
      "50",
      "--limit",
      "5",
      "--out-dir",
      "benchmark/reports/test",
    ];

    const config = parseCliArguments(args);
    expect(config.dryRun).toBe(true);
    expect(config.partition).toBe("tuning");
    expect(config.candidateIds).toEqual(["gpt-6-luna", "phi-4-mini-instruct"]);
    expect(config.delayMs).toBe(50);
    expect(config.limit).toBe(5);
    expect(config.outputDir).toContain("benchmark/reports/test");
  });

  it("verifies execution plan in dry-run mode without making network calls or writing files", async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "bench-runner-dry-"));
    try {
      const report = await runBenchmark({
        partition: "tuning",
        candidateIds: ["gpt-6-luna", "phi-4-mini-instruct"],
        delayMs: 0,
        dryRun: true,
        limit: 2,
        outputDir: tempDir,
      });

      expect(report.totalParagraphs).toBe(2);
      expect(report.datasetPartition).toBe("tuning");
      expect(report.results).toHaveLength(0);
      expect(report.candidates).toHaveLength(0);

      // Verify no reports were written in dry-run mode
      const files = fs.readdirSync(tempDir);
      expect(files).toHaveLength(0);
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it("runs full benchmark end-to-end with injected client fixture and writes reports", async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "bench-runner-e2e-"));

    const fixtureP1 = JSON.stringify({
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

    const fixtureP2 = JSON.stringify({
      chunks: [
        {
          parts: [
            { text: "In fiscal year 2024, our international research ", role: "normal" },
            { text: "institute", role: "focus_word" },
          ],
        },
        {
          parts: [
            { text: " secured $3.2M in competitive ", role: "normal" },
            { text: "grants,", role: "focus_word" },
          ],
        },
        {
          parts: [
            { text: " published 48 peer-reviewed ", role: "normal" },
            { text: "articles,", role: "focus_word" },
          ],
        },
        {
          parts: [
            { text: " and expanded clinical partnerships across the ", role: "normal" },
            { text: "EU,", role: "focus_word" },
          ],
        },
        {
          parts: [
            { text: " Japan, and ", role: "normal" },
            { text: "Canada.", role: "focus_word" },
          ],
        },
      ],
    });

    const mockFetch = async (_url: string, init?: RequestInit) => {
      const body = JSON.parse(init?.body as string);
      const userContent = body.messages[1].content as string;
      const content = userContent.includes("fiscal year") ? fixtureP2 : fixtureP1;

      return new Response(
        JSON.stringify({
          choices: [{ message: { content } }],
          usage: {
            prompt_tokens: 120,
            completion_tokens: 40,
            prompt_tokens_details: { cached_tokens: 10 },
          },
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "openai-processing-ms": "135",
          },
        }
      );
    };

    try {
      const report = await runBenchmark({
        partition: "tuning",
        candidateIds: ["gpt-6-luna", "phi-4-mini-instruct"],
        delayMs: 0,
        dryRun: false,
        limit: 2,
        outputDir: tempDir,
        clientOptions: {
          endpoint: "https://mock.azure.cognitiveservices.azure.com",
          fetch: mockFetch as unknown as typeof globalThis.fetch,
          credential: { getToken: async () => ({ token: "mock-token" }) },
        },
      });

      expect(report.totalParagraphs).toBe(2);
      expect(report.candidates).toHaveLength(2);
      expect(report.results).toHaveLength(4); // 2 models * 2 paragraphs

      for (const cand of report.candidates) {
        expect(cand.totalRuns).toBe(2);
        expect(cand.passedRuns).toBe(2);
        expect(cand.passRatePercent).toBe(100);
        expect(cand.latencyMs.p50).toBeGreaterThanOrEqual(0);
        expect(cand.costPer1kRunsUsd).toBeGreaterThan(0);
      }

      // Check written files
      const files = fs.readdirSync(tempDir);
      expect(files.some((f) => f.endsWith("-report.md"))).toBe(true);
      expect(files.some((f) => f.endsWith("-data.json"))).toBe(true);
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });
});
