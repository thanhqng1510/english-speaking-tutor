"use client";

import { PracticeWorkspace } from "@/features/practice/components/practice-workspace";
import { PracticeSessionProvider } from "@/features/practice/context/practice-session-context";

export default function Home() {
  return (
    <PracticeSessionProvider>
      <div className="flex flex-col items-center gap-8 py-6 sm:py-12">
        <div className="text-center max-w-2xl space-y-3">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            English Speaking Tutor
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
            Welcome to your pronunciation practice workspace. Enter English text below to begin practicing cadence, stress, and pronunciation.
          </p>
        </div>

        <PracticeWorkspace />
      </div>
    </PracticeSessionProvider>
  );
}
