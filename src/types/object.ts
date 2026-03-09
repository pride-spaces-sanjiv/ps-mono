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
type Prev = [never, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, ...0[]];

export type ObjectDepthKeys<T, D extends number = 10> = [D] extends [never]
  ? never
  : T extends object
    ? {
        [K in keyof T]-?: K extends string | number
          ? T[K] extends Record<string | number, any>
            ? `${K}.${ObjectDepthKeys<T[K], Prev[D]>}`
            : `${K}`
          : never;
      }[keyof T]
    : never;
