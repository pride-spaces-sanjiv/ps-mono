import { Document, FlattenMaps } from "mongoose";
import { ObjectFieldsMapsToObject } from "@/types/object.js";

/**
 * @description Returns formatted data with deleted `_id` and `__v
 * @description Replaces string `id` inplace of `_id`
 * @description If fails returns null
 */
export const convertDataToJSON = <
  T extends any,
  V extends boolean = false,
  I extends boolean = false,
>(
  doc: Document<unknown, any, T> | FlattenMaps<T>,
  options?: Partial<{
    showVersionKey: V;
    passId: I;
    alreadyConverted: boolean;
    deleteFields: (keyof T)[];
  }>,
  jsonOptions?: Parameters<Document<unknown, any, T>["toJSON"]>[0],
):
  | (Omit<
      T extends Record<string, any> ? ObjectFieldsMapsToObject<T> : T,
      "_id" | "__v"
    > & {
      id: string;
    } & (I extends true ? { _id: string } : {}) &
      (V extends true ? { __v: number } : {}))
  | null => {
  try {
    let data = doc;
    if (!options?.alreadyConverted) {
      // @ts-ignore
      data = (doc as Document<unknown, any, T>).toJSON({
        versionKey: !!options?.showVersionKey,
        ...jsonOptions,
      }) as T & { _id?: string };
    }
    // @ts-ignore
    data.id = data._id;
    if (!options?.passId) {
      // @ts-ignore
      delete data._id;
    }
    if (Array.isArray(options?.deleteFields)) {
      for (let i = 0; i < options.deleteFields.length; i++) {
        const field = options.deleteFields[i];
        // @ts-ignore
        delete data[field];
      }
    }
    // @ts-ignore
    return data;
  } catch (err) {
    return null;
  }
};
