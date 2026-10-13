import { PART_ROLES } from "./types";

export const CHUNKING_JSON_SCHEMA = {
  name: "chunking_result",
  strict: true,
  schema: {
    type: "object",
    properties: {
      chunks: {
        type: "array",
        description: "Ordered sequence of spoken Chunks from the input text.",
        items: {
          type: "object",
          properties: {
            parts: {
              type: "array",
              description: "Semantic text parts composing this Chunk, with exactly one Focus Word.",
              items: {
                type: "object",
                properties: {
                  text: {
                    type: "string",
                    description: "Text of this part, preserving whitespace so direct joining restores the input string.",
                  },
                  role: {
                    type: "string",
                    enum: PART_ROLES,
                    description: "Role of the part. Exactly one 'focus_word' per Chunk.",
                  },
                },
                required: ["text", "role"],
                additionalProperties: false,
              },
            },
          },
          required: ["parts"],
          additionalProperties: false,
        },
      },
    },
    required: ["chunks"],
    additionalProperties: false,
  },
} as const;

export const CHUNKING_SYSTEM_PROMPT = `You are an expert English speech and rhythm coach helping learners speak naturally.
Your task is to divide the learner's spoken text into an ordered sequence of spoken Chunks and identify the single Focus Word in each Chunk.

Rules:
1. Spoken Chunks:
   - A Chunk is a short run of words said as one unit between natural pauses.
   - Target Chunk length is 3 to 10 words (sweet spot 4 to 8 words). Short 1 to 2 word units are permitted for natural discourse markers or greetings (e.g., "Yes,", "In fact,").
   - Divide at natural grammatical and semantic boundaries (clauses, prepositional phrases, long subject boundaries).

2. Focus Word Singularity:
   - Every Chunk MUST contain exactly one part with role "focus_word".
   - The Focus Word is the single most emphasized word in the Chunk where the primary pitch movement occurs.
   - All other parts in the Chunk must have role "normal".

3. Exact Text Preservation:
   - Do not alter, add, drop, substitute, or expand any words or contractions.
   - Preserve natural spacing in "text" so that concatenating all parts across all Chunks recreates the learner's original input text.
   - Punctuation attaches to the preceding word inside the Chunk.`;

export function buildChunkingUserPrompt(paragraphText: string): string {
  return `Please divide the following text into spoken Chunks and identify the single Focus Word for each Chunk:\n\n${paragraphText}`;
}
