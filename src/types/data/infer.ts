export type DeepInfer<T extends any> =
  T extends Record<string, any>
    ? {
        [K in keyof T]: DeepInfer<T[K]>;
      }
    : T extends any[]
      ? DeepInfer<T[number]>[]
      : T;
