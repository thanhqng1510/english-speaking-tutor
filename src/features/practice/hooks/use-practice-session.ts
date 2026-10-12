"use client";

import { useState, useCallback } from "react";
import {
  createPracticeSessionState,
  updatePracticeSessionText,
  clearPracticeSessionText,
  MAX_PRACTICE_CHARACTERS,
} from "../model/practice-session";

export interface UsePracticeSessionReturn {
  text: string;
  characterCount: number;
  maxCharacters: number;
  isValid: boolean;
  setText: (value: string) => void;
  clear: () => void;
}

export function usePracticeSession(
  initialText = "",
  maxCharacters = MAX_PRACTICE_CHARACTERS
): UsePracticeSessionReturn {
  const [session, setSession] = useState(() =>
    createPracticeSessionState(initialText, maxCharacters)
  );

  const setText = useCallback((value: string) => {
    setSession((prev) => updatePracticeSessionText(prev, value));
  }, []);

  const clear = useCallback(() => {
    setSession((prev) => clearPracticeSessionText(prev));
  }, []);

  return {
    text: session.text,
    characterCount: session.characterCount,
    maxCharacters: session.maxCharacters,
    isValid: session.isValid,
    setText,
    clear,
  };
}
