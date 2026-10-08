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

  const handleSubmit = async (e?: React.FormEvent, customUrl?: string) => {
    if (e) e.preventDefault();

    const targetUrl = (customUrl || url).trim();
    if (!targetUrl) {
      setError("Please enter a webpage URL.");
      return;
    }

    // Auto-prepend https:// if user omits protocol
    let formattedUrl = targetUrl;
    if (!/^https?:\/\//i.test(formattedUrl)) {
      formattedUrl = `https://${formattedUrl}`;
    }
    setUrl(formattedUrl);

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
    <main className="relative min-h-screen flex flex-col justify-between items-center overflow-x-hidden">
      {/* Deep atmospheric ambient blue gradients (matching the reference image) */}
      <div className="ambient-scene" aria-hidden="true">
        <div className="cloud-top-right" />
        <div className="cloud-mid-left" />
        <div className="cloud-bottom-right" />
        <div className="cloud-top-center" />
      </div>

      {/* Subtle background grid with visible light blue lines */}
      <div className="bg-grid-pattern" aria-hidden="true" />

      {/* Top Left AI Summarizer Logo */}
      <header className="relative z-10 w-full px-6 py-5 sm:px-10 flex items-center justify-start">
        <div className="flex items-center gap-2.5 text-blue-600 select-none">
          <svg
            className="w-5 h-5 text-blue-600"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
          <span className="text-slate-900 font-semibold tracking-tight text-base sm:text-lg">AI Summarizer</span>
        </div>
      </header>

      {/* Main Centered Content */}
      <div className="relative z-10 w-full max-w-2xl mx-auto px-4 py-6 sm:py-10 flex flex-col items-center text-center my-auto">
        {/* Subtle Announcement Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/80 backdrop-blur-md border border-blue-100/90 text-[11px] sm:text-xs text-slate-600 shadow-sm mb-6 max-w-lg transition-all hover:border-blue-200">
          <span className="text-blue-500 font-medium">✦</span>
          <span>Paste a webpage and let AI summarize it.</span>
        </div>

        {/* Large Elegant Heading */}
        <h1 className="text-3xl sm:text-5xl font-medium tracking-tight text-slate-900 leading-[1.18] mb-3">
          Understand any webpage, instantly.
        </h1>

        {/* Muted Subtitle */}
        <p className="text-sm sm:text-base text-slate-500 max-w-md mx-auto mb-8 sm:mb-9 font-normal leading-relaxed">
          Extract the important information from any webpage with AI.
        </p>

        {/* Spacious Clean URL Input Box with Very Round Corners (30px) */}
        <div className={`input-frame ${isLoading ? "is-loading" : ""}`}>
          <form
            onSubmit={(e) => handleSubmit(e)}
            className="flex flex-col sm:flex-row items-stretch sm:items-center bg-white rounded-[28px] p-2 sm:p-2.5 sm:pl-5 gap-2 sm:gap-3 shadow-sm"
          >
            {/* Main Input Field */}
            <input
              type="text"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Paste a webpage URL..."
              disabled={isLoading}
              className="flex-1 bg-white text-slate-900 text-base sm:text-lg placeholder-slate-400 outline-none border-none focus:outline-none focus:ring-0 px-2 py-2 sm:px-0 disabled:opacity-70 disabled:cursor-not-allowed"
            />

            {/* Round Blue Submit Button */}
            <button
              type="submit"
              disabled={isLoading || !url.trim()}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 sm:py-3 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-full transition-all shadow-sm hover:shadow disabled:opacity-50 disabled:cursor-not-allowed select-none min-w-[124px]"
            >
              {isLoading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Summarizing...</span>
                </>
              ) : (
                <>
                  <span>Summarize</span>
                  <svg
                    className="w-3.5 h-3.5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M5 12h14" />
                    <path d="m12 5 7 7-7 7" />
                  </svg>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Quick Testing Pills below the input (DeepSeek style) */}
        <div className="flex items-center justify-center flex-wrap gap-2 mt-4 sm:mt-5">
          <button
            type="button"
            onClick={() => handleSubmit(undefined, "https://deepseek.ai")}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium bg-white/80 backdrop-blur-md border border-slate-200/70 text-slate-600 hover:text-blue-600 hover:border-blue-200 shadow-sm transition-all"
          >
            <span className="text-blue-500">✦</span> deepseek.ai
          </button>
          <button
            type="button"
            onClick={() => handleSubmit(undefined, "https://techcrunch.com")}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium bg-white/80 backdrop-blur-md border border-slate-200/70 text-slate-600 hover:text-blue-600 hover:border-blue-200 shadow-sm transition-all"
          >
            <span className="text-blue-500">✦</span> techcrunch.com
          </button>
          <button
            type="button"
            onClick={() => handleSubmit(undefined, "https://en.wikipedia.org/wiki/Artificial_intelligence")}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium bg-white/80 backdrop-blur-md border border-slate-200/70 text-slate-600 hover:text-blue-600 hover:border-blue-200 shadow-sm transition-all"
          >
            <span className="text-blue-500">✦</span> wikipedia.org
          </button>
        </div>

        {/* Human-friendly Error Banner */}
        {error && (
          <div className="mt-4 px-4 py-2.5 rounded-full text-xs sm:text-sm text-rose-700 bg-rose-50/90 border border-rose-200/80 shadow-sm animate-fade-in">
            {error}
          </div>
        )}

        {/* Summary Result Card with Round Corners (30px) */}
        {result && (
          <div className="w-full mt-8 sm:mt-10 text-left animate-fade-in">
            <div className="flex items-center justify-between mb-3 px-2">
              <div className="flex items-center gap-2.5">
                <h2 className="text-base sm:text-lg font-semibold text-slate-900">
                  Summary
                </h2>
                <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200/70 px-2.5 py-0.5 rounded-full select-none">
                  Summary generated
                </span>
              </div>

              <div className="flex items-center gap-2">
                {result.url && (
                  <span className="hidden sm:inline-block text-xs text-slate-500 bg-slate-100/90 px-2.5 py-0.5 rounded-full border border-slate-200/60 max-w-[180px] truncate">
                    {getDomain(result.url)}
                  </span>
                )}
                <button
                  type="button"
                  onClick={handleCopy}
                  className="text-xs font-medium text-slate-600 hover:text-blue-600 transition-colors px-3 py-1 rounded-full bg-white/80 border border-slate-200/70 shadow-sm hover:border-blue-200 flex items-center gap-1.5"
                >
                  <svg
                    className="w-3.5 h-3.5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                    <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                  </svg>
                  <span>{copied ? "Copied" : "Copy"}</span>
                </button>
              </div>
            </div>

            <div className="bg-white/95 backdrop-blur-xl border border-blue-100/80 rounded-[30px] p-6 sm:p-8 shadow-[0_12px_45px_-10px_rgba(59,130,246,0.08)]">
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
                      <ul className="space-y-2.5 pt-2">
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
