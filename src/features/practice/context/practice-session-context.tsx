"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
} from "react";
import {
  createPracticeSessionState,
  updatePracticeSessionText,
  clearPracticeSessionText,
  MAX_PRACTICE_CHARACTERS,
  type PracticeSessionState,
} from "../model/practice-session";

export interface PracticeSessionContextValue extends PracticeSessionState {
  setText: (text: string) => void;
  clear: () => void;
}

const PracticeSessionContext = createContext<PracticeSessionContextValue | null>(
  null
);

export function PracticeSessionProvider({
  children,
  initialText = "",
  maxCharacters = MAX_PRACTICE_CHARACTERS,
}: {
  children: React.ReactNode;
  initialText?: string;
  maxCharacters?: number;
}) {
  const [session, setSession] = useState<PracticeSessionState>(() =>
    createPracticeSessionState(initialText, maxCharacters)
  );

  const setText = useCallback((newText: string) => {
    setSession((prev) => updatePracticeSessionText(prev, newText));
  }, []);

  const clear = useCallback(() => {
    setSession((prev) => clearPracticeSessionText(prev));
  }, []);

  const value = useMemo<PracticeSessionContextValue>(
    () => ({
      ...session,
      setText,
      clear,
    }),
    [session, setText, clear]
  );

  return (
    <PracticeSessionContext.Provider value={value}>
      {children}
    </PracticeSessionContext.Provider>
  );
}

export function usePracticeSessionContext(): PracticeSessionContextValue {
  const context = useContext(PracticeSessionContext);
  if (!context) {
    throw new Error(
      "usePracticeSessionContext must be used within a PracticeSessionProvider"
    );
  }
  return context;
}
