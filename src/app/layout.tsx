import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { Mic } from "lucide-react";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
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
      className={`${inter.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground transition-colors duration-150">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container mx-auto flex h-16 max-w-5xl items-center justify-between px-6 sm:px-8">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground font-semibold">
                  <Mic className="h-4.5 w-4.5" aria-hidden="true" />
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

          <main className="flex-1 container mx-auto max-w-5xl px-6 sm:px-8 py-10 sm:py-16">
            {children}
          </main>

          <footer className="border-t py-8 sm:py-10 text-center text-xs text-muted-foreground">
            <div className="container mx-auto max-w-5xl px-6 sm:px-8">
              English Speaking Tutor &bull; Application Foundation & Practice Shell
            </div>
          </footer>
        </ThemeProvider>
      </body>
    </html>
  );
}
