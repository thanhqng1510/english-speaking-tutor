import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PracticeWorkspace } from "./practice-workspace";

describe("PracticeWorkspace Component", () => {
  it("renders textarea with placeholder and initial 0 / 1200 character counter", () => {
    render(<PracticeWorkspace />);

    const textarea = screen.getByRole("textbox", {
      name: /practice english text/i,
    });
    expect(textarea).toBeInTheDocument();
    expect(textarea).toHaveAttribute(
      "placeholder",
      expect.stringContaining("Paste or type English text")
    );

    const counter = screen.getByTestId("character-counter");
    expect(counter).toHaveTextContent("0 / 1200");
  });

  it("updates character counter as user types", () => {
    render(<PracticeWorkspace />);

    const textarea = screen.getByRole("textbox", {
      name: /practice english text/i,
    });
    fireEvent.change(textarea, {
      target: { value: "Pronunciation is key to fluent communication." },
    });

    const counter = screen.getByTestId("character-counter");
    expect(counter).toHaveTextContent("45 / 1200");
  });

  it("enforces 1200 character maximum limit", () => {
    render(<PracticeWorkspace />);

    const textarea = screen.getByRole("textbox", {
      name: /practice english text/i,
    });
    expect(textarea).toHaveAttribute("maxLength", "1200");

    const overLimit = "x".repeat(1250);
    fireEvent.change(textarea, { target: { value: overLimit } });

    const counter = screen.getByTestId("character-counter");
    expect(counter).toHaveTextContent("1200 / 1200");
    expect((textarea as HTMLTextAreaElement).value.length).toBe(1200);
  });

  it("allows clearing the text via Clear button", () => {
    render(<PracticeWorkspace />);

    const textarea = screen.getByRole("textbox", {
      name: /practice english text/i,
    });
    fireEvent.change(textarea, { target: { value: "Sentence to practice" } });

    const clearButton = screen.getByRole("button", { name: /clear text/i });
    fireEvent.click(clearButton);

    expect(screen.getByTestId("character-counter")).toHaveTextContent("0 / 1200");
    expect((textarea as HTMLTextAreaElement).value).toBe("");
  });

  it("calls onStartPractice with current text when submit/start is clicked", () => {
    const handleStart = vi.fn();
    render(<PracticeWorkspace onStartPractice={handleStart} />);

    const textarea = screen.getByRole("textbox", {
      name: /practice english text/i,
    });
    fireEvent.change(textarea, { target: { value: "Hello world" } });

    const startButton = screen.getByRole("button", { name: /start practice/i });
    expect(startButton).not.toBeDisabled();
    fireEvent.click(startButton);

    expect(handleStart).toHaveBeenCalledWith("Hello world");
  });

  it("disables start practice button when text is empty", () => {
    render(<PracticeWorkspace />);

    const startButton = screen.getByRole("button", { name: /start practice/i });
    expect(startButton).toBeDisabled();
  });
});
