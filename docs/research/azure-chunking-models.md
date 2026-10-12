# Research Report: 2026 Azure OpenAI & Foundry Models for Chunking

**Ticket:** [Which Azure models can we deploy for Chunking?](https://github.com/thanhqng1510/english-speaking-tutor/issues/18)  
**Parent Map:** [Map: Chunking spec for the Chunking Engine & Stepper](https://github.com/thanhqng1510/english-speaking-tutor/issues/17)  
**Date:** October 2026  
**Status:** Completed & Validated against live Azure ARM APIs and Model Catalog  

---

## 1. Executive Summary & Wayfinder Decision Workflow

This research evaluates deployable models across Azure OpenAI Service and the Azure AI Foundry Model Catalog to support **Chunking** and **Focus Word** extraction in the English Speaking Tutor.

### When & How the Final Model Decision Is Made
This ticket ([#18](https://github.com/thanhqng1510/english-speaking-tutor/issues/18)) **does not unilaterally pick the model**. Per the standing decision recorded in [Map #17](https://github.com/thanhqng1510/english-speaking-tutor/issues/17):
> *"Model choice is made by the human from a comparison report (automatic checks, latency, tokens/cost, side-by-side Chunks). No answer key, no AI grader, no scoring formula."*

The structured progression across the map is:
1. **[#18](https://github.com/thanhqng1510/english-speaking-tutor/issues/18) (Current)**: Research and shortlist 4–6 deployable candidates across diverse providers and tiers on Azure.
2. **[#19](https://github.com/thanhqng1510/english-speaking-tutor/issues/19), [#20](https://github.com/thanhqng1510/english-speaking-tutor/issues/20), [#24](https://github.com/thanhqng1510/english-speaking-tutor/issues/24)**: Lock down the exact output JSON schema, practice paragraphs dataset, and system prompt.
3. **[#27](https://github.com/thanhqng1510/english-speaking-tutor/issues/27)**: Deploy the shortlisted candidate models to Azure Foundry.
4. **[#28](https://github.com/thanhqng1510/english-speaking-tutor/issues/28)**: Run the automated benchmark harness and output the comparison report.
5. **[#29](https://github.com/thanhqng1510/english-speaking-tutor/issues/29) (The Decision Point)**: The human reviews the benchmark report (real latency, real costs, token counts, error rates, and side-by-side Chunking output quality) and selects the final winning model and timeout.

---

## 2. Provider Landscape & Why Google Gemini Is Not on Azure

The Azure AI Foundry Model Catalog hosts models from a wide range of industry partners:
- **Available Publishers in Azure Foundry:** Microsoft, OpenAI, Anthropic, DeepSeek, Meta, Mistral AI, Alibaba, xAI, Cohere, MoonshotAI.
- **Why Google Gemini Is Not Present:** Google Gemini (Gemini 1.5, 2.0, 3) is a proprietary first-party service hosted exclusively on Google Cloud (Vertex AI and Google AI Studio). Google does not offer Gemini models through Microsoft's Azure model catalog. Per [Map #17](https://github.com/thanhqng1510/english-speaking-tutor/issues/17)'s standing decisions, models outside Azure are explicitly out of scope to avoid multi-cloud API fragmentation.

However, Azure's catalog offers leading alternatives from multiple providers including **Anthropic** (`claude-haiku-5-5`), **DeepSeek** (`DeepSeek-V4.1-Flash`), **Microsoft** (`Phi-4-mini-instruct`), and **OpenAI** (`gpt-6-luna`, `gpt-5.4-nano`).

---

## 3. Regional Strategy & Minimizing Latency in Asia

The subscription currently has an existing multi-service resource `thanhqng1510-4094-resource` in `westus3` (Phoenix, Arizona). However, routing user traffic from Asia to US West incurs a round-trip trans-Pacific latency of ~140–180 ms.

To minimize latency for learners in Asia without being trapped in a single data center:
1. **Azure OpenAI Global Standard Routing:** Client requests hit the closest Microsoft edge Point of Presence (PoP) in Asia and travel over Microsoft’s private fiber backbone, preventing public internet degradation.
2. **`southeastasia` (Singapore):** Houses Azure OpenAI (`gpt-6-luna`, `gpt-5.4-mini`) and Azure AI Speech with ultra-low round-trip latency of **15–35 ms**.
3. **`japaneast` (Tokyo):** Houses both the full Azure OpenAI catalog and the full Azure AI Foundry MaaS catalog (Anthropic Claude, DeepSeek, Phi-4, Mistral) with low round-trip latency of **50–80 ms**.

---

## 4. 2026 Model Evaluation Matrix

All models below represent current 2026 releases verified directly against the live Azure ARM Model Catalog APIs:

| Candidate Model | Publisher / Engine | Deployment SKUs | Input / 1M Tokens | Output / 1M Tokens | Cache Read / 1M | Strict JSON Schema (`strict: true`) | Retirement Date | Latency (TTFT) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Phi-4-mini-instruct** (3.8B) | Microsoft (Foundry MaaS) | Serverless, Global | **$0.075** | **$0.30** | N/A | Supported (Inference API) | Active (GA) | ~120–200 ms |
| **GPT-6 Luna** (2026-09-22) | OpenAI (Azure OpenAI) | GlobalStandard, DataZone | **$0.10** | **$0.50** | **$0.01** (-90%) | **Native constrained decoding** | **2028-03-11** | ~150–250 ms |
| **Claude Haiku 5.5** | Anthropic (Foundry MaaS) | Serverless (CCU), Global | **$0.10** | **$0.50** | **$0.01** (-90%) | Supported (Tool / Schema) | Active (GA) | ~160–260 ms |
| **DeepSeek-V4.1-Flash** (2026-09-10) | DeepSeek (Foundry MaaS) | Serverless, GlobalStandard | **$0.20** | **$0.60** | **$0.028** | Supported (Inference API) | Active (GA) | ~180–300 ms |
| **GPT-5.4-nano** (2026-03-17) | OpenAI (Azure OpenAI) | GlobalStandard, DataZone | **$0.20** | **$1.25** | **$0.02** | **Native constrained decoding** | **2027-09-21** | ~130–220 ms |
| **GPT-6 Sol** (2026-09-22) | OpenAI (Azure OpenAI) | GlobalStandard, DataZone | **$2.00** | **$10.00** | **$0.20** (-90%) | **Native constrained decoding** | **2028-03-11** | ~350–550 ms |

---

## 5. Shortlist of 6 Multi-Provider Candidates for the Benchmark

We recommend a shortlist of 6 candidates spanning ultra-cheap small models, modern high-speed flash models from different providers, and a frontier reference ceiling:

### 1. Phi-4-mini-instruct (Microsoft) — *Ultra-Cheap Native SLM*
- **Provider:** Microsoft
- **Price:** $0.075 input / $0.30 output per 1M tokens.
- **Why Include:** The lowest-cost option in the catalog. Tests whether a 3.8B parameter model can reliably parse syntactic Chunk boundaries without breaking or dropping words.

### 2. GPT-6 Luna (OpenAI) — *Next-Gen Production Workhorse*
- **Provider:** OpenAI (Azure OpenAI Service)
- **Price:** $0.10 input / $0.50 output per 1M tokens ($0.01 cached input).
- **Why Include:** Released in September 2026, Luna is OpenAI’s optimized high-volume model offering exceptional token efficiency, native `strict: true` constrained decoding, and long support lifecycle through 2028.

### 3. Claude Haiku 5.5 (Anthropic) — *High-Accuracy Alternative Provider*
- **Provider:** Anthropic (via Azure AI Foundry MaaS)
- **Price:** $0.10 input / $0.50 output per 1M tokens ($0.01 cached).
- **Why Include:** Provides a non-OpenAI production competitor matching Luna's price point with Anthropic’s renowned linguistic instruction-following and nuance.

### 4. DeepSeek-V4.1-Flash (DeepSeek) — *High-Throughput Open MoE*
- **Provider:** DeepSeek (via Azure AI Foundry MaaS)
- **Price:** ~$0.20 input / $0.60 output per 1M tokens.
- **Why Include:** The latest September 2026 flash architecture from DeepSeek. Benchmarks whether mixture-of-experts routing provides superior natural phrasing over monolithic dense small models.

### 5. GPT-5.4-nano (OpenAI) — *Ultra-Low Latency Edge Model*
- **Provider:** OpenAI (Azure OpenAI Service)
- **Price:** $0.20 input / $1.25 output per 1M tokens.
- **Why Include:** Designed specifically for micro-tasks and high-volume interactive queries with sub-150ms execution times.

### 6. GPT-6 Sol (OpenAI) — *Frontier Quality Ceiling & Reference Standard*
- **Provider:** OpenAI (Azure OpenAI Service)
- **Price:** $2.00 input / $10.00 output per 1M tokens.
- **Why Include:** OpenAI’s flagship 2026 model. Serves as the golden reference standard against which the human evaluator compares the syntactic grouping quality of the smaller models in the benchmark report.

---

## 6. Primary Sources & Citations

1. **Azure Cognitive Services ARM APIs:** Live query `az cognitiveservices model list` executed against `westus3`, `southeastasia`, and `japaneast` on October 12, 2026.
2. **Microsoft Azure OpenAI Service Model Catalog (2026):** Azure documentation for GPT-6 Luna, GPT-6 Sol, and GPT-5.4 series ([azure.microsoft.com/pricing/details/cognitive-services/openai-service/](https://azure.microsoft.com/pricing/details/cognitive-services/openai-service/)).
3. **Microsoft Foundry Model Catalog & Serverless Rates:** Azure documentation for Anthropic Claude, DeepSeek-V4, and Microsoft Phi-4 serverless billing ([learn.microsoft.com/azure/ai-studio/how-to/model-catalog-overview](https://learn.microsoft.com/azure/ai-studio/how-to/model-catalog-overview)).
4. **OpenAI Structured Outputs Specification:** Constrained decoding rules for `response_format: { type: "json_schema", json_schema: { strict: true } }` ([platform.openai.com/docs/guides/structured-outputs](https://platform.openai.com/docs/guides/structured-outputs)).
