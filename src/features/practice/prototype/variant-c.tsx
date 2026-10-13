"use client";

import React, { useRef, useEffect } from "react";
import type { Chunk } from "./types";
import { getChunkPlainText, getChunkFocusWord } from "./mock-data";
import { Button } from "@/components/ui/button";
import {
  Volume2,
  ChevronLeft,
  ChevronRight,
  LogOut,
  X,
  AudioWaveform,
  CornerDownRight,
  Flame,
} from "lucide-react";

export interface VariantCProps {
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

export function VariantC({
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
}: VariantCProps) {
  const activeCardRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (status === "practicing" && activeCardRef.current && typeof activeCardRef.current.scrollIntoView === "function") {
      activeCardRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [activeChunkIndex, status]);

  if (status === "preparing") {
    return (
      <div
        data-testid="variant-c-preparing"
        className="w-full max-w-2xl mx-auto rounded-2xl bg-card border shadow-sm p-6 sm:p-8 space-y-5"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <AudioWaveform className="h-5 w-5 text-emerald-500 animate-pulse" />
            <h3 className="text-lg font-semibold tracking-tight">
              Preparing Speaking Session
            </h3>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onCancelPreparing}
            className="h-8 text-xs text-muted-foreground hover:text-destructive gap-1"
          >
            <X className="h-3.5 w-3.5" />
            Cancel
          </Button>
        </div>

        {/* Animated gradient progress bar */}
        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-linear-to-r from-emerald-500 via-teal-400 to-emerald-600 animate-pulse w-3/4 rounded-full" />
        </div>

        <p className="text-sm text-muted-foreground leading-relaxed">
          Splitting text into natural breath units and locking rhythm focus points…
        </p>
      </div>
    );
  }

  const currentChunk = chunks[activeChunkIndex];
  const totalChunks = chunks.length;
  const activeFocusWord = currentChunk ? getChunkFocusWord(currentChunk) : "";

  return (
    <div
      data-testid="variant-c-practice"
      className="w-full max-w-3xl mx-auto space-y-6 pb-24"
    >
      {/* Top Header Card */}
      <div className="flex items-center justify-between px-5 py-3 rounded-2xl bg-card border shadow-xs">
        <div className="flex items-center gap-2">
          <AudioWaveform className="h-5 w-5 text-emerald-500" />
          <span className="font-semibold text-sm sm:text-base">
            Flow Reader & Rhythm Stream
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <span>{totalChunks} Breath Units</span>
          <div className="h-3 w-px bg-border" />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onExitPractice}
            className="h-8 text-xs text-muted-foreground hover:text-foreground gap-1"
          >
            <LogOut className="h-3.5 w-3.5" />
            Exit
          </Button>
        </div>
      </div>

      {/* Rhythm Cards Stream */}
      <div
        role="feed"
        aria-label="Flowing rhythm stream practice view"
        className="space-y-3"
      >
        {chunks.map((chunk, index) => {
          const isActive = index === activeChunkIndex;

          return (
            <div
              key={index}
              ref={isActive ? activeCardRef : null}
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
              className={`group flex items-start gap-4 p-4 rounded-xl cursor-pointer transition-all border ${
                isActive
                  ? "bg-emerald-500/5 dark:bg-emerald-950/20 border-l-4 border-l-emerald-500 border-t-emerald-500/20 border-r-emerald-500/20 border-b-emerald-500/20 shadow-xs"
                  : "bg-card border-border hover:bg-muted/30"
              }`}
            >
              <div className="flex flex-col items-center pt-0.5 select-none">
                <span
                  className={`text-xs font-mono font-bold px-2 py-0.5 rounded-md ${
                    isActive
                      ? "bg-emerald-500 text-white"
                      : "bg-muted text-muted-foreground group-hover:text-foreground"
                  }`}
                >
                  {index + 1}
                </span>
              </div>

              <div className="flex-1 space-y-1">
                <div
                  className={`text-base sm:text-lg leading-relaxed ${
                    isActive ? "font-medium text-foreground" : "text-muted-foreground font-normal"
                  }`}
                >
                  {chunk.parts.map((part, pIdx) => {
                    const isFocus = part.role === "focus_word";
                    if (isFocus) {
                      return (
                        <span
                          key={pIdx}
                          data-testid={isActive ? "focus-word-accent" : undefined}
                          className={`inline-flex items-center gap-1 font-bold ${
                            isActive
                              ? "text-emerald-700 dark:text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-md shadow-2xs mx-0.5"
                              : "text-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400"
                          }`}
                        >
                          {isActive && <Flame className="h-3 w-3 text-emerald-500 inline" />}
                          {part.text}
                        </span>
                      );
                    }
                    return <span key={pIdx}>{part.text}</span>;
                  })}
                </div>

                {isActive && (
                  <div className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 pt-1">
                    <CornerDownRight className="h-3.5 w-3.5" />
                    <span>Breath pause after this phrase</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Docked Sticky Player Ribbon (Anchored at bottom, above switcher) */}
      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-40 w-full max-w-2xl px-4">
        <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-card/95 dark:bg-zinc-900/95 border shadow-xl backdrop-blur-md">
          {/* Active Chunk Snippet */}
          <div className="flex items-center gap-3 overflow-hidden">
            <span className="font-mono text-xs font-bold px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
              #{activeChunkIndex + 1}
            </span>
            <div className="truncate text-xs sm:text-sm font-medium">
              <span className="text-muted-foreground mr-1.5">Focus:</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                {activeFocusWord}
              </span>
            </div>
          </div>

          {/* Stepper & Audio Controls */}
          <div className="flex items-center gap-1.5 shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onPlayAudio?.(getChunkPlainText(currentChunk))}
              className="h-8 gap-1.5 text-xs border-emerald-500/30 hover:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
            >
              <Volume2 className={`h-3.5 w-3.5 ${isAudioPlaying ? "animate-bounce text-emerald-500" : ""}`} />
              <span className="hidden sm:inline">Listen</span>
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onPrevChunk}
              disabled={activeChunkIndex === 0}
              aria-label="Previous Chunk"
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={onNextChunk}
              disabled={activeChunkIndex === totalChunks - 1}
              aria-label="Next Chunk"
              className="h-8 w-8 p-0 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
