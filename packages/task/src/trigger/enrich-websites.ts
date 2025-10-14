import { openai } from "@ai-sdk/openai";
import { schemaTask } from "@trigger.dev/sdk";
import { generateText } from "ai";
import { type } from "arktype";
import { type Browser, chromium, type Page } from "playwright";
import { llmParseJson } from "../lib/ai-tools/llm-parse-json.js";
import { setTaskMetadata } from "../lib/task-metadata.js";

const inputSchema = type({
  urls: type("string[]").describe("List of website URLs to enrich"),
});

const ahrefsResultSchema = type({
  domainRating: "number|null",
  backlinks: "number|null",
});

const contactInfoSchema = type({
  companyName: "string|null",
  emails: type("string[]"),
  phones: type("string[]"),
  location: "string|null",
  socials: type({
    facebook: "string|null",
    instagram: "string|null",
    twitter: "string|null",
    linkedin: "string|null",
    youtube: "string|null",
    tiktok: "string|null",
  }),
});

const founderInfoSchema = type({
  name: "string|null",
  linkedin: "string|null",
});

const outputSchema = type({
  results: type({
    url: "string",
    ahrefs: ahrefsResultSchema,
    contact: contactInfoSchema,
    founder: founderInfoSchema,
  }).array(),
});

async function openBrowser(): Promise<Browser> {
  return await chromium.launch({ headless: true, args: ["--disable-gpu"] });
}

function toAhrefsAuthorityUrl(targetUrl: string): string {
  const encoded = encodeURIComponent(targetUrl);
  return `https://ahrefs.com/website-authority-checker/?input=${encoded}`;
}

async function parseAhrefsAuthority(
  page: Page,
): Promise<type.infer<typeof ahrefsResultSchema>> {
  // Best-effort selectors; Ahrefs can change markup. We use text search fallbacks.
  await page.waitForLoadState("domcontentloaded");
  // Give JS time to render
  await page.waitForTimeout(1500);

  const content = (await page.content()) ?? "";

  // Heuristics: look for DR and Backlinks numbers
  const drMatch = content.match(/Domain\s*Rating\s*(\d{1,3})/i);
  const backlinksMatch = content.match(/Backlinks[^\d]*(\d[\d,]*)/i);

  const domainRating = drMatch?.[1] ? Number(drMatch[1]) : null;
  const backlinks = backlinksMatch?.[1]
    ? Number(backlinksMatch[1].replace(/,/g, ""))
    : null;

  return { domainRating, backlinks };
}

async function fetchAhrefsMetrics(browser: Browser, siteUrl: string) {
  const page = await browser.newPage();
  try {
    const ahrefsUrl = toAhrefsAuthorityUrl(siteUrl);
    await page.goto(ahrefsUrl, {
      waitUntil: "domcontentloaded",
      timeout: 45_000,
    });
    return await parseAhrefsAuthority(page);
  } finally {
    await page.close();
  }
}

async function extractContactsAndSocials(
  browser: Browser,
  siteUrl: string,
): Promise<type.infer<typeof contactInfoSchema>> {
  const page = await browser.newPage();
  try {
    await page.goto(siteUrl, {
      waitUntil: "domcontentloaded",
      timeout: 45_000,
    });
    await page.waitForTimeout(800);
    const html = await page.content();

    // Extract company name from title or og:site_name
    const title = await page.title();
    const ogSiteName = await page
      .locator('meta[property="og:site_name"]')
      .getAttribute("content")
      .catch(() => null);
    const companyName = ogSiteName || title || null;

    // Emails
    const emails = Array.from(
      new Set(
        (html?.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) ?? []).slice(
          0,
          10,
        ),
      ),
    );

    // Phones (naive)
    const phoneMatches =
      html?.match(
        /(?:\+?\d[\s.-]?)?(?:\(\d{3}\)|\d{3})[\s.-]?\d{3}[\s.-]?\d{4}/g,
      ) ?? [];
    const phones = Array.from(new Set(phoneMatches.slice(0, 10)));

    // Location (simple heuristic via address or schema.org)
    const addressMatch = html?.match(/<address[^>]*>([\s\S]*?)<\/address>/i);
    const schemaAddressMatch = html?.match(/"address"\s*:\s*\{[\s\S]*?\}/i);
    const addressText = addressMatch?.[1];
    const location = addressText
      ? addressText
          .replace(/<[^>]+>/g, " ")
          .replace(/\s+/g, " ")
          .trim()
      : schemaAddressMatch?.[0]
        ? schemaAddressMatch[0].replace(/\s+/g, " ")
        : null;

    // Socials by common domain patterns
    const findUrl = (pattern: RegExp) => {
      const m = html?.match(pattern);
      return m ? m[0] : null;
    };
    const socials = {
      facebook: findUrl(
        /https?:\/\/(?:www\.)?facebook\.com\/[A-Za-z0-9._\-/]+/i,
      ),
      instagram: findUrl(
        /https?:\/\/(?:www\.)?instagram\.com\/[A-Za-z0-9._\-/]+/i,
      ),
      twitter: findUrl(
        /https?:\/\/(?:www\.)?(?:x|twitter)\.com\/[A-Za-z0-9._\-/]+/i,
      ),
      linkedin: findUrl(
        /https?:\/\/(?:www\.)?linkedin\.com\/[A-Za-z0-9._\-/]+/i,
      ),
      youtube: findUrl(/https?:\/\/(?:www\.)?youtube\.com\/[A-Za-z0-9._\-/]+/i),
      tiktok: findUrl(/https?:\/\/(?:www\.)?tiktok\.com\/[A-Za-z0-9._\-/]+/i),
    } as const;

    return {
      companyName: companyName || null,
      emails,
      phones,
      location,
      socials,
    };
  } finally {
    await page.close();
  }
}

async function findFounderViaSearch(
  siteUrl: string,
): Promise<type.infer<typeof founderInfoSchema>> {
  try {
    const hostname = new URL(siteUrl).hostname.replace(/^www\./i, "");
    const system = [
      "You are a web research assistant.",
      "Task: Find the most likely founder's full name and their LinkedIn profile for the specified company website.",
      "Rules:",
      "- Use the web_search tool to research.",
      "- Prefer official LinkedIn profile URLs (linkedin.com/in or /pub).",
      "- If multiple founders exist, pick the most prominent (CEO if also founder).",
      '- If not found, return {"name": null, "linkedin": null}.',
      "Return STRICT JSON only matching { name: string|null, linkedin: string|null }.",
    ].join(" \n");

    const { text } = await generateText({
      model: openai("gpt-5-mini"),
      tools: {
        web_search: openai.tools.webSearch({ searchContextSize: "high" }),
      },
      system,
      messages: [
        {
          role: "user",
          content: `Company website: ${siteUrl} (domain: ${hostname}). Find founder name and LinkedIn URL. JSON only.`,
        },
      ],
    });

    const parsed = await llmParseJson(text, founderInfoSchema);
    const linkedin =
      parsed.linkedin && /linkedin\.com\//i.test(parsed.linkedin)
        ? parsed.linkedin
        : null;
    return { name: parsed.name ?? null, linkedin };
  } catch (_err) {
    return { name: null, linkedin: null };
  }
}

export const enrichWebsites: ReturnType<
  typeof schemaTask<
    "enrich-websites",
    typeof inputSchema,
    typeof outputSchema.infer
  >
> = schemaTask({
  id: "enrich-websites",
  maxDuration: 900,
  machine: "small-1x",
  schema: inputSchema,
  run: async (payload) => {
    const total = payload.urls.length;
    const browser = await openBrowser();
    const results: type.infer<typeof outputSchema>["results"] = [];

    try {
      for (let i = 0; i < payload.urls.length; i++) {
        const urlMaybe = payload.urls[i];
        if (!urlMaybe) {
          continue;
        }
        const url = urlMaybe;
        setTaskMetadata({
          progress: Math.round((i / total) * 100),
          statusMessage: `Processing ${url} (${i + 1}/${total})...`,
        });

        const [ahrefs, contact, founder] = await Promise.all([
          fetchAhrefsMetrics(browser, url).catch(() => ({
            domainRating: null,
            backlinks: null,
          })),
          extractContactsAndSocials(browser, url).catch(() => ({
            companyName: null,
            emails: [],
            phones: [],
            location: null,
            socials: {
              facebook: null,
              instagram: null,
              twitter: null,
              linkedin: null,
              youtube: null,
              tiktok: null,
            },
          })),
          findFounderViaSearch(url).catch(() => ({
            name: null,
            linkedin: null,
          })),
        ]);

        results.push({ url, ahrefs, contact, founder });

        setTaskMetadata({
          progress: Math.round(((i + 1) / total) * 100),
          statusMessage: `Finished ${url} (${i + 1}/${total}).`,
        });
      }

      return { results };
    } finally {
      await browser.close();
    }
  },
});
