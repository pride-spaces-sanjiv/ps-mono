import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { amenityStore } from "../store/amenity";
import { getAmenities } from "@/services/apis/admin/amenity";
import { datifyObjectValues } from "@/utils/object/datify";
// import { validateNumber } from "@/utils/number";
import { delayPromise } from "@/utils/promise";
import { queryKeys } from "@/utils/query-keys";
import type { DatifiedAmenity } from "@/types/data/amenity";

type Props = {
  promiseDelay: number;
};
export function useAmenities({ promiseDelay = 1 }: Partial<Props> = {}) {
  const amenitiesStoreState = amenityStore((state) => state);
  const amenitiesData = amenityStore((state) => state.value);
  const setAmenitiesData = amenityStore((state) => state.setter);
  const fetchCount = amenityStore((state) => state.fetchCount);
  const increaseFetchCount = amenityStore((state) => state.increaseFetchCount);

  const queryState = useQuery({
    queryKey: [queryKeys.AMENITIES],
    queryFn: () => {
      amenitiesStoreState.increaseFetchCount();
      return delayPromise(
        getAmenities({ query: { limit: 100 } }),
        promiseDelay,
      );
    },
    retry: 3,
  });

  const { data: res } = queryState;

  useEffect(() => {
    if (res?.data?.data.results?.length) {
      const modifieds = res?.data?.data.results?.map(
        (dt) =>
          datifyObjectValues(dt, ["createdAt", "updatedAt"]) as DatifiedAmenity,
      );
      amenitiesStoreState.setter(modifieds);
      return;
    }
  }, [res?.data?.data?.results]);

  useEffect(() => {}, [queryState.fetchStatus]);

  return {
    amenitiesStoreState,
    amenitiesData,
    setAmenitiesData,
    fetchCount,
    increaseFetchCount,
    ...queryState,
  };
}
