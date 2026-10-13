import { describe, expect, it } from "vitest";
import type { Chunk, ChunkingResult } from "../types";
import {
  countChunkWords,
  extractWords,
  inspectChunkLengths,
  validateChunkingOutput,
  validateFocusWords,
  validateSchema,
  validateTextIntegrity,
} from "../validator";

describe("benchmark validator", () => {
  describe("extractWords", () => {
    it("extracts words stripping surrounding punctuation but keeping internal apostrophes", () => {
      const text = "Hello, world! We don't want to stop—do we?";
      const words = extractWords(text);
      expect(words).toEqual(["hello", "world", "we", "don't", "want", "to", "stop", "do", "we"]);
    });

    it("handles multiple spaces and newlines cleanly", () => {
      const text = "  First line. \n\n Second   line!  ";
      const words = extractWords(text);
      expect(words).toEqual(["first", "line", "second", "line"]);
    });
  });

  describe("countChunkWords", () => {
    it("accurately counts words across chunk parts", () => {
      const chunk: Chunk = {
        parts: [
          { text: "Although the weather ", role: "normal" },
          { text: "was terrible,", role: "focus_word" },
        ],
      };
      expect(countChunkWords(chunk)).toBe(5);
    });
  });

  describe("validateSchema", () => {
    it("accepts a well-formed Chunking result", () => {
      const valid: ChunkingResult = {
        chunks: [
          {
            parts: [
              { text: "Although the weather ", role: "normal" },
              { text: "was terrible,", role: "focus_word" },
            ],
          },
        ],
      };
      const check = validateSchema(valid);
      expect(check.valid).toBe(true);
      expect(check.errors).toHaveLength(0);
      expect(check.result).toBeDefined();
    });

    it("rejects non-object or null data", () => {
      expect(validateSchema(null).valid).toBe(false);
      expect(validateSchema("string").valid).toBe(false);
      expect(validateSchema(123).valid).toBe(false);
    });

    it("rejects missing or empty chunks array", () => {
      expect(validateSchema({}).valid).toBe(false);
      expect(validateSchema({ chunks: [] }).valid).toBe(false);
    });

    it("rejects invalid parts or role enum", () => {
      const invalidRole = {
        chunks: [
          {
            parts: [{ text: "Hello", role: "nuclear_stress" }],
          },
        ],
      };
      const check = validateSchema(invalidRole);
      expect(check.valid).toBe(false);
      expect(check.errors[0]).toContain("role");
    });
  });

  describe("validateFocusWords", () => {
    it("passes when every chunk has exactly one Focus Word", () => {
      const chunks: Chunk[] = [
        {
          parts: [
            { text: "Although the ", role: "normal" },
            { text: "weather", role: "focus_word" },
          ],
        },
        {
          parts: [
            { text: "was ", role: "normal" },
            { text: "terrible,", role: "focus_word" },
          ],
        },
      ];
      const check = validateFocusWords(chunks);
      expect(check.valid).toBe(true);
      expect(check.errors).toHaveLength(0);
    });

    it("fails when a Focus Word part contains multiple words", () => {
      const chunks: Chunk[] = [
        {
          parts: [
            { text: "Although ", role: "normal" },
            { text: "the weather", role: "focus_word" },
          ],
        },
      ];
      const check = validateFocusWords(chunks);
      expect(check.valid).toBe(false);
      expect(check.errors[0]).toContain("contains 2 words");
    });

    it("fails when a chunk has 0 Focus Words", () => {
      const chunks: Chunk[] = [
        {
          parts: [
            { text: "Just normal words ", role: "normal" },
            { text: "here.", role: "normal" },
          ],
        },
      ];
      const check = validateFocusWords(chunks);
      expect(check.valid).toBe(false);
      expect(check.errors[0]).toContain("0 Focus Words");
    });

    it("fails when a chunk has multiple Focus Words", () => {
      const chunks: Chunk[] = [
        {
          parts: [
            { text: "First ", role: "focus_word" },
            { text: "second ", role: "normal" },
            { text: "third", role: "focus_word" },
          ],
        },
      ];
      const check = validateFocusWords(chunks);
      expect(check.valid).toBe(false);
      expect(check.errors[0]).toContain("2 Focus Words");
    });
  });

  describe("validateTextIntegrity", () => {
    const rawInput = "Although the weather was terrible, we decided to go hiking.";

    it("passes when parts join to match the raw input words in order", () => {
      const chunks: Chunk[] = [
        {
          parts: [
            { text: "Although the ", role: "normal" },
            { text: "weather", role: "focus_word" },
          ],
        },
        {
          parts: [
            { text: " was ", role: "normal" },
            { text: "terrible,", role: "focus_word" },
          ],
        },
        {
          parts: [
            { text: " we decided to go ", role: "normal" },
            { text: "hiking.", role: "focus_word" },
          ],
        },
      ];

      const check = validateTextIntegrity(chunks, rawInput);
      expect(check.valid).toBe(true);
      expect(check.errors).toHaveLength(0);
    });

    it("fails when a word is dropped", () => {
      const chunks: Chunk[] = [
        {
          parts: [
            { text: "Although ", role: "normal" },
            { text: "weather", role: "focus_word" }, // dropped 'the'
          ],
        },
        {
          parts: [{ text: " was terrible, we decided to go ", role: "normal" }, { text: "hiking.", role: "focus_word" }],
        },
      ];

      const check = validateTextIntegrity(chunks, rawInput);
      expect(check.valid).toBe(false);
      expect(check.errors.some((e) => e.includes("Word count mismatch") || e.includes("Word mismatch"))).toBe(true);
    });

    it("fails when a word is substituted or hallucinated", () => {
      const chunks: Chunk[] = [
        {
          parts: [
            { text: "Because the weather ", role: "normal" }, // substituted 'Because' for 'Although'
            { text: "was terrible,", role: "focus_word" },
          ],
        },
        {
          parts: [{ text: " we decided to go ", role: "normal" }, { text: "hiking.", role: "focus_word" }],
        },
      ];

      const check = validateTextIntegrity(chunks, rawInput);
      expect(check.valid).toBe(false);
      expect(check.errors.some((e) => e.includes("Word mismatch"))).toBe(true);
    });
  });

  describe("inspectChunkLengths", () => {
    it("flags under-target and over-target chunk lengths", () => {
      const shortChunk: Chunk = {
        parts: [{ text: "Yes,", role: "focus_word" }],
      };
      const longChunk: Chunk = {
        parts: [
          {
            text: "one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen",
            role: "focus_word",
          },
        ],
      };
      const normalChunk: Chunk = {
        parts: [
          { text: "this is a normal chunk ", role: "normal" },
          { text: "length", role: "focus_word" },
        ],
      };

      const issues = inspectChunkLengths([shortChunk, normalChunk, longChunk]);
      expect(issues).toHaveLength(2);
      expect(issues[0].issue).toBe("under_target");
      expect(issues[1].issue).toBe("extreme_long");
    });
  });

  describe("validateChunkingOutput", () => {
    it("performs end-to-end validation on raw JSON string", () => {
      const rawInput = "Good morning everyone. Welcome to the conference.";
      const validJson = JSON.stringify({
        chunks: [
          {
            parts: [
              { text: "Good morning ", role: "normal" },
              { text: "everyone.", role: "focus_word" },
            ],
          },
          {
            parts: [
              { text: " Welcome to the ", role: "normal" },
              { text: "conference.", role: "focus_word" },
            ],
          },
        ],
      });

      const res = validateChunkingOutput(validJson, rawInput);
      expect(res.isValid).toBe(true);
      expect(res.schemaValid).toBe(true);
      expect(res.focusWordValid).toBe(true);
      expect(res.textIntegrityValid).toBe(true);
      expect(res.errors).toHaveLength(0);
    });

    it("handles invalid JSON syntax gracefully", () => {
      const res = validateChunkingOutput("{ invalid json ...", "Some text");
      expect(res.isValid).toBe(false);
      expect(res.errors[0]).toContain("JSON parse failed");
    });
  });
});
