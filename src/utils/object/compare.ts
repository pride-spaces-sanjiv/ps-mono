type Options<T extends Record<string, any>> = {
  excludeFields: [...(keyof T)[]];
};

const primaryTypes = ["string", "number", "boolean"];

export const compareFields = <
  T extends Record<string, any> = Record<string, any>,
  NT extends Record<string, any> = Record<string, any>,
>(
  obj1: T | undefined | null,
  obj2: NT | undefined | null,
  { excludeFields = [] }: Partial<Options<T>> = {},
) => {
  const result = {
    changedFields: [] as (keyof T)[],
    changedData: {} as Partial<T>,
    newFields: [] as (keyof NT)[],
    newData: {} as Partial<NT>,
    allFields: [] as (keyof T | keyof NT)[],
    allData: {} as Partial<T | NT>,
  };
  try {
    const o1Keys = Object.keys(obj1 as T);
    const o2Keys = Object.keys(obj2 as NT);

    if (!obj1 || !obj2) {
      throw new Error("Invalid objects to compare");
    }

    for (const key in obj2) {
      if (excludeFields.includes(key)) {
        continue;
      }
      // Only new
      if (!o1Keys.includes(key)) {
        result.newFields.push(key);
        result.newData[key] = obj2[key];
        result.allFields.push(key);
        result.allData[key] = obj2[key];
        continue;
      }
      // Only updated
      const oldVal = obj1[key];
      const newVal = obj2[key];
      if (primaryTypes.includes(typeof oldVal) && (oldVal as any) !== newVal) {
        result.changedFields.push(key);
        result.changedData[key] = newVal;
        result.allFields.push(key);
        result.allData[key] = newVal;
        continue;
      }
      if (typeof oldVal === typeof newVal && typeof oldVal === "object") {
        // Array
        if (Array.isArray(oldVal) && Array.isArray(newVal)) {
          result.changedFields.push(key);
          result.allFields.push(key);
          // @ts-ignore
          result.changedData[key] = [...newVal];
          // @ts-ignore
          result.allData[key] = [...newVal];
          continue;
        }
        // Object
        if (oldVal && newVal) {
          result.changedFields.push(key);
          // @ts-ignore
          result.changedData[key] = { ...newVal };
          result.allFields.push(key);
          // @ts-ignore
          result.allData[key] = { ...newVal };
        }
      }
    }
  } catch (err) {}
  return result;
};
