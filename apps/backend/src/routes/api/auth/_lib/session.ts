import { getContext } from "hono/context-storage";
import { setCookie } from "hono/cookie";

export function setSession(accessToken?: string, refreshToken?: string) {
  const context = getContext();
  if (accessToken) {
    setCookie(context, "access_token", accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: "Strict",
      path: "/",
      domain: ".scalenelab.com",
      maxAge: 34560000,
    });
  }
  if (refreshToken) {
    setCookie(context, "refresh_token", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "Strict",
      path: "/",
      domain: ".scalenelab.com",
      maxAge: 34560000,
    });
  }
}
