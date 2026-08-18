import { ResponseHandler } from "@/middlewares/request.js";
import {
  Migration,
  migrationFields,
} from "@pride-spaces/backend/database/models/migration.js";
import {
  cleanPaginatedData,
  paginatedResults,
} from "@pride-spaces/backend/utils/mongoose/pagination.js";
import {
  getFieldsandProjectors,
  getSearchFilters,
} from "@pride-spaces/backend/utils/mongoose/filters.js";
import { handleMongooseError } from "@pride-spaces/backend/utils/mongoose/error.js";
import { convertDataToJSON } from "@pride-spaces/backend/utils/mongoose/conversion.js";
import { cleanObject } from "@pride-spaces/common/utils/object/clean.js";
import type {
  ManagedRequest,
  ManagedResponse,
} from "@pride-spaces/backend/types/request.js";
import {
  RootFilterQuery,
  QueryOptions,
  AnyObject,
  InclusionProjection,
  ExclusionProjection,
  DefaultTimestampProps,
} from "mongoose";
import { ModelToRaw } from "@pride-spaces/backend/types/mongoose/document.js";
import { pipelineDBs } from "@pride-spaces/backend/utils/services/pipeline/db.js";

type RawOfModel = ModelToRaw<typeof Migration>;
export type MigrationSchema = Omit<
  RawOfModel,
  keyof DefaultTimestampProps | "id" | "_id"
>;

type GetOptions = Partial<{
  preFilters: RootFilterQuery<RawOfModel>;
  preProjections:
    | InclusionProjection<RawOfModel>
    | ExclusionProjection<RawOfModel>
    | AnyObject;
  preOptions: QueryOptions<RawOfModel>;
  response: Partial<{
    error: typeof ResponseHandler.options.handleErrorOptions;
    notFound: typeof ResponseHandler.options.handleNotFound;
    unAuthorized: typeof ResponseHandler.options.handleUnauthorizedOptions;
    success: typeof ResponseHandler.options.handleSuccess;
  }>;
}>;
type CreateOptions = Omit<GetOptions, "preFilters"> &
  Partial<{
    preBody: Partial<MigrationSchema>;
    bodyHandle: <T = Partial<MigrationSchema>>(body: T) => T | Promise<T>;
  }>;

export const getMigrations = async (
  req: ManagedRequest<any, { [k: string]: any }>,
  res: ManagedResponse,
  options: GetOptions = {},
) => {
  try {
    const {
      preFilters = {},
      preProjections = undefined,
      preOptions,
      response: responseOpts,
    } = options;

    const { fields, projectors } = getFieldsandProjectors(
      req,
      Migration,
      migrationFields,
    );
    const searchFilters = getSearchFilters<typeof Migration>(req, {
      fieldMaps: {
        FileId: "fileId",
      },
    });

    const { page, metrics, results, errored, err } = await paginatedResults(
      req,
      Migration,
      migrationFields,
      { limit: 10 },
      {
        projection: { ...preProjections, ...projectors },
        filter: cleanObject(
          { ...preFilters, ...searchFilters },
          { excludeByValues: [""] },
        ),
        options: preOptions,
      },
    );

    // On results error
    if (errored && err) {
      ResponseHandler.handleError(res, {
        ...responseOpts?.error,
        errorType: responseOpts?.error?.errorType || "get-migrations-error",
        message:
          responseOpts?.error?.message || "Failed to get migrations list",
      });
      return;
    }
    if (results.length === 0) {
      ResponseHandler.handleNotFound(res, {
        ...responseOpts?.notFound,
        errorType: responseOpts?.notFound?.errorType || "migrations-not-found",
        message: responseOpts?.notFound?.message || "No migrations found",
        data: { ...responseOpts?.notFound?.data, results, page, metrics },
      });
      return;
    }

    const data = cleanPaginatedData({ results, page, metrics, err, errored });
    ResponseHandler.handleSuccess(res, {
      ...responseOpts?.success,
      message: responseOpts?.success?.message || "Got migrations list",
      data: {
        ...responseOpts?.success?.data,
        ...data,
      },
    });
  } catch (err) {
    throw err;
  }
};

export const getMigration = async (
  req: ManagedRequest<any, { [k: string]: any }>,
  res: ManagedResponse,
  options: GetOptions = {},
) => {
  try {
    const {
      preFilters = {},
      preProjections = undefined,
      preOptions,
      response: responseOpts,
    } = options;

    const { fields, projectors } = getFieldsandProjectors(
      req,
      Migration,
      migrationFields,
    );

    const doc = await pipelineDBs.MIGRATION.getData({
      filter: { ...preFilters, _id: req.params.id },
      projection: { ...preProjections, ...projectors },
      options: preOptions,
    });
    if (!doc) {
      ResponseHandler.handleNotFound(res, {
        ...responseOpts?.notFound,
        errorType: responseOpts?.notFound?.errorType || "migration-not-found",
        message: responseOpts?.notFound?.message || "Migration not found",
      });
      return;
    }

    const data = convertDataToJSON(doc);
    ResponseHandler.handleSuccess(res, {
      ...responseOpts?.success,
      data: {
        ...responseOpts?.success?.data,
        ...data,
      },
    });
  } catch (err) {
    throw err;
    // ResponseHandler.handleError(res, {
    //   errorType: "get-space-error-failure",
    //   message: "Failed to get space details",
    // });
  }
};

export const createMigration = async (
  req: ManagedRequest<Partial<MigrationSchema>>,
  res: ManagedResponse,
  options: CreateOptions = {},
) => {
  try {
    const { preBody, bodyHandle, response: responseOpts } = options;

    // Body creation
    let body = { ...preBody, ...req.body } as MigrationSchema;
    if (bodyHandle) {
      body = await bodyHandle(body);
    }

    const doc = await pipelineDBs.MIGRATION.createData({
      // @ts-ignore
      data: body,
    });
    const data = convertDataToJSON(doc);
    ResponseHandler.handleSuccess(res, {
      ...responseOpts?.success,
      status: responseOpts?.success?.status || 201,
      message:
        responseOpts?.success?.message || "Created migration successfully",
      data: { ...responseOpts?.success?.data, ...data },
    });
    return;
  } catch (err: any) {
    const errorData = handleMongooseError(err, res, {
      uniqueError: {
        errorType: "migration-unique-error",
        msgPre: "Migration",
      },
    });
    if (errorData.handled) {
      return;
    }
    throw err;
    // ResponseHandler.handleError(res, {
    //   errorType: "create-user-error-failure",
    //   message: "Failed to create user",
    // });
  }
};

export const updateMigration = async (
  req: ManagedRequest<Partial<MigrationSchema>>,
  res: ManagedResponse,
  options: CreateOptions & Pick<GetOptions, "preFilters"> = {},
) => {
  try {
    const {
      preBody,
      bodyHandle,
      response: responseOpts,
      preFilters,
      preProjections,
      preOptions,
    } = options;

    // Body creation
    let body = { ...preBody, ...req.body } as MigrationSchema;
    if (bodyHandle) {
      body = await bodyHandle(body);
    }

    const id = req.params.id;
    const doc = await pipelineDBs.MIGRATION.updateData({
      filter: { ...preFilters, _id: id },
      updateData: body,
      options: {
        ...preOptions,
        new: true,
      },
    });

    if (!doc) {
      ResponseHandler.handleNotFound(res, {
        ...responseOpts?.notFound,
        errorType: responseOpts?.notFound?.errorType || "migration-not-found",
        message: responseOpts?.notFound?.message || "Migration not found",
      });
      return;
    }
    const data = convertDataToJSON(doc);
    ResponseHandler.handleSuccess(res, {
      ...responseOpts?.success,
      message:
        responseOpts?.success?.message || "Migration updated successfully",
      data: { ...responseOpts?.success?.data, ...data },
    });
  } catch (err: any) {
    const errorData = handleMongooseError(err, res, {
      uniqueError: {
        errorType: "migration-unique-error",
        msgPre: "Migration",
      },
    });
    if (errorData.handled) {
      return;
    }
    throw err;
  }
};

export const deleteMigration = async (
  req: ManagedRequest,
  res: ManagedResponse,
  options: GetOptions = {},
) => {
  try {
    const {
      preFilters,
      preProjections,
      preOptions,
      response: responseOpts,
    } = options;

    const id = req.params.id;
    const doc = await pipelineDBs.MIGRATION.deleteData({
      filter: { ...preFilters, _id: id },
      options: { ...preOptions },
    });
    if (!doc) {
      ResponseHandler.handleNotFound(res, {
        ...responseOpts?.notFound,
        errorType: responseOpts?.notFound?.errorType || "migration-not-found",
        message: responseOpts?.notFound?.message || "Migration not found",
      });
      return;
    }
    const data = convertDataToJSON(doc);
    ResponseHandler.handleSuccess(res, {
      ...responseOpts?.success,
      message:
        responseOpts?.success?.message || "Migration deleted successfully",
      data: { ...responseOpts?.success?.data, ...data },
    });
    return;
  } catch (err) {
    throw err;
  }
};
