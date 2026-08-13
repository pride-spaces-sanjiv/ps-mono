export type NullableValue<T extends any> = T | undefined | null;
export type NullableObject<T extends { [k: string]: any } = {}> = Partial<{
  [K in keyof T]: T[K] | null;
}>;

export type PartialNullableObject<T extends { [k: string]: any } = {}> =
  | NullableObject<T>
  | undefined
  | null;
export type RequirePartialObject<T extends PartialNullableObject<any>> =
  T extends NullableObject<infer U>
    ? { [K in keyof U]: Exclude<U[K], null | undefined> }
    : never;

export type RequireNullableValue<T extends NullableValue<any>> =
  T extends NullableValue<infer U> ? Exclude<U, null | undefined> : never;
