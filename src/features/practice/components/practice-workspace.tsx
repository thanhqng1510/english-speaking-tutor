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
  value?: string;
  onChange?: (text: string) => void;
  onStartPractice?: (text: string) => void;
  className?: string;
}

export function PracticeWorkspace({
  initialText = "",
  value,
  onChange,
  onStartPractice,
  className = "",
}: PracticeWorkspaceProps) {
  const textareaId = useId();
  const counterId = useId();
  const internal = usePracticeSession(initialText);

  const isControlled = value !== undefined;
  const text = isControlled ? value : internal.text;
  const characterCount = text.length;
  const maxCharacters = internal.maxCharacters;
  const isValid = text.trim().length > 0 && text.length <= maxCharacters;

  const isNearLimit = characterCount >= maxCharacters * 0.9;
  const isAtLimit = characterCount >= maxCharacters;

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (isControlled) {
      onChange?.(e.target.value);
    } else {
      internal.setText(e.target.value);
    }
  };

  const handleClear = () => {
    if (isControlled) {
      onChange?.("");
    } else {
      internal.clear();
    }
  };

  const handleStart = () => {
    if (isValid && onStartPractice) {
      onStartPractice(text);
    }
  };

  return (
    <Card
      className={`w-full max-w-2xl mx-auto shadow-sm border [--card-spacing:--spacing(6)] sm:[--card-spacing:--spacing(8)] ${className}`}
    >
      <CardHeader className="space-y-2.5">
        <div className="flex items-center gap-2.5">
          <Sparkles className="h-5 w-5 text-primary" aria-hidden="true" />
          <CardTitle className="text-xl sm:text-2xl font-semibold tracking-tight">
            Practice Workspace
          </CardTitle>
        </div>
        <CardDescription className="text-sm sm:text-base leading-relaxed text-muted-foreground">
          Paste or type an English sentence or paragraph (up to 1,200 characters) to practice pronunciation, cadence, and stress.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 pt-2">
        <div>
          <label htmlFor={textareaId} className="sr-only">
            Practice English text
          </label>
          <Textarea
            id={textareaId}
            aria-label="Practice English text"
            aria-describedby={counterId}
            value={text}
            onChange={handleChange}
            maxLength={maxCharacters}
            rows={6}
            placeholder="Paste or type English text here to begin your pronunciation session..."
            className="resize-none font-normal text-base sm:text-lg leading-relaxed p-4 sm:p-5 min-h-[170px] sm:min-h-[190px]"
          />
        </div>

        <div className="flex items-center justify-between text-sm pt-1">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClear}
              disabled={characterCount === 0}
              aria-label="Clear text"
              className="text-muted-foreground hover:text-foreground h-9 px-3 gap-1.5 text-sm"
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              Clear text
            </Button>
          </div>

          <div
            id={counterId}
            data-testid="character-counter"
            aria-live="polite"
            className={`font-mono text-xs sm:text-sm px-3 py-1 rounded-md transition-colors ${
              isAtLimit
                ? "text-destructive font-semibold bg-destructive/10"
                : isNearLimit
                ? "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30"
                : "text-muted-foreground bg-muted/60"
            }`}
          >
            {characterCount} / {maxCharacters}
          </div>
        </div>

        <div className="pt-4 flex justify-end">
          <Button
            type="button"
            onClick={handleStart}
            disabled={!isValid}
            aria-label="Start practice"
            size="lg"
            className="w-full sm:w-auto h-11 px-6 text-base font-medium"
          >
            Start practice
            <ArrowRight className="h-4 w-4 ml-2" aria-hidden="true" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
