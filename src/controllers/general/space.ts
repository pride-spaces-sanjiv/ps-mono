import { ResponseHandler } from "@/middlewares/request.js";
import { Space, spaceFields } from "@/database/models/space.js";
import { getSpaceOperatorsData } from "@/utils/mongoose/relations/space-operator.js";
import {
  cleanPaginatedData,
  paginatedResults,
} from "@/utils/mongoose/pagination.js";
import {
  getFieldsandProjectors,
  getSearchFilters,
} from "@/utils/mongoose/filters.js";
import { handleMongooseError } from "@/utils/mongoose/error.js";
import { convertDataToJSON } from "@/utils/mongoose/conversion.js";
import { cleanObject } from "@/utils/object/clean.js";
import type { ManagedRequest, ManagedResponse } from "@/types/request.js";
import { SpaceSchema } from "@/database/schemas/space.js";
import {
  ProjectionType,
  RootFilterQuery,
  QueryOptions,
  AnyObject,
  InclusionProjection,
  ExclusionProjection,
} from "mongoose";
import { ModelToRaw } from "@/types/mongoose/document.js";
import { pipelineDBs } from "@/utils/services/pipeline/db.js";

type RawOfModel = ModelToRaw<typeof Space>;
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
    preBody: Partial<SpaceSchema>;
    onlyDump: boolean;
    skipDump: boolean;
  }>;

export const getSpaces = async (
  req: ManagedRequest<
    any,
    { [k: string]: any } & Partial<{ operator: string; branch: string }>
  >,
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

    const withOperator =
      String(req.query?.withOperator || "").toLowerCase() === "true";

    const { fields, projectors } = getFieldsandProjectors(
      req,
      Space,
      spaceFields,
    );
    const searchFilters = getSearchFilters<typeof Space>(req, {
      fieldMaps: {
        Name: "name",
        Email: "email",
        City: "location.city",
        State: "location.state",
      },
    });

    const { page, metrics, results, errored, err } = await paginatedResults(
      req,
      Space,
      spaceFields,
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
        errorType: responseOpts?.error?.errorType || "get-spaces-error",
        message: responseOpts?.error?.message || "Failed to get spaces list",
      });
      return;
    }
    if (results.length === 0) {
      ResponseHandler.handleNotFound(res, {
        ...responseOpts?.notFound,
        errorType: responseOpts?.notFound?.errorType || "spaces-not-found",
        message: responseOpts?.notFound?.message || "No spaces found",
        data: { ...responseOpts?.notFound?.data, results, page, metrics },
      });
      return;
    }

    const data = cleanPaginatedData({ results, page, metrics, err, errored });
    const operators = withOperator
      ? (
          await getSpaceOperatorsData(
            data.results.map((space) => space.operator),
          )
        ).map((d) => convertDataToJSON(d))
      : [];
    ResponseHandler.handleSuccess(res, {
      ...responseOpts?.success,
      message: responseOpts?.success?.message || "Got spaces list",
      data: {
        ...responseOpts?.success?.data,
        ...data,
        references: withOperator
          ? {
              operators: {
                results: operators,
                metrics: { total: operators.length },
              },
            }
          : undefined,
      },
    });
  } catch (err) {
    throw err;
    // ResponseHandler.handleError(res, {
    //   errorType: "get-spaces-error-failure",
    //   message: "Failed to get spaces list",
    // });
  }
};

export const getSpace = async (
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
      Space,
      spaceFields,
    );
    const withOperator =
      String(req.query?.withOperator || "").toLowerCase() === "true";

    const doc = await pipelineDBs.SPACE.getData({
      filter: { ...preFilters, _id: req.params.id },
      projection: { ...preProjections, ...projectors },
      options: preOptions,
    });
    if (!doc) {
      ResponseHandler.handleNotFound(res, {
        ...responseOpts?.notFound,
        errorType: responseOpts?.notFound?.errorType || "space-not-found",
        message: responseOpts?.notFound?.message || "Space not found",
      });
      return;
    }

    const data = convertDataToJSON(doc);
    const operators = withOperator
      ? (await getSpaceOperatorsData([data?.operator as string])).map((d) =>
          convertDataToJSON(d),
        )
      : [];
    ResponseHandler.handleSuccess(res, {
      ...responseOpts?.success,
      data: {
        ...responseOpts?.success?.data,
        ...data,
        references: withOperator ? { operator: operators[0] } : undefined,
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

export const createSpace = async (
  req: ManagedRequest<Partial<SpaceSchema>>,
  res: ManagedResponse,
  options: CreateOptions = {},
) => {
  try {
    const {
      preBody,
      response: responseOpts,
      onlyDump = false,
      skipDump = false,
    } = options;

    const body = { ...preBody, ...req.body } as SpaceSchema;
    const doc = await pipelineDBs.SPACE.createData({
      // @ts-ignore
      data: body,
    });

    const data = convertDataToJSON(doc);
    ResponseHandler.handleSuccess(res, {
      ...responseOpts?.success,
      status: responseOpts?.success?.status || 201,
      message: responseOpts?.success?.message || "Created space successfully",
      data: { ...responseOpts?.success?.data, ...data },
    });
  } catch (err: any) {
    const errorData = handleMongooseError(err, res, {
      uniqueError: {
        errorType: "space-unique-error",
        msgPre: "Space",
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

export const updateSpace = async (
  req: ManagedRequest<Omit<Partial<SpaceSchema>, "branch" | "operator">>,
  res: ManagedResponse,
  options: CreateOptions & Pick<GetOptions, "preFilters"> = {},
) => {
  try {
    const {
      preBody,
      response: responseOpts,
      preFilters,
      preProjections,
      preOptions,
    } = options;

    const body = { ...preBody, ...req.body };
    const doc = await pipelineDBs.SPACE.updateData({
      filter: { ...preFilters, _id: req.params.id },
      updateData: body,
      options: {
        ...preOptions,
        new: true,
      },
    });
    if (!doc) {
      ResponseHandler.handleNotFound(res, {
        ...responseOpts?.notFound,
        errorType: responseOpts?.notFound?.errorType || "space-not-found",
        message: responseOpts?.notFound?.message || "Space not found",
      });
      return;
    }

    const data = convertDataToJSON(doc);
    ResponseHandler.handleSuccess(res, {
      ...responseOpts?.success,
      data: { ...responseOpts?.success?.data, ...data },
    });
  } catch (err: any) {
    const errorData = handleMongooseError(err, res, {
      uniqueError: {
        errorType: "space-unique-error",
        msgPre: "Space",
      },
    });
    if (errorData.handled) {
      return;
    }
    throw err;
    // ResponseHandler.handleError(res, {
    //   errorType: "update-space-error-failure",
    //   message: "Failed to update space details",
    // });
  }
};

export const deleteSpace = async (
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

    const doc = await pipelineDBs.SPACE.deleteData({
      filter: {
        ...preFilters,
        _id: req.params.id,
      },
      options: {
        ...preOptions,
      },
    });
    if (!doc) {
      ResponseHandler.handleNotFound(res, {
        ...responseOpts?.notFound,
        errorType: responseOpts?.notFound?.errorType || "space-not-found",
        message: responseOpts?.notFound?.message || "Space not found",
      });
      return;
    }

    const data = convertDataToJSON(doc);
    ResponseHandler.handleSuccess(res, {
      ...responseOpts?.success,
      data: { ...responseOpts?.success?.data, ...data },
    });
  } catch (err) {
    throw err;
    // ResponseHandler.handleError(res, {
    //   errorType: "delete-space-error-failure",
    //   message: "Failed to delete space",
    // });
  }
};
