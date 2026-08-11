import { Model } from "mongoose";
import { ModelToRaw } from "@/types/mongoose/document.js";

export const allGeneralFieldsEnabled: Record<
  "_id" | "createdAt" | "updatedAt",
  1
> = { _id: 1, createdAt: 1, updatedAt: 1 };

type IDFields = "id" | "_id";
type TimestampFields = "createdAt" | "updatedAt";
export const getFieldsOfModel = <
  M extends Model<any>,
  TS extends boolean = true,
>(
  model: M,
  options?: Partial<{ timestamps: TS }>,
): (TS extends true
  ? keyof Omit<ModelToRaw<M>, IDFields>
  : keyof Omit<ModelToRaw<M>, TimestampFields | IDFields>)[] => {
  const fields = Object.keys(model.schema.paths);
  if (options?.timestamps === false) {
    // @ts-ignore
    return fields.filter((k) => k !== "createdAt" && k !== "updatedAt");
  }
  // @ts-ignore
  return fields;
};

export const appendGeneralFields = <T extends string>(fields: [...T[]]) => {
  const allFields = Object.keys(allGeneralFieldsEnabled).concat(fields) as (
    | keyof typeof allGeneralFieldsEnabled
    | T
  )[];
  return allFields;
};
