import * as fs from "fs";
import * as path from "path";
import type {
  BenchmarkRunReportData,
  Chunk,
} from "./types";

/**
 * Formats a Chunk into a readable text representation highlighting the Focus Word in bold brackets:
 * e.g., "Although the weather [**terrible**],"
 */
export function formatChunkWithFocusWord(chunk: Chunk): string {
  return chunk.parts
    .map((p) => {
      if (p.role === "focus_word") {
        const trimmed = p.text.trim();
        const leadingSpace = p.text.startsWith(" ") ? " " : "";
        const trailingSpace = p.text.endsWith(" ") ? " " : "";
        return `${leadingSpace}[**${trimmed}**]${trailingSpace}`;
      }
      return p.text;
    })
    .join("");
}

/**
 * Generates the Markdown comparison report.
 */
export function generateMarkdownReport(data: BenchmarkRunReportData): string {
  const lines: string[] = [];

  lines.push(`# Chunking Model Benchmark Report`);
  lines.push(``);
  lines.push(`- **Run ID:** \`${data.runId}\``);
  lines.push(`- **Timestamp:** ${data.timestamp}`);
  lines.push(`- **Dataset Partition:** ${data.datasetPartition} (${data.totalParagraphs} practice paragraphs)`);
  lines.push(`- **Candidates Evaluated:** ${data.candidates.map((c) => c.candidateName).join(", ")}`);
  lines.push(`- **Sequential Pacing Delay:** ${data.sequentialDelayMs} ms`);
  lines.push(``);
  lines.push(`---`);
  lines.push(``);

  // 1. Executive Summary Scorecard Table
  lines.push(`## 1. Executive Summary Scorecard`);
  lines.push(``);
  lines.push(
    `| Candidate Model | Provider | Deployment | Pass Rate | Latency (p50) | Latency (p95) | Server p50 | Cost / 1k Runs |`
  );
  lines.push(
    `| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |`
  );

  for (const c of data.candidates) {
    const serverP50 = c.serverLatencyMs.p50 !== null ? `${c.serverLatencyMs.p50} ms` : "N/A";
    lines.push(
      `| **${c.candidateName}** | ${c.provider} | ${c.deploymentType} | **${c.passRatePercent}%** (${c.passedRuns}/${c.totalRuns}) | ${c.latencyMs.p50} ms | ${c.latencyMs.p95} ms | ${serverP50} | **$${c.costPer1kRunsUsd.toFixed(4)}** |`
    );
  }
  lines.push(``);

  // 2. Real-World Learner Cost Simulator
  lines.push(`## 2. Real-World Learner Cost Simulator`);
  lines.push(``);
  lines.push(
    `Projected costs across practice paragraph length tiers and active learner volumes (assumes 150 practice sessions per learner/month):`
  );
  lines.push(``);
  lines.push(`### Per-Session Cost by Paragraph Length Tier`);
  lines.push(``);
  lines.push(
    `| Candidate Model | Short (~150 chars) | Medium (~300 chars) | Long (~500 chars) | Ceiling (1,200 chars) |`
  );
  lines.push(`| :--- | :--- | :--- | :--- | :--- |`);

  for (const c of data.candidates) {
    const proj = data.costProjections[c.candidateId];
    if (proj) {
      const shortCost = proj.tiers.find((t) => t.tier === "short")?.costPerSessionUsd ?? 0;
      const medCost = proj.tiers.find((t) => t.tier === "medium")?.costPerSessionUsd ?? 0;
      const longCost = proj.tiers.find((t) => t.tier === "long")?.costPerSessionUsd ?? 0;
      const ceilCost = proj.tiers.find((t) => t.tier === "ceiling")?.costPerSessionUsd ?? 0;
      lines.push(
        `| **${c.candidateName}** | $${shortCost.toFixed(6)} | $${medCost.toFixed(6)} | $${longCost.toFixed(6)} | $${ceilCost.toFixed(6)} |`
      );
    }
  }
  lines.push(``);

  lines.push(`### Monthly Active Learner Projections`);
  lines.push(``);
  lines.push(
    `| Candidate Model | 100 Learners (15k calls) | 500 Learners (75k calls) | 1,000 Learners (150k calls) | 5,000 Learners (750k calls) |`
  );
  lines.push(`| :--- | :--- | :--- | :--- | :--- |`);

  for (const c of data.candidates) {
    const proj = data.costProjections[c.candidateId];
    if (proj) {
      const v100 = proj.volumes.find((v) => v.activeLearners === 100)?.monthlyCostUsd ?? 0;
      const v500 = proj.volumes.find((v) => v.activeLearners === 500)?.monthlyCostUsd ?? 0;
      const v1000 = proj.volumes.find((v) => v.activeLearners === 1000)?.monthlyCostUsd ?? 0;
      const v5000 = proj.volumes.find((v) => v.activeLearners === 5000)?.monthlyCostUsd ?? 0;
      lines.push(
        `| **${c.candidateName}** | $${v100.toFixed(2)} | $${v500.toFixed(2)} | $${v1000.toFixed(2)} | $${v5000.toFixed(2)} |`
      );
    }
  }
  lines.push(``);

  // 3. Latency & Token Breakdown
  lines.push(`## 3. Latency & Token Breakdown`);
  lines.push(``);
  lines.push(
    `| Candidate Model | Latency Min | Latency Max | Latency Mean | Avg Prompt Tokens | Avg Completion Tokens | Avg Cached Tokens |`
  );
  lines.push(`| :--- | :--- | :--- | :--- | :--- | :--- | :--- |`);

  for (const c of data.candidates) {
    lines.push(
      `| **${c.candidateName}** | ${c.latencyMs.min} ms | ${c.latencyMs.max} ms | ${c.latencyMs.mean} ms | ${c.tokenStats.avgPromptTokens} | ${c.tokenStats.avgCompletionTokens} | ${c.tokenStats.avgCachedTokens} |`
    );
  }
  lines.push(``);

  // 4. Failure & Outlier Details
  const failedResults = data.results.filter((r) => !r.validation.isValid || r.error !== null);
  lines.push(`## 4. Reliability & Validation Failures`);
  lines.push(``);

  if (failedResults.length === 0) {
    lines.push(`✅ Zero validation failures or errors observed across all model evaluations.`);
  } else {
    lines.push(`Found ${failedResults.length} failed invocation(s):`);
    lines.push(``);
    for (const f of failedResults) {
      lines.push(`- **Model:** \`${f.candidateId}\` | **Paragraph:** \`${f.paragraphId}\` (${f.paragraphTitle})`);
      for (const err of f.validation.errors) {
        lines.push(`  - ❌ ${err}`);
      }
      if (f.error) {
        lines.push(`  - ⚠️ System Error: ${f.error}`);
      }
    }
  }
  lines.push(``);

  // 5. Side-by-Side Chunk Inspections
  lines.push(`## 5. Side-by-Side Chunk Inspections`);
  lines.push(``);
  lines.push(
    `Compare how each candidate divided the text into Chunks and placed the Focus Word (indicated in **bold brackets**):`
  );
  lines.push(``);

  // Group by distinct paragraphs (sample up to 4 paragraphs)
  const sampleParagraphIds = Array.from(new Set(data.results.map((r) => r.paragraphId))).slice(0, 4);

  for (const pid of sampleParagraphIds) {
    const pResults = data.results.filter((r) => r.paragraphId === pid);
    const pFirst = pResults[0];
    lines.push(`### Paragraph \`${pid}\`: ${pFirst?.paragraphTitle ?? ""}`);
    lines.push(``);

    for (const r of pResults) {
      lines.push(`#### ${r.candidateId}`);
      if (r.parsed && r.parsed.chunks.length > 0) {
        lines.push(`- **Chunks (${r.parsed.chunks.length}):**`);
        r.parsed.chunks.forEach((chunk, idx) => {
          lines.push(`  ${idx + 1}. \`${formatChunkWithFocusWord(chunk).trim()}\``);
        });
      } else {
        lines.push(`- *Failed to produce valid chunks.*`);
      }
      lines.push(``);
    }
  }

  return lines.join("\n");
}

export interface SaveReportResult {
  readonly markdownPath: string;
  readonly jsonPath: string;
}

/**
 * Saves both timestamped Markdown and JSON artifacts in the destination directory.
 */
export function saveBenchmarkArtifacts(
  data: BenchmarkRunReportData,
  outputDir: string
): SaveReportResult {
  fs.mkdirSync(outputDir, { recursive: true });

  const datePrefix = data.runId;
  const markdownPath = path.join(outputDir, `${datePrefix}-report.md`);
  const jsonPath = path.join(outputDir, `${datePrefix}-data.json`);

  const markdownContent = generateMarkdownReport(data);
  fs.writeFileSync(markdownPath, markdownContent, "utf-8");

  const jsonContent = JSON.stringify(data, null, 2);
  fs.writeFileSync(jsonPath, jsonContent, "utf-8");

  return { markdownPath, jsonPath };
}
