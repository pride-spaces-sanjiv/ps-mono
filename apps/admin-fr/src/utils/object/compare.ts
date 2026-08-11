type Options<T extends Record<string, any>> = {
  excludeFields: [...(keyof T)[]];
};

const primaryTypes = ["string", "number", "boolean"];

export function getPaths<T extends any>(obj: T, prefix = "") {
  if (typeof obj !== "object" || !obj) {
    return prefix ? [prefix] : [];
  }

  const paths: string[] = [];

  if (Array.isArray(obj)) {
    obj.forEach((item, index) => {
      const path = prefix ? `${prefix}.${index}` : `${index}`;
      paths.push(path);
      paths.push(...getPaths(item, path));
    });
  } else {
    Object.entries(obj).forEach(([key, value]) => {
      const path = prefix ? `${prefix}.${key}` : key;
      paths.push(path);
      paths.push(...getPaths(value, path));
    });
  }

  return paths;
}

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
    const o1Keys = getPaths((obj1 || {}) as T) as Extract<keyof T, string>[];
    const o2Keys = getPaths(obj2 as NT) as Extract<keyof NT, string>[];

    if (!obj1 || !obj2) {
      throw new Error("Invalid objects to compare");
    }

    const pushData = (
      key: string,
      options: Partial<{
        newD: boolean;
        allD: boolean;
        changedD: boolean;
      }> = {},
    ) => {
      const { newD = false, allD = true, changedD = false } = options;
      const baseKey = key.split(".")[0] as any;
      if (newD) {
        // @ts-ignore
        result.newData[baseKey] = obj2[key];
      }
      if (changedD) {
        // @ts-ignore
        result.changedData[baseKey] = obj2[key];
      }
      if (allD) {
        // @ts-ignore
        result.allData[baseKey] = obj2[key];
      }
    };

    for (const key of o2Keys) {
      if (excludeFields.includes(key)) {
        continue;
      }
      // Only new
      if (!o1Keys.includes(key as any)) {
        result.newFields.push(key);
        result.allFields.push(key);
        pushData(key, { newD: true, allD: true });
        continue;
      }
      // Only updated
      const oldVal = obj1[key];
      const newVal = obj2[key];
      if (primaryTypes.includes(typeof oldVal) && (oldVal as any) !== newVal) {
        result.changedFields.push(key);
        result.allFields.push(key);
        pushData(key, { newD: true, changedD: true });
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
