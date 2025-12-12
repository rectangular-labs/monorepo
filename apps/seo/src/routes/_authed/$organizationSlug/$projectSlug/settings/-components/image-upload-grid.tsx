"use client";

import * as Icons from "@rectangular-labs/ui/components/icon";
import { Button } from "@rectangular-labs/ui/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@rectangular-labs/ui/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@rectangular-labs/ui/components/ui/carousel";
import { useState } from "react";
import type { ImageItem, ProjectImageKind } from "./image-setting-modal";
import { ImageSettingModal } from "./image-setting-modal";

interface ImageUploadGridProps {
  title: string;
  description?: string;
  kind: ProjectImageKind;
  projectId: string;
  organizationId: string;
  items: ImageItem[];
  onChange: (items: ImageItem[]) => void;
}

function ImageItemCard({
  item,
  onClick,
}: {
  item: ImageItem;
  onClick: () => void;
}) {
  const displayName = item.name;

  return (
    <div className="relative flex flex-col justify-between rounded-md border bg-muted/40 text-xs">
      <button
        className="absolute inset-0 hover:cursor-pointer"
        onClick={onClick}
        type="button"
      >
        <span className="sr-only">Edit {item.name ?? "image"} settings</span>
      </button>
      {item.uris.length > 0 && (
        <Carousel>
          <CarouselContent>
            {item.uris.map((uri, imgIndex) => (
              <CarouselItem key={uri}>
                <div className="relative aspect-video w-full overflow-hidden rounded-t-md bg-muted">
                  <img
                    alt={
                      displayName
                        ? `${displayName} - Image ${imgIndex + 1}`
                        : `Image ${imgIndex + 1}`
                    }
                    className="h-full w-full object-cover"
                    src={uri}
                  />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          {item.uris.length > 1 && (
            <>
              <CarouselPrevious className="left-2 size-6" />
              <CarouselNext className="right-2 size-6" />
            </>
          )}
        </Carousel>
      )}
      <div className="min-h-18 space-y-1 p-3">
        {displayName ? (
          <div className="flex items-center justify-between gap-2">
            <span className="line-clamp-1 font-medium text-xs">
              {displayName}
            </span>
          </div>
        ) : null}

        <p className="line-clamp-3 text-muted-foreground text-xs">
          {item.instructions ?? <em>No Description</em>}
        </p>
      </div>
    </div>
  );
}

export function ImageUploadGrid({
  title,
  description,
  kind,
  projectId,
  organizationId,
  items,
  onChange,
}: ImageUploadGridProps) {
  const [open, setOpen] = useState(false);
  const [currentItemIndex, setCurrentItemIndex] = useState<number | undefined>(
    undefined,
  );

  function handleAdd(item: ImageItem) {
    onChange([...items, item]);
  }
  function handleEdit(item: ImageItem) {
    onChange(
      items.map((existingItem, index) =>
        index === currentItemIndex ? item : existingItem,
      ),
    );
  }
  function handleRemove(item: ImageItem) {
    onChange(items.filter((i) => i.uris.join(".") !== item.uris.join(".")));
    setCurrentItemIndex(undefined);
  }

  const isEditing = currentItemIndex !== undefined;

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="text-base">{title}</CardTitle>
            {description ? (
              <CardDescription>{description}</CardDescription>
            ) : null}
          </div>

          <Button
            onClick={() => {
              setOpen(true);
              setCurrentItemIndex(undefined);
            }}
            size="sm"
            variant="outline"
          >
            <Icons.Plus className="size-4" /> Add
          </Button>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No images added yet. Use the Add button to upload one.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((item, index) => (
                <ImageItemCard
                  item={item}
                  key={item.uris.join(".")}
                  onClick={() => {
                    setOpen(true);
                    setCurrentItemIndex(index);
                  }}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      <ImageSettingModal
        initial={isEditing ? items[currentItemIndex] : undefined}
        kind={kind}
        onRemove={handleRemove}
        onSubmit={isEditing ? handleEdit : handleAdd}
        open={open}
        organizationId={organizationId}
        projectId={projectId}
        setOpen={setOpen}
      />
    </>
  );
}
