import { ObjectDepthKeys } from "@/types/object.js";
import { isPlainObject } from "./plain.js";

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

export const findPathsMatchingValues = <
  O extends Record<string, any>,
  V extends any,
>(
  obj: O,
  values: [...V[]],
): ObjectDepthKeys<O>[] => {
  try {
    const paths: ObjectDepthKeys<O>[] = [];
    const valueSet = new Set(values);

    const walk = (current: any, path: string) => {
      if (
        typeof current !== "object" ||
        (typeof current === "object" && current === null)
      ) {
        if (valueSet.has(current as V)) {
          paths.push(path as ObjectDepthKeys<O>);
        }
        return;
      }

      if (Array.isArray(current)) {
        for (let i = 0; i < current.length; i++) {
          const nextPath = path ? `${path}.${i}` : String(i);
          walk(current[i], nextPath);
        }

        return;
      }

      if (!isPlainObject(current)) {
        return;
      }

      for (const key of Object.keys(current)) {
        const nextPath = path ? `${path}.${key}` : key;
        walk((current as Record<string, any>)[key], nextPath);
      }
    };

    walk(obj, "");

    return paths;
  } catch (err) {
    return [];
  }
};
