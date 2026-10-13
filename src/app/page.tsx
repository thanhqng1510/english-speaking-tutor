// Prototype plan: Three variants of the Chunk practice view, switchable via `?variant=`, on the existing `/` route.
"use client";

import { Suspense } from "react";
import { PrototypePracticeHost } from "@/features/practice/prototype/prototype-host";
import { PracticeSessionProvider } from "@/features/practice/context/practice-session-context";

export default function Home() {
  return (
    <PracticeSessionProvider>
      <div className="flex flex-col items-center gap-6 sm:gap-10 py-4 sm:py-8">
        <div className="text-center max-w-2xl space-y-3">
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight">
            English Speaking Tutor
          </h1>
          <p className="text-muted-foreground text-base sm:text-lg leading-relaxed max-w-xl mx-auto">
            Welcome to your pronunciation practice workspace. Practice natural breath rhythm, Chunking, and Focus Words.
          </p>
        </div>

        <Suspense fallback={<div className="h-48 w-full max-w-2xl animate-pulse bg-muted rounded-2xl" />}>
          <PrototypePracticeHost />
        </Suspense>
      </div>
    </PracticeSessionProvider>
  );
}
