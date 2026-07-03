import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import "./globals.css";

export const metadata: Metadata = {
  title: "Prompt AI Studio",
  description:
    "Personalized prompt optimization workspace for GPT, Claude, Codex, and Gemini.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full">
      <body className="min-h-full antialiased">
        <a
          href="#main-content"
          className="sr-only rounded-md bg-accent px-4 py-2 text-sm font-semibold text-background focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50"
        >
          본문 바로가기
        </a>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
