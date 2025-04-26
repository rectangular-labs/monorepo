import { Hono } from "hono";
import { getCookie } from "hono/cookie";
import { subjects } from "../../../../../../packages/auth/src/subject";
import { env } from "../../../lib/env";
import { authClient } from "./_lib/client";
import { setSession } from "./_lib/session";

export const authRouter = new Hono()
  .get("/", async (c) => {
    const authUrl = `${env().VITE_APP_URL}/api/auth/authorize`;
    const access = getCookie(c, "access_token");
    const refresh = getCookie(c, "refresh_token");
    if (!access || !refresh) {
      return c.redirect(authUrl, 302);
    }
    const verified = await authClient().verify(subjects, access, {
      refresh,
    });
    if (verified.err) {
      return c.redirect(authUrl, 302);
    }

    if (verified.tokens) {
      setSession(verified.tokens.access, verified.tokens.refresh);
    }
    return c.json(verified.subject);
  })
  .get("/authorize", async (c) => {
    const callbackUrl = `${env().VITE_APP_URL}/api/auth/callback`;
    const { url: redirectUrl } = await authClient().authorize(
      callbackUrl,
      "code",
    );
    console.log("redirectUrl", redirectUrl);
    return c.redirect(redirectUrl, 302);
  })
  .get("/callback", async (c) => {
    const pathname = new URL(c.req.url).pathname;
    console.log("pathname", pathname);
    const code = c.req.query("code");
    if (!code) throw new Error("Missing code");
    const exchanged = await authClient().exchange(
      code,
      `${env().VITE_APP_URL}${pathname}`,
    );
    if (exchanged.err)
      return new Response(exchanged.err.toString(), {
        status: 400,
      });
    setSession(exchanged.tokens.access, exchanged.tokens.refresh);
    return c.redirect("/", 302);
  });
