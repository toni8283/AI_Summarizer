import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Web Summarizer — Understand any webpage, instantly",
  description: "Extract the important information from any webpage with AI. Clean, minimal, and fast.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased text-slate-900 bg-[#f9fbfe]">
        {children}
      </body>
    </html>
  );
}
