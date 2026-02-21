import React, { useEffect, useMemo } from "react";
import {
  providersStore,
  commonGroupsStore,
  userGroupsStore,
} from "../store/media";
import { usePaginatedQuery } from "@/services/hooks/usePaginatedQuery";
import { getProviders, getCommonGroups } from "../apis/common";
import { getGroups } from "../apis/groups";
import { delayPromise } from "@/utils/promise";
import { queryKeys } from "@/utils/query-keys";
import { datifyObjectValues, type Datified } from "@/utils/object/datify";
import type {
  DatifiedGroup,
  DatifiedProvider,
  DatifiedUserGroup,
} from "@/types/data/media";

const unifier = <T extends { [k: string]: any }, K extends keyof T>(
  arr: T[],
  key: K,
) => {
  const newArr = [] as T[];
  const onlyKeys = [] as T[K][];
  for (let i = 0; i < arr.length; i++) {
    const data = arr[i];
    if (onlyKeys.find((k) => k === data[key])) {
      continue;
    }
    newArr.push(data);
    onlyKeys.push(data[key]);
  }
  return newArr;
};
const sortByDateField = <T extends { [k: string]: any }, K extends keyof T>(
  arr: T[],
  key: K,
  reverse = false,
) => {
  const newArr = arr;
  newArr.sort((a, b) => a[key].getTime() - b[key].getTime());
  if (reverse) {
    newArr.reverse();
  }
  return newArr;
};
const datifyAndSort = <T extends { [k: string]: any }, K extends keyof T>(
  arr: T[],
  key: K,
  reverse = false,
) => {
  let newArr = arr
    .map((dt) => datifyObjectValues(dt, [key]))
    .filter((dt) => typeof dt === "object" && !!dt);
  newArr = sortByDateField(newArr, key, reverse);
  return newArr;
};

export function useAutoMediaDataFetch() {
  const providersState = providersStore();
  const commonGroupsState = commonGroupsStore();
  const groupsState = userGroupsStore();

  // All values
  const providersData = useMemo(
    () => providersState.value,
    [providersState.value],
  );
  const commonGroupsData = useMemo(
    () => commonGroupsState.value,
    [commonGroupsState.value],
  );
  const groupsData = useMemo(() => groupsState.value, [groupsState.value]);

  const providersQueryState = usePaginatedQuery({
    queryKey: [queryKeys.PROVIDERS],
    queryFn: (page, limit) =>
      getProviders({ query: { page: page + 1, limit: limit } }),
    limit: 10,
  });
  const commonGroupsQueryState = usePaginatedQuery({
    queryKey: [queryKeys.COMMONGROUPS],
    limit: 200,
    queryFn: (page, limit) =>
      getCommonGroups({ query: { page: page + 1, limit: limit } }),
  });
  const userGroupsQueryState = usePaginatedQuery({
    queryKey: [queryKeys.GROUPS],
    limit: 100,
    queryFn: (page, limit) =>
      delayPromise(getGroups({ query: { page: page + 1, limit: limit } }), 1),
  });

  useEffect(() => {
    if (
      !providersQueryState.isPending &&
      providersQueryState.data?.data?.data?.results?.length
    ) {
      if (providersQueryState.data?.data?.data?.metrics?.next) {
        const timer = setTimeout(() => {
          providersQueryState.setPage((prev) => prev + 1);
        }, 500);
        return () => {
          timer && clearTimeout(timer);
        };
      }
      const updated = unifier(
        sortByDateField(
          [
            ...providersState.value,
            ...providersQueryState.data?.data?.data?.results
              .map(
                (dt) =>
                  datifyObjectValues(dt, [
                    "createdAt",
                    "updatedAt",
                  ]) as DatifiedProvider,
              )
              .filter((dt) => !!dt.enabled),
          ],
          "updatedAt",
          true,
        ),
        "id",
      );
      providersState.setter(updated);
    }
  }, [providersQueryState.isPending]);

  useEffect(() => {
    if (
      !commonGroupsQueryState.isPending &&
      commonGroupsQueryState.data?.data?.data?.results?.length
    ) {
      if (commonGroupsQueryState.data?.data?.data?.metrics?.next) {
        const timer = setTimeout(() => {
          commonGroupsQueryState.setPage((prev) => prev + 1);
        }, 500);
        return () => {
          timer && clearTimeout(timer);
        };
      }
      commonGroupsState.setter(
        unifier(
          sortByDateField(
            [
              ...commonGroupsState.value,
              ...commonGroupsQueryState.data?.data?.data?.results.map(
                (dt) =>
                  datifyObjectValues(dt, [
                    "createdAt",
                    "updatedAt",
                  ]) as DatifiedGroup,
              ),
            ].filter(
              (gr) =>
                gr.provider &&
                providersState.value?.find(
                  (prv) => prv.aliasId === gr.provider && !!prv.enabled,
                ),
            ),
            "updatedAt",
            true,
          ),
          "id",
        ),
      );
    }
  }, [commonGroupsQueryState.isPending, providersState.value]);

  useEffect(() => {
    if (
      !userGroupsQueryState.isPending &&
      userGroupsQueryState.data?.data?.data?.results?.length
    ) {
      if (userGroupsQueryState.data?.data?.data?.metrics?.next) {
        const timer = setTimeout(() => {
          userGroupsQueryState.setPage((prev) => prev + 1);
        }, 500);
        return () => {
          timer && clearTimeout(timer);
        };
      }
      groupsState.setter(
        unifier(
          sortByDateField(
            [
              ...groupsState.value,
              ...userGroupsQueryState.data?.data?.data?.results.map(
                (dt) =>
                  datifyObjectValues(dt, [
                    "createdAt",
                    "updatedAt",
                  ]) as DatifiedUserGroup,
              ),
            ],
            "updatedAt",
            true,
          ),
          "id",
        ),
      );
    }
  }, [userGroupsQueryState.isPending]);

  return {
    providersQueryState: providersQueryState,
    commonGroupsQueryState,
    userGroupsQueryState,
    providersState,
    commonGroupsState,
    groupsState,
    providersData,
    commonGroupsData,
    groupsData,
  };
}
