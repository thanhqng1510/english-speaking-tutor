"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

const emptySubscribe = () => () => {};

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const mounted = React.useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const handleToggle = () => {
    const current = resolvedTheme ?? theme;
    setTheme(current === "dark" ? "light" : "dark");
  };

  const isDark = (resolvedTheme ?? theme) === "dark";

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={handleToggle}
      aria-label="Toggle theme"
      className={`relative h-9 w-9 rounded-md border ${className}`}
    >
      <Sun
        className={`h-4 w-4 transition-transform duration-200 ${
          mounted && isDark ? "scale-0 rotate-90" : "scale-100 rotate-0"
        }`}
        aria-hidden="true"
      />
      <Moon
        className={`absolute h-4 w-4 transition-transform duration-200 ${
          mounted && isDark ? "scale-100 rotate-0" : "scale-0 -rotate-90"
        }`}
        aria-hidden="true"
      />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
