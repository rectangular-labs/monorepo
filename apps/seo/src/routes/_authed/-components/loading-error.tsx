import * as Icons from "@rectangular-labs/ui/components/icon";
import { Button } from "@rectangular-labs/ui/components/ui/button";
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
  error,
  loadingComponent,
  errorTitle = "Something went wrong",
  errorDescription,
  onRetry,
  className,
}: LoadingErrorProps) {
  if (isLoading) {
    return (
      <div className={cn("py-8", className)}>
        {loadingComponent || <DefaultLoadingComponent />}
      </div>
    );
  }

  if (error) {
    const errorMessage = typeof error === "string" ? error : error.message;
    const description = errorDescription || errorMessage;

    return (
      <div className={cn("py-12 text-center", className)}>
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive">
          <Icons.X className="h-6 w-6 text-destructive-foreground" />
        </div>
        <h3 className="mb-2 font-semibold text-lg">{errorTitle}</h3>
        <p className="mb-4 text-muted-foreground">{description}</p>
        {onRetry && (
          <Button onClick={onRetry} variant="outline">
            <Icons.RotateCcw className="mr-2 h-4 w-4" />
            Try again
          </Button>
        )}
      </div>
    );
  }

  return null;
}

function DefaultLoadingComponent() {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-96" />
      </div>
      <div className="space-y-3">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    </div>
  );
}
