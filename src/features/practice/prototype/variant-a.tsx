"use client";

import React, { useRef, useEffect } from "react";
import type { Chunk } from "./types";
import { getChunkPlainText } from "./mock-data";
import { Button } from "@/components/ui/button";
import {
  Volume2,
  ChevronUp,
  ChevronDown,
  LogOut,
  Sparkles,
  X,
  Loader2,
} from "lucide-react";

export interface VariantAProps {
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

export function VariantA({
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
}: VariantAProps) {
  const activeRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Smooth scroll active chunk to center
  useEffect(() => {
    if (status === "practicing" && activeRef.current && typeof activeRef.current.scrollIntoView === "function") {
      activeRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [activeChunkIndex, status]);

  if (status === "preparing") {
    return (
      <div
        data-testid="variant-a-preparing"
        className="w-full max-w-xl mx-auto p-8 sm:p-12 text-center rounded-2xl bg-card border shadow-sm flex flex-col items-center justify-center space-y-6 min-h-[380px]"
      >
        <div className="relative flex items-center justify-center">
          <div className="absolute h-24 w-24 rounded-full bg-primary/10 animate-ping opacity-75" />
          <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center text-primary">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </div>

        <div className="space-y-2 max-w-sm">
          <h3 className="text-xl font-semibold tracking-tight">
            Preparing your practice session…
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Analyzing rhythm, calculating natural breath Chunks, and identifying Focus Words.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={onCancelPreparing}
          className="gap-2 text-sm mt-4 border-muted-foreground/30 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-colors"
        >
          <X className="h-4 w-4" />
          Cancel preparation
        </Button>
      </div>
    );
  }

  const currentChunk = chunks[activeChunkIndex];
  const totalChunks = chunks.length;

  return (
    <div
      data-testid="variant-a-practice"
      className="w-full max-w-2xl mx-auto flex flex-col space-y-6"
    >
      {/* Top Teleprompter HUD */}
      <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-muted/40 border backdrop-blur-sm text-sm">
        <div className="flex items-center gap-2 font-medium">
          <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
          <span>
            Chunk <strong className="text-foreground">{activeChunkIndex + 1}</strong> of {totalChunks}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onPrevChunk}
            disabled={activeChunkIndex === 0}
            aria-label="Previous Chunk"
            className="h-8 w-8 p-0"
          >
            <ChevronUp className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onNextChunk}
            disabled={activeChunkIndex === totalChunks - 1}
            aria-label="Next Chunk"
            className="h-8 w-8 p-0"
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
          <div className="h-4 w-px bg-border mx-1" />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onExitPractice}
            aria-label="Exit practice to draft"
            className="h-8 text-xs text-muted-foreground hover:text-foreground gap-1.5"
          >
            <LogOut className="h-3.5 w-3.5" />
            Exit practice
          </Button>
        </div>
      </div>

      {/* Vertical Lyrics Teleprompter Column */}
      <div
        ref={containerRef}
        role="feed"
        aria-label="Vertical karaoke lyrics practice view"
        className="relative min-h-[380px] max-h-[520px] overflow-y-auto px-4 py-16 space-y-8 rounded-2xl bg-card border shadow-inner scroll-smooth"
      >
        {chunks.map((chunk, index) => {
          const isActive = index === activeChunkIndex;

          return (
            <div
              key={index}
              ref={isActive ? activeRef : null}
              onClick={() => onSelectChunk(index)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelectChunk(index);
                }
              }}
              aria-current={isActive ? "true" : undefined}
              aria-label={`Chunk ${index + 1}: ${getChunkPlainText(chunk)}`}
              className={`cursor-pointer text-center transition-all duration-300 rounded-xl px-4 py-3 select-none ${
                isActive
                  ? "opacity-100 scale-100 text-2xl sm:text-3xl font-semibold tracking-tight text-foreground bg-primary/5 shadow-xs"
                  : "opacity-30 hover:opacity-60 scale-95 text-lg sm:text-xl font-normal text-muted-foreground"
              }`}
            >
              {chunk.parts.map((part, partIdx) => {
                const isFocus = part.role === "focus_word";
                if (isFocus && isActive) {
                  return (
                    <span
                      key={partIdx}
                      data-testid="focus-word-accent"
                      className="inline-block mx-1 px-2.5 py-0.5 rounded-lg bg-primary/20 text-primary font-bold ring-2 ring-primary/40 shadow-sm transition-transform duration-200"
                    >
                      {part.text}
                    </span>
                  );
                }
                return <span key={partIdx}>{part.text}</span>;
              })}
            </div>
          );
        })}
      </div>

      {/* Bottom Focused Stage Controls */}
      {currentChunk && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-xl bg-card border shadow-sm">
          <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
            <Sparkles className="h-4 w-4 text-primary" />
            <span>Click any chunk line to jump, or use stepper controls.</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => onPlayAudio?.(getChunkPlainText(currentChunk))}
              className="gap-2 text-xs sm:text-sm h-9"
            >
              <Volume2 className={`h-4 w-4 ${isAudioPlaying ? "animate-bounce text-primary" : ""}`} />
              {isAudioPlaying ? "Playing chunk…" : "Listen to chunk"}
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={onNextChunk}
              disabled={activeChunkIndex === totalChunks - 1}
              className="gap-1.5 text-xs sm:text-sm h-9 px-4"
            >
              Next Chunk
              <ChevronDown className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
