import { create, createStore } from "zustand";
import { type ZustandStore } from "@/types/zustand/store";
import type { DatifiedCity, DatifiedState } from "@/types/data/states-cities";

export const statesStore = create<ZustandStore<DatifiedState[]>>((set) => ({
  value: [],
  setter: (val) => set({ value: val }),
}));
export const citiesStore = create<ZustandStore<DatifiedCity[]>>((set) => ({
  value: [],
  setter: (val) => set({ value: val }),
}));
