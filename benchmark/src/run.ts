import * as path from "path";
import { getParagraphs, type DatasetPartition, type PracticeParagraph } from "../dataset";
import { getCandidateConfig } from "./candidates";
import { invokeCandidateModel } from "./client";
import { aggregateCandidateMetrics, calculateLearnerCostProjections } from "./metrics";
import { saveBenchmarkArtifacts } from "./reporter";
import type {
  BenchmarkRunReportData,
  CandidateAggregateMetrics,
  CandidateCostProjection,
  CandidateModelId,
  ModelInvocationResult,
} from "./types";

export interface BenchmarkRunnerConfig {
  readonly partition: DatasetPartition | "all";
  readonly candidateIds: readonly CandidateModelId[];
  readonly delayMs: number;
  readonly dryRun: boolean;
  readonly limit?: number;
  readonly outputDir: string;
  readonly clientOptions?: import("./client").ModelClientOptions;
}

export function parseCliArguments(args: string[]): BenchmarkRunnerConfig {
  let partition: DatasetPartition | "all" = "evaluation";
  let candidateIds: CandidateModelId[] = [
    "phi-4-mini-instruct",
    "gpt-6-luna",
    "claude-haiku-5-5",
    "deepseek-v4-1-flash",
    "gpt-5-4-nano",
    "gpt-6-sol",
  ];
  let delayMs = 200;
  let dryRun = false;
  let limit: number | undefined;
  let outputDir = path.resolve(process.cwd(), "benchmark/reports/runs");

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--dry-run") {
      dryRun = true;
    } else if (arg === "--set" && i + 1 < args.length) {
      const val = args[++i];
      if (val === "tuning" || val === "evaluation" || val === "all") {
        partition = val;
      }
    } else if (arg === "--models" && i + 1 < args.length) {
      candidateIds = args[++i].split(",").map((s) => s.trim()) as CandidateModelId[];
    } else if (arg === "--delay" && i + 1 < args.length) {
      delayMs = parseInt(args[++i], 10) || 0;
    } else if (arg === "--limit" && i + 1 < args.length) {
      limit = parseInt(args[++i], 10) || undefined;
    } else if (arg === "--out-dir" && i + 1 < args.length) {
      outputDir = path.resolve(process.cwd(), args[++i]);
    }
  }

  return {
    partition,
    candidateIds,
    delayMs,
    dryRun,
    limit,
    outputDir,
  };
}

export function formatTimestamp(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  const yyyy = date.getFullYear();
  const mm = pad(date.getMonth() + 1);
  const dd = pad(date.getDate());
  const hh = pad(date.getHours());
  const min = pad(date.getMinutes());
  return `${yyyy}-${mm}-${dd}-${hh}${min}`;
}

export async function runBenchmark(config: BenchmarkRunnerConfig): Promise<BenchmarkRunReportData> {
  const startTime = new Date();
  const runId = formatTimestamp(startTime);

  console.log(`=======================================================`);
  console.log(` English Speaking Tutor: Chunking Benchmark Harness`);
  console.log(`=======================================================`);
  console.log(`Mode:       ${config.dryRun ? "DRY-RUN (Plan Verification Only)" : "LIVE AZURE INFERENCE"}`);
  console.log(`Dataset:    ${config.partition} partition`);
  console.log(`Candidates: ${config.candidateIds.join(", ")}`);
  console.log(`Delay:      ${config.delayMs} ms between invocations`);
  console.log(`Output:     ${config.outputDir}`);
  console.log(`-------------------------------------------------------`);

  let paragraphs: readonly PracticeParagraph[] =
    config.partition === "all"
      ? getParagraphs()
      : getParagraphs({ set: config.partition });

  if (config.limit && config.limit > 0) {
    paragraphs = paragraphs.slice(0, config.limit);
  }

  console.log(`Loaded ${paragraphs.length} practice paragraphs.`);

  if (config.dryRun) {
    console.log(`\n✔ Dry-run execution plan verified:`);
    console.log(`  - Candidates: ${config.candidateIds.join(", ")} (${config.candidateIds.length} models)`);
    console.log(`  - Dataset partition: ${config.partition} (${paragraphs.length} paragraphs)`);
    console.log(`  - Planned API calls: ${config.candidateIds.length * paragraphs.length}`);
    console.log(`  - Pacing delay: ${config.delayMs} ms`);
    console.log(`  - Output directory: ${config.outputDir}`);
    console.log(`  (No network calls were made and no costs were incurred.)\n`);

    return {
      runId,
      timestamp: startTime.toISOString(),
      datasetPartition: config.partition,
      totalParagraphs: paragraphs.length,
      sequentialDelayMs: config.delayMs,
      candidates: [],
      costProjections: {} as Record<CandidateModelId, CandidateCostProjection>,
      results: [],
    };
  }

  const allResults: ModelInvocationResult[] = [];

  for (const candidateId of config.candidateIds) {
    const modelConfig = getCandidateConfig(candidateId);
    console.log(`\n▶ Evaluating candidate: ${modelConfig.name} (${modelConfig.provider})`);

    let candidatePasses = 0;

    for (let pIdx = 0; pIdx < paragraphs.length; pIdx++) {
      const paragraph = paragraphs[pIdx];
      process.stdout.write(
        `  [${pIdx + 1}/${paragraphs.length}] ${paragraph.id.padEnd(16)} (${paragraph.characterCount}c, ${paragraph.lengthTier}) ... `
      );

      const result = await invokeCandidateModel(candidateId, paragraph, config.clientOptions);

      allResults.push(result);

      if (result.validation.isValid) {
        candidatePasses++;
        console.log(`✓ PASS (${result.roundTripMs} ms, $${result.costUsd.toFixed(6)})`);
      } else {
        console.log(`✗ FAIL (${result.roundTripMs} ms)`);
        for (const err of result.validation.errors) {
          console.log(`    - ${err}`);
        }
      }

      if (config.delayMs > 0 && pIdx < paragraphs.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, config.delayMs));
      }
    }

    const passRate = Math.round((candidatePasses / paragraphs.length) * 100);
    console.log(`  Candidate summary: ${candidatePasses}/${paragraphs.length} passed (${passRate}%)`);
  }

  // Aggregate metrics and cost projections
  const candidateMetrics: CandidateAggregateMetrics[] = [];
  const costProjections = {} as Record<CandidateModelId, CandidateCostProjection>;

  for (const cId of config.candidateIds) {
    const modelConfig = getCandidateConfig(cId);
    const candidateResults = allResults.filter((r) => r.candidateId === cId);
    candidateMetrics.push(aggregateCandidateMetrics(modelConfig, candidateResults));
    costProjections[cId] = calculateLearnerCostProjections(modelConfig, candidateResults);
  }

  const reportData: BenchmarkRunReportData = {
    runId,
    timestamp: startTime.toISOString(),
    datasetPartition: config.partition,
    totalParagraphs: paragraphs.length,
    sequentialDelayMs: config.delayMs,
    candidates: candidateMetrics,
    costProjections,
    results: allResults,
  };

  const { markdownPath, jsonPath } = saveBenchmarkArtifacts(reportData, config.outputDir);

  console.log(`\n-------------------------------------------------------`);
  console.log(`✔ Benchmark Complete!`);
  console.log(`  Markdown report: ${markdownPath}`);
  console.log(`  Raw JSON data:   ${jsonPath}`);
  console.log(`=======================================================\n`);

  return reportData;
}

// Direct execution entrypoint
if (typeof process !== "undefined" && process.argv && process.argv[1]?.includes("benchmark/src/run.ts")) {
  const config = parseCliArguments(process.argv.slice(2));
  runBenchmark(config).catch((err) => {
    console.error("Benchmark failed with error:", err);
    process.exit(1);
  });
}
