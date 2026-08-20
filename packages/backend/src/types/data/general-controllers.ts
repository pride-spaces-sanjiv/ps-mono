import {
  ExclusionProjection,
  InclusionProjection,
  Model,
  RootFilterQuery,
  AnyObject,
  QueryOptions,
} from "mongoose";
import { ModelToDocument, ModelToRaw } from "../mongoose/document.js";
import { ResponseHandler } from "@/middlewares/request.js";
import { dumpUserAction } from "@/utils/data/dumpAction.js";

export namespace GeneralizedControllers {
  export type RawOfModel<T extends Model<any>> = ModelToRaw<T>;
  export type GetOptions<T extends Model<any>> = Partial<{
    preFilters: RootFilterQuery<T>;
    preProjections:
      | InclusionProjection<RawOfModel<T>>
      | ExclusionProjection<RawOfModel<T>>
      | AnyObject;
    preOptions: QueryOptions<RawOfModel<T>>;
    response: Partial<{
      error: Partial<typeof ResponseHandler.options.handleErrorOptions>;
      notFound: Partial<typeof ResponseHandler.options.handleNotFound>;
      unAuthorized: Partial<
        typeof ResponseHandler.options.handleUnauthorizedOptions
      >;
      success: Partial<typeof ResponseHandler.options.handleSuccess>;
    }>;
  }>;
  export type CreateOptions<
    T extends Model<any>,
    S extends Record<string, unknown>,
  > = Omit<GetOptions<T>, "preFilters"> &
    Partial<{
      preBody: Partial<S>;
      bodyHandle: <T = Partial<S>>(body: T) => T | Promise<T>;
      dumpDataHandle: <T = Partial<S>>(body: T) => T | Promise<T>;
      onlyDump: boolean;
      skipDump: boolean;
      dumpArgs: Partial<
        Exclude<Parameters<typeof dumpUserAction>[0], undefined | null>
      >;
    }>;
  export type UpdateOptions<
    T extends Model<any>,
    S extends Record<string, unknown>,
  > = CreateOptions<T, S> &
    Pick<GetOptions<T>, "preFilters"> &
    Partial<{
      proceedToProcess: (
        body: Partial<S>,
        doc: ModelToDocument<T>,
      ) => Promise<boolean | undefined | null> | boolean | null | undefined;
    }>;

  export type FieldsAndProjectorsOptions<T extends Model<any>> = {
    allowedProjectionFields: [...(keyof InclusionProjection<RawOfModel<T>>)[]];
  };
}
