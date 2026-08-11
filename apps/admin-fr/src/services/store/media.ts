import { create, createStore } from "zustand";
import { type ZustandStore } from "@/types/zustand/store";
import type {
  DatifiedProvider,
  DatifiedGroup,
  DatifiedUserGroup,
} from "@/types/data/media";

export const providersStore = create<ZustandStore<DatifiedProvider[]>>(
  (set) => ({
    value: [],
    setter: (val) =>
      set((state) => ({
        value: typeof val === "function" ? val(state.value) : val,
      })),
  }),
);

export const commonGroupsStore = create<ZustandStore<DatifiedGroup[]>>(
  (set) => ({
    value: [],
    setter: (val) =>
      set((state) => ({
        value: typeof val === "function" ? val(state.value) : val,
      })),
  }),
);
export const userGroupsStore = create<ZustandStore<DatifiedUserGroup[]>>(
  (set) => ({
    value: [],
    setter: (val) =>
      set((state) => ({
        value: typeof val === "function" ? val(state.value) : val,
      })),
  }),
);
