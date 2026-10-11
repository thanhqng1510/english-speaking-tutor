import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ThemeToggle } from "./theme-toggle";

// Mock next-themes useTheme hook
const mockSetTheme = vi.fn();
let mockTheme = "light";

vi.mock("next-themes", () => ({
  useTheme: () => ({
    theme: mockTheme,
    setTheme: (t: string) => {
      mockTheme = t;
      mockSetTheme(t);
    },
    resolvedTheme: mockTheme,
  }),
}));

describe("ThemeToggle Component", () => {
  it("renders theme toggle button with accessible label", () => {
    mockTheme = "light";
    mockSetTheme.mockClear();

    render(<ThemeToggle />);

    const button = screen.getByRole("button", { name: /toggle theme/i });
    expect(button).toBeInTheDocument();
  });

  it("toggles to dark theme when currently in light theme", () => {
    mockTheme = "light";
    mockSetTheme.mockClear();

    render(<ThemeToggle />);

    const button = screen.getByRole("button", { name: /toggle theme/i });
    fireEvent.click(button);

    expect(mockSetTheme).toHaveBeenCalledWith("dark");
  });

  it("toggles to light theme when currently in dark theme", () => {
    mockTheme = "dark";
    mockSetTheme.mockClear();

    render(<ThemeToggle />);

    const button = screen.getByRole("button", { name: /toggle theme/i });
    fireEvent.click(button);

    expect(mockSetTheme).toHaveBeenCalledWith("light");
  });
});
