import { seoBlogSource } from "@rectangular-labs/content";
import { getPostsOverview } from "@rectangular-labs/content/get-posts-overview";
import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";

const getBlogTree = createServerFn({ method: "GET" }).handler(() =>
  getPostsOverview(seoBlogSource),
);

export const Route = createFileRoute("/blog/")({
  component: Page,
  loader: async () => {
    const postOverview = await getBlogTree();
    return { postOverview };
  },
});

const CATEGORIES = [
  { id: "all", label: "Latest" },
  { id: "fluid-posts-updates", label: "Fluid Posts Updates" },
  { id: "seo-insights", label: "SEO Insights" },
  { id: "seo-experiments", label: "SEO Experiments" },
] as const;

function Page() {
  const { postOverview } = Route.useLoaderData();
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredPosts = useMemo(() => {
    let posts = postOverview;

    if (activeCategory !== "all") {
      posts = posts.filter((post) =>
        post.tags?.some(
          (tag) =>
            tag.toLowerCase().replace(/\s+/g, "-") === activeCategory ||
            tag.toLowerCase().includes(activeCategory.replace(/-/g, " ")),
        ),
      );
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      posts = posts.filter(
        (post) =>
          post.title?.toLowerCase().includes(query) ||
          post.description?.toLowerCase().includes(query) ||
          post.tags?.some((tag) => tag.toLowerCase().includes(query)),
      );
    }

    return posts;
  }, [postOverview, activeCategory, searchQuery]);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        {/* Header */}
        <div className="mb-12 flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-16">
          {/* Title and tagline */}
          <div className="lg:sticky lg:top-24 lg:w-64 lg:flex-shrink-0">
            <h1 className="font-serif text-4xl text-foreground tracking-[-0.02em] sm:text-5xl">
              Blog
            </h1>
            <p className="mt-2 text-muted-foreground text-sm leading-relaxed">
              Thoughts on SEO, content strategy, and building organic growth.
            </p>

            {/* Categories sidebar */}
            <nav className="mt-8 hidden lg:block">
              <ul className="space-y-1">
                {CATEGORIES.map((cat) => (
                  <li key={cat.id}>
                    <button
                      className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                        activeCategory === cat.id
                          ? "bg-accent font-medium text-foreground"
                          : "text-muted-foreground hover:bg-accent hover:text-foreground"
                      }`}
                      onClick={() => setActiveCategory(cat.id)}
                      type="button"
                    >
                      {cat.label}
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          {/* Main content area */}
          <div className="flex-1">
            {/* Search bar */}
            <div className="mb-6">
              <div className="relative">
                <svg
                  aria-hidden="true"
                  className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-muted-foreground"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                  />
                </svg>
                <input
                  className="w-full rounded-xl border border-border bg-background py-3 pr-4 pl-12 text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search articles..."
                  type="text"
                  value={searchQuery}
                />
              </div>
            </div>

            {/* Mobile categories */}
            <div className="mb-6 flex gap-2 overflow-x-auto pb-2 lg:hidden">
              {CATEGORIES.map((cat) => (
                <button
                  className={`flex-shrink-0 rounded-full px-4 py-2 text-sm transition-colors ${
                    activeCategory === cat.id
                      ? "bg-primary font-medium text-primary-foreground"
                      : "bg-secondary text-secondary-foreground hover:bg-accent"
                  }`}
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  type="button"
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Posts grid */}
            {filteredPosts.length === 0 ? (
              <div className="py-16 text-center">
                <p className="text-muted-foreground">No articles found.</p>
              </div>
            ) : (
              <div className="grid gap-8 sm:grid-cols-2">
                {filteredPosts.map((post, index) => (
                  <a
                    className={`group flex flex-col gap-4 ${
                      index === 0 ? "sm:col-span-2" : ""
                    }`}
                    href={post.url}
                    key={post.url}
                  >
                    {/* Cover image */}
                    {post.cover ? (
                      <div className="overflow-hidden rounded-xl bg-muted">
                        <img
                          alt={post.title ?? "Cover"}
                          className={`w-full object-cover transition-transform duration-300 group-hover:scale-105 ${
                            index === 0 ? "aspect-[2/1]" : "aspect-video"
                          }`}
                          src={post.cover}
                        />
                      </div>
                    ) : (
                      <div
                        className={`rounded-xl bg-muted ${
                          index === 0 ? "aspect-[2/1]" : "aspect-video"
                        }`}
                      />
                    )}

                    {/* Tags */}
                    {post.tags && post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {post.tags.slice(0, 3).map((tag) => (
                          <span
                            className="rounded-full bg-secondary px-3 py-1 text-secondary-foreground text-xs"
                            key={tag}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Author and date */}
                    <div className="flex items-center gap-3">
                      {post.authorDetail?.image ? (
                        <img
                          alt={post.authorDetail.name ?? "Author"}
                          className="h-8 w-8 rounded-full object-cover"
                          src={post.authorDetail.image}
                        />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                          <svg
                            aria-hidden="true"
                            className="h-4 w-4 text-muted-foreground"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              clipRule="evenodd"
                              d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                              fillRule="evenodd"
                            />
                          </svg>
                        </div>
                      )}
                      <div className="text-sm">
                        <span className="text-foreground">
                          {post.authorDetail?.name ?? "Editorial"}
                        </span>
                        {post.createdAt && (
                          <>
                            <span className="mx-2 text-muted-foreground">
                              ·
                            </span>
                            <span className="text-muted-foreground">
                              {new Date(post.createdAt).toLocaleDateString(
                                "en-US",
                                {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                },
                              )}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Title and description */}
                    <div>
                      <h2
                        className={`font-serif text-foreground tracking-[-0.01em] group-hover:text-primary ${
                          index === 0 ? "text-2xl sm:text-3xl" : "text-xl"
                        }`}
                      >
                        {post.title ?? "Untitled"}
                      </h2>
                      {post.description && (
                        <p className="mt-2 line-clamp-2 text-muted-foreground text-sm leading-relaxed">
                          {post.description}
                        </p>
                      )}
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
