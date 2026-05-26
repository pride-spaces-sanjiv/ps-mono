export const cleanObject = <T extends Record<string, any>, R = T>(
  obj: T,
  options: Partial<{ excludeByValues: any[] }> = {},
) => {
  const { excludeByValues = [] } = options;
  const cleaned: R = {} as any;
  for (const key in obj) {
    if (
      (typeof obj[key] === "object" && !obj[key]) ||
      obj[key] === undefined ||
      excludeByValues.includes(obj[key])
    ) {
      continue;
    }
    // @ts-ignore
    cleaned[key] = obj[key];
  }
  return cleaned;
};

export const deleteObjectFields = <
  T extends Record<string, any>,
  F extends keyof T,
>(
  obj: T,
  { excludeFields = [] }: Partial<{ excludeFields: [...F[]] }> = {},
) => {
  for (const field of excludeFields) {
    delete obj[field];
  }
  return obj as Omit<T, F>;
};
