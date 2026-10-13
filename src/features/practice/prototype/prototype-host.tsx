"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { PracticeWorkspace } from "../components/practice-workspace";
import { VariantA } from "./variant-a";
import { VariantB } from "./variant-b";
import { VariantC } from "./variant-c";
import { FinalPrototype } from "./final-prototype";
import { PrototypeSwitcher } from "@/components/prototype-switcher";
import {
  PROTOTYPE_VARIANTS,
  type PrototypeVariantKey,
  type PracticeSessionStatus,
  type Chunk,
} from "./types";
import {
  PRESET_PARAGRAPHS,
  createChunksFromText,
} from "./mock-data";
import { Button } from "@/components/ui/button";
import {
  AlertCircle,
  RotateCcw,
  X,
  FileText,
  Bug,
  Code2,
} from "lucide-react";

export function PrototypePracticeHost() {
  const searchParams = useSearchParams();
  const rawVariant = (searchParams?.get("variant")?.toUpperCase() ?? "FINAL") as PrototypeVariantKey;
  const currentVariant: PrototypeVariantKey = ["FINAL", "A", "B", "C"].includes(rawVariant)
    ? rawVariant
    : "FINAL";

  const [status, setStatus] = useState<PracticeSessionStatus>("draft");
  const [text, setText] = useState<string>(PRESET_PARAGRAPHS[0].text);
  const [chunks, setChunks] = useState<readonly Chunk[]>([]);
  const [activeChunkIndex, setActiveChunkIndex] = useState<number>(0);
  const [simulateError, setSimulateError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState<boolean>(false);
  const [showStateInspector, setShowStateInspector] = useState<boolean>(false);

  const abortControllerRef = useRef<AbortController | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, []);

  const handleStartPractice = useCallback(
    (inputText: string) => {
      setText(inputText);
      setStatus("preparing");
      setErrorMessage(null);

      // Abort any existing controller
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

      // Simulate preparation stage (1.2 seconds)
      timerRef.current = setTimeout(() => {
        if (controller.signal.aborted) {
          return;
        }

        if (simulateError) {
          // Failure flow: show error toast, revert to draft for retry
          setStatus("draft");
          setErrorMessage("Chunking service timed out (408). Please check your connection and retry.");
        } else {
          // Success flow: generate chunks and enter practicing state
          const generatedChunks = createChunksFromText(inputText);
          setChunks(generatedChunks);
          setActiveChunkIndex(0);
          setStatus("practicing");
        }
      }, 1200);
    },
    [simulateError]
  );

  const handleCancelPreparing = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    setStatus("draft");
  }, []);

  const handleExitPractice = useCallback(() => {
    setStatus("draft");
    setChunks([]);
    setActiveChunkIndex(0);
  }, []);

  const handleSelectChunk = useCallback((index: number) => {
    setActiveChunkIndex(index);
  }, []);

  const handlePrevChunk = useCallback(() => {
    setActiveChunkIndex((prev) => Math.max(0, prev - 1));
  }, []);

  const handleNextChunk = useCallback(() => {
    setActiveChunkIndex((prev) => Math.min(chunks.length - 1, prev + 1));
  }, [chunks.length]);

  const handlePlayAudio = useCallback((chunkText: string) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(chunkText);
      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      utterance.lang = "en-US";

      utterance.onstart = () => setIsAudioPlaying(true);
      utterance.onend = () => setIsAudioPlaying(false);
      utterance.onerror = () => setIsAudioPlaying(false);

      window.speechSynthesis.speak(utterance);
    } else {
      setIsAudioPlaying(true);
      setTimeout(() => setIsAudioPlaying(false), 800);
    }
  }, []);

  const handleLoadPreset = (presetText: string) => {
    setText(presetText);
    if (status !== "draft") {
      handleExitPractice();
    }
  };

  return (
    <div className="w-full flex flex-col items-center space-y-6">
      {/* Prototype Control Bar: Quick Presets & Error Simulator */}
      <div className="w-full max-w-2xl flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-muted/40 border text-xs">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-semibold text-muted-foreground mr-1 flex items-center gap-1">
            <FileText className="h-3.5 w-3.5" />
            Presets:
          </span>
          {PRESET_PARAGRAPHS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => handleLoadPreset(preset.text)}
              className={`px-2.5 py-1 rounded-md transition-colors border ${
                text === preset.text
                  ? "bg-primary text-primary-foreground font-medium border-primary"
                  : "bg-background hover:bg-muted text-muted-foreground border-border"
              }`}
            >
              {preset.lengthTier.toUpperCase()}: {preset.title.slice(0, 18)}…
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {/* Simulate Error Toggle */}
          <button
            type="button"
            onClick={() => setSimulateError((prev) => !prev)}
            aria-pressed={simulateError}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors border font-medium ${
              simulateError
                ? "bg-destructive/15 text-destructive border-destructive/40"
                : "bg-background hover:bg-muted text-muted-foreground border-border"
            }`}
          >
            <Bug className="h-3.5 w-3.5" />
            <span>Simulate Error {simulateError ? "(ON)" : "(OFF)"}</span>
          </button>

          {/* State Inspector Toggle */}
          <button
            type="button"
            onClick={() => setShowStateInspector((prev) => !prev)}
            aria-pressed={showStateInspector}
            className="p-1 rounded-md text-muted-foreground hover:text-foreground border bg-background"
            title="Toggle session state inspector"
          >
            <Code2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Error Toast Notification (Per ticket #21: error toast + revert to draft + retry) */}
      {errorMessage && (
        <div
          role="alert"
          data-testid="error-toast"
          className="w-full max-w-2xl flex items-center justify-between gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive shadow-sm animate-in fade-in slide-in-from-top-2 duration-200"
        >
          <div className="flex items-center gap-2.5 text-sm">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span className="font-medium">{errorMessage}</span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleStartPractice(text)}
              className="h-8 gap-1 text-xs border-destructive/30 bg-destructive/15 hover:bg-destructive/25 text-destructive"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Retry
            </Button>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              aria-label="Dismiss error"
              className="p-1 rounded-md hover:bg-destructive/10 text-destructive"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* State Inspector Panel (Prototype Rule 5: Surface the state) */}
      {showStateInspector && (
        <div
          data-testid="state-inspector"
          className="w-full max-w-2xl p-3 rounded-xl bg-zinc-950 text-zinc-200 font-mono text-xs border border-zinc-800 space-y-1"
        >
          <div className="text-[10px] uppercase font-bold text-zinc-400">
            Session State Model (Live)
          </div>
          <div>status: &quot;{status}&quot;</div>
          <div>activeChunkIndex: {activeChunkIndex}</div>
          <div>totalChunks: {chunks.length}</div>
          <div>variant: &quot;{currentVariant}&quot;</div>
          <div>simulateError: {simulateError ? "true" : "false"}</div>
        </div>
      )}

      {/* Main Workspace / Practice View */}
      {status === "draft" && (
        <PracticeWorkspace
          value={text}
          onChange={setText}
          onStartPractice={handleStartPractice}
        />
      )}

      {status !== "draft" && currentVariant === "FINAL" && (
        <FinalPrototype
          status={status}
          chunks={chunks}
          activeChunkIndex={activeChunkIndex}
          onSelectChunk={handleSelectChunk}
          onPrevChunk={handlePrevChunk}
          onNextChunk={handleNextChunk}
          onCancelPreparing={handleCancelPreparing}
          onExitPractice={handleExitPractice}
          onPlayAudio={handlePlayAudio}
          isAudioPlaying={isAudioPlaying}
        />
      )}

      {status !== "draft" && currentVariant === "A" && (
        <VariantA
          status={status}
          chunks={chunks}
          activeChunkIndex={activeChunkIndex}
          onSelectChunk={handleSelectChunk}
          onPrevChunk={handlePrevChunk}
          onNextChunk={handleNextChunk}
          onCancelPreparing={handleCancelPreparing}
          onExitPractice={handleExitPractice}
          onPlayAudio={handlePlayAudio}
          isAudioPlaying={isAudioPlaying}
        />
      )}

      {status !== "draft" && currentVariant === "B" && (
        <VariantB
          status={status}
          chunks={chunks}
          activeChunkIndex={activeChunkIndex}
          onSelectChunk={handleSelectChunk}
          onPrevChunk={handlePrevChunk}
          onNextChunk={handleNextChunk}
          onCancelPreparing={handleCancelPreparing}
          onExitPractice={handleExitPractice}
          onPlayAudio={handlePlayAudio}
          isAudioPlaying={isAudioPlaying}
        />
      )}

      {status !== "draft" && currentVariant === "C" && (
        <VariantC
          status={status}
          chunks={chunks}
          activeChunkIndex={activeChunkIndex}
          onSelectChunk={handleSelectChunk}
          onPrevChunk={handlePrevChunk}
          onNextChunk={handleNextChunk}
          onCancelPreparing={handleCancelPreparing}
          onExitPractice={handleExitPractice}
          onPlayAudio={handlePlayAudio}
          isAudioPlaying={isAudioPlaying}
        />
      )}

      {/* Prototype Switcher Floating Bar */}
      <PrototypeSwitcher
        variants={PROTOTYPE_VARIANTS}
        currentVariant={currentVariant}
      />
    </div>
  );
}
