import { Document, HydratedDocument, Model, ObjectId, Schema } from "mongoose";
import { OnlyTypedFields } from "../object.js";

export type SchemaToRaw<T extends Schema<any>, I extends boolean = true> =
  T extends Schema<any, any, any, any, any, any, any, infer U> ? U : never;

export type ModelToRaw<T extends Model<any>, I extends boolean = true> =
  T extends Model<infer U>
    ? U &
        (I extends true
          ? Pick<InstanceType<typeof Document<ObjectId>>, "id" | "_id">
          : {})
    : never;

export type ModelToDocument<T extends Model<any>, I extends boolean = true> =
  T extends Model<infer U> ? HydratedDocument<U> : never;

export type ModelDocumentKeys<
  T extends Model<any>,
  ID extends boolean = false,
  DT extends boolean = false,
  I extends boolean = true,
> = ID extends true
  ? keyof ModelToRaw<T, I>
  : DT extends true
    ? Exclude<keyof ModelToRaw<T, I>, "_id">
    : Exclude<keyof ModelToRaw<T, I>, "_id" | "createdAt" | "updatedAt">;

export type ModelDateFields<M extends Model<any>> =
  M extends Model<infer U>
    ? U extends Record<string, any>
      ? OnlyTypedFields<Required<U>, Date>
      : never
    : never;
