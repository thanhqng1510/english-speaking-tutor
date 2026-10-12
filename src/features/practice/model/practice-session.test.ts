import { describe, it, expect } from "vitest";
import {
  createPracticeSessionState,
  updatePracticeSessionText,
  clearPracticeSessionText,
  clampPracticeText,
} from "./practice-session";

describe("Practice Session State Model", () => {
  it("initializes with empty text, 0 character count, and 1200 max bound", () => {
    const session = createPracticeSessionState();

    expect(session.text).toBe("");
    expect(session.characterCount).toBe(0);
    expect(session.maxCharacters).toBe(1200);
    expect(session.isValid).toBe(false);
  });

  it("updates text and accurately tracks character count when typing", () => {
    const session = createPracticeSessionState();
    const updated = updatePracticeSessionText(
      session,
      "English pronunciation practice"
    );

    expect(updated.text).toBe("English pronunciation practice");
    expect(updated.characterCount).toBe(30);
    expect(updated.isValid).toBe(true);
  });

  it("enforces strict bounds at 1200 characters by clamping excess input", () => {
    const longInput = "a".repeat(1300);
    const clamped = clampPracticeText(longInput, 1200);

    expect(clamped.length).toBe(1200);

    const session = createPracticeSessionState();
    const updated = updatePracticeSessionText(session, longInput);

    expect(updated.text.length).toBe(1200);
    expect(updated.characterCount).toBe(1200);
  });

  it("resets text and character count when cleared", () => {
    const session = createPracticeSessionState("Some practice sentence");
    const cleared = clearPracticeSessionText(session);

    expect(cleared.text).toBe("");
    expect(cleared.characterCount).toBe(0);
    expect(cleared.isValid).toBe(false);
  });
});
