import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { siteDescription, siteName, siteUrl } from "@/lib/site/config";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: siteName,
    template: `%s · ${siteName}`,
  },
  description: siteDescription,
  applicationName: siteName,
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: siteUrl,
    siteName,
    title: siteName,
    description: siteDescription,
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: siteName,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteName,
    description: siteDescription,
    images: ["/og.png"],
  },
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
