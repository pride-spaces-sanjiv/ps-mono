export type OnlyTypedFields<
  O extends Record<string, any>,
  T extends any,
> = Pick<
  O,
  {
    [K in keyof O]: O[K] extends T ? K : never;
  }[keyof O]
>;

export type ObjectFieldsMapsToObject<O extends Record<string, any>> = {
  [K in keyof O]: O[K] extends Map<infer A, infer B> | null | undefined
    ? A extends string | number | symbol
      ?
          | Record<A & string, B>
          | (O[K] extends null
              ? null
              : O[K] extends undefined
                ? undefined
                : never)
      : never
    : O[K];
};

// Helper to limit recursion depth (prevents "Infinite Depth" errors)
type Prev = [never, 0, 1, 2, 3, 4, 5, ...0[]];

export type ObjectDepthKeys<T, D extends number = 5> = [D] extends [never]
  ? never
  : T extends object
    ? {
        [K in keyof T & (string | number)]: T[K] extends readonly (infer U)[]
          ? `${K}` | `${K}.${ObjectDepthKeys<U, Prev[D]>}`
          : T[K] extends object | null | undefined
            ? `${K}` | `${K}.${ObjectDepthKeys<NonNullable<T[K]>, Prev[D]>}`
            : `${K}`;
      }[keyof T & (string | number)]
    : never;
