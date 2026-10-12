import { describe, it, expect } from "vitest";
import React from "react";
import { renderHook, act } from "@testing-library/react";
import {
  PracticeSessionProvider,
  usePracticeSessionContext,
} from "./practice-session-context";

describe("PracticeSessionContext & Provider (Central State Skeleton)", () => {
  it("provides central practice session state to children", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <PracticeSessionProvider initialText="Initial central text">
        {children}
      </PracticeSessionProvider>
    );

    const { result } = renderHook(() => usePracticeSessionContext(), {
      wrapper,
    });

    expect(result.current.text).toBe("Initial central text");
    expect(result.current.characterCount).toBe(20);
    expect(result.current.isValid).toBe(true);
  });

  it("updates central state across subscribers", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <PracticeSessionProvider>{children}</PracticeSessionProvider>
    );

    const { result } = renderHook(() => usePracticeSessionContext(), {
      wrapper,
    });

    act(() => {
      result.current.setText("Updated text in central store");
    });

    expect(result.current.text).toBe("Updated text in central store");
    expect(result.current.characterCount).toBe(29);
  });

  it("throws descriptive error when consumed outside of Provider", () => {
    expect(() => {
      renderHook(() => usePracticeSessionContext());
    }).toThrow("usePracticeSessionContext must be used within a PracticeSessionProvider");
  });
});
