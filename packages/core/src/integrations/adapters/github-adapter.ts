import { Octokit } from "@octokit/rest";
import type {
  ContentPayload,
  GitHubConfig,
  PublishAdapter,
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
    ...({
      provider: "github",
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
        console.log("publishing content", content.articleType);
        const [owner, repo] = config.repository.split("/");
        if (!owner || !repo) {
          return err(new Error("Invalid repository format."));
        }

        const frontmatter = generateFrontmatter(content);
        const markdownContent = frontmatter + content.contentMarkdown;

        const basePath = config.basePath.replace(/^\/|\/$/g, "");
        const contentSlug = `/${content.slug.replace(/^\/|\/$/g, "")}`;
        const filePath = `${basePath}${contentSlug}.md`;
        console.log("filePath", filePath);
        const commitMessage = `docs: add ${content.title}`;

        try {
          if (config.mode === "pull_request") {
            // Get the SHA of the target branch
            const { data: refData } = await octokit.git.getRef({
              owner,
              repo,
              ref: `heads/${config.branch}`,
            });
            const baseSha = refData.object.sha;

            // Create a new branch for the PR
            const timestamp = Date.now();
            const prBranchName = `content${contentSlug}-${timestamp}`;

            await octokit.git.createRef({
              owner,
              repo,
              ref: `refs/heads/${prBranchName}`,
              sha: baseSha,
            });

            // Check if file exists on the new branch (inherited from base)
            let existingSha: string | undefined;
            try {
              const { data } = await octokit.repos.getContent({
                owner,
                repo,
                path: filePath,
                ref: prBranchName,
              });
              if (!Array.isArray(data) && data.type === "file") {
                existingSha = data.sha;
              }
            } catch {
              // File doesn't exist
            }

            // Commit the file to the new branch
            await octokit.repos.createOrUpdateFileContents({
              owner,
              repo,
              path: filePath,
              message: commitMessage,
              content: btoa(
                String.fromCharCode(
                  ...new TextEncoder().encode(markdownContent),
                ),
              ),
              branch: prBranchName,
              ...(existingSha && { sha: existingSha }),
            });

            // Create the pull request
            const { data: prData } = await octokit.pulls.create({
              owner,
              repo,
              title: `Add content: ${content.title}`,
              body: `This PR adds a new content file: **${content.title}**\n\n- Slug: \`${contentSlug}\`\n- Primary Keyword: ${content.primaryKeyword}\n- Article Type: ${content.articleType}`,
              head: prBranchName,
              base: config.branch,
            });

            return ok({
              externalId: String(prData.number),
              externalUrl: prData.html_url,
              handle: filePath,
            });
          }

          // Commit mode - direct commit to branch
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
    } satisfies PublishAdapter),
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
  };
};
