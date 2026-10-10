# English Speaking Tutor

An intelligent, interactive web application for learning and mastering English pronunciation, prosody, and speaking fluency.

## Overview

The English Speaking Tutor goes beyond simple text-to-speech repetition. It creates a closed-loop pronunciation practice laboratory that pairs native speech synthesis with speech assessment and articulatory feedback.

### Key Capabilities
- **Neural Text-to-Speech (TTS):** Native pronunciation across regional English accents (US, UK, Australia, etc.) powered by Microsoft Azure AI Speech.
- **Synchronized Karaoke Highlighting:** Real-time, word-level synchronized text highlighting at 60 FPS using exact word boundary timestamps.
- **Prosodic Thought-Group Chunking:** Natural breath-group phrase breakdown for cognitive load management.
- **Acoustic Pronunciation Assessment:** Forced-alignment scoring of Accuracy, Fluency, Completeness, and Prosody (intonation) via Azure AI Speech Pronunciation Assessment.
- **In-Browser Audio Capture:** Real-time 16 kHz Linear PCM audio streaming via `AudioWorklet`.
- **A/B Synchronized Audio Comparison:** Instantaneous toggle between native model and user recording for perceptual contrast.
- **Visual Pitch Contour:** Fundamental frequency ($F_0$) extraction (YIN algorithm) aligned with native speech models via Dynamic Time Warping (DTW).
- **Connected Speech Coaching:** Visual indicators for linking, elision, assimilation, and stress-timing.
- **AI Articulatory Feedback:** LLM-generated physical tongue and lip placement guidance for corrected pronunciation.

## Research & Documentation

Comprehensive architectural blueprints, API comparisons, and linguistic foundations are documented in:
- [`docs/research/english-speaking-tutor-feasibility-and-extensions.md`](docs/research/english-speaking-tutor-feasibility-and-extensions.md)

## Development Roadmap

- [ ] **Phase 1 (MVP):** Text input, Azure Neural TTS proxy, 60 FPS karaoke highlighting, AudioWorklet recording, Azure Pronunciation Assessment scoring, and A/B audio player.
- [ ] **Phase 2 (Advanced):** YIN + DTW pitch contour visualizer, connected speech markup, and LLM biomechanical articulatory coaching.
- [ ] **Phase 3 (Vision):** FSRS phoneme mastery matrix, 3D viseme lip-sync avatar, and spontaneous speaking mode.

## License

Private / Proprietary
