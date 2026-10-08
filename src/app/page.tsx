"use client";

import { useState } from "react";

interface SummaryResult {
  summary: string;
  title?: string;
  url?: string;
}

export default function Home() {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SummaryResult | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const trimmed = url.trim();
    if (!trimmed) {
      setError("Please enter a webpage URL.");
      return;
    }

    // Auto-prepend https:// if user omits protocol
    let formattedUrl = trimmed;
    if (!/^https?:\/\//i.test(formattedUrl)) {
      formattedUrl = `https://${formattedUrl}`;
      setUrl(formattedUrl);
    }

    setError(null);
    setIsLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: formattedUrl }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Something went wrong while generating the summary. Please try again.");
      } else {
        setResult({
          summary: data.summary,
          title: data.title,
          url: data.url,
        });
      }
    } catch {
      setError("Unable to connect to the server. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!result?.summary) return;
    navigator.clipboard.writeText(result.summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const parseSummaryText = (text: string) => {
    const lines = text.split("\n");
    const paragraphs: string[] = [];
    const bullets: string[] = [];

    lines.forEach((line) => {
      const trimmedLine = line.trim();
      if (!trimmedLine) return;

      if (trimmedLine.startsWith("- ") || trimmedLine.startsWith("* ") || trimmedLine.startsWith("• ")) {
        bullets.push(trimmedLine.replace(/^[-*•]\s*/, ""));
      } else {
        paragraphs.push(trimmedLine);
      }
    });

    return { paragraphs, bullets };
  };

  const getDomain = (urlStr?: string) => {
    if (!urlStr) return "";
    try {
      return new URL(urlStr).hostname.replace(/^www\./, "");
    } catch {
      return urlStr;
    }
  };

  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      {/* Background Grid (5-8% opacity) */}
      <div className="bg-grid-pattern" aria-hidden="true" />

      {/* Ambient Diffused Blue Gradient Blobs */}
      <div className="ambient-glow-top" aria-hidden="true" />
      <div className="ambient-glow-left" aria-hidden="true" />
      <div className="ambient-glow-right" aria-hidden="true" />

      {/* Main Centered Content */}
      <div className="relative z-10 w-full max-w-2xl mx-auto flex flex-col items-center text-center">
        {/* Eyebrow text */}
        <p className="text-[11px] sm:text-xs font-semibold tracking-wider text-slate-500 uppercase mb-3 select-none">
          AI WEB SUMMARIZER
        </p>

        {/* Heading */}
        <h1 className="text-3xl sm:text-5xl font-semibold tracking-tight text-slate-900 leading-[1.18] mb-3">
          Understand any webpage, instantly.
        </h1>

        {/* Subtitle */}
        <p className="text-sm sm:text-base text-slate-500 max-w-md mx-auto mb-8 sm:mb-10 font-normal leading-relaxed">
          Paste a webpage URL and let AI extract the important information for you.
        </p>

        {/* URL Input Container with Animated Border */}
        <div
          className={`input-frame ${isLoading ? "is-loading" : ""}`}
        >
          <form
            onSubmit={handleSubmit}
            className="flex flex-col sm:flex-row items-stretch sm:items-center bg-white/90 backdrop-blur-md rounded-[18.5px] p-2 sm:p-2 sm:pl-5 gap-2 sm:gap-3"
          >
            <input
              type="text"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Paste a webpage URL..."
              disabled={isLoading}
              className="flex-1 bg-transparent px-3 py-2 sm:px-0 text-slate-900 text-sm sm:text-base placeholder-slate-400 outline-none disabled:opacity-70 disabled:cursor-not-allowed"
            />
            <button
              type="submit"
              disabled={isLoading || !url.trim()}
              className="inline-flex items-center justify-center px-5 py-2.5 sm:py-3 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-[14px] transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed select-none min-w-[124px]"
            >
              {isLoading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Summarizing...</span>
                </span>
              ) : (
                "Summarize"
              )}
            </button>
          </form>
        </div>

        {/* Human-friendly Error Message */}
        {error && (
          <div className="mt-4 px-4 py-2 rounded-xl text-xs sm:text-sm text-rose-700 bg-rose-50/90 border border-rose-200/70 shadow-sm animate-fade-in">
            {error}
          </div>
        )}

        {/* Result Container */}
        {result && (
          <div className="w-full mt-8 sm:mt-10 text-left animate-fade-in">
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="flex items-center gap-2.5">
                <h2 className="text-base sm:text-lg font-semibold text-slate-900">
                  Summary
                </h2>
                <span className="text-[11px] font-medium text-emerald-600 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-full select-none">
                  Summary generated
                </span>
              </div>

              <div className="flex items-center gap-2">
                {result.url && (
                  <span className="hidden sm:inline-block text-xs text-slate-400 bg-slate-100/80 px-2 py-0.5 rounded border border-slate-200/50 max-w-[180px] truncate">
                    {getDomain(result.url)}
                  </span>
                )}
                <button
                  type="button"
                  onClick={handleCopy}
                  className="text-xs font-medium text-slate-500 hover:text-blue-600 transition-colors px-2 py-1 rounded hover:bg-slate-100/60 flex items-center gap-1"
                >
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
            </div>

            <div className="bg-white/90 backdrop-blur-md border border-slate-200/70 rounded-[20px] p-6 sm:p-8 shadow-sm">
              {result.title && (
                <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-3 leading-snug">
                  {result.title}
                </h3>
              )}

              {(() => {
                const { paragraphs, bullets } = parseSummaryText(result.summary);
                return (
                  <div className="space-y-4 text-slate-600 text-sm sm:text-[15px] leading-relaxed">
                    {paragraphs.map((p, idx) => (
                      <p key={idx} className="leading-relaxed">
                        {p}
                      </p>
                    ))}

                    {bullets.length > 0 && (
                      <ul className="space-y-2 pt-1">
                        {bullets.map((b, idx) => (
                          <li key={idx} className="flex items-start gap-2.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 shrink-0 opacity-80" />
                            <span>{b}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
