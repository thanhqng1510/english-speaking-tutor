// Prototype plan: Three variants of the Chunk practice view, switchable via `?variant=`, on the existing `/` route.
"use client";

import { Suspense } from "react";
import { PrototypePracticeHost } from "@/features/practice/prototype/prototype-host";
import { PracticeSessionProvider } from "@/features/practice/context/practice-session-context";

export default function Home() {
  return (
    <PracticeSessionProvider>
      <div className="w-full flex flex-col items-center">
        <Suspense fallback={<div className="h-48 w-full max-w-2xl animate-pulse bg-muted rounded-2xl" />}>
          <PrototypePracticeHost />
        </Suspense>
      </div>
    </PracticeSessionProvider>
  );
}
