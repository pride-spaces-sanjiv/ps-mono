export type ShortenKeys<S extends string> = S extends `${infer A} ${infer B}`
  ? `${Lowercase<A>}${Lowercase<ShortenKeys<B>>}`
  : Lowercase<S>;

export const shortenKeys = <T extends Record<string, any>, K extends keyof T>(
  object: T,
) => {
  // @ts-ignore
  const copyObj = {} as Record<ShortenKeys<K>, T[K]>;
  for (const key in object) {
    if (!Object.hasOwn(object, key)) continue;
    const shortenedKey = key
      .trim()
      .replace(/ +/g, "")
      .toLowerCase() as keyof typeof copyObj;
    // @ts-ignore
    copyObj[shortenedKey] = object[key];
  }
  return copyObj;
};
