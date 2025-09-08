import { expo } from "@better-auth/expo";
import { createDb } from "@rectangular-labs/db";
import type { BetterAuthOptions } from "better-auth";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { emailOTP, magicLink, twoFactor } from "better-auth/plugins";
import { authEnv } from "./env";

export function initAuthHandler(baseURL: string) {
  const env = authEnv();

  const useDiscord = !!env.AUTH_DISCORD_ID && !!env.AUTH_DISCORD_SECRET;
  const useGithub = !!env.AUTH_GITHUB_ID && !!env.AUTH_GITHUB_SECRET;

  const config = {
    database: drizzleAdapter(createDb(env.DATABASE_URL), {
      provider: "pg",
    }),
    telemetry: {
      enabled: false,
    },
    onAPIError: {
      errorURL: "/login",
    },
    baseURL,
    secret: env.AUTH_ENCRYPTION_KEY,
    logger: {
      disabled: true,
      log(level, message, ...args) {
        console.log(level, message, ...args);
      },
    },
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: true,
      sendResetPassword: async (data) => {
        await Promise.resolve();
        console.log("sendResetPassword", JSON.stringify(data, null, 2));
      },
    },
    emailVerification: {
      sendVerificationEmail: async ({ user, url, token }) => {
        await Promise.resolve();
        console.log(
          "sendVerificationEmail",
          JSON.stringify({ user, url, token }, null, 2),
        );
      },
    },
    plugins: [
      emailOTP({
        async sendVerificationOTP({ email, otp, type }) {
          await Promise.resolve();
          console.log(`[auth] Email OTP (${type}) for ${email}: ${otp}`);
        },
      }),
      magicLink({
        sendMagicLink: async ({ email, token, url }) => {
          await Promise.resolve();
          console.log(`[auth] Magic link for ${email}: ${token} ${url}`);
        },
      }),
      twoFactor(),
      expo(),
    ],
    socialProviders: {
      ...(useDiscord && {
        discord: {
          clientId: env.AUTH_DISCORD_ID,
          clientSecret: env.AUTH_DISCORD_SECRET,
          redirectURI: `${baseURL}/api/auth/callback/discord`,
        },
      }),
      ...(useGithub && {
        github: {
          clientId: env.AUTH_GITHUB_ID,
          clientSecret: env.AUTH_GITHUB_SECRET,
          redirectURI: `${baseURL}/api/auth/callback/github`,
        },
      }),
    },
    trustedOrigins: ["expo://"],
  } satisfies BetterAuthOptions;

  return betterAuth(config);
}

export type Auth = ReturnType<typeof initAuthHandler>;
export type Session = Auth["$Infer"]["Session"];
