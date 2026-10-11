"use client";

import { PracticeWorkspace } from "@/features/practice/components/practice-workspace";
import { PracticeSessionProvider } from "@/features/practice/context/practice-session-context";

export default function Home() {
  return (
    <PracticeSessionProvider>
      <div className="flex flex-col items-center gap-10 sm:gap-14 py-4 sm:py-8">
        <div className="text-center max-w-2xl space-y-4">
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight">
            English Speaking Tutor
          </h1>
          <p className="text-muted-foreground text-base sm:text-lg leading-relaxed max-w-xl mx-auto">
            Welcome to your pronunciation practice workspace. Enter English text below to begin practicing cadence, stress, and pronunciation.
          </p>
        </div>

        <PracticeWorkspace />
      </div>
    </PracticeSessionProvider>
  );
}
