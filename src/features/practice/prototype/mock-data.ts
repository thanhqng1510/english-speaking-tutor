import type { Chunk, ChunkPart } from "./types";

export interface PresetParagraph {
  readonly id: string;
  readonly title: string;
  readonly category: "exam" | "everyday";
  readonly lengthTier: "short" | "medium" | "long";
  readonly text: string;
  readonly chunks: readonly Chunk[];
}

export const PRESET_PARAGRAPHS: readonly PresetParagraph[] = [
  {
    id: "preset-short",
    title: "Renewable energy transition",
    category: "exam",
    lengthTier: "short",
    text: "The growing demand for clean and renewable energy has transformed how modern cities design their power grids.",
    chunks: [
      {
        parts: [
          { text: "The growing demand for clean and renewable ", role: "normal" },
          { text: "energy", role: "focus_word" },
        ],
      },
      {
        parts: [
          { text: " has ", role: "normal" },
          { text: "transformed", role: "focus_word" },
          { text: " how modern cities", role: "normal" },
        ],
      },
      {
        parts: [
          { text: " design their power ", role: "normal" },
          { text: "grids.", role: "focus_word" },
        ],
      },
    ],
  },
  {
    id: "preset-medium",
    title: "Rushing to catch the bus",
    category: "everyday",
    lengthTier: "medium",
    text: "She grabbed her raincoat from the hook by the front door, ran straight to the bus stop without looking back, and barely caught the morning commute on time.",
    chunks: [
      {
        parts: [
          { text: "She grabbed her ", role: "normal" },
          { text: "raincoat", role: "focus_word" },
        ],
      },
      {
        parts: [
          { text: " from the hook by the front ", role: "normal" },
          { text: "door,", role: "focus_word" },
        ],
      },
      {
        parts: [
          { text: " ran straight to the bus ", role: "normal" },
          { text: "stop", role: "focus_word" },
        ],
      },
      {
        parts: [
          { text: " without looking ", role: "normal" },
          { text: "back,", role: "focus_word" },
        ],
      },
      {
        parts: [
          { text: " and barely caught the morning ", role: "normal" },
          { text: "commute", role: "focus_word" },
        ],
      },
      {
        parts: [
          { text: " on ", role: "normal" },
          { text: "time.", role: "focus_word" },
        ],
      },
    ],
  },
  {
    id: "preset-long",
    title: "Corporate integrity keynote address",
    category: "exam",
    lengthTier: "long",
    text: "The candidate standing confidently at the podium paused before addressing the audience. 'Integrity is not simply a buzzword for our organization,' she declared, 'it is the foundational standard that guides every decision we make.' When asked about sudden regulatory changes, she acknowledged the difficulties, explained their mitigation strategy in detail, and reiterated their unwavering long-term commitment.",
    chunks: [
      {
        parts: [
          { text: "The candidate standing confidently at the ", role: "normal" },
          { text: "podium", role: "focus_word" },
        ],
      },
      {
        parts: [
          { text: " paused before addressing the ", role: "normal" },
          { text: "audience.", role: "focus_word" },
        ],
      },
      {
        parts: [
          { text: " 'Integrity is not simply a ", role: "normal" },
          { text: "buzzword", role: "focus_word" },
        ],
      },
      {
        parts: [
          { text: " for our ", role: "normal" },
          { text: "organization,'", role: "focus_word" },
        ],
      },
      {
        parts: [
          { text: " she ", role: "normal" },
          { text: "declared,", role: "focus_word" },
        ],
      },
      {
        parts: [
          { text: " 'it is the foundational ", role: "normal" },
          { text: "standard", role: "focus_word" },
        ],
      },
      {
        parts: [
          { text: " that guides every decision we ", role: "normal" },
          { text: "make.'", role: "focus_word" },
        ],
      },
      {
        parts: [
          { text: " When asked about sudden regulatory ", role: "normal" },
          { text: "changes,", role: "focus_word" },
        ],
      },
      {
        parts: [
          { text: " she acknowledged the ", role: "normal" },
          { text: "difficulties,", role: "focus_word" },
        ],
      },
      {
        parts: [
          { text: " explained their mitigation strategy in ", role: "normal" },
          { text: "detail,", role: "focus_word" },
        ],
      },
      {
        parts: [
          { text: " and reiterated their unwavering long-term ", role: "normal" },
          { text: "commitment.", role: "focus_word" },
        ],
      },
    ],
  },
];

/**
 * Creates realistic Chunks with exactly one Focus Word per chunk for arbitrary learner input.
 * Preserves exact character reassembly.
 */
export function createChunksFromText(rawText: string): Chunk[] {
  const matchingPreset = PRESET_PARAGRAPHS.find(
    (p) => p.text.trim() === rawText.trim()
  );
  if (matchingPreset) {
    return [...matchingPreset.chunks];
  }

  const text = rawText.trim();
  if (!text) {
    return [];
  }

  // Regex split on clause punctuation boundaries while preserving punctuation
  const sentenceBoundaryRegex = /([^.!?,\n;:]+[.!?,\n;:]*)/g;
  const rawSegments = text.match(sentenceBoundaryRegex) || [text];

  const chunks: Chunk[] = [];

  for (const rawSegment of rawSegments) {
    const trimmed = rawSegment.trim();
    if (!trimmed) continue;

    const words = trimmed.split(/\s+/);
    if (words.length <= 7) {
      chunks.push(makeSingleChunk(rawSegment));
    } else {
      // Split into 4-6 word sub-chunks
      let startIndex = 0;
      while (startIndex < words.length) {
        const sliceCount = Math.min(5, words.length - startIndex);
        const subWords = words.slice(startIndex, startIndex + sliceCount);
        const subText = subWords.join(" ") + (startIndex + sliceCount < words.length ? " " : "");
        chunks.push(makeSingleChunk(subText));
        startIndex += sliceCount;
      }
    }
  }

  return chunks.length > 0 ? chunks : [makeSingleChunk(text)];
}

function makeSingleChunk(chunkString: string): Chunk {
  // Find words inside chunkString
  const words = chunkString.trim().split(/\s+/);
  if (words.length === 0) {
    return { parts: [{ text: chunkString, role: "focus_word" }] };
  }

  // Pick the most salient content word (e.g. longest or second-to-last word)
  // Clean word of punctuation to judge length
  let bestWordIndex = words.length - 1;
  let maxLen = 0;
  for (let i = words.length - 1; i >= 0; i--) {
    const clean = words[i].replace(/[^a-zA-Z]/g, "");
    if (clean.length > maxLen) {
      maxLen = clean.length;
      bestWordIndex = i;
    }
  }

  const focusWordToken = words[bestWordIndex];
  const wordStartPos = chunkString.indexOf(focusWordToken);

  if (wordStartPos === -1) {
    return { parts: [{ text: chunkString, role: "focus_word" }] };
  }

  const parts: ChunkPart[] = [];
  const before = chunkString.slice(0, wordStartPos);
  const after = chunkString.slice(wordStartPos + focusWordToken.length);

  if (before) {
    parts.push({ text: before, role: "normal" });
  }
  parts.push({ text: focusWordToken, role: "focus_word" });
  if (after) {
    parts.push({ text: after, role: "normal" });
  }

  return { parts };
}

export function getChunkPlainText(chunk: Chunk): string {
  return chunk.parts.map((p) => p.text).join("");
}

export function getChunkFocusWord(chunk: Chunk): string {
  const fw = chunk.parts.find((p) => p.role === "focus_word");
  return fw ? fw.text.replace(/[^a-zA-Z0-9'-]/g, "") : "";
}
