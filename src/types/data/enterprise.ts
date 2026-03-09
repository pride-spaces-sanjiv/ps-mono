import type { Datified } from "@/utils/object/datify";
import type { OperatorSchema } from "@/utils/schemas/operator";
import type { GeneralData } from "./general";

export type Enterprise = GeneralData &
  Omit<Partial<OperatorSchema>, "password">;

export type DatifiedEnterprise = Datified<
  Enterprise,
  ["createdAt", "updatedAt"]
>;
