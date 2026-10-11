import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { Mic } from "lucide-react";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "English Speaking Tutor",
  description:
    "Interactive pronunciation laboratory and English speaking practice tutor.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground transition-colors duration-150">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-semibold">
                  <Mic className="h-4 w-4" aria-hidden="true" />
                </div>
                <span className="font-semibold tracking-tight text-base sm:text-lg">
                  English Speaking Tutor
                </span>
              </div>
              <div className="flex items-center gap-3">
                <ThemeToggle />
              </div>
            </div>
          </header>

          <main className="flex-1 container mx-auto max-w-5xl px-4 py-8">
            {children}
          </main>

          <footer className="border-t py-6 text-center text-xs text-muted-foreground">
            <div className="container mx-auto max-w-5xl px-4">
              English Speaking Tutor &bull; Application Foundation & Practice Shell
            </div>
          </footer>
        </ThemeProvider>
      </body>
    </html>
  );
}
