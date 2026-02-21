export type Datified<
  T extends { [k: string]: any },
  K extends (keyof T)[]
> = Omit<T, K[number]> & { [P in K[number]]: Date };

/**
 * @description Change date `string` or `number` fields to `Date` type
 * @description Use the `fields` parameter to pass fields to change to `Date` type if valid
 * @description On failure returns null
 */
export const datifyObjectValues = <
  T extends { [k: string]: any },
  K extends (keyof T)[]
>(
  data: T,
  fields: [...K]
) => {
  try {
    const modified = { ...data };
    for (let i = 0; i < fields.length; i++) {
      const field = fields[i];
      const value = data[field];
      if (typeof value === "string") {
        // @ts-ignore
        modified[field] = new Date(value);
      }
      if (typeof value === "number") {
        // @ts-ignore
        modified[field] = new Date(value);
      }
    }
    return modified as Datified<T, K>;
  } catch (err) {
    return null;
  }
};
