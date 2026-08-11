import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { tokenStore, userStore } from "@/services/store/user";
import { getSelfData as getAdminData } from "@/services/apis/admin/auth";
import { getSelfData as getOperatorData } from "@/services/apis/operator/auth";
import { getSelfData as getEnterpriseData } from "@/services/apis/self/enterprise";
import { datifyObjectValues } from "@/utils/object/datify";
import { validateNumber } from "@/utils/number";
// import { validateNumber } from "@/utils/number";
import { delayPromise } from "@/utils/promise";
import { queryKeys } from "@/utils/query-keys";
import type { NonAdminUserType } from "@/utils/data/userTypes";
import { getTokenInfo } from "../apis/general/token";
import { adminLevels, type AdminLevel } from "@/utils/data/admin";

type Props<T extends NonAdminUserType | "admin"> = {
  promiseDelay: number;
  userType: T;
};
export function useUser<T extends NonAdminUserType | "admin" = "admin">({
  promiseDelay = 1,
  userType = "admin" as T,
}: Partial<Props<T>> = {}) {
  const userStoreState = userStore((state) => state);
  const tokenStoreState = tokenStore((state) => state);
  const userData = userStore((state) => state.value);
  const fetchCount = userStore((state) => state.fetchCount);
  const tokeInfoFetches = userStore((state) => state.tokeInfoFetches);
  const userLevel = useMemo(() => userStoreState.level, [userStoreState]);
  const setUserLevel = useMemo(() => userStoreState.setLevel, [userStoreState]);

  const isTokenValid = useMemo(
    () =>
      !!tokenStoreState.value?.expiry &&
      tokenStoreState.value.expiry.getTime() > Date.now() + 10000,
    [tokenStoreState.value],
  );

  // Get user level from token
  const { data: tokenInfoRes } = useQuery({
    queryKey: ["token-info", tokenStoreState.value?.expiry],
    queryFn: () => {
      return isTokenValid
        ? getTokenInfo().finally(() => userStoreState.increaseTokeInfoFetches())
        : null;
    },
    retry: 3,
  });
  const tokenUserLevel = useMemo(
    () => tokenInfoRes?.data?.data?.level,
    [tokenInfoRes],
  );
  console.log("Token info :", tokenInfoRes?.data?.data);

  const queryState = useQuery({
    queryKey: [
      queryKeys.USERDATA,
      tokenUserLevel,
      tokenStoreState.value?.expiry,
    ],
    queryFn: () => {
      return tokenStoreState && tokenUserLevel
        ? delayPromise(
            adminLevels.includes(tokenUserLevel as AdminLevel)
              ? getAdminData()
              : getOperatorData(),
            promiseDelay,
          ).then((res) => {
            userStoreState.increaseFetchCount();
            return res;
          })
        : null;
    },
    retry: 3,
  });

  const { data: res } = queryState;

  useEffect(() => {
    if (res?.data?.data?.id) {
      const modified = datifyObjectValues(res.data.data, [
        "createdAt",
        "updatedAt",
      ]);
      userStoreState.setter({
        ...userStoreState.value,
        ...modified,
      } as typeof modified);
      return;
    }
  }, [res?.data?.data?.id]);

  // useEffect(() => {
  //   // @ts-ignore
  //   userType === "admin" &&
  //     // @ts-ignore
  //     setUserLevel(userData?.level || userStoreState.level);
  // }, [userData, userType]);

  useEffect(() => {
    tokenUserLevel && setUserLevel(tokenUserLevel);
  }, [tokenUserLevel]);

  useEffect(() => {}, [queryState.fetchStatus]);

  return {
    userStore,
    userStoreState,
    tokenStore,
    tokenStoreState,
    userData,
    userLevel,
    setUserLevel,
    isTokenValid,
    fetchCount,
    tokeInfoFetches,
    ...queryState,
  };
}
