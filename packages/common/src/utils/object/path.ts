import { ObjectDepthKeys } from "@/types/object.js";

export const hasPath = <
  O extends Record<string, any>,
  T extends ObjectDepthKeys<O>,
>(
  obj: O,
  path: T,
) => {
  try {
    const keys = path.split(".");

    let current = obj;

    for (const key of keys) {
      if (!Object.prototype.hasOwnProperty.call(current, key)) {
        return false;
      }

      current = current[key];
    }

    return true;
  } catch (err) {
    return false;
  }
};

export const getPathValue = <
  O extends Record<string, any>,
  T extends ObjectDepthKeys<O>,
>(
  obj: O,
  path: T,
) => {
  try {
    return path.split(".").reduce((value, key) => value?.[key], obj) as O[T];
  } catch (err) {
    return null;
  }
};

export const setPathValue = <
  O extends Record<string, any>,
  T extends ObjectDepthKeys<O>,
>(
  obj: O,
  path: T,
  value: any,
) => {
  try {
    const keys = path.split(".");
    const lastKey = keys.pop()!;

    const target = keys.reduce((current, key) => {
      return current[key];
    }, obj);

    // @ts-ignore
    target[lastKey] = value;
  } catch (err) {}
};
