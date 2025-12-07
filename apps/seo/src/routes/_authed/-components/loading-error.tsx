import * as Icons from "@rectangular-labs/ui/components/icon";
import { Button } from "@rectangular-labs/ui/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@rectangular-labs/ui/components/ui/empty";
import { Skeleton } from "@rectangular-labs/ui/components/ui/skeleton";
import { cn } from "@rectangular-labs/ui/utils/cn";

interface LoadingErrorProps {
  /** Current loading state */
  isLoading: boolean;
  /** Custom loading component */
  loadingComponent?: React.ReactNode;
  /** Error object or message */
  error: Error | string | null;
  /** Custom error title */
  errorTitle?: string;
  /** Custom error description */
  errorDescription?: string;
  /** Retry function */
  onRetry?: () => void;
  /** Additional className for the container */
  className?: string;
}

export function LoadingError({
  isLoading,
  loadingComponent,
  error,
  errorTitle = "Something went wrong",
  errorDescription,
  onRetry,
  className,
}: LoadingErrorProps) {
  if (isLoading) {
    return (
      loadingComponent ?? <DefaultLoadingComponent className={className} />
    );
  }

  if (error) {
    const errorMessage = typeof error === "string" ? error : error.message;
    const description = errorDescription || errorMessage;

    return (
      <Empty className={className}>
        <EmptyHeader>
          <EmptyMedia className="bg-destructive" variant="icon">
            <Icons.X className="text-destructive-foreground" />
          </EmptyMedia>
          <EmptyTitle>{errorTitle}</EmptyTitle>
          <EmptyDescription>{description}</EmptyDescription>
        </EmptyHeader>
        {onRetry && (
          <EmptyContent>
            <Button onClick={onRetry}>
              <Icons.RotateCcw className="size-4" />
              Try again
            </Button>
          </EmptyContent>
        )}
      </Empty>
    );
  }

  return null;
}

function DefaultLoadingComponent({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-4", className)}>
      <div className="space-y-2">
        <Skeleton className="h-8 w-1/12" />
        <Skeleton className="h-4 w-1/6" />
      </div>
      <div className="space-y-3">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    </div>
  );
}
