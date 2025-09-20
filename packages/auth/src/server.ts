import { expo } from "@better-auth/expo";
import type { BetterAuthOptions } from "better-auth";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import {
  emailOTP,
  magicLink,
  oAuthProxy,
  organization,
  twoFactor,
} from "better-auth/plugins";
import { passkey } from "better-auth/plugins/passkey";
import { authEnv } from "./env";

interface DB {
  // biome-ignore lint/suspicious/noExplicitAny: better-auth types
  [key: string]: any;
}

export function initAuthHandler(baseURL: string, db: DB) {
  const env = authEnv();

  const useDiscord = !!env.AUTH_DISCORD_ID && !!env.AUTH_DISCORD_SECRET;
  const useGithub = !!env.AUTH_GITHUB_ID && !!env.AUTH_GITHUB_SECRET;
  const useReddit = !!env.AUTH_REDDIT_ID && !!env.AUTH_REDDIT_SECRET;

  const config = {
    baseURL,
    secret: env.AUTH_ENCRYPTION_KEY,
    account: {
      encryptOAuthTokens: true,
      accountLinking: {
        enabled: true,
      },
    },
    user: {
      additionalFields: {
        source: {
          type: "string",
          required: false,
        },
        goal: {
          type: "string",
          required: false,
        },
      },
    },
    database: drizzleAdapter(db, {
      provider: "pg",
    }),
    telemetry: {
      enabled: false,
    },
    onAPIError: {
      errorURL: "/login",
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
      oAuthProxy({
        /**
         * Auto-inference blocked by https://github.com/better-auth/better-auth/pull/2891
         */
        currentURL: baseURL,
        productionURL: baseURL,
      }),
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
      passkey(),
      twoFactor(),
      organization({
        sendInvitationEmail: async ({ email, id }) => {
          await Promise.resolve();
          console.log(`[auth] Invitation email for ${email}: ${id}`);
        },
      }),
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
      ...(useReddit && {
        reddit: {
          clientId: env.AUTH_REDDIT_ID,
          clientSecret: env.AUTH_REDDIT_SECRET,
          redirectURI: `${baseURL}/api/auth/callback/reddit`,
        },
      }),
    },
    trustedOrigins: ["expo://"],
  } satisfies BetterAuthOptions;

  return betterAuth(config) as ReturnType<typeof betterAuth<typeof config>>;
}

export type Auth = ReturnType<typeof initAuthHandler>;
export type Session = Auth["$Infer"]["Session"];
export type Organization = Auth["$Infer"]["Organization"];
export type Member = Auth["$Infer"]["Member"];
