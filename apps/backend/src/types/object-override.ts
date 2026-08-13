export type OverrideObject<
  A extends { [k: string]: any },
  B extends Partial<{ [K in keyof A]: any }>
> = Omit<A, keyof B> & B;
