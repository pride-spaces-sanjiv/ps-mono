import React, { useEffect, useMemo } from "react";
import { statesStore, citiesStore } from "@/services/store/states-cities";
import { usePaginatedQuery } from "@/services/hooks/usePaginatedQuery";
import { getStates, getCities } from "@/services/apis/general/states-cities";
import { queryKeys } from "@/utils/query-keys";
import { datifyObjectValues, type Datified } from "@/utils/object/datify";
import type { DatifiedCity, DatifiedState } from "@/types/data/states-cities";

const min10StaleTime = 1000 * 60 * 10; // 10 minutes

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

const sortByField = <T extends { [k: string]: any }, K extends keyof T>(
  arr: T[],
  field: K,
  fieldType: "string" | "number" | "date" = "string",
  reverse = false,
) => {
  const newArr = arr;
  newArr.sort((a, b) =>
    fieldType === "string"
      ? (a[field] as string).localeCompare(b[field] as string)
      : fieldType === "date"
        ? (a[field] as Date).getTime() - (b[field] as Date).getTime()
        : (a[field] as number) - (b[field] as number),
  );
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

export function useStatesCities() {
  const statesStoreState = statesStore((state) => state);
  const citiesStoreState = citiesStore((state) => state);

  // All values
  const statesData = useMemo(
    () => statesStoreState.value,
    [statesStoreState.value],
  );
  const citiesData = useMemo(
    () => citiesStoreState.value,
    [citiesStoreState.value],
  );

  /**
   * Contains list of cities inside a state data
   * @example {"MH": {name: "Maharashtra", cities: [{rId: 92389, name: "Mumbai", state: "MH"}]}}
   */
  const groupedCities = useMemo(() => {
    return Object.fromEntries(
      statesData
        .filter((dt) => !!dt.code)
        .map((state) => {
          return [
            state.code as string,
            {
              id: state.id,
              name: state.name,
              cities: sortByField(
                citiesData.filter((city) => city.state === state.code),
                "name",
                "string",
              ),
            },
          ];
        }),
    );
  }, [citiesData, statesData]);

  const statesQueryState = usePaginatedQuery({
    queryKey: [queryKeys.STATES],
    queryFn: (page, limit) =>
      getStates({ query: { page: page + 1, limit: limit } }),
    limit: 50,
    staleTime: min10StaleTime,
  });
  const citiesQueryState = usePaginatedQuery({
    queryKey: [queryKeys.CITIES],
    limit: 1000,
    queryFn: (page, limit) =>
      getCities({ query: { page: page + 1, limit: limit } }),
    staleTime: min10StaleTime,
  });

  useEffect(() => {
    if (
      !statesQueryState.isFetching &&
      statesQueryState.data?.data?.data?.results?.length
    ) {
      if (statesQueryState.data?.data?.data?.metrics?.next) {
        const timer = setTimeout(() => {
          statesQueryState.setPage((prev) => prev + 1);
        }, 500);
        return () => {
          timer && clearTimeout(timer);
        };
      }
      const updated = unifier(
        sortByField(
          [
            ...statesStoreState.value,
            ...statesQueryState.data?.data?.data?.results
              .map(
                (dt) =>
                  datifyObjectValues(dt, [
                    "createdAt",
                    "updatedAt",
                  ]) as DatifiedState,
              )
              .filter((dt) => !!dt.name),
          ],
          "name",
          "string",
        ),
        "code",
      );
      statesStoreState.setter(updated);
    }
  }, [statesQueryState.isFetching]);

  useEffect(() => {
    if (
      citiesQueryState.status !== "success" ||
      !citiesQueryState.data?.data?.data?.results?.length
    )
      return;

    const results = citiesQueryState.data?.data?.data?.results;
    citiesStoreState.setter((prev) => {
      const merged = [
        ...prev,
        ...results.map(
          (dt) =>
            datifyObjectValues(dt, ["createdAt", "updatedAt"]) as DatifiedCity,
        ),
      ];
      const sorted = sortByField(merged, "name", "string");
      const unified = unifier(sorted, "rId");
      return unified;
    });

    if (citiesQueryState.data?.data?.data?.metrics?.next) {
      const timer = setTimeout(() => {
        citiesQueryState.setPage((prev) => prev + 1);
      }, 500);
      return () => {
        timer && clearTimeout(timer);
      };
    }
  }, [citiesQueryState.status, citiesQueryState.data]);

  return {
    statesQueryState,
    citiesQueryState,
    statesStoreState,
    citiesStoreState,
    citiesData,
    statesData,
    statesStore,
    citiesStore,
    groupedCities,
  };
}
