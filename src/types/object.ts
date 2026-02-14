export type OnlyTypedFields<
  O extends Record<string, any>,
  T extends any
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
