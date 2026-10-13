"use client";

import React, { useRef, useEffect } from "react";
import type { Chunk } from "./types";
import { getChunkPlainText, getChunkFocusWord } from "./mock-data";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  Volume2,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Target,
  CheckCircle2,
  Clock,
  X,
  Radio,
} from "lucide-react";

export interface VariantBProps {
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

export function VariantB({
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
}: VariantBProps) {
  const activeLineRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (status === "practicing" && activeLineRef.current && typeof activeLineRef.current.scrollIntoView === "function") {
      activeLineRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [activeChunkIndex, status]);

  if (status === "preparing") {
    return (
      <Card data-testid="variant-b-preparing" className="w-full max-w-xl mx-auto shadow-sm">
        <CardHeader className="space-y-1.5 pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-semibold flex items-center gap-2">
              <Radio className="h-5 w-5 text-amber-500 animate-pulse" />
              Studio Rhythm Synthesis
            </CardTitle>
            <span className="text-xs font-mono bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2.5 py-1 rounded-md font-semibold">
              Preparing Pipeline
            </span>
          </div>
          <CardDescription>
            Executing model inference and audio generation pipeline.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2.5 rounded-xl bg-muted/40 p-4 border text-sm">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                Input text normalized & validated
              </span>
              <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-medium">Done</span>
            </div>
            <div className="flex items-center justify-between font-medium text-foreground">
              <span className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-500 animate-spin" />
                Chunk cadence & Focus Words inference
              </span>
              <span className="text-xs font-mono text-amber-600 dark:text-amber-400">Processing…</span>
            </div>
            <div className="flex items-center justify-between text-muted-foreground opacity-60">
              <span className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Synthesizing reference voice audio
              </span>
              <span className="text-xs font-mono">Queued</span>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={onCancelPreparing}
              className="gap-2 text-sm border-muted-foreground/30 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
            >
              <X className="h-4 w-4" />
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentChunk = chunks[activeChunkIndex];
  const totalChunks = chunks.length;
  const activeFocusWord = currentChunk ? getChunkFocusWord(currentChunk) : "";

  return (
    <div
      data-testid="variant-b-practice"
      className="w-full max-w-5xl mx-auto space-y-4"
    >
      {/* Studio Header Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-card border shadow-xs text-sm">
        <div className="flex items-center gap-2 font-medium">
          <Target className="h-4 w-4 text-amber-500" />
          <span className="font-semibold">Practice Studio</span>
          <span className="text-muted-foreground text-xs font-mono ml-2">
            Chunk {activeChunkIndex + 1} / {totalChunks}
          </span>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onExitPractice}
          className="h-8 text-xs text-muted-foreground hover:text-foreground gap-1.5"
        >
          <LogOut className="h-3.5 w-3.5" />
          Exit practice
        </Button>
      </div>

      {/* 2-Column Split Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Numbered Musical Score Track */}
        <div className="lg:col-span-7 rounded-2xl bg-card border shadow-sm p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b text-xs font-medium text-muted-foreground">
            <span>RHYTHM SCORE & CHUNK SEQUENCE</span>
            <span>CLICK ANY LINE TO JUMP</span>
          </div>

          <div
            role="list"
            className="space-y-2 max-h-[500px] overflow-y-auto pr-1 scroll-smooth"
          >
            {chunks.map((chunk, idx) => {
              const isActive = idx === activeChunkIndex;
              const formattedNumber = String(idx + 1).padStart(2, "0");

              return (
                <div key={idx} className="space-y-1">
                  <div
                    ref={isActive ? activeLineRef : null}
                    onClick={() => onSelectChunk(idx)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onSelectChunk(idx);
                      }
                    }}
                    aria-current={isActive ? "true" : undefined}
                    className={`group flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all border ${
                      isActive
                        ? "bg-amber-500/10 border-amber-500/40 text-foreground font-medium shadow-xs"
                        : "bg-muted/20 border-transparent hover:bg-muted/40 hover:border-border text-muted-foreground"
                    }`}
                  >
                    <span
                      className={`font-mono text-xs font-bold pt-0.5 select-none ${
                        isActive ? "text-amber-500" : "text-muted-foreground/60 group-hover:text-foreground"
                      }`}
                    >
                      {formattedNumber}
                    </span>

                    <div className="flex-1 text-base leading-relaxed select-none">
                      {chunk.parts.map((part, pIdx) => {
                        const isFocus = part.role === "focus_word";
                        if (isFocus) {
                          return (
                            <span
                              key={pIdx}
                              className={`font-semibold ${
                                isActive
                                  ? "text-amber-600 dark:text-amber-400 underline decoration-amber-500 decoration-2 underline-offset-4"
                                  : "text-foreground group-hover:text-amber-600 dark:group-hover:text-amber-400"
                              }`}
                            >
                              {part.text}
                            </span>
                          );
                        }
                        return <span key={pIdx}>{part.text}</span>;
                      })}
                    </div>
                  </div>

                  {/* Pause Marker indicator between chunks */}
                  {idx < totalChunks - 1 && (
                    <div className="flex items-center gap-2 pl-9 py-0.5 text-[11px] font-mono text-muted-foreground/50 select-none">
                      <span className="h-1 w-1 rounded-full bg-muted-foreground/40" />
                      <span>[pause ~0.5s]</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Active Chunk Focus Inspector Card */}
        <div className="lg:col-span-5 sticky top-6 space-y-4">
          <Card className="shadow-sm border-amber-500/30">
            <CardHeader className="pb-3 border-b space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase font-semibold text-amber-500">
                  Focus Stage
                </span>
                <span className="text-xs text-muted-foreground">
                  Bar {activeChunkIndex + 1} of {totalChunks}
                </span>
              </div>
              <CardTitle className="text-lg font-semibold">Active Chunk Drill</CardTitle>
            </CardHeader>

            <CardContent className="space-y-5 pt-4">
              {/* Isolated Chunk text */}
              <div className="p-4 rounded-xl bg-muted/40 border text-center space-y-2">
                <div className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                  {currentChunk.parts.map((p, i) =>
                    p.role === "focus_word" ? (
                      <span
                        key={i}
                        data-testid="focus-word-accent"
                        className="text-amber-600 dark:text-amber-400 underline decoration-amber-500 decoration-2 underline-offset-4 inline-block mx-0.5"
                      >
                        {p.text}
                      </span>
                    ) : (
                      <span key={i}>{p.text}</span>
                    )
                  )}
                </div>
              </div>

              {/* Focus Word Explanation Card */}
              <div className="rounded-xl p-3.5 bg-amber-500/10 border border-amber-500/20 space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-semibold text-amber-700 dark:text-amber-300">
                  <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping" />
                  Focus Word: &ldquo;{activeFocusWord}&rdquo;
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Deliver with the primary pitch peak of this breath group. Stretch the stressed vowel and pause briefly immediately afterward.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 pt-1">
                <Button
                  type="button"
                  variant="secondary"
                  className="w-full gap-2 text-sm h-10 font-medium"
                  onClick={() => onPlayAudio?.(getChunkPlainText(currentChunk))}
                >
                  <Volume2 className={`h-4 w-4 ${isAudioPlaying ? "animate-bounce text-amber-500" : ""}`} />
                  {isAudioPlaying ? "Playing chunk…" : "Listen to target pronunciation"}
                </Button>

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onPrevChunk}
                    disabled={activeChunkIndex === 0}
                    className="gap-1.5 text-xs h-9"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <Button
                    type="button"
                    onClick={onNextChunk}
                    disabled={activeChunkIndex === totalChunks - 1}
                    className="gap-1.5 text-xs h-9 bg-amber-600 hover:bg-amber-700 text-white"
                  >
                    Next Chunk
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
