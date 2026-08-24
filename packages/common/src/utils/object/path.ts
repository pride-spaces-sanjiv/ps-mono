import { ObjectDepthKeys } from "@/types/object.js";

export const hasPath = <
  O extends Record<string, any>,
  T extends ObjectDepthKeys<O>,
>(
  obj: O,
  path: T,
): boolean => {
  const keys = path.split(".");

  let current = obj;

  for (const key of keys) {
    if (!Object.prototype.hasOwnProperty.call(current, key)) {
      return false;
    }

    current = current[key];
  }

  return true;
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
