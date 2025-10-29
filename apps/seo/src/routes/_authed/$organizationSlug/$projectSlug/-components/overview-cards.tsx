import * as Icons from "@rectangular-labs/ui/components/icon";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@rectangular-labs/ui/components/ui/card";
import { Skeleton } from "@rectangular-labs/ui/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { getApiClientRq } from "~/lib/api";

export function OverviewCards({ projectId }: { projectId: string }) {
  const { data: overview, isLoading } = useQuery(
    getApiClientRq().content.overview.queryOptions({
      input: { projectId },
      enabled: !!projectId,
    }),
  );

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="font-medium text-sm">Total Content</CardTitle>
          <Icons.FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-8 w-16" />
          ) : (
            <div className="font-bold text-2xl">{overview?.totalContent}</div>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="font-medium text-sm">Ranking Pages</CardTitle>
          <Icons.TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-8 w-16" />
          ) : (
            <div className="font-bold text-2xl">{overview?.rankingPages}</div>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="font-medium text-sm">
            Avg. Keyword Difficulty
          </CardTitle>
          <Icons.Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-8 w-16" />
          ) : (
            <div className="font-bold text-2xl">
              {overview?.avgKeywordDifficulty}
            </div>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="font-medium text-sm">
            Est. Monthly Traffic
          </CardTitle>
          <Icons.Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-8 w-16" />
          ) : (
            <div className="font-bold text-2xl">{overview?.totalTraffic}</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
