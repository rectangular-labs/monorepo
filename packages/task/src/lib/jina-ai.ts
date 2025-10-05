/**
 * JINA.ai API helpers for fetching web content and SERP results
 * @see https://github.com/jina-ai/reader
 */

import { ok, type Result, safe, safeFetch } from "@rectangular-labs/result";
import { taskEnv } from "../env";

interface JinaReaderResponse {
  code: number;
  status: number;
  data: {
    title: string;
    description: string;
    url: string;
    content: string;
    usage?: {
      tokens: number;
    };
  };
}

export interface JinaSearchResult {
  title: string;
  url: string;
  description: string;
  content?: string;
}

interface JinaSearchResponse {
  code: number;
  status: number;
  data: JinaSearchResult[];
}

/**
 * Fetch a web page converted to markdown using JINA.ai Reader API
 * @param url - The URL to fetch
 * @returns Markdown content of the page
 */
export async function fetchPageAsMarkdown(
  url: string,
): Promise<
  Result<{ markdown: string; title: string; description: string }, Error>
> {
  const env = taskEnv();
  const jinaUrl = `https://r.jina.ai/${url}`;

  const response = await safeFetch(jinaUrl, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${env.JINA_API_KEY}`,
      "X-With-Generated-Alt": "true", // Include generated alt text for images
      "X-Base": "true", // Include base html for the page
      "X-No-Cache": "true", // Prevent caching
      "X-Md-Heading-Style": "setext", // use setext headings for markdown
    },
  });

  if (!response.ok) {
    return response;
  }

  const json = await safe(() => response.value.json());
  if (!json.ok) {
    return json;
  }
  console.log("json", json.value);
  const jsonData = json.value as JinaReaderResponse;

  return ok({
    markdown: jsonData.data.content,
    title: jsonData.data.title,
    description: jsonData.data.description,
  });
}

/**
 * Fetch SERP results for a search query using JINA.ai Search API
 * @param query - The search query
 * @param options - Optional parameters
 * @returns Top SERP results
 */
export async function fetchSerpResults(
  query: string,
  options?: {
    limit?: number;
  },
): Promise<Result<JinaSearchResult[], Error>> {
  const env = taskEnv();
  const jinaUrl = `https://s.jina.ai/${encodeURIComponent(query)}`;

  const response = await safeFetch(jinaUrl, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${env.JINA_API_KEY}`,
    },
  });

  if (!response.ok) {
    return response;
  }

  const json = await safe(() => response.value.json());
  if (!json.ok) {
    return json;
  }
  const jsonData = json.value as JinaSearchResponse;

  const limit = options?.limit ?? 10;
  return ok(jsonData.data.slice(0, limit));
}
