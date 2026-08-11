import { create } from "zustand";
import type { DatifiedAmenity } from "@/types/data/amenity";
import type { ZustandStore } from "@/types/zustand/store";
import { type AdminLevel } from "@/utils/data/admin";

type Extras = {
  fetchCount: number;
  increaseFetchCount: (count?: number) => void;
  // level: AdminLevel | "enterprise" | null;
  // setLevel: (level: AdminLevel | "enterprise" | null) => void;
};

export const amenityStore = create<ZustandStore<DatifiedAmenity[], Extras>>(
  (set) => ({
    value: [],
    setter: (val) =>
      set((state) => ({
        value: typeof val === "function" ? val(state.value) : val,
      })),
    // level: null,
    // setLevel: (level: UserStoreExtras["level"] = null) => set({ level }),
    fetchCount: 0,
    increaseFetchCount: (count = 1) =>
      set((prev) => ({ fetchCount: prev.fetchCount + count })),
  }),
);
