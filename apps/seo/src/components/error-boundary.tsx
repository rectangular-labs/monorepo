import { Terminal } from "@rectangular-labs/ui/components/icon";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@rectangular-labs/ui/components/ui/alert";
import { Button } from "@rectangular-labs/ui/components/ui/button";
import type { ErrorComponentProps } from "@tanstack/react-router";
import { Link, rootRouteId, useMatch, useRouter } from "@tanstack/react-router";

export function DefaultCatchBoundary({ error }: ErrorComponentProps) {
  const router = useRouter();
  const isRoot = useMatch({
    strict: false,
    select: (state) => state.id === rootRouteId,
  });

  console.error(error);
  const message = (() => {
    if (error instanceof Error) {
      try {
        const parsed = JSON.parse(error.message);
        return parsed[0].problem;
      } catch {
        return error.message;
      }
    }
    return "An unexpected error occurred.";
  })();

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center justify-center gap-4 p-6">
      <Alert variant="default">
        <Terminal />
        <AlertTitle>Something went wrong</AlertTitle>
        <AlertDescription>{message}</AlertDescription>
      </Alert>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button
          onClick={() => {
            router.invalidate();
          }}
          type="button"
          variant="outline"
        >
          Try again
        </Button>
        {isRoot ? (
          <Button asChild>
            <Link to="/">Home</Link>
          </Button>
        ) : (
          <Button
            onClick={() => {
              window.history.back();
            }}
            type="button"
          >
            Go back
          </Button>
        )}
      </div>
    </div>
  );
}
