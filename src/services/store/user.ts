import { create } from "zustand";
import * as secureStorage from "@secure-storage/common";
import type { DatifiedUser } from "@/types/data/user";
import type { ZustandStore } from "@/types/zustand/store";
import { datifyObjectValues } from "@/utils/object/datify";

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

export const userStore = create<
  ZustandStore<
    DatifiedUser | null,
    { fetchCount: number; increaseFetchCount: (count?: number) => void }
  >
>((set) => ({
  value: null,
  setter: (update) => set({ value: update }),
  setterAndPersist: (update: DatifiedUser | null) => {
    secureStorage.localStorage.setItem("__uD__", update);
    set({ value: update });
  },
  fetchCount: 0,
  increaseFetchCount: (count = 1) =>
    set((prev) => ({ fetchCount: prev.fetchCount + count })),
}));
