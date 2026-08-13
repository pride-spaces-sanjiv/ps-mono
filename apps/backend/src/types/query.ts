import { ParsedQs } from "qs";
import { NullableObject } from "./partial.js";

export type RequestQuery<T extends { [k: string]: any } = {}> = NullableObject<
  T & {
    [k: string]: ParsedQs[string];
  }
>;
export type ResponseLocals<T extends { [k: string]: any } = {}> =
  NullableObject<
    T & {
      [k: string]: any;
    }
  >;
