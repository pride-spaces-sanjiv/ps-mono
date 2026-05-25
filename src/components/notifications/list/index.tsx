import React, { useMemo, useState } from "react";
import useInfiniteScrollHook from "react-infinite-scroll-hook";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { usePaginatedQuery } from "@/services/hooks/usePaginatedQuery";
import { deleteDump, getDumps } from "@/services/apis/admin/dump";
import { queryKeys } from "@/utils/query-keys";
import NotificationCard from "@/components/notifications/card";

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
    queryFn: (page, limit) => getDumps({ query: { page, limit } }),
  });

  const dumps = useMemo(() => res?.data?.data?.results || [], [res]);

  const { mutateAsync: deleteMutater } = useMutation({
    mutationFn: (id: string) => deleteDump({ url: id }),
    mutationKey: [queryKeys.DUMPS, "delete"],
  });

  const handleDelete = async (id: string) => {
    try {
      setDeletingId(id);
      const res = await deleteMutater(id);

      if (res.status === 200) {
        queryClient.invalidateQueries({ queryKey: [queryKeys.DUMPS] });
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
    <div className="flex flex-col gap-4 p-4 sm:p-6 w-full mx-auto">
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
    </div>
  );
}
