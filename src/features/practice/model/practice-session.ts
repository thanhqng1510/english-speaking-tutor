export interface PracticeSession {
  getText(): string;
  getCharacterCount(): number;
  getMaxCharacters(): number;
  isValid(): boolean;
  setText(value: string): void;
  clear(): void;
}

export const MAX_PRACTICE_CHARACTERS = 500;

export function createPracticeSession(maxCharacters = MAX_PRACTICE_CHARACTERS): PracticeSession {
  let currentText = "";

  return {
    getText() {
      return currentText;
    },
    getCharacterCount() {
      return currentText.length;
    },
    getMaxCharacters() {
      return maxCharacters;
    },
    isValid() {
      return currentText.trim().length > 0 && currentText.length <= maxCharacters;
    },
    setText(value: string) {
      if (value.length > maxCharacters) {
        currentText = value.slice(0, maxCharacters);
      } else {
        currentText = value;
      }
    },
    clear() {
      currentText = "";
    },
  };
}
