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
  Sparkles,
} from "lucide-react";

export interface FinalPrototypeProps {
  status: "draft" | "preparing" | "practicing";
  chunks: readonly Chunk[];
  activeChunkIndex: number;
  onSelectChunk: (index: number) => void;
  onPrevChunk: () => void;
  onNextChunk: () => void;
  onCancelPreparing: () => void;
  onExitPractice: () => void;
  onPlayAudio?: (text: string) => void;
  isAudioPlaying?: boolean;
}

export function FinalPrototype({
  status,
  chunks,
  activeChunkIndex,
  onSelectChunk,
  onPrevChunk,
  onNextChunk,
  onCancelPreparing,
  onExitPractice,
  onPlayAudio,
  isAudioPlaying,
}: FinalPrototypeProps) {
  const activeRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Keep position stable without layout shifts or auto-scrolling
  const currentChunk = chunks[activeChunkIndex];
  const totalChunks = chunks.length;
  const activeFocusWord = currentChunk ? getChunkFocusWord(currentChunk) : "";

  // Play audio for current chunk
  const playCurrentChunk = useCallback(() => {
    if (currentChunk && onPlayAudio) {
      onPlayAudio(getChunkPlainText(currentChunk));
    }
  }, [currentChunk, onPlayAudio]);

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
        onNextChunk();
      } else if (e.key === "ArrowUp" || e.key === "k") {
        e.preventDefault();
        onPrevChunk();
      } else if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        playCurrentChunk();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [status, onNextChunk, onPrevChunk, playCurrentChunk]);

  // 1. Preparing State: dedicated filling progress bar with clean neutral colors
  if (status === "preparing") {
    return (
      <div
        data-testid="final-preparing"
        className="w-full max-w-lg mx-auto py-12 px-6 sm:px-8 rounded-2xl bg-card border shadow-xs text-center space-y-6"
      >
        <div className="space-y-2">
          <h3 className="text-lg sm:text-xl font-semibold tracking-tight text-foreground">
            Preparing your practice session…
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Analyzing natural cadence, breath Chunks, and Focus Words.
          </p>
        </div>

        {/* Dedicated Filling Progress Bar (Neutral tokens, light & dark mode) */}
        <div className="w-full space-y-2">
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
            className="text-xs text-muted-foreground hover:text-foreground hover:bg-muted gap-1.5 h-8 px-4"
          >
            <X className="h-3.5 w-3.5" />
            Cancel preparation
          </Button>
        </div>
      </div>
    );
  }

  // 2. Practicing State: Immersive Canvas + Right Info Panel + Sleek Floating Bar
  return (
    <div
      data-testid="final-practice"
      className="relative w-full max-w-5xl mx-auto space-y-4 pb-24"
    >
      {/* Immersive Top Bar: Minimalist Exit Practice Button */}
      <div className="flex items-center justify-between px-2 py-1">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
          <span className="font-medium">Practice Mode</span>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onExitPractice}
          aria-label="Exit practice to draft"
          className="text-xs text-muted-foreground hover:text-foreground hover:bg-muted gap-1.5 h-8 px-3 rounded-full transition-colors"
        >
          <X className="h-3.5 w-3.5" />
          Exit practice
        </Button>
      </div>

      {/* Main 2-Column Immersive Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left / Center Canvas: Immersive Scrolling Lyrics */}
        <div className="lg:col-span-8 flex flex-col items-center">
          <div
            ref={containerRef}
            role="feed"
            aria-label="Vertical karaoke lyrics practice canvas"
            className="w-full relative min-h-[400px] max-h-[540px] overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden px-4 sm:px-6 py-12 space-y-3 rounded-2xl bg-card border shadow-xs"
          >
            {chunks.map((chunk, index) => {
              const isActive = index === activeChunkIndex;

              return (
                <div
                  key={index}
                  ref={isActive ? activeRef : null}
                  onClick={() => {
                    if (isActive) {
                      playCurrentChunk();
                    } else {
                      onSelectChunk(index);
                      if (onPlayAudio) {
                        onPlayAudio(getChunkPlainText(chunk));
                      }
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      if (isActive) {
                        playCurrentChunk();
                      } else {
                        onSelectChunk(index);
                        if (onPlayAudio) {
                          onPlayAudio(getChunkPlainText(chunk));
                        }
                      }
                    }
                  }}
                  aria-current={isActive ? "true" : undefined}
                  aria-label={`Chunk ${index + 1}: ${getChunkPlainText(chunk)}`}
                  className={`group relative cursor-pointer text-center rounded-xl px-4 py-3 select-none transition-colors duration-150 text-xl sm:text-2xl leading-relaxed ${
                    isActive
                      ? "opacity-100 font-semibold text-foreground bg-muted/50 shadow-xs"
                      : "opacity-35 hover:opacity-65 text-muted-foreground font-normal bg-transparent"
                  }`}
                >
                  {chunk.parts.map((part, partIdx) => {
                    const isFocus = part.role === "focus_word";
                    if (isFocus && isActive) {
                      return (
                        <span
                          key={partIdx}
                          data-testid="focus-word-accent"
                          className="inline-block mx-1 px-2.5 py-0.5 rounded-lg bg-primary/10 dark:bg-primary/20 text-foreground dark:text-foreground font-bold border border-primary/25 shadow-2xs"
                        >
                          {part.text}
                        </span>
                      );
                    }
                    return <span key={partIdx}>{part.text}</span>;
                  })}

                  {/* Inline Audio Feedback Indicator (replaces dedicated button) */}
                  {isActive && (
                    <span
                      className="inline-flex items-center ml-2.5 align-middle text-muted-foreground group-hover:text-foreground transition-colors"
                      title="Click chunk or press Space to listen"
                    >
                      {isAudioPlaying ? (
                        <Volume2 className="h-5 w-5 animate-bounce text-primary" />
                      ) : (
                        <Volume2 className="h-4 w-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                      )}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Micro hint below canvas */}
          <div className="pt-2 text-[11px] text-muted-foreground/60 select-none">
            Click any line to speak • Space to replay • ↑ / ↓ to step
          </div>
        </div>

        {/* Right-Hand Info Panel: Focus Word & Cadence Analysis (Extensible for future prosody) */}
        <div className="lg:col-span-4 sticky top-6 space-y-4">
          <div className="rounded-2xl bg-card border shadow-xs p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b text-xs">
              <span className="font-mono uppercase tracking-wider font-semibold text-muted-foreground text-[11px]">
                Chunk Focus
              </span>
              <span className="font-mono text-muted-foreground">
                {activeChunkIndex + 1} / {totalChunks}
              </span>
            </div>

            {/* Focus Word Breakdown */}
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground">Key Pitch Stress:</div>
              <div className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                &ldquo;{activeFocusWord}&rdquo;
                <Sparkles className="h-4 w-4 text-primary opacity-70" />
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed pt-1">
                Deliver this word with the primary pitch peak of the phrase. Extend the vowel length and pause briefly after this breath unit.
              </p>
            </div>

            {/* Cadence Metrics & Future Extension Slot */}
            <div className="rounded-xl bg-muted/40 p-3 space-y-2 border text-xs">
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Phrase Rhythm:</span>
                <span className="font-medium text-foreground">
                  {currentChunk?.parts.map((p) => p.text).join("").trim().split(/\s+/).length} words
                </span>
              </div>
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Breath Boundary:</span>
                <span className="font-medium text-foreground">Natural pause</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Sleek Floating Bottom Bar: Useful function without cluttering canvas */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 px-4 py-2 rounded-full bg-background/90 dark:bg-zinc-900/95 border shadow-xl backdrop-blur-md text-xs select-none">
        {/* Progress counter */}
        <div className="flex items-center gap-1.5 font-mono font-medium px-1">
          <span className="text-foreground font-bold">{activeChunkIndex + 1}</span>
          <span className="text-muted-foreground/60">/</span>
          <span className="text-muted-foreground">{totalChunks}</span>
        </div>

        <div className="h-3.5 w-px bg-border" />

        {/* Stepper Navigation */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onPrevChunk}
            disabled={activeChunkIndex === 0}
            aria-label="Previous Chunk"
            className="p-1 rounded-full text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:pointer-events-none hover:bg-muted transition-colors"
          >
            <ChevronUp className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onNextChunk}
            disabled={activeChunkIndex === totalChunks - 1}
            aria-label="Next Chunk"
            className="p-1 rounded-full text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:pointer-events-none hover:bg-muted transition-colors"
          >
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>

        <div className="h-3.5 w-px bg-border" />

        {/* Audio Replay Button */}
        <button
          type="button"
          onClick={playCurrentChunk}
          aria-label="Listen to active chunk"
          className="flex items-center gap-1 px-2 py-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors font-medium"
        >
          {isAudioPlaying ? (
            <Volume2 className="h-3.5 w-3.5 text-primary animate-pulse" />
          ) : (
            <Volume2 className="h-3.5 w-3.5" />
          )}
          <span>Listen</span>
        </button>

        <span className="text-[10px] text-muted-foreground/60 hidden sm:inline font-mono pl-1">
          (Space: play)
        </span>
      </div>
    </div>
  );
}
