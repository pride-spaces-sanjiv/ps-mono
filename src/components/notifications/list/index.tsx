import React, { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import useInfiniteScrollHook from "react-infinite-scroll-hook";
import { usePaginatedQuery } from "@/services/hooks/usePaginatedQuery";
import { deleteDump, getDumps } from "@/services/apis/admin/dump";
import { queryKeys } from "@/utils/query-keys";
import NotificationCard from "@/components/notifications/card";
import { toast } from "sonner";
import Skeleton from "react-loading-skeleton";
import { cn } from "@/utils/className";
import type { Dump } from "@/types/data/dump";

export default function NotificationList() {
  const queryClient = useQueryClient();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const {
    data: res,
    isFetching,
    page,
    setPage,
  } = usePaginatedQuery({
    limit: 10,
    queryKey: [queryKeys.DUMPS],
    queryFn: (page, limit) => getDumps({ query: { page: page + 1, limit } }),
  });

  const [infiniteRef] = useInfiniteScrollHook({
    loading: isFetching,
    hasNextPage: !!res?.data?.data?.metrics?.next,
    onLoadMore: () => {
      setPage((prev) => prev + 1);
    },
    disabled: res?.data?.data?.metrics?.next === 0,
    rootMargin: "0px 0px -40px 0px",
    delayInMs: 300,
  });

  // const dumps = useMemo(() => res?.data?.data?.results || [], [res]);
  const dumps = useMemo(() => {
    const keyResponsePairs = queryClient
      .getQueriesData<typeof res>({
        queryKey: [queryKeys.DUMPS, "paginated"],
      })
      .filter(
        ([keys, data]) =>
          typeof keys[2] === "number" &&
          typeof keys[3] === "number" &&
          keys[3] === 10 &&
          keys[2] >= 0 &&
          data !== undefined &&
          data,
      )
      .sort((a, b) => (a[0][2] as number) - (b[0][2] as number)); // sort page wise in incremental
    console.log("Dumps paginated responses", keyResponsePairs);

    // Append page wise results flattened
    const results = keyResponsePairs.reduce((prev, curr, i) => {
      if (curr[1]?.data?.data?.results) {
        prev.push(...curr[1].data.data.results);
      }
      return prev;
    }, [] as Dump[]);

    return results;
  }, [res, queryClient]);

  const { mutateAsync: deleteMutater } = useMutation({
    mutationFn: (id: string) => deleteDump({ url: id }),
  });
  const handleDelete = async (id: string) => {
    try {
      setDeletingId(id);
      const res = await deleteMutater(id);

      if (res.status === 200) {
        await queryClient.invalidateQueries({
          queryKey: [queryKeys.DUMPS, "paginated"],
        });
        toast.success("Notification deleted");
        return;
      }

      throw new Error("Invalid response");
    } catch (err) {
      toast.error("Failed to delete notification");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="flex flex-col gap-2 p-3 sm:p-4 w-full mx-auto">
      {dumps.length === 0 ? (
        <div className="rounded-xl border border-dashed border-muted p-6 text-center text-muted-foreground">
          No notifications yet. Refresh the page or check back later.
        </div>
      ) : (
        dumps.map((n) => (
          <NotificationCard
            key={n.id}
            notification={n}
            onDelete={handleDelete}
            isDeleting={deletingId === n.id}
          />
        ))
      )}
      {isFetching &&
        Array(3)
          .fill(null)
          .map((_, i) => (
            <Skeleton
              key={i}
              containerClassName={cn(
                "rounded-xl flex flex-col h-[97px] [&_br]:hidden overflow-hidden",
              )}
              className="w-full h-full"
            />
          ))}
      {<div className="size-0 opacity-0" ref={infiniteRef}></div>}
    </div>
  );
}
