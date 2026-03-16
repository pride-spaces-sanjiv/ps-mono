import type { Datified } from "@/utils/object/datify";
import type { OperatorSchema } from "@/utils/schemas/operators";
import type { GeneralData } from "./general";

export type Operator = GeneralData & Omit<Partial<OperatorSchema>, "password">;

export type DatifiedOperator = Datified<Operator, ["createdAt", "updatedAt"]>;
