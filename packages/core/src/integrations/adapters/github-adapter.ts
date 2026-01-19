import { Octokit } from "@octokit/rest";
import type {
  ContentPayload,
  GitHubConfig,
} from "@rectangular-labs/core/schemas/integration-parsers";
import { err, ok, type Result } from "@rectangular-labs/result";

function generateFrontmatter(content: ContentPayload): string {
  const data = {
    title: content.title,
    description: content.description,
    slug: content.slug,
    primaryKeyword: content.primaryKeyword,
    date: content.publishedAt?.toISOString() ?? new Date().toISOString(),
    ...(content.heroImage && { image: content.heroImage }),
    ...(content.heroImageCaption && { imageCaption: content.heroImageCaption }),
    ...(content.primaryKeyword && { keywords: [content.primaryKeyword] }),
    ...(content.articleType && { articleType: content.articleType }),
  };

  return `---\n${Object.entries(data)
    .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
    .join("\n")}\n---\n\n`;
}

export const githubAdapter = (accessToken: string) => {
  const octokit = new Octokit({ auth: accessToken });
  return {
    provider: "github" as const,
    async listRepositories(): Promise<
      Result<Array<{ fullName: string; defaultBranch: string }>>
    > {
      try {
        const repos = await octokit.paginate(
          octokit.repos.listForAuthenticatedUser,
          {
            per_page: 100,
            sort: "updated",
            affiliation: "owner,collaborator,organization_member",
          },
        );
        return ok(
          repos
            .filter((repo) => repo.permissions?.push)
            .map((repo) => ({
              fullName: repo.full_name,
              defaultBranch: repo.default_branch,
            })),
        );
      } catch (error) {
        return err(error instanceof Error ? error : new Error(String(error)));
      }
    },

    async listBranches(repository: string): Promise<Result<string[]>> {
      const [owner, repo] = repository.split("/");
      if (!owner || !repo) {
        return err(new Error("Invalid repository format."));
      }
      try {
        const branches = await octokit.paginate(octokit.repos.listBranches, {
          owner,
          repo,
          per_page: 100,
        });
        return ok(branches.map((branch) => branch.name));
      } catch (error) {
        return err(error instanceof Error ? error : new Error(String(error)));
      }
    },

    async healthCheck(config: GitHubConfig) {
      const [owner, repo] = config.repository.split("/");
      if (!owner || !repo) {
        return err(new Error("Invalid repository format."));
      }
      try {
        await octokit.repos.get({ owner, repo });
        return ok({ ok: true });
      } catch (error) {
        return err(error instanceof Error ? error : new Error(String(error)));
      }
    },

    async publish(config: GitHubConfig, content: ContentPayload) {
      if (config.mode !== "commit") {
        return err(new Error("Pull request mode is not supported yet."));
      }
      const [owner, repo] = config.repository.split("/");
      if (!owner || !repo) {
        return err(new Error("Invalid repository format."));
      }

      const frontmatter = generateFrontmatter(content);
      const markdownContent = frontmatter + content.contentMarkdown;

      const basePath = config.basePath.endsWith("/")
        ? config.basePath
        : `${config.basePath}/`;

      const filePath = `${basePath}${content.slug}.md`;

      const commitMessage = `docs: add ${content.title}`;

      try {
        let existingSha: string | undefined;
        try {
          const { data } = await octokit.repos.getContent({
            owner,
            repo,
            path: filePath,
            ref: config.branch,
          });
          if (!Array.isArray(data) && data.type === "file") {
            existingSha = data.sha;
          }
        } catch {
          // File doesn't exist.
        }

        const { data } = await octokit.repos.createOrUpdateFileContents({
          owner,
          repo,
          path: filePath,
          message: commitMessage,
          content: btoa(
            String.fromCharCode(...new TextEncoder().encode(markdownContent)),
          ),
          branch: config.branch,
          ...(existingSha && { sha: existingSha }),
        });

        return ok({
          externalId: data.content?.sha ?? "",
          externalUrl: data.content?.html_url ?? undefined,
          handle: filePath,
        });
      } catch (error) {
        return err(error instanceof Error ? error : new Error(String(error)));
      }
    },
  };
};
