import { type Datified } from "@/utils/object/datify";

export type GeneralData = {
  id: string;
  createdAt: string;
  updatedAt: string;
};
export type DatifiedGeneralData = Datified<
  GeneralData,
  ["createdAt", "updatedAt"]
>;
