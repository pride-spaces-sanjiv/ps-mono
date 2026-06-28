import { create } from "zustand";
import * as secureStorage from "@secure-storage/common";
import type { DatifiedAdmin, DatifiedUser } from "@/types/data/user";
import type { ZustandStore } from "@/types/zustand/store";
import { datifyObjectValues } from "@/utils/object/datify";
import type { DatifiedOperator } from "@/types/data/operators";
import { type AdminLevel } from "@/utils/data/admin";
import type { UserType } from "@/utils/data/userTypes";

export type TokenData = { token: string; expiry: Date; refreshToken: string };
export const tokenStore = create<ZustandStore<TokenData | null>>((set) => ({
  value:
    datifyObjectValues(
      secureStorage.localStorage.getItem<TokenData | null>(
        "__aT__",
      ) as TokenData,
      ["expiry"],
    ) || null,
  setter: (val) =>
    set((state) => ({
      value: typeof val === "function" ? val(state.value) : val,
    })),
}));

type UserStoreExtras = {
  fetchCount: number;
  increaseFetchCount: (count?: number) => void;
  level: UserType | null;
  setLevel: (level: UserType | null) => void;
};
export const userStore = create<
  ZustandStore<
    Partial<DatifiedAdmin | DatifiedOperator> | null,
    UserStoreExtras
  >
>((set) => ({
  value: null,
  level: null,
  setLevel: (level: UserStoreExtras["level"] = null) => set({ level }),
  setter: (val) =>
    set((state) => ({
      value: typeof val === "function" ? val(state.value) : val,
    })),
  setterAndPersist: (update: DatifiedAdmin | DatifiedOperator | null) => {
    secureStorage.localStorage.setItem("__uD__", update);
    set({ value: update });
  },
  fetchCount: 0,
  increaseFetchCount: (count = 1) =>
    set((prev) => ({ fetchCount: prev.fetchCount + count })),
}));
