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
