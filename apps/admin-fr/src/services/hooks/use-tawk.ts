import { act, useEffect, useMemo, useState } from "react";
import {
  TawkEvent,
  useTawkAction,
  useTawkEvent,
  TawkLiveChat,
} from "tawk-react";
import { useUser } from "./use-user";
import { generateTawkHash } from "../apis/admin/auth";

const safeCall = <
  R extends any | void,
  T extends ((...args: any) => R) | null | undefined,
  A extends T extends (...args: any) => R ? Parameters<T> : any[]
>(
  func: T,
  ...args: A
) => {
  try {
    if (typeof func === "function") {
      return func(...args);
    }
    throw new Error(`Not a function, got [${typeof func}]`);
  } catch (err) {
    console.error("Unsafe function :", err);
    return null;
  }
};

export const useTawk = () => {
  const { isTokenValid, userData } = useUser();
  const [hash, setHash] = useState("");

  const user = useMemo(() => {
    if (isTokenValid && userData?.name?.trim() && userData.email?.trim()) {
      return {
        email: userData.email,
        name: userData.name,
        hash: hash,
        userId: userData.id,
      } as Parameters<(typeof actions)["login"]>[0];
    }
    return null;
  }, [userData?.email, userData?.name, isTokenValid, userData?.phone, hash]);

  const actions = useTawkAction();
  const actionsLoaded = useMemo(
    () =>
      !!actions?.hideWidget &&
      !!actions?.showWidget &&
      !!actions?.setAttributes,
    [actions]
  );

  useTawkEvent(TawkEvent.onLoad, () => {
    console.log("Tawk widget hiding on load");
    // safeCall(actions?.hideWidget);
  });
  useTawkEvent(TawkEvent.onVisitorNameChanged, (name) => {
    console.log("Tawk Visitor as :", name);
  });

  useEffect(() => {
    console.log("Hook Tawk user", user);
    if (user) {
      safeCall(actions?.hideWidget);
      safeCall(actions?.setAttributes, user, (err) => {
        if (err) {
          return console.error("Failed tawk to login :", err);
        }
        console.log("tawk to login done");
        safeCall(actions?.showWidget);
      });
      // safeCall(actions?.login, user, (err) => {
      //   if (err) {
      //     return console.error("Failed tawk to login :", err);
      //   }
      //   console.log("tawk to login done");
      //   safeCall(actions?.showWidget);
      // });
    }
  }, [user, actionsLoaded]);

  useEffect(() => {
    generateTawkHash()
      .then((res) => {
        const data = res.data.data;
        if (res.status === 200 && data.hash) {
          console.log("Tawk Hash", data);
          setHash(data.hash.hex);
        }
      })
      .catch((err) => {
        console.error("Failed generating tawk hash :", err);
      });
  }, [userData?.email]);

  return { actions: actions };
};
