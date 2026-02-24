type DatifyFields<T extends Record<string, any>, F extends keyof T> = Omit<
  T,
  F
> & { [K in F]?: Date };
export const datifyFieldsInObject = <
  T extends Record<string, any>,
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
