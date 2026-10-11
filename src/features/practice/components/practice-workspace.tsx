"use client";

import React, { useId } from "react";
import { usePracticeSession } from "../hooks/use-practice-session";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Sparkles, Trash2, ArrowRight } from "lucide-react";

export interface PracticeWorkspaceProps {
  initialText?: string;
  onStartPractice?: (text: string) => void;
  className?: string;
}

export function PracticeWorkspace({
  initialText = "",
  onStartPractice,
  className = "",
}: PracticeWorkspaceProps) {
  const textareaId = useId();
  const counterId = useId();
  const { text, characterCount, maxCharacters, isValid, setText, clear } =
    usePracticeSession(initialText);

  const isNearLimit = characterCount >= maxCharacters * 0.9;
  const isAtLimit = characterCount >= maxCharacters;

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
  };

  const handleStart = () => {
    if (isValid && onStartPractice) {
      onStartPractice(text);
    }
  };

  return (
    <Card className={`w-full max-w-2xl mx-auto shadow-sm border ${className}`}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" aria-hidden="true" />
          <CardTitle className="text-xl font-semibold tracking-tight">
            Practice Workspace
          </CardTitle>
        </div>
        <CardDescription>
          Paste or type an English sentence or paragraph (up to 500 characters) to practice pronunciation, cadence, and stress.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label
            htmlFor={textareaId}
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Practice English text
          </label>
          <Textarea
            id={textareaId}
            aria-describedby={counterId}
            value={text}
            onChange={handleChange}
            maxLength={maxCharacters}
            rows={5}
            placeholder="Paste or type English text here to begin your pronunciation session..."
            className="resize-none font-normal text-base leading-relaxed p-3"
          />
        </div>

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={clear}
              disabled={characterCount === 0}
              aria-label="Clear text"
              className="text-muted-foreground hover:text-foreground h-8 px-2"
            >
              <Trash2 className="h-3.5 w-3.5 mr-1" aria-hidden="true" />
              Clear text
            </Button>
          </div>

          <div
            id={counterId}
            data-testid="character-counter"
            aria-live="polite"
            className={`font-mono text-xs px-2 py-1 rounded transition-colors ${
              isAtLimit
                ? "text-destructive font-semibold bg-destructive/10"
                : isNearLimit
                ? "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30"
                : "text-muted-foreground bg-muted/50"
            }`}
          >
            {characterCount} / {maxCharacters}
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <Button
            type="button"
            onClick={handleStart}
            disabled={!isValid}
            aria-label="Start practice"
            className="w-full sm:w-auto"
          >
            Start practice
            <ArrowRight className="h-4 w-4 ml-1.5" aria-hidden="true" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
