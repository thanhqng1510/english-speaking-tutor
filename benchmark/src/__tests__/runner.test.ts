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

  it("runs full benchmark end-to-end in dry-run mode and writes reports", async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "bench-runner-test-"));
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
      expect(report.candidates).toHaveLength(2);
      expect(report.results).toHaveLength(4); // 2 models * 2 paragraphs

      for (const cand of report.candidates) {
        expect(cand.totalRuns).toBe(2);
        expect(cand.passedRuns).toBe(2);
        expect(cand.passRatePercent).toBe(100);
        expect(cand.latencyMs.p50).toBeGreaterThan(0);
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
