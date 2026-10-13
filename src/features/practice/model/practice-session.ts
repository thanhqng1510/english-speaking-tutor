export const MAX_PRACTICE_CHARACTERS = 1200;

export type PartRole = "normal" | "focus_word";

export interface ChunkPart {
  readonly text: string;
  readonly role: PartRole;
}

export interface Chunk {
  readonly parts: readonly ChunkPart[];
}

export type PracticeSessionStatus = "draft" | "preparing" | "practicing";

export interface PracticeSessionState {
  status?: PracticeSessionStatus;
  text: string;
  characterCount: number;
  maxCharacters: number;
  isValid: boolean;
  chunks?: readonly Chunk[];
  activeChunkIndex?: number;
}

export function clampPracticeText(
  text: string,
  maxCharacters = MAX_PRACTICE_CHARACTERS
): string {
  if (text.length > maxCharacters) {
    return text.slice(0, maxCharacters);
  }
  return text;
}

export function createPracticeSessionState(
  initialText = "",
  maxCharacters = MAX_PRACTICE_CHARACTERS
): PracticeSessionState {
  const text = clampPracticeText(initialText, maxCharacters);
  return {
    text,
    characterCount: text.length,
    maxCharacters,
    isValid: text.trim().length > 0 && text.length <= maxCharacters,
  };
}

export function updatePracticeSessionText(
  state: PracticeSessionState,
  newText: string
): PracticeSessionState {
  const text = clampPracticeText(newText, state.maxCharacters);
  return {
    ...state,
    text,
    characterCount: text.length,
    isValid: text.trim().length > 0 && text.length <= state.maxCharacters,
  };
}

export function clearPracticeSessionText(
  state: PracticeSessionState
): PracticeSessionState {
  return updatePracticeSessionText(state, "");
}
