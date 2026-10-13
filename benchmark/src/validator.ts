import type {
  Chunk,
  ChunkLengthIssue,
  ChunkPart,
  ChunkingResult,
  ValidationResult,
} from "./types";

/**
 * Normalizes text into an ordered array of lowercase word tokens for word-for-word comparison.
 * Removes outer punctuation, quotes, ellipses, but preserves internal apostrophes (e.g. "don't", "we've").
 */
export function extractWords(text: string): string[] {
  return text
    .replace(/[—–]/g, " ")
    .replace(/[^a-zA-Z0-9'\s]/g, " ")
    .trim()
    .split(/\s+/)
    .map((token) => token.replace(/^'+|'+$/g, "").toLowerCase())
    .filter((word) => word.length > 0);
}

/**
 * Counts words in a Chunk by joining its parts.
 */
export function countChunkWords(chunk: Chunk): number {
  const chunkText = chunk.parts.map((p) => p.text).join("");
  return extractWords(chunkText).length;
}

/**
 * Validates the raw JSON or parsed output against the part-based schema.
 */
export function validateSchema(data: unknown): {
  valid: boolean;
  result: ChunkingResult | null;
  errors: string[];
} {
  const errors: string[] = [];

  if (!data || typeof data !== "object") {
    return { valid: false, result: null, errors: ["Output must be a non-null JSON object"] };
  }

  const obj = data as Record<string, unknown>;
  if (!Array.isArray(obj.chunks)) {
    return { valid: false, result: null, errors: ["Field 'chunks' must be an array"] };
  }

  if (obj.chunks.length === 0) {
    return { valid: false, result: null, errors: ["Field 'chunks' cannot be an empty array"] };
  }

  const validatedChunks: Chunk[] = [];

  for (let cIdx = 0; cIdx < obj.chunks.length; cIdx++) {
    const rawChunk = obj.chunks[cIdx];
    if (!rawChunk || typeof rawChunk !== "object") {
      errors.push(`Chunk at index ${cIdx} must be an object`);
      continue;
    }

    const chunkObj = rawChunk as Record<string, unknown>;
    if (!Array.isArray(chunkObj.parts)) {
      errors.push(`Chunk at index ${cIdx} is missing 'parts' array`);
      continue;
    }

    if (chunkObj.parts.length === 0) {
      errors.push(`Chunk at index ${cIdx} has an empty 'parts' array`);
      continue;
    }

    const validatedParts: ChunkPart[] = [];
    for (let pIdx = 0; pIdx < chunkObj.parts.length; pIdx++) {
      const rawPart = chunkObj.parts[pIdx];
      if (!rawPart || typeof rawPart !== "object") {
        errors.push(`Chunk ${cIdx}, part ${pIdx} must be an object`);
        continue;
      }

      const partObj = rawPart as Record<string, unknown>;
      if (typeof partObj.text !== "string") {
        errors.push(`Chunk ${cIdx}, part ${pIdx} 'text' must be a string`);
        continue;
      }

      if (partObj.role !== "normal" && partObj.role !== "focus_word") {
        errors.push(
          `Chunk ${cIdx}, part ${pIdx} 'role' must be either 'normal' or 'focus_word', received: '${String(partObj.role)}'`
        );
        continue;
      }

      validatedParts.push({
        text: partObj.text,
        role: partObj.role,
      });
    }

    validatedChunks.push({ parts: validatedParts });
  }

  if (errors.length > 0) {
    return { valid: false, result: null, errors };
  }

  return {
    valid: true,
    result: { chunks: validatedChunks },
    errors: [],
  };
}

/**
 * Validates that every Chunk contains exactly one Focus Word.
 */
export function validateFocusWords(chunks: readonly Chunk[]): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  chunks.forEach((chunk, index) => {
    const focusWords = chunk.parts.filter((p) => p.role === "focus_word");
    if (focusWords.length === 0) {
      errors.push(
        `Chunk ${index + 1} has 0 Focus Words (text: "${chunk.parts.map((p) => p.text).join("").trim()}"). Expected exactly 1.`
      );
    } else if (focusWords.length > 1) {
      const words = focusWords.map((p) => `"${p.text.trim()}"`).join(", ");
      errors.push(
        `Chunk ${index + 1} has ${focusWords.length} Focus Words (${words}). Expected exactly 1.`
      );
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validates that the reassembled Chunk parts match the raw input word-for-word in order.
 */
export function validateTextIntegrity(
  chunks: readonly Chunk[],
  rawInput: string
): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  const expectedWords = extractWords(rawInput);

  const reassembledText = chunks
    .flatMap((c) => c.parts)
    .map((p) => p.text)
    .join("");
  const actualWords = extractWords(reassembledText);

  if (expectedWords.length !== actualWords.length) {
    errors.push(
      `Word count mismatch: input has ${expectedWords.length} words, but output has ${actualWords.length} words.`
    );
  }

  const minLen = Math.min(expectedWords.length, actualWords.length);
  for (let i = 0; i < minLen; i++) {
    if (expectedWords[i] !== actualWords[i]) {
      errors.push(
        `Word mismatch at word ${i + 1}: expected "${expectedWords[i]}", received "${actualWords[i]}".`
      );
      if (errors.length >= 5) {
        errors.push("... (truncated further word mismatches)");
        break;
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Inspects chunk lengths against the 3-10 word target range and detects outliers.
 */
export function inspectChunkLengths(chunks: readonly Chunk[]): ChunkLengthIssue[] {
  const issues: ChunkLengthIssue[] = [];

  chunks.forEach((chunk, index) => {
    const wordCount = countChunkWords(chunk);
    const chunkText = chunk.parts.map((p) => p.text).join("").trim();

    if (wordCount === 0) {
      issues.push({
        chunkIndex: index,
        text: chunkText,
        wordCount,
        issue: "extreme_short",
      });
    } else if (wordCount < 3) {
      issues.push({
        chunkIndex: index,
        text: chunkText,
        wordCount,
        issue: "under_target",
      });
    } else if (wordCount > 15) {
      issues.push({
        chunkIndex: index,
        text: chunkText,
        wordCount,
        issue: "extreme_long",
      });
    } else if (wordCount > 10) {
      issues.push({
        chunkIndex: index,
        text: chunkText,
        wordCount,
        issue: "over_target",
      });
    }
  });

  return issues;
}

/**
 * Runs all 4 automated checks on a candidate model output:
 * 1. Valid JSON schema
 * 2. Focus Word singularity (exactly 1 per Chunk)
 * 3. Word-for-word text integrity against raw input
 * 4. Chunk length bounds inspection (3-10 words target)
 */
export function validateChunkingOutput(
  rawJsonOrObj: unknown,
  rawInput: string
): ValidationResult {
  const allErrors: string[] = [];

  let parsedData: unknown = rawJsonOrObj;
  if (typeof rawJsonOrObj === "string") {
    try {
      parsedData = JSON.parse(rawJsonOrObj);
    } catch (err) {
      const parseError = `JSON parse failed: ${err instanceof Error ? err.message : String(err)}`;
      return {
        isValid: false,
        schemaValid: false,
        focusWordValid: false,
        textIntegrityValid: false,
        chunkLengthIssues: [],
        errors: [parseError],
      };
    }
  }

  const schemaCheck = validateSchema(parsedData);
  if (!schemaCheck.valid || !schemaCheck.result) {
    allErrors.push(...schemaCheck.errors);
    return {
      isValid: false,
      schemaValid: false,
      focusWordValid: false,
      textIntegrityValid: false,
      chunkLengthIssues: [],
      errors: allErrors,
    };
  }

  const chunks = schemaCheck.result.chunks;

  const focusWordCheck = validateFocusWords(chunks);
  if (!focusWordCheck.valid) {
    allErrors.push(...focusWordCheck.errors);
  }

  const textIntegrityCheck = validateTextIntegrity(chunks, rawInput);
  if (!textIntegrityCheck.valid) {
    allErrors.push(...textIntegrityCheck.errors);
  }

  const chunkLengthIssues = inspectChunkLengths(chunks);

  // Hard reliability checks: schema, focus word, text integrity
  const isValid = schemaCheck.valid && focusWordCheck.valid && textIntegrityCheck.valid;

  return {
    isValid,
    schemaValid: schemaCheck.valid,
    focusWordValid: focusWordCheck.valid,
    textIntegrityValid: textIntegrityCheck.valid,
    chunkLengthIssues,
    errors: allErrors,
  };
}
