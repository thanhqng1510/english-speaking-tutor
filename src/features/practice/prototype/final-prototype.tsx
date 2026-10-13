"use client";

import React, { useRef, useEffect, useCallback } from "react";
import type { Chunk } from "./types";
import { getChunkPlainText, getChunkFocusWord } from "./mock-data";
import { Button } from "@/components/ui/button";
import {
  Volume2,
  ChevronUp,
  ChevronDown,
  X,
  Volume1,
} from "lucide-react";

export interface FinalPrototypeProps {
  status: "draft" | "preparing" | "practicing";
  chunks: readonly Chunk[];
  activeChunkIndex: number;
  playingChunkIndex?: number | null;
  onSelectChunk: (index: number) => void;
  onPrevChunk: () => void;
  onNextChunk: () => void;
  onCancelPreparing: () => void;
  onExitPractice: () => void;
  onPlayAudio?: (text: string, chunkIndex?: number) => void;
  isAudioPlaying?: boolean;
}

export function FinalPrototype({
  status,
  chunks,
  activeChunkIndex,
  playingChunkIndex,
  onSelectChunk,
  onPrevChunk,
  onNextChunk,
  onCancelPreparing,
  onExitPractice,
  onPlayAudio,
  isAudioPlaying,
}: FinalPrototypeProps) {
  const activeRef = useRef<HTMLDivElement | null>(null);

  const currentChunk = chunks[activeChunkIndex];
  const totalChunks = chunks.length;
  const activeFocusWord = currentChunk ? getChunkFocusWord(currentChunk) : "";

  // Keep a ref to the current chunk so keyboard shortcuts always play the freshest active chunk
  const currentChunkRef = useRef(currentChunk);
  useEffect(() => {
    currentChunkRef.current = currentChunk;
  }, [currentChunk]);

  // Play audio for current full chunk
  const playCurrentChunk = useCallback(() => {
    const target = currentChunkRef.current;
    if (target && onPlayAudio) {
      onPlayAudio(getChunkPlainText(target), activeChunkIndex);
    }
  }, [onPlayAudio, activeChunkIndex]);

  // Play audio for only the Focus Word in isolation (Per Grilling Q2)
  const playFocusWordOnly = useCallback(() => {
    const target = currentChunkRef.current;
    const focusWord = target ? getChunkFocusWord(target) : "";
    if (focusWord && onPlayAudio) {
      onPlayAudio(focusWord, activeChunkIndex);
    }
  }, [onPlayAudio, activeChunkIndex]);

  // Keyboard navigation for practice mode
  useEffect(() => {
    if (status !== "practicing") return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      if (
        activeEl instanceof HTMLInputElement ||
        activeEl instanceof HTMLTextAreaElement ||
        activeEl?.getAttribute("contenteditable") === "true"
      ) {
        return;
      }

      if (e.key === "ArrowDown" || e.key === "j") {
        e.preventDefault();
        (document.activeElement as HTMLElement)?.blur();
        onNextChunk();
      } else if (e.key === "ArrowUp" || e.key === "k") {
        e.preventDefault();
        (document.activeElement as HTMLElement)?.blur();
        onPrevChunk();
      } else if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        playCurrentChunk();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [status, onNextChunk, onPrevChunk, playCurrentChunk]);

  // 1. Preparing State: Pure, minimal centered view with progress bar (no gray card)
  if (status === "preparing") {
    return (
      <div
        data-testid="final-preparing"
        className="w-full max-w-md mx-auto py-24 px-4 text-center space-y-6"
      >
        <div className="space-y-1.5">
          <h3 className="text-xl font-semibold tracking-tight text-foreground">
            Preparing your practice session…
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Analyzing natural cadence, breath Chunks, and Focus Words.
          </p>
        </div>

        {/* Dedicated Filling Progress Bar (Clean neutral tokens) */}
        <div className="w-full space-y-2 pt-2">
          <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-1000 ease-out animate-pulse"
              style={{ width: "85%" }}
            />
          </div>
        </div>

        <div className="pt-2 flex justify-center">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onCancelPreparing}
            className="text-xs text-muted-foreground hover:text-foreground gap-1.5 h-8 px-4 rounded-full"
          >
            <X className="h-3.5 w-3.5" />
            Cancel preparation
          </Button>
        </div>
      </div>
    );
  }

  // 2. Practicing State: Pure, distraction-free immersive canvas
  return (
    <div
      data-testid="final-practice"
      className="relative w-full max-w-3xl mx-auto flex flex-col items-center pb-28 pt-2"
    >
      {/* Immersive Top Bar: Visible helper guide on left, Exit button on right */}
      <div className="w-full flex flex-wrap items-center justify-between gap-2 py-1 px-3 border-b border-border/20 mb-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground/80 select-none font-medium">
          <span>
            Click chunk or press{" "}
            <kbd className="px-1.5 py-0.5 rounded bg-muted border text-[11px] font-mono shadow-2xs">
              Space
            </kbd>{" "}
            to listen
          </span>
          <span className="text-muted-foreground/40">•</span>
          <span>
            <kbd className="px-1.5 py-0.5 rounded bg-muted border text-[11px] font-mono shadow-2xs">
              ↑
            </kbd>{" "}
            <kbd className="px-1.5 py-0.5 rounded bg-muted border text-[11px] font-mono shadow-2xs">
              ↓
            </kbd>{" "}
            to change chunk
          </span>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onExitPractice}
          aria-label="Exit practice to draft"
          className="text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 gap-1.5 h-8 px-3 rounded-full transition-colors"
        >
          <X className="h-3.5 w-3.5" />
          Exit practice
        </Button>
      </div>

      {/* Pure Canvas: Distraction-free lyrics stream directly on the page */}
      <div
        role="feed"
        aria-label="Vertical karaoke lyrics practice canvas"
        className="w-full flex flex-col items-center justify-center py-6 sm:py-12 space-y-4 sm:space-y-6"
      >
        {chunks.map((chunk, index) => {
          const isActive = index === activeChunkIndex;
          const isThisChunkPlaying =
            (playingChunkIndex !== undefined && playingChunkIndex !== null
              ? playingChunkIndex === index
              : isActive) && Boolean(isAudioPlaying);

          return (
            <div
              key={index}
              ref={isActive ? activeRef : null}
              onClick={(e) => {
                (e.currentTarget as HTMLElement).blur();
                if (isActive) {
                  playCurrentChunk();
                } else {
                  onSelectChunk(index);
                  if (onPlayAudio) {
                    onPlayAudio(getChunkPlainText(chunk), index);
                  }
                }
              }}
              role="button"
              tabIndex={isActive ? 0 : -1}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  playCurrentChunk();
                }
              }}
              aria-current={isActive ? "true" : undefined}
              aria-label={`Chunk ${index + 1}: ${getChunkPlainText(chunk)}`}
              className={`group relative cursor-pointer text-center px-4 py-1.5 select-none transition-opacity duration-300 ease-out text-xl sm:text-2xl font-medium leading-relaxed ${
                isActive
                  ? "opacity-100 text-foreground"
                  : "opacity-30 hover:opacity-60 text-muted-foreground"
              }`}
            >
              <span className="inline-block relative">
                {chunk.parts.map((part, partIdx) => {
                  const isFocus = part.role === "focus_word";
                  if (!isFocus) {
                    return (
                      <span key={partIdx} className="transition-colors duration-300 ease-out">
                        {part.text}
                      </span>
                    );
                  }

                  return (
                    <span
                      key={partIdx}
                      data-testid={isActive ? "focus-word-accent" : undefined}
                      className={`inline transition-all duration-300 ease-out ${
                        isActive
                          ? "italic font-black text-foreground underline decoration-[2.5px] decoration-foreground underline-offset-8 tracking-wide text-[1.12em]"
                          : "italic font-bold text-foreground/90 underline decoration-1 decoration-foreground/40 underline-offset-6"
                      }`}
                    >
                      {part.text}
                    </span>
                  );
                })}

                {/* Minimal voice playing cue: strictly bound to the chunk actually playing */}
                <span
                  data-testid={isThisChunkPlaying ? "audio-playing-indicator" : undefined}
                  aria-label={isThisChunkPlaying ? "Voice playing" : undefined}
                  className={`absolute left-full ml-3 top-1/2 -translate-y-1/2 flex items-center gap-0.5 text-primary transition-opacity duration-200 pointer-events-none ${
                    isThisChunkPlaying ? "opacity-100" : "opacity-0"
                  }`}
                >
                  <span className="w-0.5 h-2.5 bg-current rounded-full animate-pulse" />
                  <span className="w-0.5 h-4 bg-current rounded-full animate-pulse [animation-delay:150ms]" />
                  <span className="w-0.5 h-2 bg-current rounded-full animate-pulse [animation-delay:300ms]" />
                </span>
              </span>
            </div>
          );
        })}
      </div>

      {/* Sleek Floating Bottom Bar: Actionable controls without canvas clutter */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2.5 sm:gap-3 px-3.5 sm:px-4 py-2 rounded-full bg-background/90 dark:bg-zinc-900/95 border shadow-xl backdrop-blur-md text-xs select-none">
        {/* Progress counter */}
        <div className="flex items-center gap-1 font-mono font-medium px-1">
          <span className="text-foreground font-bold">{activeChunkIndex + 1}</span>
          <span className="text-muted-foreground/50">/</span>
          <span className="text-muted-foreground">{totalChunks}</span>
        </div>

        <div className="h-3.5 w-px bg-border" />

        {/* Stepper Navigation */}
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={(e) => {
              (e.currentTarget as HTMLElement).blur();
              onPrevChunk();
            }}
            disabled={activeChunkIndex === 0}
            aria-label="Previous Chunk"
            className="p-1 rounded-full text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:pointer-events-none hover:bg-muted transition-colors"
          >
            <ChevronUp className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              (e.currentTarget as HTMLElement).blur();
              onNextChunk();
            }}
            disabled={activeChunkIndex === totalChunks - 1}
            aria-label="Next Chunk"
            className="p-1 rounded-full text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:pointer-events-none hover:bg-muted transition-colors"
          >
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>

        <div className="h-3.5 w-px bg-border" />

        {/* Listen Full Chunk Button */}
        <button
          type="button"
          onClick={(e) => {
            (e.currentTarget as HTMLElement).blur();
            playCurrentChunk();
          }}
          aria-label="Listen to active chunk"
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors font-medium"
        >
          <Volume2 className={`h-3.5 w-3.5 ${isAudioPlaying ? "text-primary animate-pulse" : ""}`} />
          <span>Listen</span>
        </button>

        {/* Hear Focus Word Only Button (Per Grilling Q2) */}
        {activeFocusWord && (
          <>
            <div className="h-3.5 w-px bg-border" />
            <button
              type="button"
              onClick={(e) => {
                (e.currentTarget as HTMLElement).blur();
                playFocusWordOnly();
              }}
              aria-label="Hear focus word in isolation"
              title={`Hear "${activeFocusWord}" spoken in isolation`}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 dark:bg-primary/20 text-foreground hover:bg-primary/20 transition-colors font-medium text-[11px]"
            >
              <Volume1 className="h-3.5 w-3.5 text-primary" />
              <span>Focus: <strong>{activeFocusWord}</strong></span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
