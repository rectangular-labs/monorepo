import { ORPCError } from "@orpc/server";
import { githubAdapter } from "@rectangular-labs/core/integrations/adapters/github-adapter";
import { type } from "arktype";
import { protectedBase } from "../context";
import { getPublishingScopes } from "../lib/project/get-publishing-scopes";

const listRepositories = protectedBase
  .route({ method: "GET", path: "/repositories" })
  .input(type.undefined)
  .output(
    type({
      repositories: type({
        accountId: "string",
        fullName: "string",
        defaultBranch: "string",
      }).array(),
      hasGithubAccount: "boolean",
      hasRepoScopes: "boolean",
    }),
  )
  .handler(async ({ context }) => {
    const accounts = await context.db.query.account.findMany({
      where: (table, { and, eq }) =>
        and(eq(table.userId, context.user.id), eq(table.providerId, "github")),
    });

    if (accounts.length === 0) {
      return {
        repositories: [],
        hasGithubAccount: false,
        hasRepoScopes: false,
      };
    }

    const githubPublishingScopes = getPublishingScopes("github");
    if (!githubPublishingScopes) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "GitHub publishing scopes not found.",
      });
    }
    const accountsWithScopes = accounts.filter((account) =>
      githubPublishingScopes.every((scope) => account.scope?.includes(scope)),
    );
    if (accountsWithScopes.length === 0) {
      return {
        repositories: [],
        hasGithubAccount: true,
        hasRepoScopes: false,
      };
    }

    const repositories: Array<{
      accountId: string;
      fullName: string;
      defaultBranch: string;
    }> = [];

    for (const account of accountsWithScopes) {
      const accessToken = await context.auth.api.getAccessToken({
        body: {
          accountId: account.id,
          userId: account.userId,
          providerId: account.providerId,
        },
      });

      const result = await githubAdapter(
        accessToken.accessToken,
      ).listRepositories();
      if (!result.ok) {
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message: result.error.message,
        });
      }

      repositories.push(
        ...result.value.map((repo) => ({
          accountId: account.id,
          fullName: repo.fullName,
          defaultBranch: repo.defaultBranch,
        })),
      );
    }

    return {
      repositories,
      hasGithubAccount: true,
      hasRepoScopes: true,
    };
  });

const listBranches = protectedBase
  .route({ method: "GET", path: "/branches" })
  .input(
    type({
      accountId: "string",
      repository: "string",
    }),
  )
  .output(type({ branches: "string[]" }))
  .handler(async ({ context, input }) => {
    const account = await context.db.query.account.findFirst({
      where: (table, { and, eq }) =>
        and(
          eq(table.id, input.accountId),
          eq(table.userId, context.user.id),
          eq(table.providerId, "github"),
        ),
    });
    if (!account) {
      throw new ORPCError("UNAUTHORIZED", {
        message: "No GitHub account connected.",
      });
    }

    const accessToken = await context.auth.api.getAccessToken({
      body: {
        accountId: account.id,
        userId: context.user.id,
        providerId: "github",
      },
    });

    const result = await githubAdapter(accessToken.accessToken).listBranches(
      input.repository,
    );
    if (!result.ok) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: result.error.message,
      });
    }

    return { branches: result.value };
  });

export const github = protectedBase.prefix("/github").router({
  listRepositories,
  listBranches,
});
