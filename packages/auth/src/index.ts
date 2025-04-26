import { issuer } from "@openauthjs/openauth";
import { CodeProvider } from "@openauthjs/openauth/provider/code";
import { DiscordProvider } from "@openauthjs/openauth/provider/discord";
import { GithubProvider } from "@openauthjs/openauth/provider/github";
import { CodeUI } from "@openauthjs/openauth/ui/code";
import { Select } from "@openauthjs/openauth/ui/select";
import { handle } from "hono/aws-lambda";
import { env } from "./env";
import { subjects } from "./subject";

async function getUser(email: string) {
  await Promise.resolve();
  // Get user from database and return user ID
  return "123";
}

const authApp = issuer({
  subjects,
  select: Select({
    providers: {
      code: {
        display: "Code",
      },
      discord: {
        display: "Discord",
      },
      github: {
        display: "GitHub",
      },
    },
  }),
  providers: {
    code: CodeProvider(
      CodeUI({
        sendCode: async (email, code) => {
          await Promise.resolve();
          console.log(email, code);
        },
      }),
    ),
    discord: DiscordProvider({
      clientID: env().DISCORD_CLIENT_ID,
      clientSecret: env().DISCORD_CLIENT_SECRET,
      scopes: ["identify", "email"],
      pkce: true,
      type: "code",
    }),
    github: GithubProvider({
      clientID: env().GITHUB_CLIENT_ID,
      clientSecret: env().GITHUB_CLIENT_SECRET,
      scopes: ["user:email", "read:user"],
      pkce: true,
      type: "code",
    }),
  },
  success: async (ctx, value) => {
    if (value.provider === "code") {
      console.log("value", value);
      console.log("value.claims", value.claims);
      return ctx.subject("user", {
        id: await getUser(value.claims.email ?? ""),
        name: value.claims.name ?? "",
        email: value.claims.email ?? "",
        image: value.claims.picture ?? "",
      });
    }
    throw new Error("Invalid provider");
  },
});

export const handler = handle(authApp);
