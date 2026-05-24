type Options<T extends Record<string, any>> = {
  excludeFields: [...(keyof T)[]];
};

const primaryTypes = ["string", "number", "boolean"];

export const compareFields = <
  T extends Record<string, any> = Record<string, any>,
  NT extends Record<string, any> = Record<string, any>,
>(
  obj1: T,
  obj2: NT,
  { excludeFields = [] }: Partial<Options<T>> = {},
) => {
  const result = {
    changedFields: [] as (keyof T)[],
    changedData: {} as Partial<T>,
    newFields: [] as (keyof NT)[],
    newData: {} as NT,
  };
  try {
    const o1Keys = Object.keys(obj1);
    const o2Keys = Object.keys(obj2);
    for (const key in obj2) {
      if (excludeFields.includes(key)) {
        continue;
      }
      // Only new
      if (!o1Keys.includes(key)) {
        result.newFields.push(key);
        result.newData[key] = obj2[key];
        continue;
      }
      // Only updated
      const oldVal = obj1[key];
      const newVal = obj2[key];
      if (primaryTypes.includes(typeof oldVal) || (oldVal as any) !== newVal) {
        result.changedFields.push(key);
        result.changedData[key] = newVal;
      }
    }
  } catch (err) {}
  return result;
};
