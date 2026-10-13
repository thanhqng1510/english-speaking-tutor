import * as fs from "fs";
import * as path from "path";
import type {
  BenchmarkRunReportData,
  CandidateAggregateMetrics,
  CandidateCostProjection,
  CandidateModelId,
  Chunk,
  ModelInvocationResult,
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

export function renderReportHeader(data: BenchmarkRunReportData): string[] {
  return [
    `# Chunking Model Benchmark Report`,
    ``,
    `- **Run ID:** \`${data.runId}\``,
    `- **Timestamp:** ${data.timestamp}`,
    `- **Dataset Partition:** ${data.datasetPartition} (${data.totalParagraphs} practice paragraphs)`,
    `- **Candidates Evaluated:** ${data.candidates.map((c) => c.candidateName).join(", ")}`,
    `- **Sequential Pacing Delay:** ${data.sequentialDelayMs} ms`,
    ``,
    `---`,
    ``,
  ];
}

export function renderExecutiveSummarySection(candidates: readonly CandidateAggregateMetrics[]): string[] {
  const lines: string[] = [
    `## 1. Executive Summary Scorecard`,
    ``,
    `| Candidate Model | Provider | Deployment | Pass Rate | Latency (p50) | Latency (p95) | Server p50 | Cost / 1k Runs |`,
    `| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |`,
  ];

  for (const c of candidates) {
    const serverP50 = c.serverLatencyMs.p50 !== null ? `${c.serverLatencyMs.p50} ms` : "N/A";
    lines.push(
      `| **${c.candidateName}** | ${c.provider} | ${c.deploymentType} | **${c.passRatePercent}%** (${c.passedRuns}/${c.totalRuns}) | ${c.latencyMs.p50} ms | ${c.latencyMs.p95} ms | ${serverP50} | **$${c.costPer1kRunsUsd.toFixed(4)}** |`
    );
  }
  lines.push(``);
  return lines;
}

export function renderLearnerCostSimulatorSection(
  candidates: readonly CandidateAggregateMetrics[],
  costProjections: Record<CandidateModelId, CandidateCostProjection>
): string[] {
  const lines: string[] = [
    `## 2. Real-World Learner Cost Simulator`,
    ``,
    `Projected costs across practice paragraph length tiers and active learner volumes (assumes 150 practice sessions per learner/month):`,
    ``,
    `### Per-Session Cost by Paragraph Length Tier`,
    ``,
    `| Candidate Model | Short (~150 chars) | Medium (~300 chars) | Long (~500 chars) | Ceiling (1,200 chars) |`,
    `| :--- | :--- | :--- | :--- | :--- |`,
  ];

  for (const c of candidates) {
    const proj = costProjections[c.candidateId];
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

  for (const c of candidates) {
    const proj = costProjections[c.candidateId];
    if (proj) {
      const cost100Learners = proj.volumes.find((v) => v.activeLearners === 100)?.monthlyCostUsd ?? 0;
      const cost500Learners = proj.volumes.find((v) => v.activeLearners === 500)?.monthlyCostUsd ?? 0;
      const cost1000Learners = proj.volumes.find((v) => v.activeLearners === 1000)?.monthlyCostUsd ?? 0;
      const cost5000Learners = proj.volumes.find((v) => v.activeLearners === 5000)?.monthlyCostUsd ?? 0;
      lines.push(
        `| **${c.candidateName}** | $${cost100Learners.toFixed(2)} | $${cost500Learners.toFixed(2)} | $${cost1000Learners.toFixed(2)} | $${cost5000Learners.toFixed(2)} |`
      );
    }
  }
  lines.push(``);
  return lines;
}

export function renderLatencyAndTokenBreakdownSection(
  candidates: readonly CandidateAggregateMetrics[]
): string[] {
  const lines: string[] = [
    `## 3. Latency & Token Breakdown`,
    ``,
    `| Candidate Model | Latency Min | Latency Max | Latency Mean | Avg Prompt Tokens | Avg Completion Tokens | Avg Cached Tokens |`,
    `| :--- | :--- | :--- | :--- | :--- | :--- | :--- |`,
  ];

  for (const c of candidates) {
    lines.push(
      `| **${c.candidateName}** | ${c.latencyMs.min} ms | ${c.latencyMs.max} ms | ${c.latencyMs.mean} ms | ${c.tokenStats.avgPromptTokens} | ${c.tokenStats.avgCompletionTokens} | ${c.tokenStats.avgCachedTokens} |`
    );
  }
  lines.push(``);
  return lines;
}

export function renderReliabilitySection(results: readonly ModelInvocationResult[]): string[] {
  const lines: string[] = [];
  const failedResults = results.filter((r) => !r.validation.isValid || r.error !== null);

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

  const lengthOutliers = results.filter((r) => r.validation.chunkLengthIssues.length > 0);
  lines.push(`### Chunk Length Bounds Inspection`);
  lines.push(``);
  if (lengthOutliers.length === 0) {
    lines.push(`✅ All generated Chunks across all candidates fell within the 3–10 word target range.`);
  } else {
    const extremeOutliers = results.filter((r) => !r.validation.chunkLengthBoundsValid);
    if (extremeOutliers.length > 0) {
      lines.push(`⚠️ **Extreme Outliers (< 1 or > 15 words):** ${extremeOutliers.length} invocation(s) flagged.`);
    } else {
      lines.push(`Target range is 3–10 words (sweet spot 4–8 words). Outliers noted for human review:`);
    }
    lines.push(``);
    for (const item of lengthOutliers) {
      lines.push(`- **Model:** \`${item.candidateId}\` | **Paragraph:** \`${item.paragraphId}\``);
      for (const issue of item.validation.chunkLengthIssues) {
        lines.push(`  - Chunk ${issue.chunkIndex + 1} (${issue.wordCount} words, ${issue.issue}): "${issue.text}"`);
      }
    }
  }
  lines.push(``);
  return lines;
}

export function renderSideBySideInspectionsSection(results: readonly ModelInvocationResult[]): string[] {
  const lines: string[] = [
    `## 5. Side-by-Side Chunk Inspections`,
    ``,
    `Compare how each candidate divided the text into Chunks and placed the Focus Word (indicated in **bold brackets**):`,
    ``,
  ];

  const distinctParagraphIds = Array.from(new Set(results.map((r) => r.paragraphId)));

  for (const pid of distinctParagraphIds) {
    const pResults = results.filter((r) => r.paragraphId === pid);
    const pFirst = pResults[0];
    lines.push(`### Paragraph \`${pid}\`: ${pFirst?.paragraphTitle ?? ""}`);
    lines.push(``);

    for (const r of pResults) {
      lines.push(`#### ${r.candidateId}`);
      if (r.parsed && r.parsed.chunks.length > 0) {
        lines.push(`- **Chunks (${r.parsed.chunks.length}):**`);
        r.parsed.chunks.forEach((chunk, idx) => {
          lines.push(`  ${idx + 1}. ${formatChunkWithFocusWord(chunk).trim()}`);
        });
      } else {
        lines.push(`- *Failed to produce valid chunks.*`);
      }
      lines.push(``);
    }
  }

  return lines;
}

/**
 * Generates the Markdown comparison report by composing individual section renderers.
 */
export function generateMarkdownReport(data: BenchmarkRunReportData): string {
  const sections = [
    ...renderReportHeader(data),
    ...renderExecutiveSummarySection(data.candidates),
    ...renderLearnerCostSimulatorSection(data.candidates, data.costProjections),
    ...renderLatencyAndTokenBreakdownSection(data.candidates),
    ...renderReliabilitySection(data.results),
    ...renderSideBySideInspectionsSection(data.results),
  ];

  return sections.join("\n");
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
