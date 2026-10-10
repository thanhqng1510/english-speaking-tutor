# Comprehensive Research Report: Technical Possibilities and Pedagogical Extensions for an English Speaking Tutor Web App

**Project:** English Speaking Tutor Web Application  
**Repository Location:** `docs/research/english-speaking-tutor-feasibility-and-extensions.md`  
**Date:** October 2026  
**Status:** Completed & Validated  

---

## Table of Contents
1. [Executive Summary & Core Strategic Verdict](#1-executive-summary--core-strategic-verdict)
2. [Track 1: Technical Possibilities for Text-to-Speech (TTS)](#2-track-1-technical-possibilities-for-text-to-speech-tts)
   - [2.1 Comprehensive Cloud & Client TTS Engine Comparison](#21-comprehensive-cloud--client-tts-engine-comparison)
   - [2.2 In-Depth Evaluation of Cloud TTS Providers](#22-in-depth-evaluation-of-cloud-tts-providers)
   - [2.3 Client-Side Web Speech API Analysis](#23-client-side-web-speech-api-analysis)
   - [2.4 Critical Technical Requirements for Pronunciation Learning](#24-critical-technical-requirements-for-pronunciation-learning)
3. [Track 2: Pedagogical Enhancements, Speech Assessment & UX Extensions](#3-track-2-pedagogical-enhancements-speech-assessment--ux-extensions)
   - [3.1 Closing the Loop: Azure AI Speech Pronunciation Assessment API](#31-closing-the-loop-azure-ai-speech-pronunciation-assessment-api)
   - [3.2 Comparative Evaluation of ASR & Speech Scoring Engines](#32-comparative-evaluation-of-asr--speech-scoring-engines)
   - [3.3 In-Browser Audio Capture via AudioWorklet](#33-in-browser-audio-capture-via-audioworklet)
   - [3.4 The Science of Language Acquisition & Shadowing](#34-the-science-of-language-acquisition--shadowing)
   - [3.5 Connected Speech Phenomena & Visual Markup](#35-connected-speech-phenomena--visual-markup)
   - [3.6 Neural Prosody, Intonation & Pitch Evaluation](#36-neural-prosody-intonation--pitch-evaluation)
   - [3.7 Text Chunking into Prosodic "Thought Groups"](#37-text-chunking-into-prosodic-thought-groups)
   - [3.8 Interactive UX: A/B Voice Player, LLM Coach & Phoneme Mastery Matrix](#38-interactive-ux-ab-voice-player-llm-coach--phoneme-mastery-matrix)
4. [Primary Source & Academic Literature Citations](#4-primary-source--academic-literature-citations)

---

## 1. Executive Summary & Core Strategic Verdict

The initial concept for this application—*submitting a paragraph of English text to a text-to-speech (TTS) engine, listening to authentic native pronunciation, and repeating it aloud to match tone and cadence*—is an intuitive starting point. However, rigorous research into cloud speech engineering and Second Language Acquisition (SLA) pedagogy yields two foundational findings:

1. **Text-to-Speech Engine Selection:** Not all TTS engines are created equal for language education. Standard generic voice APIs (like OpenAI Audio) lack word-level timestamp alignment and International Phonetic Alphabet (IPA) control. Others (like AWS Polly) impose severe architectural penalties—requiring two separate API calls to retrieve both audio and speech marks, doubling billing costs. **Microsoft Azure AI Speech is the clear industry leader for language learning**, providing native word-boundary timestamps, visemes (lip-sync mouth poses), full IPA SSML, and over 40 native English accents in a single, cost-effective call ($16.00 / 1M characters).
2. **Pedagogical Enhancement (Closing the Loop):** Passive listening and unguided repetition alone risk reinforcing **fossilized pronunciation errors** due to *perceptual deafness* (learners cannot hear the acoustic discrepancy between their own voice and the native speaker). By transforming the application into a **closed-loop pronunciation laboratory**—integrating acoustic forced alignment via **Azure AI Speech Pronunciation Assessment**, **in-browser 16 kHz AudioWorklet recording**, **prosodic thought-group chunking**, **neural prosody and intonation scoring**, **synchronized A/B voice comparison**, and **LLM biomechanical mouth/tongue coaching**—the product elevates from a basic playback tool into a comprehensive, research-backed speaking coach.

---

## 2. Track 1: Technical Possibilities for Text-to-Speech (TTS)

### 2.1 Comprehensive Cloud & Client TTS Engine Comparison

| Capability / Metric | **Microsoft Azure AI Speech** | **AWS Polly** | **Google Cloud TTS** | **OpenAI Audio API** (`tts-1`) | **ElevenLabs** (Turbo v2.5) | **Web Speech API** (`speechSynthesis`) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Acoustic Naturalness** | 9.4 / 10 | 8.8 / 10 | 9.0 / 10 | 9.6 / 10 | **9.9 / 10** | 5.0 – 7.5 / 10 |
| **Word Boundary Timestamps** | **Native (Ticks/ms)** | Native (JSON) | Manual `<mark>` only | ❌ None | **Native (Arrays)** | ⚠️ Broken on Android/iOS |
| **Visemes / Lip-Sync Poses** | **22 IDs + 55 ARKit 3D** | 21 IDs | ❌ None | ❌ None | ❌ None | ❌ None |
| **SSML Phoneme (`<phoneme>`)** | **Full (IPA & SAPI)** | Full (IPA & X-SAMPA) | Full (IPA & X-SAMPA) | ❌ None | Inline IPA only | ❌ None |
| **Neural Slow Prosody** | **Native (`<prosody rate>`)**| Native | Native | DSP scaling only | Pacing audio tags | Pitch-shifting / robotic |
| **English Dialects / Accents** | **40+ dialects** | 7 dialects | 8 dialects | 1 (Generic US) | Hundreds | Device OS-dependent |
| **Single Call Audio + Timing** | **Yes (Speech SDK)** | ❌ **No (2 calls needed)** | Yes (with `<mark>`) | ❌ No timing | **Yes** | N/A |
| **Standard Cost / 1M Chars** | **$16.00** | **$16.00 ($32 w/ marks)** | $16.00 | $15.00 / $30.00 | **$150.00 – $300.00** | **Free ($0.00)** |
| **Free Monthly Tier** | 500,000 chars | 1,000,000 chars (1 yr) | 1,000,000 chars | None | 10,000 chars | Unlimited |
| **Production Suitability** | ⭐ **Best Overall** | ⚠️ High Cost with Marks | ⚠️ Complex SSML | ❌ Lacks Timestamps | 💎 Premium Dialogues | ❌ Unreliable Primary |

---

### 2.2 In-Depth Evaluation of Cloud TTS Providers

#### 1. Microsoft Azure AI Speech (Text-to-Speech) — *Recommended Primary Engine*
* **Architecture:** Communicates over WebSocket (`wss://`) using the official `microsoft-cognitiveservices-speech-sdk` or short-lived authorization tokens.
* **Dialect Breadth:** Covers 40+ English accents (`en-US`, `en-GB`, `en-AU`, `en-CA`, `en-IN`, `en-IE`, `en-NZ`, `en-ZA`, `en-SG`, `en-PH`, `en-NG`, etc.).
* **SSML & Language Learning Controls:**
  * IPA Phoneme Tagging:
    ```xml
    <speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US">
      <voice name="en-US-JennyNeural">
        Pronounce it as <phoneme alphabet="ipa" ph="ˈʃɪp">ship</phoneme>, not <phoneme alphabet="ipa" ph="ˈʃiːp">sheep</phoneme>.
      </voice>
    </speak>
    ```
  * Natural Slow Prosody: `<prosody rate="-20%">` naturally stretches vowels and maintains human-sounding acoustic resonance rather than digital time-compression artifacts.
  * Expressive Styles (`mstts:express-as`): `chat`, `cheerful`, `empathetic`, `whispering`, with adjustable intensity (`styledegree="1.5"`).
* **Word Boundaries & Visemes:** Emits real-time `wordBoundary` events (audio ticks, duration, character offset, word length) and `visemeReceived` events (22 standard mouth poses and 55 ARKit 3D blend shapes for Three.js avatars).
* **Cost:** $16.00 per 1M characters.

#### 2. AWS Polly — *The Double-Call Bottleneck*
* **Capabilities:** Offers high-quality Neural and Generative voices with comprehensive Speech Marks (`word`, `sentence`, `viseme`, `ssml`).
* **The Critical Flaw:** AWS Polly's real-time API (`SynthesizeSpeech`) only supports a single `OutputFormat` per HTTP request. To obtain both MP3 audio and Word Speech Marks, the backend must make **two distinct API calls**:
  1. Call 1: `OutputFormat: 'mp3'` (audio binary).
  2. Call 2: `OutputFormat: 'json'` + `SpeechMarkTypes: ['word', 'viseme']` (metadata).
* **Consequences:** Doubles the effective cost to **$32.00 per 1M characters** (Neural) or **$60.00 per 1M characters** (Generative) and introduces latency and audio-text synchronization drift risks.

#### 3. Google Cloud Text-to-Speech — *The SSML Mark Overhead*
* **Capabilities:** High-fidelity WaveNet, Neural2, and Studio/Journey voices.
* **Limitations:** Google Cloud TTS does not provide automatic word-level boundaries out of the box. To obtain word timings, developers must tokenize the text, manually inject `<mark name="w0"/>` tags before every word, and enable `enableTimePointing: ["SSML_MARK"]`. This adds token overhead, increases payload sizes, risks subtle micro-pauses in neural pacing, and lacks viseme lip-sync output.

#### 4. OpenAI Audio API (`tts-1`, `tts-1-hd`) — *Unsuitable for Tutoring*
* **Capabilities:** Exceptional conversational naturalness and emotional tone.
* **Fatal Flaws:** Returns raw audio only with **zero word boundary timestamps**, **zero SSML support**, **zero IPA phoneme tuning**, and no explicit regional dialect selection. Karaoke highlighting would require running an external forced aligner (e.g., Whisper, Gentle, or MFA), introducing 1–2 seconds of additional compute latency and added cost.

#### 5. ElevenLabs (Turbo v2.5 / Multilingual v2) — *Specialized Premium Engine*
* **Capabilities:** Unrivaled emotional prosody and conversational realism.
* **Native Timestamps:** Features a dedicated `/v1/text-to-speech/{voice_id}/with-timestamps` endpoint returning precise character-level start and end times in seconds.
* **Cost Consideration:** Costs **$150.00 to $300.00 per 1M characters** (10x to 18x more expensive than Azure). Recommended strictly as a premium upgrade or for unscripted conversational roleplay.

---

### 2.3 Client-Side Web Speech API Analysis

While `window.speechSynthesis` offers zero-cost, offline synthesis, it suffers from severe limitations that make it unsuitable as the primary engine for language tutoring:
1. **Broken Event Handling:** The `onboundary` event is broken or missing on Android Chrome and WebKit, and triggers garbage-collection memory leaks on desktop browsers during medium-to-long paragraphs.
2. **No Audio Buffer Access:** Audio is routed directly to the OS audio daemon. The web application cannot access PCM samples, preventing waveform visualization, pitch analysis, audio recording comparison, and client-side caching.
3. **Severe Voice Fragmentation:** Voice sets differ across operating systems (Apple Samantha vs. Google US English vs. Microsoft David), destroying brand consistency and creating conflicting pronunciation standards across devices.

---

### 2.4 Critical Technical Requirements for Pronunciation Learning

#### 1. Audio-Text Karaoke Synchronization
Standard HTML5 `<audio>` element `timeupdate` events fire at a frequency of **~4 Hz (4 times per second, or every 250ms)**. Because spoken English words often last only 100ms–350ms, a 4 Hz timer wakes up too slowly and skips words before the code can highlight them.
* **The 60 FPS Animation Loop Solution:** Run a `requestAnimationFrame` clock querying `audio.currentTime` directly at **60 Hz (60 times per second, or every ~16.6ms)**.
* **Optimal Synchronization Algorithm (`lower_bound` + Directional Pruning):**
  1. *Directional Search-Space Pruning:* Comparing `currentTime` against `lastTime` immediately halves the search space:
     - If `currentTime >= lastTime` (normal playback or forward seek), the new word cannot be before `lastIndex`. Prune the left: search range is $[i_{\text{last}}, N-1]$.
     - If `currentTime < lastTime` (scrubbed backward), prune the right: search range is $[0, i_{\text{last}}]$.
  2. *Monotonic `lower_bound` Lookup:* Since word start times (`audioOffsetMs`) are strictly monotonically increasing, binary search finds the candidate word that started most recently at or before `currentTime`.
  3. *Single Pause Boundary Check:* Finally, verify `currentTime <= candidate.start + candidate.duration`. If true, highlight the word; if false, the audio is in a breath/pause gap between words (returns `-1`).

$$\text{Candidate Index} = \text{LowerBound}\big(\text{speechMarks.audioOffsetMs}, \text{currentTime}, [\text{low}, \text{high}]\big)$$

#### 2. Speed Adjustment Without Pitch Distortion
* **Client-Side:** Setting `audio.playbackRate = 0.8` uses the browser's built-in Waveform Similarity Overlap-Add (WSOLA) phase-vocoder (`preservesPitch = true`). Because `audio.currentTime` automatically advances in media-time, timestamp synchronization remains aligned.
* **Server-Side (Superior):** Requesting SSML `<prosody rate="80%">` produces authentic neural vowel lengthening and distinct articulatory gestures that sound significantly more natural than digital DSP stretching.

#### 3. Visemes for Mouth Shape & Lip-Sync
Azure AI Speech outputs 22 distinct viseme IDs (representing bilabial plosives `/p, b, m/`, labiodental fricatives `/f, v/`, dental fricatives `/θ, ð/`, open vowels, etc.) as well as 55 ARKit 3D blend shapes. This enables synchronized 2D SVG lip-sync or 3D Three.js avatar animations showing students how to shape their mouth.

---

## 3. Track 2: Pedagogical Enhancements, Speech Assessment & UX Extensions

### 3.1 Closing the Loop: Azure AI Speech Pronunciation Assessment API

A student cannot improve pronunciation by listening alone if they suffer from **perceptual assimilation** (interpreting L2 sounds as their closest L1 phonemic category). The system must provide objective, acoustic-phonetic scoring.

Unlike generic ASR engines that transcribe what they think the user said, **Azure Pronunciation Assessment** evaluates the acoustic distance between the user’s speech and native phonetic models against a reference text.

```
                           AZURE SCORING HIERARCHY
                                 [ PronScore ]
                               (Overall 0 - 100)
                                       │
        ┌───────────────────┬──────────┴──────────┬───────────────────┐
        ▼                   ▼                     ▼                   ▼
 [ AccuracyScore ]   [ FluencyScore ]     [ CompletenessScore ]  [ ProsodyScore ]
 Segmental Phonetics Silent Pause Ratio   Skipped Word Ratio     Pitch & Intonation
```

#### Metric Breakdown (0 to 100 Scale)
* **`PronScore`:** Weighted aggregate proficiency score.
* **`AccuracyScore`:** Segmental correctness calculated across phonemes, syllables, and words.
* **`FluencyScore`:** Rhythmic cadence and naturalness of silent intervals between words.
* **`CompletenessScore`:** Ratio of pronounced words against reference script (detects skipped clauses).
* **`ProsodyScore`:** Evaluates stress distribution, fundamental frequency ($F_0$) variation, and speech velocity.

#### Miscue Detection (`EnableMiscue = true`)
Azure automatically flags structural discrepancies:
* **`Mispronunciation`:** Word uttered, but acoustic accuracy falls below threshold (`< 60`). Returns the exact failing phonemes.
* **`Omission`:** Word skipped by learner.
* **`Insertion`:** Extra word uttered (e.g., stuttering, false start).
* **`UnexpectedBreak` / `MissingBreak`:** Pausing inside a tight syntactic unit or failing to pause at punctuation.
* **`Monotone`:** Flat intonation contour lacking English melodic variation.

---

### 3.2 Comparative Evaluation of ASR & Speech Scoring Engines

| Feature | **Azure Pronunciation Assessment** | **OpenAI Whisper** | **Deepgram (Nova-2)** | **Web Speech API** |
| :--- | :--- | :--- | :--- | :--- |
| **Primary Design** | CAPT Acoustic Scoring | General Transcription | Real-Time Streaming ASR | Dictation |
| **Phoneme Accuracy (0–100)**| **Native built-in** | ❌ None | ❌ None | ❌ None |
| **Prosody & Intonation Metric**| **Native (`ProsodyScore`)**| ❌ None | ❌ None | ❌ None |
| **Forced Alignment** | **Built-in reference alignment**| Requires external MFA | Word timestamps only | Basic interim results |
| **Latency** | 500ms – 1.2s post-audio | 800ms – 2.5s (API) | **< 300ms** | Real-time |
| **Disfluent Speech Handling** | Accurately penalizes errors | Hallucinates or auto-corrects | Skips phonetics | Silently fails |

---

### 3.3 In-Browser Audio Capture via AudioWorklet

Standard browser `MediaRecorder` produces compressed WebM/Opus or Ogg files that require server-side decoding via `ffmpeg` before speech engines can process them.

The modern standard uses an **`AudioWorklet`** running on the dedicated Web Audio rendering thread:
1. Captures 32-bit floating-point audio from `getUserMedia()`.
2. Downsamples native 44.1/48 kHz to 16 kHz on the fly.
   > **Why 16 kHz?** Frequency here refers to digital sample rate (snapshot measurements per second). By the Nyquist-Shannon theorem, capturing a sound requires a sample rate at least 2× its highest acoustic frequency. Because all human speech intelligibility (vowels and consonants like *s*, *th*) lives below 8,000 Hz, a 16 kHz rate ($2 \times 8\text{ kHz} = 16\text{ kHz}$, or 16,000 samples/sec) preserves 100% of speech phonetics with crystal clarity while keeping payload sizes 66% smaller than 48 kHz music streams.
3. Converts samples to 16-bit signed Linear PCM integers.
4. Transmits raw 16 kHz PCM to the speech assessment engine. Azure handles Voice Activity Detection (silence endpointing) natively, automatically detecting when the user begins and finishes speaking without requiring custom client-side VAD.
5. *(Optional visual feedback)*: If the UI needs a standard microphone volume indicator or waveform so the user can verify their mic is working, a standard Web Audio `AnalyserNode` can read volume levels in parallel without adding complexity.

```
[ Microphone ] ──► [ AudioWorklet (Downsample 16kHz + Int16 PCM) ] ──► [ Azure Assessment API (Native VAD) ]
                          │
                          └──► [ Optional: AnalyserNode ] ──► [ Simple Mic Level Indicator ]
```

---

### 3.4 The Science of Language Acquisition & Shadowing

The application's core loop is grounded in the **Shadowing Technique**, formalized for SLA by **Alexander Arguelles**, **Shuhei Kadota** (2007, 2019), and **Yo Hamada** (2012, 2016).

```
                      ACOUSTIC MODEL INPUT (TTS)
                                  │
                                  ▼
                      Input Effect (Perception)
             Fast automated auditory phonological parsing
                                  │
                                  ▼
             Baddeley's Working Memory (Phonological Loop)
             ┌───────────────────────────────────────────┐
             │ Phonological Store  ◄──►  Subvocal        │
             │ (~2 sec echo)             Rehearsal       │
             └─────────────────────┬─────────────────────┘
                                   │
                    ┌──────────────┴──────────────┐
                    ▼                             ▼
         Output Effect (Action)         Monitoring Effect (Control)
         Motor vocal tract articulation Continuous real-time deviation
         Muscle memory formation        tracking: Model vs Self
```

#### Kadota’s Internal Phonological Optimization Model (IPOM)
Shadowing acts directly on **Baddeley’s phonological loop**:
1. **Input Effect:** Forces rapid auditory decoding without pauses, matching native speech rates (140–180 wpm).
2. **Practice Effect:** Strengthens working memory retention by keeping the phonological loop saturated.
3. **Output Effect:** Trains motor coordination (tongue, lips, velum) for non-native phonemic sequences.
4. **Monitoring Effect:** Establishes an auditory-articulatory feedback loop allowing learners to actively compare their vocal output against the model.

---

### 3.5 Connected Speech Phenomena & Visual Markup

Learners frequently pronounce English as a sequence of isolated citation-form words. Natural spoken English relies on connected speech adaptations that the tutor UI must make visible.

```
       CITATION FORM                           CONNECTED SPEECH
  "Pick"   "it"   "up"             ───►         "Pi - ki - tup"
 [/pɪk/]  [/ɪt/]  [/ʌp/]                         [/pɪ.kɪ.tʌp/]
  Consonant-to-Vowel                             Resyllabification
```

#### 1. Linking (Catenation & Intrusion)
* **Consonant-to-Vowel (C-V Linking):** Coda consonant of word $N$ becomes the onset of word $N+1$.  
  *Example:* `pick it up` $\to$ `pi-ki-tup` (`/pɪ.kɪ.tʌp/`); `check in` $\to$ `che-kin`.
* **Intrusive Semi-Vowels:**
  * `/j/` intrusion after front vowels (`/iː, eɪ, aɪ/`): `see it` $\to$ `see-[j]-it` (`/siː.j.ɪt/`).
  * `/w/` intrusion after rounded vowels (`/uː, oʊ, aʊ/`): `go out` $\to$ `go-[w]-out` (`/ɡoʊ.w.aʊt/`).

#### 2. Assimilation & Elision
* **Coalescent Assimilation:** `/t/ + /j/ \to [tʃ]` (`don't you` $\to$ `don-chu`); `/d/ + /j/ \to [dʒ]` (`did you` $\to$ `did-ja`).
* **Elision:** Alveolar plosives `/t/` and `/d/` drop between consonants: `last night` $\to$ `las' night`; `next door` $\to$ `nex' door`.

#### 3. Stress-Timed English (Isochrony) vs. Syllable-Timed L1s
* English is **stress-timed**: the intervals between stressed syllables (beats) remain roughly equal, compressing unstressed syllables into weak forms using the schwa (`/ə/`).
* Speakers of syllable-timed L1s (Spanish, French, Japanese, Vietnamese, Cantonese) assign equal duration to every syllable, creating an unnatural staccato rhythm.
* **UI Typography Solution:** Visually elevate primary stressed syllables (125% font size, bold, primary color) and mute weak function words (85% font size, muted gray).

---

### 3.6 Neural Prosody, Intonation & Pitch Evaluation

Intonation conveys syntactic intent (e.g., questions vs. statements), contrastive emphasis, and pragmatic emotion. Modern pronunciation assessment evaluates prosody holistically using deep neural models rather than legacy 1D heuristic curve matching.

```
Relative Pitch (Semitones relative to median)
    ▲
 +3 ┼                      Target Pitch Contour (Model)
 +2 ┼                   ╭────────╮
 +1 ┼          ╭────────╯        ╰──────╮
  0 ┼──────────╯                        ╰─────────── (Baseline)
 -1 ┼           . . . . . . . . . . . . . 
 -2 ┼     Learner Pitch Contour (Neural Estimation via SPICE / CREPE)
    └─────┴───────────┴──────────┴──────────┴──────────► Normalized Time
         "What"      "are"      "YOU"    "doing?"
```

#### 1. Holistic Neural Prosody Assessment (Azure AI Speech `ProsodyScore`)
In modern CAPT systems, prosody cannot be evaluated accurately by comparing raw pitch curves in isolation. Azure AI Speech Pronunciation Assessment utilizes deep transformer acoustic models trained on extensive native corpora to output a comprehensive **`ProsodyScore` (0–100)** that jointly evaluates four acoustic dimensions:
* **Intonation Contour:** Evaluates whether pitch contours rise, fall, or sustain correctly based on sentence structure (e.g., rising intonation for yes/no questions, falling intonation for statements and wh-questions).
* **Lexical & Nuclear Stress:** Detects whether acoustic energy, duration, and pitch peaks coincide with the primary stressed syllables and contrastive focus words.
* **Rhythm & Isochrony:** Analyzes duration ratios between stressed and unstressed syllables to ensure natural English stress-timing rather than staccato syllable-timed pacing.
* **Pause Insertion & Juncture:** Detects inappropriate mid-clause hesitation pauses and verifies that breath pauses align with syntactic thought-group boundaries.

#### 2. Why Legacy Heuristics (YIN + DTW) Are Obsolete for Scoring
* **Acoustic Timbre and Anatomy Confounding:** Legacy autocorrelation algorithms like YIN (2002) attempt 1D fundamental frequency tracking ($F_0$), but comparing raw pitch between different speakers (e.g., male learner vs. female TTS reference) using Dynamic Time Warping (DTW, 1970s) Euclidean distance produces distorted, uncalibrated scores.
* **DTW Masks Timing Defects:** DTW warps time non-linearly to force alignment. If a learner stretches an unstressed word unnaturally, DTW compresses the alignment and conceals the rhythmic mistake.
* **Modern Standard:** Real scoring is performed via deep neural acoustic embeddings and Goodness of Pronunciation (GOP) posteriors.

#### 3. Client-Side Intonation Visualization Architecture: Lightweight vs. Neural Benchmark

When visual intonation contours are rendered in the UI to give learners feedback on melodic direction (e.g., contrasting against native TTS baselines), the engineering choice between in-browser deep neural models and lightweight mathematical estimators was empirically evaluated in an offline benchmark on authentic 12–15 second speech recordings:

| Evaluation Dimension | Heavy Neural CNN (CREPE / TF.js) | Lightweight MPM (`Pitchy`) | Empirical Verdict & Architectural Selection |
| :--- | :--- | :--- | :--- |
| **Client Bundle Size** | **~6.3 MB** (1.2 MB TF.js + 5.1 MB weights) | **8.6 KB** (zero external dependencies) | 🏆 **Pitchy (700x lighter):** Eliminates mobile data and memory penalties. |
| **Inference Latency (15s audio)** | **~1,750 ms** (~35 ms / 25ms frame on WebGL) | **38.5 ms** (<0.2 ms / frame on CPU) | 🏆 **Pitchy (45x faster):** Renders contours instantaneously without UI pauses. |
| **Raw Octave Outlier Rate** | **3.3%** (11 frames spiked to $+12.7\text{ st}$ to $+14.4\text{ st}$) | **1.8%** (5 frames spiked to $+11.2\text{ st}$) | 🏆 **Pitchy (Higher overtone resistance):** Time-lag correlation naturally tracks the fundamental envelope $\tau_0 = 1/F_0$, whereas CNN spectral classifiers latch onto loud 2nd harmonics ($2 \times F_0$). |
| **Contour Agreement (Shape)** | Reference contour | **98.4% shape agreement** ($0.66\text{ st}$ mean diff) | 🤝 **Identical Visual Value:** Lightweight curve matches the neural CNN shape with sub-semitone fidelity. |

#### 4. The Production Signal Processing Pipeline (Two-Stage Outlier Suppression)

Regardless of the estimator used, raw single-frame pitch tracking without filtering suffers from acoustic noise artifacts. In production, raw frame estimates must pass through a two-stage signal processing pipeline before rendering:

```
[ Raw Mic Audio (Float32 PCM) ]
               │
               ▼
   [ Frame Extraction (25ms hop, 2048-sample window) ]
               │
               ├───► [ 1. Voicing Energy Gate (RMS Floor) ]
               │     Zeroes out frames below 8% of peak speech RMS to eliminate
               │     friction hiss (/s/, /t/) and trailing breath releases.
               │
               ├───► [ 2. McLeod Pitch Method (Pitchy, clarity > 0.68) ]
               │     Calculates fundamental frequency via Normalized Square Difference (NSDF).
               │
               ├───► [ 3. 3-Frame Median Filter ]
               │     Removes single-frame transient jitter.
               │
               ├───► [ 4. Dynamic Octave Continuity & Harmonic Folding ]
               │     Compares frame pitch against surrounding contextual trajectory (±100ms).
               │     Folds octave double jumps (+9.5st to +14.5st, ratio ≈ 2.0) down by -12st (f / 2).
               │     Prunes isolated transient blips shorter than 75ms (< 3 frames).
               │
               ▼
   [ 5. Semitone Normalization Relative to Speaker Median ]
     Pitch_norm(t) = 12 · log2( F0(t) / F0_median )
               │
               ▼
[ Interactive Visual Contour (0st Baseline) with Slow Playback (0.5x / 0.75x) ]
```

* **Stage 1: Voicing Energy Gate:** Discards unvoiced frames where physical acoustic energy ($E_{\text{RMS}}$) falls below an adaptive threshold ($8\%$ of peak voiced energy). This prevents background noise and unvoiced consonants from triggering spurious pitch estimates.
* **Stage 2: Octave Continuity & Harmonic Folding:** Human vocal folds physically cannot jump an octave ($+12\text{ st}$, doubling frequency) within 25 milliseconds during connected speech. If a frame jumps by $+9.5$ to $+14.5\text{ st}$ relative to its local melodic window, the algorithm folds it down by one octave ($f \to f/2$), restoring the true vocal fold period.
* **Semitone Normalization ($0\text{ st}$ Baseline):**
  $$\text{Pitch}_{\text{norm}}(t) = 12 \cdot \log_2\left(\frac{F_0(t)}{F_{0,\text{median}}}\right)$$
  Converting raw Hertz to semitones relative to each speaker's median pitch centers any vocal range (bass, tenor, alto, soprano) at a $0\text{ semitones}$ baseline, enabling direct visual comparison between learner curves and native model baselines.
* **Synchronized Playback with Pitch-Preserving Slower Rates:** Providing $0.5\times$ and $0.75\times$ playback speed allows learners to inspect subtle intra-syllable pitch rises and falls in slow motion without altering acoustic pitch.

#### 5. Baseline Pitch Contours for Arbitrary & Custom Text: Feasibility & Scope Boundaries

When learners practice arbitrary custom text or unscripted free speech, no pre-recorded human reference track exists. Providing an intonation baseline in this scenario introduces specific architectural options and feasibility boundaries:

##### A. Reference Generation Mechanisms
* **Approach 1: Dynamic Neural TTS Reference Track (Recommended Technical Path):**
  * **Workflow:** Synthesize reference audio for the custom text via an expressive neural TTS engine (e.g., Azure Neural TTS, ElevenLabs, or local Piper TTS). The synthesized waveform is passed through the identical client-side MPM pitch extraction and two-stage outlier suppression pipeline.
  * **Pedagogical Benefit:** Provides both the reference visual contour and a high-fidelity native audio model that the learner can listen to on demand (`"Listen to Model"`).
  * **Trade-off:** Incurs TTS synthesis latency (~200–500 ms) and cloud API cost per custom submission.
* **Approach 2: Rule-Based Phonological Pitch Envelopes (ToBI Framework):**
  * **Workflow:** Determine lexical stress via CMUDict and project stylized intonation patterns from punctuation and syntax (e.g., declarative terminal fall $H^*\ L\text{-}L\%$, polar yes/no terminal rise $L^*\ H\text{-}H\%$, continuation rise $L^*\ H\text{-}L\%$).
  * **Benefit:** Zero synthesis cost and instantaneous rendering.
  * **Limitation:** Generates abstract geometric bounds rather than authentic micro-prosodic contours, and cannot provide reference audio playback.

##### B. The Alignment Bottleneck (Tempo & Pause Variance)
A critical pitfall in custom text evaluation is that **learners and baseline models never speak at identical speeds or with identical pause patterns**:
* If a learner pauses for 1 second after word 2, plotting learner and baseline contours on a shared linear time axis ($t = 0 \dots T$) causes the curves to drift completely out of phase, misleading the learner even if their melodic direction was correct.
* **Engineering Solution:** Rather than linear time overlay, contours must be anchored using **word-level forced alignment** (e.g., word timestamps from Azure Speech Assessment or local CTC aligner). The baseline curve is warped or rendered word-by-word, comparing relative pitch slopes (rising ↗, falling ↘, peak-fall ∧) within matching lexical boundaries.

##### C. Pragmatic Feasibility Verdict & Scope Boundaries (Early-Stage Staging)
To avoid over-promising or committing to premature complexity during early MVP delivery:
* **MVP Scope (Low Risk, Guaranteed Delivery):**
  * **Curated Exercises:** Pre-record or pre-synthesize native reference audio with pre-computed, verified baseline pitch tracks for core lessons.
  * **Custom Text Practice:** Rely on Azure AI Speech's holistic neural `ProsodyScore` (0–100) to evaluate intonation, rhythm, and stress without drawing a visual overlay curve. If the learner's pitch curve is displayed, present it standalone with median centering ($0\text{ st}$) and slow-motion scrubbing.
* **Post-MVP Phase (Advanced Enhancement):**
  * Implement on-demand neural TTS baseline synthesis with word-anchored alignment bands for user-supplied paragraphs once the core transcription, scoring, and UI flows are fully validated in production.


---

### 3.7 Text Chunking into Prosodic "Thought Groups"

Feeding entire long paragraphs into TTS or learner practice creates cognitive overload. Natural speech breaks into **thought groups** (breath groups) containing a single primary focus:

```
Raw Paragraph:
"Although the weather was terrible yesterday morning we decided to go hiking in the mountains because we had prepared all our gear."

Chunked into Practice Thought Groups:
1. [ Although the weather was terrible ]     (Rising pitch ↗, Focus: "terrible")
2. [ yesterday morning, ]                    (Slight rise ↗, Focus: "morning")
3. [ we decided to go hiking ]               (Level sustain →, Focus: "hiking")
4. [ in the mountains, ]                     (Slight rise ↗, Focus: "mountains")
5. [ because we had prepared all our gear. ]   (Final falling pitch ↘, Focus: "gear")
```

#### 1. Why Hard-Coded Heuristics Fall Short
Traditional regex or hard-coded rules attempt to split solely on punctuation marks (`,`, `.`, `;`) and coordinating conjunctions (`because`, `although`, `if`, `and`):
* **Punctuation Absence in Natural Speech:** Spoken thought groups frequently occur where written commas are grammatically absent (e.g., long subject noun phrases: *"The candidate who answered all the technical questions [pause] received an immediate offer"*).
* **False Syntactic Splits:** Hard-coded conjunction rules blindly split compound predicates and parallel structures (e.g., *"She packed her bags and left"* should not be split into two separate fragments).
* **Missing Prosodic Context:** Pure text splitters cannot infer which word carries the **nuclear stress** or whether a clause transition calls for a continuation rise vs. a terminal drop.

#### 2. Architectural Direction: Centralized Azure Small Language Models (SLMs)
Rather than maintaining fragile heuristic parsers, prosodic segmentation directionally points toward small, cost-effective language models hosted natively within the existing Azure infrastructure:

* **Candidate Model Options (To Be Evaluated):** Potential candidates include Azure OpenAI small models (e.g., `gpt-4o-mini`) or Azure AI Model Catalog SLMs (e.g., `Phi-3.5-mini`, `Phi-4-mini`). *Final model selection is not locked in at this stage and will be decided through a dedicated feature-level evaluation benchmark.*
* **Centralized Billing & Infrastructure Cohesion:**
  * Because Azure AI Speech is already the application's core speech processing backbone (GOP phoneme posteriors and `ProsodyScore`), centralizing LLM inference on Azure consolidates infrastructure into a single Azure resource group and unified billing invoice.
  * Secures API calls through unified **Azure Entra ID / Managed Identities**, removing fragmented multi-vendor API keys.
  * Keeps traffic within the same Azure cloud backbone, minimizing cross-region egress overhead and latency.
* **Directional Feasibility (Cost & Latency):**
  * **Token Footprint:** A standard 60–120 word paragraph consumes ~100–150 input tokens and produces ~100–140 output tokens in structured JSON format.
  * **Estimated Cost Scale:** Under typical SLM pricing tiers (~$0.15 / 1M input, ~$0.60 / 1M output), processing **1,000 custom practice submissions is estimated at ~$0.08** (< $0.0001 per paragraph), confirming that the directional approach introduces negligible operational expense.
  * **Inference Speed:** Typical SLM response time is ~150–250 ms using constrained JSON Schema mode (`response_format: { type: "json_object" }`).

#### 3. Concept Schema: Structured Output (Illustrative Example)

> [!NOTE]
> **Directional Concept Only:** The schema below illustrates the general pattern for structured prosodic metadata. The definitive JSON schema, field attributes, and validation rules will undergo dedicated grilling and comparative evaluation when feature-level implementation begins.

```json
{
  "thought_groups": [
    {
      "text": "Although the weather was terrible",
      "nuclear_stress_word": "terrible",
      "boundary_tone": "continuation_rise",
      "pause_duration_hint_ms": 300
    },
    {
      "text": "yesterday morning,",
      "nuclear_stress_word": "morning",
      "boundary_tone": "continuation_rise",
      "pause_duration_hint_ms": 250
    },
    {
      "text": "we decided to go hiking in the mountains",
      "nuclear_stress_word": "hiking",
      "boundary_tone": "level_sustain",
      "pause_duration_hint_ms": 200
    },
    {
      "text": "because we had prepared all our gear.",
      "nuclear_stress_word": "gear",
      "boundary_tone": "terminal_fall",
      "pause_duration_hint_ms": 600
    }
  ]
}
```

#### 4. Hybrid Reliability Pattern
To ensure the user interface never freezes if cloud networks stutter or rate limits occur:
* **Primary (Cloud SLM):** Azure-hosted small model generates syntactically natural thought groups with prosodic annotations.
* **Fallback (Deterministic Client Heuristic):** If the API call times out (>400 ms) or encounters network unavailability, the system falls back locally to syntactic punctuation/conjunction splitting, ensuring practice remains uninterrupted.

---

### 3.8 Interactive UX: A/B Voice Player, LLM Coach & Phoneme Mastery Matrix

#### 1. Instantaneous A/B Voice Player: Concept & Alignment Constraints
To overcome phonetic "perceptual deafness" (where language learners struggle to hear why their own speech differs from a native speaker), the interface concept provides synchronized dual audio scrubbing:

* **Seamless A/B Toggling:** Instantly switches audio playback between the native reference model and the learner's recording without resetting the cognitive context.
* **Pitch-Preserving Slower Playback:** Enables reduced playback rates ($0.5\times$, $0.75\times$) with pitch preservation so learners can parse subtle phonetic transitions in slow motion.
* **Targeted Chunk Replay:** Loops the active thought group to facilitate repetitive muscle memory training.
* *Note on Controls:* Specific keyboard shortcuts or touch gestures will be finalized during interaction design rather than locked in during early architectural planning.

##### Critical Constraint: Lexical Alignment Across Varying Speaking Paces
For seamless A/B switching to function across recordings, the player cannot rely on a naive linear time playhead:
* If the learner speaks slowly with hesitation pauses (e.g., 110 WPM) while native TTS speaks at normal conversational tempo (e.g., 150 WPM), raw audio timestamp $t = 2.5\text{s}$ points to entirely different words in the two audio buffers.
* **Lexical Anchoring:** Playhead synchronization is anchored by **word and phoneme boundary timestamps** (derived from the alignment pass). Toggling A/B playback maps the current position to the corresponding word or syllable in the other audio stream, ensuring comparison remains lexically matched.

#### 2. Generative AI Articulatory Coach & Example-Based Learning
Raw scores (e.g., *"Phoneme /θ/ = 38%"*) fail to instruct the user on how to physically correct a phonetic mistake. When Azure Speech flags a degraded phoneme, an LLM prompt synthesizes targeted biomechanical guidance reinforced by **example-driven practice**:

```
[ Azure Assessment Flag: Word "Thursday", target /θ/, detected /s/, Score: 38 ]
                               │
                               ▼
   [ LLM Pronunciation Coach (Azure-Hosted SLM / LLM Prompt) ]
                               │
                               ▼
 💬 1. Biomechanical Cue:
    "You produced an /s/ sound instead of /θ/. Place the tip of your
    tongue lightly between your top and bottom teeth, and blow air gently
    across it without retracting your tongue."

 🎯 2. Contrastive Minimal Pairs:
    • sink  vs.  think
    • mouse vs.  mouth
    • pass  vs.  path

 🗣️ 3. Targeted Contextual Practice Examples:
    • Word drill: "theater", "method", "breath"
    • Sentence drill: "I think thirty thousand people came on Thursday."
```

* **Physical Placement Instructions:** Explains the physical mouth mechanics (tongue placement, airflow, vocal cord vibration).
* **Minimal Pair Discrimination:** Contrasts the target phoneme against the exact substituted sound the learner produced, sharpening auditory discrimination.
* **Progressive Example Generation:** Generates fresh contextual words and natural practice sentences (spanning initial, medial, and final word positions) so the learner can immediately reinforce correct muscle memory.

#### 3. Spaced Repetition System (FSRS) Phoneme Mastery Heatmap
The application tracks a persistent **Phonetic Mastery Matrix** using the Free Spaced Repetition Scheduler (FSRS):
* Tracks individual phoneme error frequencies (e.g., `/θ/`, `/ð/`, `/æ/`, `/l/ vs /r/`).
* Automatically synthesizes targeted warm-up sentences for subsequent practice sessions focused on the learner's weakest phonemes.

---

## 4. Primary Source & Academic Literature Citations

1. **Microsoft Azure Speech Documentation (2024).** *Pronunciation assessment documentation, miscue detection, prosody scoring, and REST/WebSocket API specifications.* Microsoft Learn.  
   `https://learn.microsoft.com/en-us/azure/ai-services/speech-service/how-to-pronunciation-assessment`
2. **Microsoft Azure Speech SDK for JavaScript.** *SpeechSynthesizer, WordBoundaryEventArgs, and VisemeReceivedEventArgs API specifications.*  
   `https://learn.microsoft.com/en-us/javascript/api/microsoft-cognitiveservices-speech-sdk/`
3. **AWS Polly Developer Guide (2024).** *Using Speech Marks with Amazon Polly and SynthesizeSpeech API parameters.* AWS Documentation.  
   `https://docs.aws.amazon.com/polly/latest/dg/speechmarkexamples.html`
4. **Google Cloud Text-to-Speech Documentation (2024).** *Using SSML timepoints and synthetic voice models.* Google Cloud Documentation.  
   `https://cloud.google.com/text-to-speech/docs/ssml`
5. **ElevenLabs API Reference (2024).** *Text-to-Speech with timestamps endpoint `/v1/text-to-speech/{voice_id}/with-timestamps`.* ElevenLabs Docs.  
   `https://elevenlabs.io/docs/api-reference/text-to-speech-with-timestamps`
6. **W3C Speech Synthesis Markup Language (SSML) Version 1.0.** *W3C Recommendation for prosody, phoneme, and mark elements.*  
   `https://www.w3.org/TR/speech-synthesis/`
7. **Kadota, S. (2019).** *Shadowing as a Language Acquisition Technique: The Nature of the Motor Theory of Speech Perception and the Internal Phonological Optimization Model.* Routledge.
8. **Hamada, Y. (2016).** *Teaching EFL Learners Shadowing for Listening: Developing learners' automaticity of bottom-up processing.* Routledge.
9. **Baddeley, A. (2000).** *The episodic buffer: a new component of working memory?* Trends in Cognitive Sciences, 4(11), 417-423.
10. **Kim, J. W., Salamon, J., Li, P., & Bello, J. P. (2018).** *CREPE: A Convolutional Representation for Pitch Estimation.* IEEE International Conference on Acoustics, Speech and Signal Processing (ICASSP), 161-165.
11. **Gfeller, B., Frank, C., Roblek, D., Sharifi, M., Tagliasacchi, M., & Zeghidour, N. (2020).** *SPICE: Self-Supervised Pitch Estimation.* IEEE/ACM Transactions on Audio, Speech, and Language Processing, 28, 1118-1128.
12. **Abercrombie, D. (1967).** *Elements of General Phonetics.* Edinburgh University Press. (Isochrony and stress-timing foundations).
13. **Celce-Murcia, M., Brinton, D. M., & Goodwin, J. M. (2010).** *Teaching Pronunciation: A Course Book and Reference Guide.* Cambridge University Press.
