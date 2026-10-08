import { NextRequest, NextResponse } from "next/server";
import { isValidUrl, scrapeWebpage } from "@/lib/scraper";
import { summarizeWithGemini } from "@/lib/gemini";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    let body: { url?: unknown };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON request payload." },
        { status: 400 }
      );
    }

    const { url } = body;

    // 1. Validate URL presence
    if (!url || typeof url !== "string" || url.trim().length === 0) {
      return NextResponse.json(
        { error: "Please enter a webpage URL." },
        { status: 400 }
      );
    }

    const trimmedUrl = url.trim();

    // 2. Validate URL format
    if (!isValidUrl(trimmedUrl)) {
      return NextResponse.json(
        { error: "Please enter a valid webpage URL (must begin with http:// or https://)." },
        { status: 400 }
      );
    }

    // 3. Scrape webpage content with Cheerio
    let scraped;
    try {
      scraped = await scrapeWebpage(trimmedUrl);
    } catch (scrapeErr: unknown) {
      const errCode = scrapeErr instanceof Error ? scrapeErr.message : "UNKNOWN";

      if (errCode === "INVALID_URL") {
        return NextResponse.json(
          { error: "Please enter a valid webpage URL." },
          { status: 400 }
        );
      }
      if (errCode === "TIMEOUT") {
        return NextResponse.json(
          { error: "The webpage took too long to respond. Please try another URL." },
          { status: 504 }
        );
      }
      if (errCode === "UNREACHABLE") {
        return NextResponse.json(
          { error: "Unable to reach the webpage. Please check the URL and try again." },
          { status: 502 }
        );
      }
      if (errCode === "NOT_FOUND") {
        return NextResponse.json(
          { error: "The requested webpage was not found (404)." },
          { status: 404 }
        );
      }
      if (errCode === "ACCESS_DENIED") {
        return NextResponse.json(
          { error: "Access to this webpage was denied by the host server." },
          { status: 403 }
        );
      }
      if (errCode === "NOT_HTML" || errCode === "EMPTY_PAGE" || errCode === "NO_READABLE_CONTENT") {
        return NextResponse.json(
          { error: "We couldn't extract readable content from this page." },
          { status: 422 }
        );
      }

      return NextResponse.json(
        { error: "We couldn't extract readable content from this page." },
        { status: 502 }
      );
    }

    // 4. Summarize with Google Gemini API
    let summary: string;
    try {
      summary = await summarizeWithGemini({
        title: scraped.title,
        url: scraped.url,
        text: scraped.text,
      });
    } catch (aiErr: unknown) {
      const errCode = aiErr instanceof Error ? aiErr.message : "UNKNOWN";

      if (errCode === "MISSING_API_KEY") {
        return NextResponse.json(
          {
            error:
              "Gemini API key is not configured. Please add GEMINI_API_KEY to your server environment (.env.local).",
          },
          { status: 500 }
        );
      }
      if (errCode === "INVALID_API_KEY") {
        return NextResponse.json(
          {
            error:
              "The configured Gemini API key is invalid or unauthorized. Please verify your API key in AI Studio.",
          },
          { status: 401 }
        );
      }
      if (errCode === "RATE_LIMIT_EXCEEDED") {
        return NextResponse.json(
          {
            error:
              "Gemini API rate limit reached. Please wait a few moments and try again.",
          },
          { status: 429 }
        );
      }

      return NextResponse.json(
        {
          error:
            "Something went wrong while generating the summary. Please try again.",
        },
        { status: 500 }
      );
    }

    // 5. Return success payload
    return NextResponse.json(
      {
        summary,
        title: scraped.title,
        url: scraped.url,
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { error: "An unexpected server error occurred. Please try again." },
      { status: 500 }
    );
  }
}

