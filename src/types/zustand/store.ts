export type ZustandStore<
  T extends any,
  O extends { [k: string]: any } = { [k: string]: any }
> = {
  value: T;
  setter: (val: T) => void;
} & O;
