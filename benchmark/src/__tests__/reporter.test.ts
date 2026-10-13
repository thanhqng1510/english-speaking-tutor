import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { describe, expect, it } from "vitest";
import { CANDIDATE_MODELS } from "../candidates";
import { aggregateCandidateMetrics, calculateLearnerCostProjections } from "../metrics";
import {
  formatChunkWithFocusWord,
  generateMarkdownReport,
  saveBenchmarkArtifacts,
} from "../reporter";
import type {
  BenchmarkRunReportData,
  CandidateCostProjection,
  CandidateModelId,
  Chunk,
  ModelInvocationResult,
} from "../types";

describe("benchmark reporter", () => {
  describe("formatChunkWithFocusWord", () => {
    it("formats chunk parts with Focus Word in bold brackets", () => {
      const chunk: Chunk = {
        parts: [
          { text: "Although the weather ", role: "normal" },
          { text: "was terrible,", role: "focus_word" },
        ],
      };
      const formatted = formatChunkWithFocusWord(chunk);
      expect(formatted).toBe("Although the weather [**was terrible,**]");
    });
  });

  describe("generateMarkdownReport & saveBenchmarkArtifacts", () => {
    const candidateConfig = CANDIDATE_MODELS["gpt-6-luna"];

    const mockResult: ModelInvocationResult = {
      candidateId: "gpt-6-luna",
      paragraphId: "eval-exam-01",
      paragraphTitle: "University Seminar Presentation",
      lengthTier: "medium",
      characterCount: 280,
      wordCount: 52,
      rawResponse: "{}",
      parsed: {
        chunks: [
          {
            parts: [
              { text: "Good morning ", role: "normal" },
              { text: "everyone.", role: "focus_word" },
            ],
          },
        ],
      },
      validation: {
        isValid: true,
        schemaValid: true,
        focusWordValid: true,
        textIntegrityValid: true,
        chunkLengthIssues: [],
        errors: [],
      },
      roundTripMs: 195,
      serverProcessingMs: 140,
      tokens: { promptTokens: 200, completionTokens: 90, cachedTokens: 50 },
      costUsd: 0.000065,
      error: null,
    };

    const metrics = aggregateCandidateMetrics(candidateConfig, [mockResult]);
    const costProjection = calculateLearnerCostProjections(candidateConfig, [mockResult]);

    const reportData: BenchmarkRunReportData = {
      runId: "2026-10-13-1200",
      timestamp: "2026-10-13T05:00:00.000Z",
      datasetPartition: "evaluation",
      totalParagraphs: 1,
      sequentialDelayMs: 200,
      candidates: [metrics],
      costProjections: {
        "gpt-6-luna": costProjection,
      } as Record<CandidateModelId, CandidateCostProjection>,
      results: [mockResult],
    };

    it("generates markdown containing all key sections and tables", () => {
      const md = generateMarkdownReport(reportData);

      expect(md).toContain("# Chunking Model Benchmark Report");
      expect(md).toContain("## 1. Executive Summary Scorecard");
      expect(md).toContain("GPT-6 Luna");
      expect(md).toContain("100%");
      expect(md).toContain("## 2. Real-World Learner Cost Simulator");
      expect(md).toContain("## 3. Latency & Token Breakdown");
      expect(md).toContain("## 4. Reliability & Validation Failures");
      expect(md).toContain("## 5. Side-by-Side Chunk Inspections");
      expect(md).toContain("University Seminar Presentation");
    });

    it("saves markdown and json files to disk", () => {
      const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "bench-report-test-"));
      try {
        const { markdownPath, jsonPath } = saveBenchmarkArtifacts(reportData, tempDir);

        expect(fs.existsSync(markdownPath)).toBe(true);
        expect(fs.existsSync(jsonPath)).toBe(true);

        const mdContent = fs.readFileSync(markdownPath, "utf-8");
        expect(mdContent).toContain("Executive Summary Scorecard");

        const jsonContent = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
        expect(jsonContent.runId).toBe("2026-10-13-1200");
        expect(jsonContent.candidates).toHaveLength(1);
      } finally {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    });
  });
});
