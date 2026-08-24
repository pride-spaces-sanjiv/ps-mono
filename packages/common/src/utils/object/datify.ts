import { ObjectDepthKeys } from "@/types/object.js";
import { getPathValue, hasPath, setPathValue } from "./path.js";

type DatifyFields<T extends Record<string, any>, F extends keyof T> = Omit<
  T,
  F
> & { [K in F]?: Date };
export const datifyFieldsInObject = <
  T extends { [k: string]: any },
  F extends keyof T,
>(
  obj: T,
  fields: [...F[]],
): DatifyFields<T, F> => {
  for (const field of fields) {
    if (
      !Object.hasOwn(obj, field) ||
      !(typeof obj[field] === "string" || typeof obj[field] === "number")
    ) {
      continue;
    }
    // @ts-ignore
    obj[field] = new Date(obj[field]);
  }
  return obj;
};

export type Datified<
  T extends { [k: string]: any },
  K extends (keyof T)[],
> = Omit<T, K[number]> & { [P in K[number]]: Date };

/**
 * @description Change date `string` or `number` fields to `Date` type
 * @description Use the `fields` parameter to pass fields to change to `Date` type if valid
 * @description On failure returns null
 */
export const datifyObjectValues = <
  T extends { [k: string]: any },
  K extends ObjectDepthKeys<T>[],
>(
  data: T,
  fields: [...K],
) => {
  try {
    const modified = { ...data };
    for (let i = 0; i < fields.length; i++) {
      const field = fields[i];
      if (!hasPath(data, field)) {
        continue;
      }
      const value = getPathValue(data, field);
      console.log("Modifying field in datify :", field, value);
      if (typeof value === "string") {
        setPathValue(modified, field, new Date(value));
        // // @ts-ignore
        // modified[field] = new Date(value);
      }
      if (typeof value === "number") {
        setPathValue(modified, field, new Date(value));
        // // @ts-ignore
        // modified[field] = new Date(value);
      }
    }
    return modified as Datified<T, K>;
  } catch (err) {
    return null;
  }
};
