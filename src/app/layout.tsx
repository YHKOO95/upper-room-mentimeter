import type { Metadata } from "next";
import { Inter_Tight, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const interTight = Inter_Tight({
  variable: "--font-inter-tight",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800", "900"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "UPPER ROOM · Word Cloud",
  description: "2026 비상수련회 실시간 워드클라우드 프레젠테이션",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="ko"
      className={`${interTight.variable} ${jetbrainsMono.variable}`}
      style={{
        // Map next/font variables to design system variables
        ["--font-display" as string]: "var(--font-inter-tight), 'Pretendard', system-ui, sans-serif",
        ["--font-mono" as string]: "var(--font-jetbrains-mono), ui-monospace, monospace",
      }}
    >
      <body>{children}</body>
    </html>
  );
}
