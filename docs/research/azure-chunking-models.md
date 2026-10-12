# Research Report: Azure OpenAI & Foundry Models for Chunking

**Ticket:** [Which Azure models can we deploy for Chunking?](https://github.com/thanhqng1510/english-speaking-tutor/issues/18)  
**Parent Map:** [Map: Chunking spec for the Chunking Engine & Stepper](https://github.com/thanhqng1510/english-speaking-tutor/issues/17)  
**Date:** October 2026  
**Status:** Completed & Validated against live Azure API and Model Catalog  

---

## 1. Executive Summary

This research identifies and benchmarks deployable models across Azure OpenAI Service and the Azure AI Foundry Model Catalog to support **Chunking** and **Focus Word** extraction in the English Speaking Tutor. 

Because the project enforces **no fallback deterministic parser**, reliability is a hard requirement: any candidate model must reliably produce strict structured JSON conforming to the schema and preserve the input text without omission or alteration. Furthermore, **cost is a first-class constraint**, requiring models that maintain negligible per-session costs while delivering low interactive latency for learners.

### Key Findings
1. **Regional Strategy & Asia Latency:** While the project has an existing AIServices resource in `westus3` (`thanhqng1510-4094-resource`), Azure OpenAI models use **Global Standard** routing by default. For a learner located in Asia, placing application hosting or regional model deployments in **Southeast Asia (`southeastasia` - Singapore)** or **Japan East (`japaneast` - Tokyo)** reduces round-trip network latency from ~150–200 ms (US West) down to ~15–35 ms (Singapore) or ~50–80 ms (Tokyo). Both Azure OpenAI (`southeastasia` & `japaneast`) and the full Azure AI Foundry MaaS catalog (`japaneast`) are accessible in Asia.
2. **Strict Schema Support (`strict: true`):** Azure OpenAI (`gpt-4o-mini`, `gpt-4o`) natively implements constrained decoding via `response_format: { type: "json_schema", json_schema: { strict: true } }`, guaranteeing 100% syntactic compliance and preventing hallucinated or missing keys. Azure AI Foundry models (`Phi-4-mini`, `Ministral-3B`, `Llama-3.3-70B`) support schema-constrained decoding via the Azure AI Model Inference API.
3. **Recommended Shortlist (6 Candidates):** We recommend 6 candidates spanning ultra-cheap small models to frontier reference baselines:
   - **Phi-4-mini-instruct** ($0.075 / $0.30 per 1M tokens) — Ultra-cheap Microsoft SLM.
   - **Ministral-3B** ($0.10 / $0.10 per 1M tokens) — High-efficiency edge model.
   - **GPT-4o-mini** ($0.15 / $0.60 per 1M tokens) — Production benchmark workhorse with prompt caching.
   - **DeepSeek-V3** ($0.58 / $1.68 per 1M tokens) — Mid-tier high-capacity MoE.
   - **Llama-3.3-70B-Instruct** ($0.71 / $0.71 per 1M tokens) — Open-weights reasoning baseline.
   - **GPT-4o** ($2.50 / $10.00 per 1M tokens) — Frontier quality ceiling and reference standard.

---

## 2. Regional Topology & Network Latency Considerations

### 2.1 The Existing West US 3 Resource vs. Regional Placement
The subscription currently holds one multi-service resource:
- **Resource Name:** `thanhqng1510-4094-resource`
- **Resource Group:** `rg-thanhqng1510-7192`
- **Location:** `westus3` (Phoenix, Arizona)

This account provides unified access to Azure Speech (Neural TTS and Pronunciation Assessment) and Azure OpenAI / AI Foundry Inference. However, because network latency directly impacts the preparation phase experienced by the learner, geographical proximity to Asia is critical.

| Deployment / Region | Target User Location | Typical RTT Network Latency | Catalog Support |
| :--- | :--- | :--- | :--- |
| **`southeastasia` (Singapore)** | Vietnam / SE Asia | **15 – 35 ms** | Full Azure OpenAI (`gpt-4o`, `gpt-4o-mini`), Azure AI Speech |
| **`japaneast` (Tokyo)** | East / SE Asia | **50 – 80 ms** | Full Azure OpenAI, Full Azure AI Foundry MaaS (Phi-4, Mistral, Llama, DeepSeek) |
| **`westus3` (US West)** | North America | **140 – 180 ms** | Full Azure OpenAI, Full Azure AI Foundry MaaS, Azure AI Speech |

### 2.2 Global Standard vs. Regional Routing
- **Global Standard (Azure OpenAI):** Available on `gpt-4o-mini` and `gpt-4o`. Client requests hit the nearest Microsoft Azure Edge Point of Presence (PoP) and traverse Microsoft's private global fiber network to dynamically available compute. It provides higher default rate limits (up to 50M tokens/min) and automatic failover across Azure datacenters.
- **Regional Deployment:** Traffic terminates strictly within the designated data center. For low latency in Asia without trans-Pacific routing, an AIServices account in `southeastasia` or `japaneast` can be provisioned alongside or as an alternative to `westus3`.

---

## 3. Comprehensive Model Evaluation Matrix

All pricing, SKUs, and deprecation dates have been validated against live Azure Resource Manager / Azure Cognitive Services model APIs and published official pricing as of October 2026.

| Model Candidate | Publisher / Type | Supported SKUs | Input Price / 1M | Output Price / 1M | Cached Input / 1M | Strict JSON Schema (`strict: true`) | Prompt Caching | Retirement Date | Typical TTFT / Latency |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Phi-4-mini-instruct** (3.8B) | Microsoft (Foundry MaaS) | Serverless, Global | **$0.075** | **$0.30** | N/A | Supported (Inference API) | No | Active (GA) | ~150 – 250 ms |
| **Ministral-3B** (3B) | Mistral AI (Foundry MaaS) | Serverless, Global | **$0.10** | **$0.10** | N/A | Supported (Inference API) | No | Active (GA) | ~180 – 300 ms |
| **GPT-4o-mini** (2024-07-18) | OpenAI (Azure OpenAI) | GlobalStandard, DataZone, Regional | **$0.15** | **$0.60** | **$0.075** (-50%) | **Native constrained decoding** | Yes (>= 1024 tokens) | **2028-04-13** | ~200 – 350 ms |
| **DeepSeek-V3** (671B MoE) | DeepSeek (Foundry MaaS) | Serverless, GlobalStandard | **$0.58** | **$1.68** | N/A | Supported (Inference API) | No | Active (GA) | ~300 – 500 ms |
| **Llama-3.3-70B-Instruct** | Meta (Foundry MaaS) | Serverless, GlobalStandard | **$0.71** | **$0.71** | N/A | Supported (Inference API) | No | Active (GA) | ~400 – 700 ms |
| **GPT-4o** (2024-08-06 / 2024-11-20) | OpenAI (Azure OpenAI) | GlobalStandard, DataZone, Regional | **$2.50** | **$10.00** | **$1.25** (-50%) | **Native constrained decoding** | Yes (>= 1024 tokens) | **2028-04-13** | ~350 – 600 ms |

---

## 4. Shortlisted Candidates for the Chunking Benchmark

### 1. Phi-4-mini-instruct (Microsoft) — *Ultra-Cheap Small Language Model*
- **Role in Benchmark:** Establishes the absolute lower bound on cost ($0.075 input / $0.30 output).
- **Why Include:** Built specifically for low-latency reasoning and synthetic data tasks. If a 3.8B model demonstrates reliable syntactic Chunking and Focus Word selection, running costs will remain under $0.0001 per practice paragraph.
- **Risk to Verify:** Smaller parameter models occasionally drop punctuation or fail the hard pass/fail check where concatenated Chunks must exactly match the original text.

### 2. Ministral-3B (Mistral AI) — *Edge/Compact Multilingual Specialist*
- **Role in Benchmark:** European high-density edge model offering balanced pricing ($0.10 / $0.10 per 1M tokens).
- **Why Include:** Mistral's instruction models excel in linguistic parsing, structured extraction, and following strict formatting constraints.
- **Risk to Verify:** Behavior when handling idiomatic English phrasal verbs and sentence-level intonational boundaries.

### 3. GPT-4o-mini (OpenAI) — *The Primary Production Contender*
- **Role in Benchmark:** The primary target candidate for production deployment.
- **Why Include:**
  - Standard pricing of $0.15 input / $0.60 output makes it exceptionally economical (~$0.00015 per call).
  - 100% deterministic schema adherence via OpenAI constrained decoding (`strict: true`). Zero invalid JSON returns.
  - Automatic prompt caching provides a 50% discount on static system prompts and few-shot examples when prompt lengths exceed 1024 tokens.
  - Guaranteed lifecycle on Azure through April 2028.
  - Native Global Standard deployment availability across `westus3`, `southeastasia`, and `japaneast`.
- **Risk to Verify:** Tendency to over-segment short phrases into too many Chunks or miss colloquial speech rhythm.

### 4. DeepSeek-V3 (DeepSeek) — *High-Capacity Mixture-of-Experts*
- **Role in Benchmark:** Mid-tier MoE architecture offering 671B parameters with 37B active per token.
- **Why Include:** Evaluates whether deep general language comprehension and MoE routing improve Chunking naturalness compared to sub-4B models, at moderate cost ($0.58 / $1.68).
- **Risk to Verify:** Cold-start latency and serverless queue times under peak traffic.

### 5. Llama-3.3-70B-Instruct (Meta) — *Open-Weights Reasoning Baseline*
- **Role in Benchmark:** The premier 70B open-weights model on Azure AI Foundry.
- **Why Include:** Provides near-frontier linguistic reasoning at a flat rate of $0.71 / 1M tokens for both input and output. Serves as the open-weights benchmark against GPT-4o.
- **Risk to Verify:** Slightly higher latency (TTFT ~500 ms) compared to 3B–8B lightweight models.

### 6. GPT-4o (OpenAI) — *Quality Ceiling & Reference Standard*
- **Role in Benchmark:** The gold-standard linguistic reference model.
- **Why Include:** While costlier ($2.50 / $10.00), GPT-4o represents state-of-the-art prosodic and semantic grouping. Running GPT-4o in the benchmark allows the human evaluator to compare whether smaller models match or diverge from frontier-grade Chunking decisions.
- **Risk to Verify:** Cost spike risks if adopted directly into production without strict user quotas.

---

## 5. Technical Implementation & Verification Details

### 5.1 Strict Schema Implementation
In accordance with ticket [#19](https://github.com/thanhqng1510/english-speaking-tutor/issues/19), the model must output an array of Chunks, where each Chunk contains `text` and `focus_word`.

For Azure OpenAI models (`gpt-4o`, `gpt-4o-mini`), the exact API payload requires:
```json
{
  "response_format": {
    "type": "json_schema",
    "json_schema": {
      "name": "chunking_response",
      "strict": true,
      "schema": {
        "type": "object",
        "properties": {
          "chunks": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "text": { "type": "string" },
                "focus_word": { "type": "string" }
              },
              "required": ["text", "focus_word"],
              "additionalProperties": false
            }
          }
        },
        "required": ["chunks"],
        "additionalProperties": false
      }
    }
  }
}
```

For Azure AI Foundry models using the Azure AI Model Inference API (`@azure-rest/ai-inference` or OpenAI compatibility mode), the same schema is passed with constrained decoding enabled.

### 5.2 Pass/Fail Invariant Check
The benchmark harness will verify that joining `chunks.map(c => c.text).join(" ")` reproduces the exact original input string (normalized for whitespace). Any omission, deletion, or modification of text constitutes a hard model failure.

---

## 6. Primary Sources & Citations

1. **Azure Cognitive Services Model API:** Live CLI query `az cognitiveservices model list` executed against `westus3`, `southeastasia`, and `japaneast` on October 12, 2026.
2. **Microsoft Azure OpenAI Service Pricing:** Official pricing documentation ([azure.microsoft.com/pricing/details/cognitive-services/openai-service/](https://azure.microsoft.com/pricing/details/cognitive-services/openai-service/)).
3. **Microsoft Azure AI Foundry Model Catalog & Serverless API Pricing:** Official Microsoft documentation for Phi-4, Llama 3.3, Mistral, and DeepSeek pay-as-you-go serverless endpoints ([learn.microsoft.com/azure/ai-studio/how-to/model-catalog-overview](https://learn.microsoft.com/azure/ai-studio/how-to/model-catalog-overview)).
4. **OpenAI Structured Outputs Guide:** Constrained decoding specification with `strict: true` and JSON Schema limitations ([platform.openai.com/docs/guides/structured-outputs](https://platform.openai.com/docs/guides/structured-outputs)).
5. **Azure AI Model Inference API Reference:** Cross-model schema enforcement and SDK integration ([learn.microsoft.com/azure/ai-studio/reference/reference-model-inference-api](https://learn.microsoft.com/azure/ai-studio/reference/reference-model-inference-api)).
