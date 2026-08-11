import { useEffect, useMemo, useState } from "react";
import {
  QueryClient,
  useQuery,
  type DefinedInitialDataOptions,
  type QueryFunction,
  type QueryKey,
} from "@tanstack/react-query";

type Params<
  TQueryFnData = any,
  TError = Error,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = readonly any[],
> = {
  page: number;
  limit: number;
  initialPageOnLimitChange: boolean;
} & Omit<
  DefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey>,
  "queryFn"
> & {
    queryFn?: (
      page: number,
      limit: number,
      context: Parameters<QueryFunction<TQueryFnData, TQueryKey>>[0],
    ) => ReturnType<QueryFunction<TQueryFnData, TQueryKey>>;
  };

export function usePaginatedQuery<
  TQueryFnData = any,
  TError = Error,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = readonly any[],
>(
  params: Partial<Params<TQueryFnData, TError, TData, TQueryKey>> | null,
  queryClient?: QueryClient,
) {
  const allParams = useMemo(() => ({ ...params }), [params]);
  const onlyQueryOptions = useMemo(
    () =>
      ({
        ...allParams,
        page: undefined,
        limit: undefined,
      }) as Partial<Omit<Params, "page" | "undefined">>,
    [allParams],
  );

  const [page, setPage] = useState(allParams.page ?? 0);
  const [limit, setLimit] = useState(allParams.limit ?? 10);
  const [fetchCount, setFetchCount] = useState(0);

  const query = useQuery<TQueryFnData, TError, TData, TQueryKey>(
    {
      ...onlyQueryOptions,
      // @ts-ignore
      queryKey: [
        ...(onlyQueryOptions?.queryKey || []),
        "paginated",
        page,
        limit,
      ],
      queryFn: (context) => {
        setFetchCount((prev) => prev + 1);
        return onlyQueryOptions?.queryFn?.(page, limit, context);
      },
    },
    queryClient,
  );

  const [pagedResults, setPagedResults] = useState<(typeof query.data)[]>([]);

  useEffect(() => {}, [query.data, page]);

  useEffect(() => {
    allParams.initialPageOnLimitChange !== false && setPage?.(0);
  }, [allParams.initialPageOnLimitChange, limit]);

  return {
    page,
    setPage,
    limit,
    setLimit,
    fetchCount,
    ...query,
  };
}
