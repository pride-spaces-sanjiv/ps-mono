import type { Datified } from "@/utils/object/datify";
import type { GeneralData } from "./general";
import type { DeepInfer } from "./infer";

export type State = DeepInfer<
  GeneralData &
    Partial<{
      name: string;
      code: string;
    }>
>;
export type City = DeepInfer<
  GeneralData &
    Partial<{
      rId: number;
      name: string;
      state: string;
    }>
>;
export type DatifiedState = DeepInfer<
  Datified<State, ["createdAt", "updatedAt"]>
>;
export type DatifiedCity = DeepInfer<
  Datified<City, ["createdAt", "updatedAt"]>
>;
