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
import { useEffect, useMemo, useState } from "react";
import type {
  ImageItem,
  ProjectImageKind,
  UploadImageItem,
} from "./image-setting-modal";
import { ImageSettingModal } from "./image-setting-modal";

interface ImageUploadGridProps {
  title: string;
  description?: string;
  kind: ProjectImageKind;
  projectId: string;
  organizationId: string;
  items: ImageItem[];
  onChange: (items: UploadImageItem[]) => void;
}

function ImageItemCard({
  item,
  onEdit,
  onRemove,
}: {
  item: ImageItem;
  onEdit: () => void;
  onRemove: () => void;
}) {
  const imageUrls = useMemo(() => {
    if (!item.images) return [];
    return item.images.map((file) => URL.createObjectURL(file));
  }, [item.images]);

  useEffect(() => {
    return () => {
      for (const url of imageUrls) {
        URL.revokeObjectURL(url);
      }
    };
  }, [imageUrls]);

  const displayName = item.name;

  return (
    <div className="flex flex-col justify-between rounded-md border bg-muted/40 p-3 text-xs">
      {imageUrls.length > 0 && (
        <div className="-mx-3 -mt-3 mb-3">
          <Carousel className="w-full">
            <CarouselContent>
              {imageUrls.map((url, imgIndex) => (
                <CarouselItem key={url}>
                  <div className="relative aspect-video w-full overflow-hidden rounded-t-md bg-muted">
                    <img
                      alt={
                        displayName
                          ? `${displayName} - Image ${imgIndex + 1}`
                          : `Image ${imgIndex + 1}`
                      }
                      className="h-full w-full object-cover"
                      src={url}
                    />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            {imageUrls.length > 1 && (
              <>
                <CarouselPrevious className="left-2 size-6" />
                <CarouselNext className="right-2 size-6" />
              </>
            )}
          </Carousel>
        </div>
      )}
      <div className="space-y-1">
        {displayName ? (
          <div className="flex items-center justify-between gap-2">
            <span className="line-clamp-1 font-medium text-xs">
              {displayName}
            </span>
          </div>
        ) : null}
        {item.instructions ? (
          <p className="line-clamp-3 text-muted-foreground text-xs">
            {item.instructions}
          </p>
        ) : null}
      </div>
      <div className="mt-3 flex items-center justify-between gap-2">
        <Button onClick={onEdit} size="icon-xs" variant="ghost">
          <Icons.Pencil className="h-3 w-3" />
          <span className="sr-only">Edit</span>
        </Button>

        <Button onClick={onRemove} size="icon-xs" variant="ghost">
          <Icons.Trash className="h-3 w-3" />
          <span className="sr-only">Remove</span>
        </Button>
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

  function handleAdd(item: UploadImageItem) {
    onChange([...items, item]);
  }
  function handleEdit(item: UploadImageItem) {
    onChange(
      items.map((existingItem, index) =>
        index === currentItemIndex ? item : existingItem,
      ),
    );
  }
  function handleRemove(index: number) {
    onChange(items.filter((_, i) => i !== index));
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
                  onEdit={() => {
                    setOpen(true);
                    setCurrentItemIndex(index);
                  }}
                  onRemove={() => handleRemove(index)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      <ImageSettingModal
        initial={isEditing ? items[currentItemIndex] : undefined}
        kind={kind}
        onSubmit={isEditing ? handleEdit : handleAdd}
        open={open}
        organizationId={organizationId}
        projectId={projectId}
        setOpen={setOpen}
      />
    </>
  );
}
