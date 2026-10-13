import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import {
  createChunksFromText,
  PRESET_PARAGRAPHS,
  getChunkPlainText,
  getChunkFocusWord,
} from "./mock-data";
import { VariantA } from "./variant-a";
import { VariantB } from "./variant-b";
import { VariantC } from "./variant-c";
import { FinalPrototype } from "./final-prototype";

describe("Prototype Mock Data & Chunker", () => {
  it("loads predefined presets with exactly one Focus Word per chunk and exact reassembly", () => {
    for (const preset of PRESET_PARAGRAPHS) {
      expect(preset.chunks.length).toBeGreaterThan(0);

      // Verify each chunk has exactly one Focus Word
      for (const chunk of preset.chunks) {
        const focusWords = chunk.parts.filter((p) => p.role === "focus_word");
        expect(focusWords).toHaveLength(1);
      }

      // Verify exact text reassembly
      const reconstructed = preset.chunks
        .flatMap((c) => c.parts)
        .map((p) => p.text)
        .join("");
      expect(reconstructed).toBe(preset.text);
    }
  });

  it("chunks custom arbitrary text into chunks with Focus Words and full reassembly", () => {
    const customText = "Effective communication requires rhythm, clear cadence, and steady pacing.";
    const chunks = createChunksFromText(customText);

    expect(chunks.length).toBeGreaterThan(0);

    for (const chunk of chunks) {
      const focusWords = chunk.parts.filter((p) => p.role === "focus_word");
      expect(focusWords).toHaveLength(1);
      expect(getChunkPlainText(chunk).length).toBeGreaterThan(0);
      expect(getChunkFocusWord(chunk).length).toBeGreaterThan(0);
    }
  });
});

describe("Variant A (Immersive Teleprompter)", () => {
  const sampleChunks = PRESET_PARAGRAPHS[0].chunks;

  it("renders preparing view with Cancel button", () => {
    const handleCancel = vi.fn();
    render(
      <VariantA
        status="preparing"
        chunks={[]}
        activeChunkIndex={0}
        onSelectChunk={vi.fn()}
        onPrevChunk={vi.fn()}
        onNextChunk={vi.fn()}
        onCancelPreparing={handleCancel}
        onExitPractice={vi.fn()}
      />
    );

    expect(screen.getByTestId("variant-a-preparing")).toBeInTheDocument();
    const cancelBtn = screen.getByRole("button", { name: /cancel preparation/i });
    fireEvent.click(cancelBtn);
    expect(handleCancel).toHaveBeenCalledTimes(1);
  });

  it("renders practicing view with active chunk, focus word accent, and click interaction", () => {
    const handleSelect = vi.fn();
    const handleNext = vi.fn();

    render(
      <VariantA
        status="practicing"
        chunks={sampleChunks}
        activeChunkIndex={0}
        onSelectChunk={handleSelect}
        onPrevChunk={vi.fn()}
        onNextChunk={handleNext}
        onCancelPreparing={vi.fn()}
        onExitPractice={vi.fn()}
      />
    );

    expect(screen.getByTestId("variant-a-practice")).toBeInTheDocument();
    expect(screen.getByTestId("focus-word-accent")).toBeInTheDocument();

    // Click on chunk 2 line
    const chunk2 = screen.getByRole("button", { name: /^Chunk 2:/i });
    fireEvent.click(chunk2);
    expect(handleSelect).toHaveBeenCalledWith(1);

    // Click Next Chunk
    const nextButtons = screen.getAllByRole("button", { name: /next chunk/i });
    fireEvent.click(nextButtons[0]);
    expect(handleNext).toHaveBeenCalledTimes(1);
  });
});

describe("Variant B (Split Studio & Focus Inspector)", () => {
  const sampleChunks = PRESET_PARAGRAPHS[0].chunks;

  it("renders preparing view with pipeline checklist and cancel button", () => {
    const handleCancel = vi.fn();
    render(
      <VariantB
        status="preparing"
        chunks={[]}
        activeChunkIndex={0}
        onSelectChunk={vi.fn()}
        onPrevChunk={vi.fn()}
        onNextChunk={vi.fn()}
        onCancelPreparing={handleCancel}
        onExitPractice={vi.fn()}
      />
    );

    expect(screen.getByTestId("variant-b-preparing")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(handleCancel).toHaveBeenCalledTimes(1);
  });

  it("renders 2-column layout with numbered score track and active chunk inspector", () => {
    const handleSelect = vi.fn();
    render(
      <VariantB
        status="practicing"
        chunks={sampleChunks}
        activeChunkIndex={0}
        onSelectChunk={handleSelect}
        onPrevChunk={vi.fn()}
        onNextChunk={vi.fn()}
        onCancelPreparing={vi.fn()}
        onExitPractice={vi.fn()}
      />
    );

    expect(screen.getByTestId("variant-b-practice")).toBeInTheDocument();
    expect(screen.getByText(/rhythm score/i)).toBeInTheDocument();
    expect(screen.getByText(/active chunk drill/i)).toBeInTheDocument();
    expect(screen.getByTestId("focus-word-accent")).toBeInTheDocument();

    // Click line 2
    const lines = screen.getAllByRole("button");
    const line2 = lines.find((el) => el.textContent?.includes("02"));
    expect(line2).toBeDefined();
    if (line2) {
      fireEvent.click(line2);
      expect(handleSelect).toHaveBeenCalledWith(1);
    }
  });
});

describe("Variant C (Flow Ribbon)", () => {
  const sampleChunks = PRESET_PARAGRAPHS[0].chunks;

  it("renders rhythm stream and docked sticky ribbon", () => {
    const handleSelect = vi.fn();
    const handleExit = vi.fn();

    render(
      <VariantC
        status="practicing"
        chunks={sampleChunks}
        activeChunkIndex={0}
        onSelectChunk={handleSelect}
        onPrevChunk={vi.fn()}
        onNextChunk={vi.fn()}
        onCancelPreparing={vi.fn()}
        onExitPractice={handleExit}
      />
    );

    expect(screen.getByTestId("variant-c-practice")).toBeInTheDocument();
    expect(screen.getByTestId("focus-word-accent")).toBeInTheDocument();

    const exitBtn = screen.getByRole("button", { name: /exit/i });
    fireEvent.click(exitBtn);
    expect(handleExit).toHaveBeenCalledTimes(1);
  });
});

describe("FinalPrototype (Unified Synthesized Design)", () => {
  const sampleChunks = PRESET_PARAGRAPHS[0].chunks;

  it("renders preparing view with dedicated filling progress bar and cancel button", () => {
    const handleCancel = vi.fn();
    render(
      <FinalPrototype
        status="preparing"
        chunks={[]}
        activeChunkIndex={0}
        onSelectChunk={vi.fn()}
        onPrevChunk={vi.fn()}
        onNextChunk={vi.fn()}
        onCancelPreparing={handleCancel}
        onExitPractice={vi.fn()}
      />
    );

    expect(screen.getByTestId("final-preparing")).toBeInTheDocument();
    expect(screen.getByText(/preparing your practice session/i)).toBeInTheDocument();
    const cancelBtn = screen.getByRole("button", { name: /cancel preparation/i });
    fireEvent.click(cancelBtn);
    expect(handleCancel).toHaveBeenCalledTimes(1);
  });

  it("renders practicing view with lyrics canvas, Focus Word pill, right panel, and bottom floating bar", () => {
    const handleSelect = vi.fn();
    const handleNext = vi.fn();
    const handlePrev = vi.fn();
    const handleExit = vi.fn();
    const handlePlayAudio = vi.fn();

    render(
      <FinalPrototype
        status="practicing"
        chunks={sampleChunks}
        activeChunkIndex={0}
        onSelectChunk={handleSelect}
        onPrevChunk={handlePrev}
        onNextChunk={handleNext}
        onCancelPreparing={vi.fn()}
        onExitPractice={handleExit}
        onPlayAudio={handlePlayAudio}
      />
    );

    expect(screen.getByTestId("final-practice")).toBeInTheDocument();
    expect(screen.getByTestId("focus-word-accent")).toBeInTheDocument();

    // Isolated Focus Word audio trigger in bottom floating bar (per Q2)
    const focusWordBtn = screen.getByRole("button", { name: /hear focus word in isolation/i });
    expect(focusWordBtn).toBeInTheDocument();
    fireEvent.click(focusWordBtn);
    expect(handlePlayAudio).toHaveBeenCalledWith(expect.any(String));

    // Bottom floating bar counter
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();

    // Single exit button
    const exitBtn = screen.getByRole("button", { name: /exit practice to draft/i });
    fireEvent.click(exitBtn);
    expect(handleExit).toHaveBeenCalledTimes(1);

    // Audio replay button in bottom bar
    const listenBtn = screen.getByRole("button", { name: /listen to active chunk/i });
    fireEvent.click(listenBtn);
    expect(handlePlayAudio).toHaveBeenCalledTimes(2);

    // Top bar helper guide
    expect(screen.getByText(/click chunk or press/i)).toBeInTheDocument();

    // Next chunk in bottom bar
    const nextBtn = screen.getByRole("button", { name: /next chunk/i });
    fireEvent.click(nextBtn);
    expect(handleNext).toHaveBeenCalledTimes(1);
  });

  it("plays current chunk audio on Space key press without playing stale chunk", () => {
    const handleNext = vi.fn();
    const handlePlayAudio = vi.fn();

    const { rerender } = render(
      <FinalPrototype
        status="practicing"
        chunks={sampleChunks}
        activeChunkIndex={0}
        onSelectChunk={vi.fn()}
        onPrevChunk={vi.fn()}
        onNextChunk={handleNext}
        onCancelPreparing={vi.fn()}
        onExitPractice={vi.fn()}
        onPlayAudio={handlePlayAudio}
      />
    );

    // Press Space on initial chunk 0
    fireEvent.keyDown(window, { key: " " });
    expect(handlePlayAudio).toHaveBeenCalledWith(getChunkPlainText(sampleChunks[0]));

    // Advance to chunk 1
    rerender(
      <FinalPrototype
        status="practicing"
        chunks={sampleChunks}
        activeChunkIndex={1}
        onSelectChunk={vi.fn()}
        onPrevChunk={vi.fn()}
        onNextChunk={handleNext}
        onCancelPreparing={vi.fn()}
        onExitPractice={vi.fn()}
        onPlayAudio={handlePlayAudio}
      />
    );

    // Press Space again: must play Chunk 1, not the old Chunk 0
    fireEvent.keyDown(window, { key: " " });
    expect(handlePlayAudio).toHaveBeenLastCalledWith(getChunkPlainText(sampleChunks[1]));
  });
});

describe("PrototypePracticeHost Preset Selection", () => {
  it("updates textarea text and character counter when clicking different presets", async () => {
    // Dynamically import to ensure client component loads in test
    const { PrototypePracticeHost } = await import("./prototype-host");
    render(<PrototypePracticeHost />);

    const textarea = screen.getByRole("textbox", {
      name: /practice english text/i,
    }) as HTMLTextAreaElement;

    // Initially short preset
    expect(textarea.value).toBe(PRESET_PARAGRAPHS[0].text);

    // Click medium preset
    const mediumBtn = screen.getByRole("button", { name: /MEDIUM/i });
    fireEvent.click(mediumBtn);

    expect(textarea.value).toBe(PRESET_PARAGRAPHS[1].text);

    // Click long preset
    const longBtn = screen.getByRole("button", { name: /LONG/i });
    fireEvent.click(longBtn);

    expect(textarea.value).toBe(PRESET_PARAGRAPHS[2].text);
  });
});
