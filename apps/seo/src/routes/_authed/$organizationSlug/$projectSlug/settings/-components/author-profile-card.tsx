"use client";

import * as Icons from "@rectangular-labs/ui/components/icon";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@rectangular-labs/ui/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@rectangular-labs/ui/components/ui/card";
import { getInitials } from "@rectangular-labs/ui/utils/format/initials";
import type { WritingSettingFormSchema } from "../-lib/writing-settings";

export function AuthorProfileCard({
  author,
  onClick,
}: {
  author: WritingSettingFormSchema["authors"][number];
  onClick: () => void;
}) {
  const initials = getInitials(author.name).toUpperCase().slice(0, 2);

  return (
    <Card className="relative">
      <button className="absolute inset-0" onClick={onClick} type="button">
        <span className="sr-only">Edit {author.name} profile</span>
      </button>
      <CardHeader className="flex flex-row items-center gap-3">
        <Avatar className="size-8 shrink-0 sm:size-10">
          {author.avatarUri && <AvatarImage src={author.avatarUri} />}
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <CardTitle className="truncate">{author.name}</CardTitle>
          {author.title && (
            <CardDescription className="truncate">
              {author.title}
            </CardDescription>
          )}
        </div>
      </CardHeader>
      {!!(author.bio || author.socialLinks?.length) && (
        <CardContent className="grid gap-2">
          {author.bio && (
            <p className="line-clamp-3 text-muted-foreground text-sm">
              {author.bio}
            </p>
          )}
          {author.socialLinks?.length && (
            <div className="flex gap-2">
              {author.socialLinks.map((link) => (
                <a
                  className="z-10 inline-flex size-8 items-center justify-center rounded-full border text-muted-foreground transition-colors hover:text-foreground"
                  href={link.url}
                  key={`${link.platform}-${link.url}`}
                  rel="noreferrer"
                  target="_blank"
                >
                  <span className="sr-only">{link.platform}</span>
                  <Icons.Link className="size-3" />
                </a>
              ))}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
