import { Button } from "@rectangular-labs/ui/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@rectangular-labs/ui/components/ui/sheet";
import { Link } from "@tanstack/react-router";
import { ContentDisplay, useContentDisplayController } from "./content-display";

export function ContentDetailsDrawer({
  contentDraftId,
  organizationIdentifier,
  organizationSlug,
  projectId,
  projectSlug,
  onClose,
}: {
  contentDraftId: string | null;
  organizationIdentifier: string;
  organizationSlug: string;
  projectId: string;
  projectSlug: string;
  onClose: () => void;
}) {
  const open = !!contentDraftId;

  const controller = useContentDisplayController({
    draftId: contentDraftId,
    organizationIdentifier,
    projectId,
  });

  return (
    <Sheet onOpenChange={(nextOpen) => !nextOpen && onClose()} open={open}>
      <SheetContent className="gap-0 p-0 sm:max-w-4xl">
        <SheetHeader className="border-b px-4 py-3 sm:px-6">
          <SheetTitle>
            {controller.details?.contentDraft.title ?? "Content details"}
          </SheetTitle>
        </SheetHeader>

        <ContentDisplay
          controller={controller}
          headerActions={
            contentDraftId ? (
              <Button asChild size="sm" variant="outline">
                <Link
                  params={{
                    draftId: contentDraftId,
                    organizationSlug,
                    projectSlug,
                  }}
                  to="/$organizationSlug/$projectSlug/content/$draftId"
                >
                  Open page
                </Link>
              </Button>
            ) : null
          }
        />
      </SheetContent>
    </Sheet>
  );
}
