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

interface DB {
  // biome-ignore lint/suspicious/noExplicitAny: better-auth types
  [key: string]: any;
}

export function initAuthHandler({
  baseURL,
  db,
  encryptionKey,
  discordClientId,
  discordClientSecret,
  githubClientId,
  githubClientSecret,
  redditClientId,
  redditClientSecret,
  googleClientId,
  googleClientSecret,
}: {
  baseURL: string;
  db: DB;
  encryptionKey: string;
  discordClientId?: string | undefined;
  discordClientSecret?: string | undefined;
  githubClientId?: string | undefined;
  githubClientSecret?: string | undefined;
  redditClientId?: string | undefined;
  redditClientSecret?: string | undefined;
  googleClientId?: string | undefined;
  googleClientSecret?: string | undefined;
}) {
  const useDiscord = !!discordClientId && !!discordClientSecret;
  const useGithub = !!githubClientId && !!githubClientSecret;
  const useReddit = !!redditClientId && !!redditClientSecret;
  const useGoogle = !!googleClientId && !!googleClientSecret;

  const productionUrl =
    baseURL.startsWith("https://pr-") || baseURL.startsWith("https://preview.")
      ? `https://preview.${new URL(baseURL).hostname.split(".").slice(-2).join(".")}` // preview.fluidposts.com or preview.rectangularlabs.com
      : baseURL;

  console.log("productionUrl", productionUrl);

  const config = {
    baseURL,
    secret: encryptionKey,
    account: {
      encryptOAuthTokens: true,
      accountLinking: {
        enabled: true,
        allowDifferentEmails: true,
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
        productionURL: productionUrl,
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
        organizationHooks: {
          beforeCreateOrganization: ({ organization }) => {
            if (organization.slug === "organization") {
              throw new Error("Organization slug is already taken");
            }
            return Promise.resolve();
          },
          beforeUpdateOrganization: ({ organization }) => {
            if (organization.slug === "organization") {
              throw new Error("Organization slug is already taken");
            }
            return Promise.resolve();
          },
        },
      }),
      expo(),
    ],
    socialProviders: {
      ...(useDiscord && {
        discord: {
          clientId: discordClientId,
          clientSecret: discordClientSecret,
          redirectURI: `${productionUrl}/api/auth/callback/discord`,
        },
      }),
      ...(useGithub && {
        github: {
          clientId: githubClientId,
          clientSecret: githubClientSecret,
          redirectURI: `${productionUrl}/api/auth/callback/github`,
        },
      }),
      ...(useReddit && {
        reddit: {
          clientId: redditClientId,
          clientSecret: redditClientSecret,
          redirectURI: `${productionUrl}/api/auth/callback/reddit`,
        },
      }),
      ...(useGoogle && {
        google: {
          clientId: googleClientId,
          clientSecret: googleClientSecret,
          redirectURI: `${productionUrl}/api/auth/callback/google`,
          accessType: "offline",
          prompt: "select_account consent",
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
