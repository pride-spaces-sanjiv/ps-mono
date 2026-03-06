import type { Datified } from "@/utils/object/datify";
import type { EnterpriseSchema } from "@/utils/schemas/enterprise";
import type { GeneralData } from "./general";

export type Enterprise = GeneralData &
  Omit<Partial<EnterpriseSchema>, "password">;

export type DatifiedEnterprise = Datified<
  Enterprise,
  ["createdAt", "updatedAt"]
>;
