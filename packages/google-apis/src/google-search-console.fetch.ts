import { err, ok, type Result, safe } from "@rectangular-labs/result";

const GSC_BASE_URL = "https://www.googleapis.com/webmasters/v3";

/**
 * Make a request to the Google Search Console API
 */
export async function makeGscRequest<T>(
  accessToken: string,
  endpoint: string,
  options?: {
    method?: "GET" | "POST";
    body?: unknown;
  },
): Promise<Result<T, Error>> {
  const url = `${GSC_BASE_URL}${endpoint}`;

  const response = await safe(async () => {
    const res = await fetch(url, {
      method: options?.method ?? "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      ...(options?.body ? { body: JSON.stringify(options.body) } : {}),
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`GSC API request failed (${res.status}): ${errorText}`);
    }

    return await res.json();
  });

  if (!response.ok) {
    return err(response.error);
  }

  return ok(response.value as T);
}
