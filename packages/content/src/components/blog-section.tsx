import { User } from "@rectangular-labs/ui/components/icon";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@rectangular-labs/ui/components/ui/avatar";
import { Badge } from "@rectangular-labs/ui/components/ui/badge";
import { Section } from "@rectangular-labs/ui/components/ui/section";
import type { ExtractedPost } from "../lib/get-posts-overview";
import { SearchInput } from "./search-input";

type BlogSectionProps = {
  postsOverview: ExtractedPost[];
  title?: string;
  showFeatured?: boolean;
};

export function BlogSection({
  postsOverview,
  title = "Latest articles",
  showFeatured = true,
}: BlogSectionProps) {
  const [featured, ...rest] = postsOverview;
  let restPost = rest;
  if (featured && !showFeatured) {
    restPost = [featured].concat(rest);
  }
  const FIVE_DAYS_MS = 5 * 24 * 60 * 60 * 1000;
  const isRecent = (date: Date | null) =>
    date ? Date.now() - date.getTime() <= FIVE_DAYS_MS : false;

  return (
    <Section>
      <div className="container mx-auto flex flex-col gap-14">
        <div className="flex w-full flex-col gap-8 sm:flex-row sm:items-center sm:justify-between">
          <h4 className="max-w-xl font-regular text-3xl tracking-tighter md:text-5xl">
            {title}
          </h4>
          <SearchInput />
        </div>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          {showFeatured && featured ? (
            <a
              className="flex cursor-pointer flex-col gap-4 hover:opacity-75 md:col-span-2"
              href={featured.url}
            >
              {featured.cover ? (
                <img
                  alt={featured.title ?? "Cover"}
                  className="aspect-video w-full rounded-md bg-muted object-cover"
                  src={featured.cover}
                />
              ) : (
                <div className="aspect-video rounded-md bg-muted" />
              )}
              <div className="flex flex-row flex-wrap items-center gap-2">
                {isRecent(featured.createdAt) ? (
                  <Badge>NEW</Badge>
                ) : isRecent(featured.lastModified) ? (
                  <Badge>UPDATED</Badge>
                ) : null}
                {featured.tags?.map((tag) => (
                  <Badge key={tag}>{tag}</Badge>
                ))}
              </div>
              <div className="flex flex-row items-center gap-4">
                <p className="flex flex-row items-center gap-2 text-sm">
                  <span className="text-muted-foreground">By</span>{" "}
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={featured.authorDetail?.image ?? ""} />
                    <AvatarFallback>
                      {featured.authorDetail?.name ?? <User />}
                    </AvatarFallback>
                  </Avatar>
                  <span>{featured.authorDetail?.name ?? "Editorial"}</span>
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="max-w-3xl text-4xl tracking-tight">
                  {featured.title ?? "Untitled"}
                </h3>
                {featured.description ? (
                  <p className="max-w-3xl text-base text-muted-foreground">
                    {featured.description}
                  </p>
                ) : null}
              </div>
            </a>
          ) : null}

          {restPost.map((post) => (
            <a
              className="flex cursor-pointer flex-col gap-4 hover:opacity-75"
              href={post.url}
              key={post.url}
            >
              {post.cover ? (
                <img
                  alt={post.title ?? "Cover"}
                  className="aspect-video w-full rounded-md bg-muted object-cover"
                  src={post.cover}
                />
              ) : (
                <div className="aspect-video rounded-md bg-muted" />
              )}
              <div className="flex flex-row flex-wrap items-center gap-2">
                {isRecent(post.createdAt) ? (
                  <Badge>NEW</Badge>
                ) : isRecent(post.lastModified) ? (
                  <Badge>UPDATED</Badge>
                ) : null}
                {post.tags?.map((tag) => (
                  <Badge key={tag}>{tag}</Badge>
                ))}
              </div>
              <div className="flex flex-row items-center gap-4">
                <p className="flex flex-row items-center gap-2 text-sm">
                  <span className="text-muted-foreground">By</span>{" "}
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={post.authorDetail?.image ?? ""} />
                    <AvatarFallback>
                      {post.authorDetail?.name ?? <User />}
                    </AvatarFallback>
                  </Avatar>
                  <span>{post.authorDetail?.name ?? "Editorial"}</span>
                </p>
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="max-w-3xl text-2xl tracking-tight">
                  {post.title ?? "Untitled"}
                </h3>
                {post.description ? (
                  <p className="max-w-3xl text-base text-muted-foreground">
                    {post.description}
                  </p>
                ) : null}
              </div>
            </a>
          ))}
        </div>
      </div>
    </Section>
  );
}
