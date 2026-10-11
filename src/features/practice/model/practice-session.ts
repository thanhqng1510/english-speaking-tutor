export const MAX_PRACTICE_CHARACTERS = 500;

export interface PracticeSessionState {
  text: string;
  characterCount: number;
  maxCharacters: number;
  isValid: boolean;
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
