import type { DB } from "@rectangular-labs/db";
import { eq, schema } from "@rectangular-labs/db";
import { apiEnv } from "../env";

export interface RedditCommentInput {
  parentFullname: string; // e.g. t3_<post> or t1_<comment>
  text: string;
  userId: string;
}

export interface RedditCommentResult {
  id: string;
  url?: string | undefined;
}

async function getUserRedditAccessToken(
  db: DB,
  userId: string,
): Promise<string | null> {
  const rows = await db
    .select()
    .from(schema.account)
    .where(eq(schema.account.userId, userId));
  const reddit = rows.find((a) => a.providerId === "reddit");
  return reddit?.accessToken ?? null;
}

export async function postRedditComment(
  db: DB,
  input: RedditCommentInput,
): Promise<RedditCommentResult> {
  const env = apiEnv();
  const accessToken = await getUserRedditAccessToken(db, input.userId);
  if (!accessToken) {
    throw new Error("Missing Reddit access token for user");
  }

  const resp = await fetch("https://oauth.reddit.com/api/comment", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": env.REDDIT_USER_AGENT ?? "rectangular-labs/mentions",
    } as Record<string, string>,
    body: new URLSearchParams({
      api_type: "json",
      thing_id: input.parentFullname,
      text: input.text,
    }).toString(),
  });

  if (!resp.ok) {
    const body = await resp.text();
    throw new Error(`Reddit API error (${resp.status}): ${body}`);
  }

  const data = (await resp.json()) as {
    json: {
      data?: { things?: Array<{ data?: { id?: string; permalink?: string } }> };
    };
  };
  const thing = data.json.data?.things?.[0]?.data;
  return {
    id: thing?.id ?? "",
    url: thing?.permalink ? `https://reddit.com${thing.permalink}` : undefined,
  };
}
