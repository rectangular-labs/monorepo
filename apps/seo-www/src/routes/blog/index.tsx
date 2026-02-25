import { seoBlogSource } from "@rectangular-labs/content";
import { getPostsOverview } from "@rectangular-labs/content/get-posts-overview";
import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { useState, useMemo } from "react";

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
      posts = posts.filter(post => 
        post.tags?.some(tag => 
          tag.toLowerCase().replace(/\s+/g, "-") === activeCategory ||
          tag.toLowerCase().includes(activeCategory.replace(/-/g, " "))
        )
      );
    }
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      posts = posts.filter(post =>
        post.title?.toLowerCase().includes(query) ||
        post.description?.toLowerCase().includes(query) ||
        post.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }
    
    return posts;
  }, [postOverview, activeCategory, searchQuery]);

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        {/* Header */}
        <div className="mb-12 flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-16">
          {/* Title and tagline */}
          <div className="lg:sticky lg:top-24 lg:w-64 lg:flex-shrink-0">
            <h1 className="font-serif text-4xl text-neutral-900 tracking-[-0.02em] sm:text-5xl dark:text-white">
              Blog
            </h1>
            <p className="mt-2 text-neutral-500 text-sm leading-relaxed dark:text-neutral-400">
              Thoughts on SEO, content strategy, and building organic growth.
            </p>
            
            {/* Categories sidebar */}
            <nav className="mt-8 hidden lg:block">
              <ul className="space-y-1">
                {CATEGORIES.map((cat) => (
                  <li key={cat.id}>
                    <button
                      type="button"
                      onClick={() => setActiveCategory(cat.id)}
                      className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                        activeCategory === cat.id
                          ? "bg-neutral-100 font-medium text-neutral-900 dark:bg-neutral-800 dark:text-white"
                          : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800/50 dark:hover:text-white"
                      }`}
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
                  className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-neutral-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  type="text"
                  placeholder="Search articles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-neutral-200 bg-white py-3 pr-4 pl-12 text-neutral-900 placeholder:text-neutral-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white dark:focus:border-emerald-400 dark:placeholder:text-neutral-500"
                />
              </div>
            </div>

            {/* Mobile categories */}
            <div className="mb-6 flex gap-2 overflow-x-auto pb-2 lg:hidden">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(cat.id)}
                  className={`flex-shrink-0 rounded-full px-4 py-2 text-sm transition-colors ${
                    activeCategory === cat.id
                      ? "bg-neutral-900 font-medium text-white dark:bg-white dark:text-neutral-900"
                      : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Posts grid */}
            {filteredPosts.length === 0 ? (
              <div className="py-16 text-center">
                <p className="text-neutral-500 dark:text-neutral-400">No articles found.</p>
              </div>
            ) : (
              <div className="grid gap-8 sm:grid-cols-2">
                {filteredPosts.map((post, index) => (
                  <a
                    key={post.url}
                    href={post.url}
                    className={`group flex flex-col gap-4 ${
                      index === 0 ? "sm:col-span-2" : ""
                    }`}
                  >
                    {/* Cover image */}
                    {post.cover ? (
                      <div className="overflow-hidden rounded-xl bg-neutral-100 dark:bg-neutral-800">
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
                        className={`rounded-xl bg-neutral-100 dark:bg-neutral-800 ${
                          index === 0 ? "aspect-[2/1]" : "aspect-video"
                        }`}
                      />
                    )}

                    {/* Tags */}
                    {post.tags && post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {post.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full bg-neutral-100 px-3 py-1 text-neutral-600 text-xs dark:bg-neutral-800 dark:text-neutral-400"
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
                          src={post.authorDetail.image}
                          alt={post.authorDetail.name ?? "Author"}
                          className="h-8 w-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-200 dark:bg-neutral-700">
                          <svg
                            className="h-4 w-4 text-neutral-500"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                            aria-hidden="true"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                      )}
                      <div className="text-sm">
                        <span className="text-neutral-900 dark:text-white">
                          {post.authorDetail?.name ?? "Editorial"}
                        </span>
                        {post.createdAt && (
                          <>
                            <span className="mx-2 text-neutral-400">·</span>
                            <span className="text-neutral-500 dark:text-neutral-400">
                              {new Date(post.createdAt).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Title and description */}
                    <div>
                      <h2
                        className={`font-serif text-neutral-900 tracking-[-0.01em] group-hover:text-emerald-600 dark:text-white dark:group-hover:text-emerald-400 ${
                          index === 0 ? "text-2xl sm:text-3xl" : "text-xl"
                        }`}
                      >
                        {post.title ?? "Untitled"}
                      </h2>
                      {post.description && (
                        <p className="mt-2 line-clamp-2 text-neutral-500 text-sm leading-relaxed dark:text-neutral-400">
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
