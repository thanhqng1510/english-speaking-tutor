"use client";

import { useState, useCallback } from "react";
import {
  createPracticeSession,
  MAX_PRACTICE_CHARACTERS,
  type PracticeSession,
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
  const [session] = useState<PracticeSession>(() => {
    const s = createPracticeSession(maxCharacters);
    if (initialText) {
      s.setText(initialText);
    }
    return s;
  });

  const [text, setTextState] = useState<string>(() => session.getText());

  const setText = useCallback(
    (value: string) => {
      session.setText(value);
      setTextState(session.getText());
    },
    [session]
  );

  const clear = useCallback(() => {
    session.clear();
    setTextState(session.getText());
  }, [session]);

  return {
    text,
    characterCount: session.getCharacterCount(),
    maxCharacters: session.getMaxCharacters(),
    isValid: session.isValid(),
    setText,
    clear,
  };
}
