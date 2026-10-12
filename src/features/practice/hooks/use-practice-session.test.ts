import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { usePracticeSession } from "./use-practice-session";

describe("usePracticeSession hook", () => {
  it("provides initial state with 0 characters", () => {
    const { result } = renderHook(() => usePracticeSession());

    expect(result.current.text).toBe("");
    expect(result.current.characterCount).toBe(0);
    expect(result.current.maxCharacters).toBe(1200);
    expect(result.current.isValid).toBe(false);
  });

  it("updates text and character count when setText is called", () => {
    const { result } = renderHook(() => usePracticeSession());

    act(() => {
      result.current.setText("Practicing rhythm and stress");
    });

    expect(result.current.text).toBe("Practicing rhythm and stress");
    expect(result.current.characterCount).toBe(28);
    expect(result.current.isValid).toBe(true);
  });

  it("clamps input when exceeding 1200 characters", () => {
    const { result } = renderHook(() => usePracticeSession());
    const overLimit = "b".repeat(1250);

    act(() => {
      result.current.setText(overLimit);
    });

    expect(result.current.text.length).toBe(1200);
    expect(result.current.characterCount).toBe(1200);
  });

  it("clears input on clear()", () => {
    const { result } = renderHook(() => usePracticeSession());

    act(() => {
      result.current.setText("Hello");
    });
    expect(result.current.text).toBe("Hello");

    act(() => {
      result.current.clear();
    });
    expect(result.current.text).toBe("");
    expect(result.current.characterCount).toBe(0);
  });
});
