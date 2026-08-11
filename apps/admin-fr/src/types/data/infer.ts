export type DeepInfer<T extends any> = T extends
  | Date
  | RegExp
  | Function
  | ((...args: any[]) => any)
  ? T
  : T extends Exclude<Record<string, any>, any[]>
    ? {
        [K in keyof T]: DeepInfer<T[K]>;
      }
    : T extends any[]
      ? DeepInfer<T[number]>[]
      : T;
