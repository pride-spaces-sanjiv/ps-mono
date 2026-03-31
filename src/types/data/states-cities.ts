import type { Datified } from "@/utils/object/datify";
import type { GeneralData } from "./general";

export type State = GeneralData &
  Partial<{
    name: string;
    code: string;
  }>;
export type City = GeneralData &
  Partial<{
    rId: number;
    name: string;
    state: string;
  }>;
export type DatifiedState = Datified<State, ["createdAt", "updatedAt"]>;
export type DatifiedCity = Datified<City, ["createdAt", "updatedAt"]>;
