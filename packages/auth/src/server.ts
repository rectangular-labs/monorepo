import { expo } from "@better-auth/expo";
import { createEmailClient } from "@rectangular-labs/emails";
import { inboundDriver } from "@rectangular-labs/emails/drivers/inbound";
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
  fromEmail,
  inboundApiKey,
  credentialVerificationType,
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
  fromEmail: string;
  credentialVerificationType?: "code" | "token";
  inboundApiKey?: string | undefined;
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

  const domain = new URL(baseURL).hostname.split(".").slice(-2).join(".");
  const productionUrl =
    baseURL.startsWith("https://pr-") || baseURL.startsWith("https://preview.")
      ? `https://preview.${domain}` // preview.fluidposts.com or preview.rectangularlabs.com
      : baseURL;
  console.log("productionUrl", productionUrl);
  console.log("baseURL", baseURL);
  const emailDriver = createEmailClient({
    driver: inboundApiKey ? inboundDriver(inboundApiKey) : undefined,
  });

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
      enabled: !!credentialVerificationType,
      requireEmailVerification: true,
      sendResetPassword: async (data) => {
        if (credentialVerificationType === "code") {
          throw new Error(
            "Password reset should be done through the email OTP plugin",
          );
        }
        await emailDriver.send({
          from: fromEmail,
          to: data.user.email,
          subject: "Reset your password",
          text: `Reset your password at ${data.url}`,
        });
      },
    },
    emailVerification: {
      ...(credentialVerificationType === "token" && {
        sendVerificationEmail: async ({ user, url }) => {
          await emailDriver.send({
            from: fromEmail,
            to: user.email,
            subject: "Verify your email",
            text: `Verify your email at ${url}`,
          });
        },
      }),
    },
    plugins: [
      oAuthProxy({
        productionURL: productionUrl,
      }),
      emailOTP({
        overrideDefaultEmailVerification: credentialVerificationType === "code",
        async sendVerificationOTP({ email, otp }) {
          await emailDriver.send({
            from: fromEmail,
            to: email,
            subject: `${otp} is your verification code`,
            text: `Your one-time verification code is ${otp}`,
          });
        },
      }),
      magicLink({
        sendMagicLink: async ({ email, url }) => {
          await emailDriver.send({
            from: fromEmail,
            to: email,
            subject: "Your login link",
            text: `Your login link is ${url}`,
          });
        },
      }),
      passkey(),
      twoFactor(),
      organization({
        sendInvitationEmail: async ({ email, id, organization, inviter }) => {
          await emailDriver.send({
            from: fromEmail,
            to: email,
            subject: `You have been invited to join ${organization.name} by ${inviter.user.name}`,
            text: `You have been invited to join ${organization.name} by ${inviter.user.name}. Accept the invitation by entering the following code: ${id}`,
          });
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
    advanced: {
      cookiePrefix: domain.split(".").at(0) ?? "",
      useSecureCookies: true,
    },
    trustedOrigins: ["expo://", productionUrl, baseURL],
  } as const satisfies BetterAuthOptions;

  return betterAuth(config) as ReturnType<typeof betterAuth<typeof config>>;
}

export type Auth = ReturnType<typeof initAuthHandler>;
export type Session = Auth["$Infer"]["Session"];
export type Organization = Auth["$Infer"]["Organization"];
export type Member = Auth["$Infer"]["Member"];
