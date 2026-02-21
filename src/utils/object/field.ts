export const deleteFields = <T extends { [k: string]: any }, K extends keyof T>(
  data: T,
  fields: [...K[]] = []
  // @ts-ignore
): Omit<T, K> | (T extends undefined | null ? T : never) => {
  if (!data) {
    return data;
  }
  const copy = { ...data };
  for (let i = 0; i < fields.length; i++) {
    const key = fields[i];
    if (Object.hasOwn(copy, key)) {
      delete copy[key];
    }
  }
  return copy;
};

export const pickFields = <T extends { [k: string]: any }, K extends keyof T>(
  data: T,
  fields: [...K[]] = []
  // @ts-ignore
): Pick<T, K> | (T extends undefined | null ? T : never) => {
  if (!data) {
    return data;
  }
  const copy = {} as Pick<T, K>;
  for (let i = 0; i < fields.length; i++) {
    const key = fields[i];
    if (Object.hasOwn(data, key)) {
      copy[key] = data[key];
    }
  }
  return copy;
};
