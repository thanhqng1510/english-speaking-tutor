# Agent Guidelines: English Speaking Tutor

This file provides context and operational guidelines for AI agents working in this repository.

## Agent skills

### Issue tracker

Issues are tracked on GitHub using the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Standard 5-role triage vocabulary (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context repository layout (`GLOSSARY.md` and `docs/adr/` at root). See `docs/agents/domain.md`.

## Developer Preferences & Workflow Rules

### 1. Ephemeral Teaching Scratchpads
- Treat all interactive teaching sessions (`/teach`) as ephemeral scratchpads.
- Always generate teaching files, lessons, notes, and mission files in an external temporary directory (e.g. `/tmp` or agent scratchpad).
- Never create or commit teaching files directly inside this repository.

### 2. Git Branch & Safety Policy
- Never commit or push directly to `main`.
- Always develop on a dedicated feature branch named after the ticket/feature (e.g. `feat/<issue-number>-<slug>`) and open a pull request.

### 3. Early-Stage Documentation Restraint
- During exploratory, research, or discovery phases, keep project `README.md` and documentation minimal, lean, and strictly aligned with the current verified state.
- Avoid speculative roadmaps, premature architecture diagrams, or concrete implementation code snippets until explicitly reviewed and agreed upon.

### 4. Prioritize Native Platform & Cloud SDK Capabilities
- Leverage native built-in platform or cloud SDK capabilities (e.g. Azure AI Speech native VAD/endpointing) before proposing bespoke client-side algorithms.
- Avoid over-engineering — UI features, fallback paths, or evaluation methods — unless standard and explicitly requested. Prefer surfacing a clear error over a bespoke fallback.
- When a choice needs judgement (e.g. picking a model), prefer producing a clear comparison report for the human to decide over building automated scoring.

### 5. Plain Domain Language
- Name domain concepts (glossary terms, UI labels, ticket titles, schema fields) in plain everyday English a learner would understand.
- Avoid academic or linguistics jargon (e.g. "thought group", "nuclear stress") even when research sources use it; if a plain word collides with an existing term, flag the collision and propose an alternative rather than falling back to jargon.

## Skill Adjustments

Project-specific additions to community skills. Apply them on top of the skill's own instructions.

### grilling
- Open each question with the problem it solves, in plain words, before any options or jargon. If the question exists because of a technical constraint, say so in one sentence ("to pick a model we must judge output quality; who judges?"). Use a concrete example where the trade-off is abstract.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
