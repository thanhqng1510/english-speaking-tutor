import { describe, it, expect } from "vitest";
import { createPracticeSession } from "./practice-session";

describe("Practice Session State Model", () => {
  it("initializes with empty text, 0 character count, and 500 max bound", () => {
    const session = createPracticeSession();

    expect(session.getText()).toBe("");
    expect(session.getCharacterCount()).toBe(0);
    expect(session.getMaxCharacters()).toBe(500);
    expect(session.isValid()).toBe(false);
  });

  it("updates text and accurately tracks character count when typing", () => {
    const session = createPracticeSession();
    session.setText("English pronunciation practice");

    expect(session.getText()).toBe("English pronunciation practice");
    expect(session.getCharacterCount()).toBe(30);
    expect(session.isValid()).toBe(true);
  });

  it("enforces strict bounds at 500 characters by clamping excess input", () => {
    const session = createPracticeSession();
    const longInput = "a".repeat(550);
    session.setText(longInput);

    expect(session.getText().length).toBe(500);
    expect(session.getCharacterCount()).toBe(500);
  });

  it("resets text and character count when cleared", () => {
    const session = createPracticeSession();
    session.setText("Some practice sentence");
    session.clear();

    expect(session.getText()).toBe("");
    expect(session.getCharacterCount()).toBe(0);
    expect(session.isValid()).toBe(false);
  });
});
