import React, { useMemo } from "react";
import useInfiniteScrollHook from "react-infinite-scroll-hook";
import { usePaginatedQuery } from "@/services/hooks/usePaginatedQuery";
import { getDumps } from "@/services/apis/admin/dump";
import { queryKeys } from "@/utils/query-keys";
import NotificationCard from "@/components/notifications/card";

export default function NotificationList() {
  const {
    data: res,
    isFetching,
    page,
    setPage,
  } = usePaginatedQuery({
    limit: 10,
    queryKey: [queryKeys.DUMPS],
    queryFn: (page, limit) => getDumps({ query: { page, limit } }),
  });

  const dumps = useMemo(() => res?.data?.data?.results || [], [res]);

    const [infiniteRef] = useInfiniteScrollHook({
    loading: isFetching,
    hasNextPage: !!res?.data?.data?.metrics?.next,
    onLoadMore: () => {
      setPage((prev) => prev + 1);
    },
    disabled: res?.data?.data?.metrics?.next === 0,
    rootMargin: "0px 0px 40px 0px",
  });

  return (
    <div className="flex flex-col gap-2 p-3 sm:p-4 w-full mx-auto">
      {dumps.length === 0 ? (
        <div className="rounded-xl border border-dashed border-muted p-6 text-center text-muted-foreground">
          No notifications yet. Refresh the page or check back later.
        </div>
      ) : (
        dumps.map((n) => (
          <NotificationCard key={n.id} notification={n} />
        ))
      )}
    </div>
  );
}
