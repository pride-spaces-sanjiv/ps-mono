import { create } from "zustand";
import * as secureStorage from "@secure-storage/common";
import type { DatifiedAdmin, DatifiedUser } from "@/types/data/user";
import type { ZustandStore } from "@/types/zustand/store";
import { datifyObjectValues } from "@/utils/object/datify";
import type { DatifiedEnterprise } from "@/types/data/enterprise";
import { type AdminLevel } from "@/utils/data/admin";

export type TokenData = { token: string; expiry: Date; refreshToken: string };
export const tokenStore = create<ZustandStore<TokenData | null>>((set) => ({
  value:
    datifyObjectValues(
      secureStorage.localStorage.getItem<TokenData | null>(
        "__aT__",
      ) as TokenData,
      ["expiry"],
    ) || null,
  setter: (update) => set({ value: update }),
}));

type UserStoreExtras = {
  fetchCount: number;
  increaseFetchCount: (count?: number) => void;
  level: AdminLevel | "enterprise" | null;
  setLevel: (level: AdminLevel | "enterprise" | null) => void;
};
export const userStore = create<
  ZustandStore<
    Partial<DatifiedAdmin | DatifiedEnterprise> | null,
    UserStoreExtras
  >
>((set) => ({
  value: null,
  level: null,
  setLevel: (level: UserStoreExtras["level"] = null) => set({ level }),
  setter: (update) => set({ value: update }),
  setterAndPersist: (update: DatifiedAdmin | DatifiedEnterprise | null) => {
    secureStorage.localStorage.setItem("__uD__", update);
    set({ value: update });
  },
  fetchCount: 0,
  increaseFetchCount: (count = 1) =>
    set((prev) => ({ fetchCount: prev.fetchCount + count })),
}));
