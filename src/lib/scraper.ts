import * as cheerio from "cheerio";

export interface ScrapedContent {
  title: string;
  text: string;
  url: string;
}

const MAX_EXTRACTED_CHARACTERS = 14000;
const FETCH_TIMEOUT_MS = 12000;

/**
 * Validates whether the given string is a valid HTTP/HTTPS URL.
 */
export function isValidUrl(urlString: string): boolean {
  try {
    const parsed = new URL(urlString.trim());
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Fetches and cleans readable text content from a given webpage URL using Cheerio.
 */
export async function scrapeWebpage(url: string): Promise<ScrapedContent> {
  const cleanUrl = url.trim();

  if (!isValidUrl(cleanUrl)) {
    throw new Error("INVALID_URL");
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(cleanUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
      redirect: "follow",
    });
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error("TIMEOUT");
    }
    throw new Error("UNREACHABLE");
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("NOT_FOUND");
    }
    if (response.status === 403 || response.status === 401) {
      throw new Error("ACCESS_DENIED");
    }
    throw new Error(`HTTP_ERROR_${response.status}`);
  }

  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("text/html") && !contentType.includes("application/xhtml")) {
    throw new Error("NOT_HTML");
  }

  const html = await response.text();
  if (!html || html.trim().length === 0) {
    throw new Error("EMPTY_PAGE");
  }

  const $ = cheerio.load(html);

  // Extract page title
  const pageTitle =
    $('meta[property="og:title"]').attr("content") ||
    $("title").text().trim() ||
    $("h1").first().text().trim() ||
    "Webpage Content";

  // Remove clutter, scripts, styles, navigation, footer, ads, and decorative elements
  $(
    [
      "script",
      "style",
      "noscript",
      "iframe",
      "svg",
      "canvas",
      "nav",
      "footer",
      "header",
      "aside",
      ".nav",
      ".navbar",
      ".footer",
      ".header",
      ".sidebar",
      ".menu",
      ".ad",
      ".ads",
      ".advertisement",
      ".social-share",
      ".cookie-banner",
      ".consent-modal",
      "[role='alert']",
      "[role='banner']",
      "[role='navigation']",
      "[aria-hidden='true']",
    ].join(", ")
  ).remove();

  // Prefer main content container if present, otherwise body
  let mainElement = $("article, main, [role='main']");
  if (mainElement.length === 0 || mainElement.text().trim().length < 150) {
    mainElement = $("body");
  }

  // Extract clean text
  let rawText = mainElement
    .find("h1, h2, h3, h4, h5, h6, p, li, blockquote")
    .map((_, el) => $(el).text().trim())
    .get()
    .filter((line) => line.length > 0)
    .join("\n\n");

  // Fallback to general body text if structured elements are sparse
  if (!rawText || rawText.trim().length < 100) {
    rawText = mainElement.text();
  }

  // Normalize excessive whitespace and line breaks
  const cleanedText = rawText
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n\s*\n+/g, "\n\n")
    .trim();

  if (!cleanedText || cleanedText.length < 80) {
    throw new Error("NO_READABLE_CONTENT");
  }

  // Limit extracted text to reasonable size for Gemini API token efficiency
  const truncatedText =
    cleanedText.length > MAX_EXTRACTED_CHARACTERS
      ? cleanedText.slice(0, MAX_EXTRACTED_CHARACTERS) + "\n\n[Content truncated for length]"
      : cleanedText;

  return {
    title: pageTitle.replace(/\s+/g, " ").trim(),
    text: truncatedText,
    url: cleanUrl,
  };
}
