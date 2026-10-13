"use client";

import React, { useEffect, useCallback } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight, Layers } from "lucide-react";
import type { PrototypeVariantKey, VariantDefinition } from "@/features/practice/prototype/types";

export interface PrototypeSwitcherProps {
  variants: readonly VariantDefinition[];
  currentVariant: PrototypeVariantKey;
  onVariantChange?: (newVariant: PrototypeVariantKey) => void;
}

export function PrototypeSwitcher({
  variants,
  currentVariant,
  onVariantChange,
}: PrototypeSwitcherProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentIndex = variants.findIndex((v) => v.key === currentVariant);
  const safeIndex = currentIndex >= 0 ? currentIndex : 0;
  const currentDef = variants[safeIndex] ?? variants[0];

  const updateVariant = useCallback(
    (nextKey: PrototypeVariantKey) => {
      if (onVariantChange) {
        onVariantChange(nextKey);
      }
      const params = new URLSearchParams(searchParams?.toString() ?? "");
      params.set("variant", nextKey);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [onVariantChange, searchParams, pathname, router]
  );

  const cyclePrev = useCallback(() => {
    const prevIndex = (safeIndex - 1 + variants.length) % variants.length;
    updateVariant(variants[prevIndex].key);
  }, [safeIndex, variants, updateVariant]);

  const cycleNext = useCallback(() => {
    const nextIndex = (safeIndex + 1) % variants.length;
    updateVariant(variants[nextIndex].key);
  }, [safeIndex, variants, updateVariant]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      if (
        activeEl instanceof HTMLInputElement ||
        activeEl instanceof HTMLTextAreaElement ||
        activeEl?.getAttribute("contenteditable") === "true"
      ) {
        return;
      }

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        cyclePrev();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        cycleNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [cyclePrev, cycleNext]);

  // Hidden in production builds
  if (process.env.NODE_ENV === "production") {
    return null;
  }

  return (
    <div
      data-testid="prototype-switcher"
      role="region"
      aria-label="UI Prototype Switcher"
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-zinc-950/90 dark:bg-zinc-100/95 text-zinc-100 dark:text-zinc-900 shadow-2xl border border-zinc-800 dark:border-zinc-300 backdrop-blur-md transition-all select-none"
    >
      <div className="flex items-center gap-1.5 pr-1.5 border-r border-zinc-800 dark:border-zinc-300">
        <Layers className="h-3.5 w-3.5 text-primary opacity-80" aria-hidden="true" />
        <span className="text-[10px] font-semibold tracking-wider uppercase opacity-70 hidden sm:inline">
          Prototype
        </span>
      </div>

      <button
        type="button"
        onClick={cyclePrev}
        aria-label="Previous UI variant"
        className="p-1 rounded-full hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      <div className="flex items-center gap-1.5 px-2 min-w-[130px] sm:min-w-[160px] justify-center text-xs sm:text-sm font-semibold tracking-tight">
        <span className="text-primary font-bold">{currentDef.key}</span>
        <span className="opacity-80">({currentDef.name})</span>
      </div>

      <button
        type="button"
        onClick={cycleNext}
        aria-label="Next UI variant"
        className="p-1 rounded-full hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
      >
        <ChevronRight className="h-4 w-4" />
      </button>

      <span className="text-[10px] opacity-60 ml-1 hidden md:inline font-mono">
        (←/→ keys)
      </span>
    </div>
  );
}
