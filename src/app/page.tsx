"use client";

import { useState } from "react";
import { PracticeWorkspace } from "@/features/practice/components/practice-workspace";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Headphones, Activity } from "lucide-react";

export default function Home() {
  const [activeSessionText, setActiveSessionText] = useState<string | null>(null);

  return (
    <div className="flex flex-col items-center gap-8 py-4 sm:py-8">
      {/* Hero Intro */}
      <div className="text-center max-w-2xl space-y-3">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
          Master Natural English Rhythm &amp; Cadence
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
          Input your English speech text below. Break it down into prosodic thought groups, listen to authentic native speech, and refine your pronunciation with closed-loop acoustic assessment.
        </p>
      </div>

      {/* Main Practice Workspace */}
      <PracticeWorkspace
        onStartPractice={(text) => {
          setActiveSessionText(text);
        }}
      />

      {/* Active Session Feedback Preview (skeleton for subsequent tickets) */}
      {activeSessionText && (
        <Card className="w-full max-w-2xl border-primary/20 bg-primary/5">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span>Workspace loaded: Ready for prosodic chunking engine (Issue #2).</span>
            </div>
            <span className="text-xs text-muted-foreground font-mono">
              {activeSessionText.length} chars
            </span>
          </CardContent>
        </Card>
      )}

      {/* Feature Capabilities Showcase */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-2xl pt-4">
        <div className="flex items-start gap-3 p-3 rounded-lg border bg-card text-card-foreground">
          <Headphones className="h-5 w-5 text-primary mt-0.5" />
          <div className="space-y-1">
            <h3 className="font-semibold text-xs tracking-tight">Neural TTS Reference</h3>
            <p className="text-xs text-muted-foreground">
              Native multi-accent models with 60 FPS karaoke highlighting.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 p-3 rounded-lg border bg-card text-card-foreground">
          <Activity className="h-5 w-5 text-primary mt-0.5" />
          <div className="space-y-1">
            <h3 className="font-semibold text-xs tracking-tight">Acoustic Assessment</h3>
            <p className="text-xs text-muted-foreground">
              Phoneme-level accuracy, fluency, completeness, and prosody scoring.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 p-3 rounded-lg border bg-card text-card-foreground">
          <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
          <div className="space-y-1">
            <h3 className="font-semibold text-xs tracking-tight">500-Char Bound</h3>
            <p className="text-xs text-muted-foreground">
              Safeguarded practice units optimized for working memory shadowing.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
