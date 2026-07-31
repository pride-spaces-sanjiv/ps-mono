import { ResponseHandler } from "@/middlewares/request.js";
import { Operator, operatorFields } from "@/database/models/operator.js";
import {
  cleanPaginatedData,
  paginatedResults,
} from "@/utils/mongoose/pagination.js";
import {
  getFieldsandProjectors,
  getMultiFilters,
  getSearchFilters,
} from "@/utils/mongoose/filters.js";
import { handleMongooseError } from "@/utils/mongoose/error.js";
import { convertDataToJSON } from "@/utils/mongoose/conversion.js";
import { cleanObject } from "@/utils/object/clean.js";
import type { ManagedRequest, ManagedResponse } from "@/types/request.js";
import { OperatorSchema } from "@/database/schemas/operator.js";
import {
  ProjectionType,
  RootFilterQuery,
  QueryOptions,
  AnyObject,
  InclusionProjection,
  ExclusionProjection,
  Types,
} from "mongoose";
import { ModelToRaw } from "@/types/mongoose/document.js";
import { pipelineDBs } from "@/utils/services/pipeline/db.js";
import { dumpUserAction } from "@/utils/data/dumpAction.js";
import { dumpActions, dumpStatuses } from "@/utils/data/dump.js";
import { generateSpaceKeyword } from "@/utils/data/name-keyword.js";
import { areasUpdateMQ } from "@/utils/services/rabbitmq/rabbitmq.js";
import { getSpaceCountsOfOperator } from "@/utils/mongoose/relations/space-operator.js";
import { encodeCrypto } from "@/utils/crypto.js";

type RawOfModel = ModelToRaw<typeof Operator>;
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
    preBody: Partial<OperatorSchema>;
    bodyHandle: <T = Partial<OperatorSchema>>(body: T) => T | Promise<T>;
    onlyDump: boolean;
    skipDump: boolean;
    dumpArgs: Partial<
      Exclude<Parameters<typeof dumpUserAction>[0], undefined | null>
    >;
  }>;

export const getOperators = async (
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
      Operator,
      operatorFields,
    );
    const searchFilters = getSearchFilters<typeof Operator>(req, {
      fieldMaps: {
        Name: "name",
        Email: "email",
        Slug: "slug",
        BrandName: "brandName",
      },
    });
    const multiFilters = getMultiFilters<typeof Operator>(req, {
      fieldMaps: {
        Name: "name",
        Email: "email",
        Slug: "slug",
        BrandName: "brandName",
        EstablishedOn: "establishedOn",
      },
    });

    const { page, metrics, results, errored, err } = await paginatedResults(
      req,
      Operator,
      operatorFields,
      { limit: 10 },
      {
        projection: { ...preProjections, ...projectors },
        filter: cleanObject(
          { ...preFilters, ...searchFilters, ...multiFilters },
          { excludeByValues: [""] },
        ),
        options: preOptions,
      },
    );

    // On results error
    if (errored && err) {
      ResponseHandler.handleError(res, {
        ...responseOpts?.error,
        errorType: responseOpts?.error?.errorType || "get-operators-error",
        message: responseOpts?.error?.message || "Failed to get operators list",
      });
      return;
    }
    if (results.length === 0) {
      ResponseHandler.handleNotFound(res, {
        ...responseOpts?.notFound,
        errorType: responseOpts?.notFound?.errorType || "operators-not-found",
        message: responseOpts?.notFound?.message || "No operators found",
        data: { ...responseOpts?.notFound?.data, results, page, metrics },
      });
      return;
    }

    const data = cleanPaginatedData({ results, page, metrics, err, errored });
    const spaceCounts = await getSpaceCountsOfOperator(
      results.map((r) => r.id),
    );
    ResponseHandler.handleSuccess(res, {
      ...responseOpts?.success,
      message: responseOpts?.success?.message || "Got operators list",
      data: {
        ...responseOpts?.success?.data,
        ...data,
        results: data.results.map((r) => ({
          ...r,
          totalSpaces: spaceCounts[r.id] || 0,
        })),
      },
    });
  } catch (err) {
    throw err;
  }
};

// GET SINGLE
export const getOperator = async (
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
      Operator,
      operatorFields,
    );

    const id = req.params.id;

    const doc = await pipelineDBs.OPERATOR.getData({
      filter: { ...preFilters, _id: id },
      projection: { ...preProjections, ...projectors },
      options: preOptions,
    });
    if (!doc) {
      ResponseHandler.handleNotFound(res, {
        ...responseOpts?.notFound,
        errorType: responseOpts?.notFound?.errorType || "operator-not-found",
        message: responseOpts?.notFound?.message || "Operator not found",
      });
      return;
    }

    const data = convertDataToJSON(doc);
    const spaceCounts = await getSpaceCountsOfOperator([id]);

    ResponseHandler.handleSuccess(res, {
      ...responseOpts?.success,
      data: {
        ...responseOpts?.success?.data,
        ...data,
        totalSpaces: spaceCounts[doc.id] || 0,
      },
    });
  } catch (err) {
    throw err;
  }
};

// CREATE
export const createOperator = async (
  req: ManagedRequest<Partial<OperatorSchema>>,
  res: ManagedResponse,
  options: CreateOptions = {},
) => {
  try {
    const {
      preBody,
      bodyHandle,
      response: responseOpts,
      onlyDump = false,
      skipDump = false,
      dumpArgs,
    } = options;

    // Body creation
    let body = {
      ...preBody,
      ...req.body,
    } as OperatorSchema;
    if (bodyHandle) {
      body = await bodyHandle(body);
    }
    // Password encryption on existence
    if (body.password?.trim()) {
      body.password = encodeCrypto(body.password);
    }

    const id = new Types.ObjectId().toHexString();

    // Dump handle
    if (!skipDump) {
      const dumpRes = await dumpUserAction({
        ...dumpArgs,
        isNew: true,
        // @ts-ignore
        dump: {
          ...dumpArgs?.dump,
          collection: "operators",
          data: {
            ...dumpArgs?.dump?.data,
            ...body,
          },
          metadata: {
            id: id,
            name: body.brandName || body.name,
          },
          action: "add",
        },
        req: req,
      });
      if (dumpRes.disAllowed || dumpRes.levelInvalid) {
        ResponseHandler.handleUnauthorized(res, {
          errorType: "dump-unauthorized",
          message: "Dump action was unauthorized",
        });
        return;
      }
      if (dumpRes.error) {
        ResponseHandler.handleUnauthorized(res, {
          errorType: "dump-failed",
          message: "Dump action was failed",
        });
        return;
      }
    }

    // Allowed to create
    if (!onlyDump) {
      const doc = await pipelineDBs.OPERATOR.createData({
        // @ts-ignore
        data: body,
      });
      const data = convertDataToJSON(doc);
      ResponseHandler.handleSuccess(res, {
        ...responseOpts?.success,
        status: responseOpts?.success?.status || 201,
        message:
          responseOpts?.success?.message || "Created operator successfully",
        data: { ...responseOpts?.success?.data, ...data },
      });
      return;
    }

    // Allowed to dump only
    const doc = Operator.hydrate({ _id: id, ...body });
    const data = convertDataToJSON(doc);
    ResponseHandler.handleSuccess(res, {
      ...responseOpts?.success,
      status: responseOpts?.success?.status || 201,
      message:
        responseOpts?.success?.message || "Dumped new operator successfully",
      data: { ...responseOpts?.success?.data, ...data },
    });
  } catch (err: any) {
    const errorData = handleMongooseError(err, res, {
      uniqueError: {
        errorType: "operator-unique-error",
        msgPre: "Operator",
      },
    });
    if (errorData.handled) {
      return;
    }
    throw err;
  }
};

// UPDATE
export const updateOperator = async (
  req: ManagedRequest<Omit<Partial<OperatorSchema>, "branch" | "operator">>,
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
      onlyDump = false,
      skipDump = false,
      dumpArgs,
    } = options;

    // Body creation
    let body = {
      ...preBody,
      ...req.body,
      fullKeyword: generateSpaceKeyword(req.body?.name || "") || undefined,
    } as SpaceSchema;
    if (bodyHandle) {
      body = await bodyHandle(body);
    }

    const id = req.params.id;

    // Check exists or not first
    let doc = await pipelineDBs.SPACE.getData({
      filter: { ...preFilters, _id: id },
      projection: { ...preProjections },
      options: { ...preOptions },
    });
    if (!doc) {
      ResponseHandler.handleNotFound(res, {
        ...responseOpts?.notFound,
        errorType: responseOpts?.notFound?.errorType || "space-not-found",
        message: responseOpts?.notFound?.message || "Space not found",
      });
      return;
    }

    // Handle city-area on upload
    if (
      body.location?.city &&
      body.location?.area &&
      doc.isSelected("location.city") &&
      doc.location?.city !== body.location.city
    ) {
      areasUpdateMQ.sendMessage({
        pairs: [
          {
            city: body?.location?.city?.trim(),
            area: body?.location?.area?.trim(),
          },
        ],
      });
    }

    // Dump handle
    if (!skipDump) {
      const dumpRes = await dumpUserAction({
        ...dumpArgs,
        isNew: true,
        // @ts-ignore
        dump: {
          ...dumpArgs?.dump,
          collection: "spaces",
          data: {
            ...dumpArgs?.dump?.data,
            ...body,
          },
          metadata: {
            id: id,
            name: doc.name,
          },
          action: "update",
        },
        req: req,
      });
      if (dumpRes.disAllowed || dumpRes.levelInvalid) {
        ResponseHandler.handleUnauthorized(res, {
          errorType: "dump-unauthorized",
          message: "Dump action was unauthorized",
        });
        return;
      }
      if (dumpRes.error) {
        ResponseHandler.handleUnauthorized(res, {
          errorType: "dump-failed",
          message: "Dump action was failed",
        });
        return;
      }
    }

    // Allowed to update
    if (!onlyDump) {
      doc = await pipelineDBs.SPACE.updateData({
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
          errorType: responseOpts?.notFound?.errorType || "space-not-found",
          message: responseOpts?.notFound?.message || "Space not found",
        });
        return;
      }
      const data = convertDataToJSON(doc);
      ResponseHandler.handleSuccess(res, {
        ...responseOpts?.success,
        message: responseOpts?.success?.message || "Space updated successfully",
        data: { ...responseOpts?.success?.data, ...data },
      });
      return;
    }

    // Allowed to dump only
    const data = convertDataToJSON(doc);
    ResponseHandler.handleSuccess(res, {
      ...responseOpts?.success,
      message:
        responseOpts?.success?.message || "Dumped space data successfully",
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

// DELETE
export const deleteSpace = async (
  req: ManagedRequest,
  res: ManagedResponse,
  options: GetOptions &
    Pick<CreateOptions, "onlyDump" | "skipDump" | "dumpArgs"> = {},
) => {
  try {
    const {
      preFilters,
      preProjections,
      preOptions,
      onlyDump = false,
      skipDump = false,
      dumpArgs,
      response: responseOpts,
    } = options;

    const id = req.params.id;

    // Check exists or not first
    let doc = await pipelineDBs.SPACE.getData({
      filter: { ...preFilters, _id: id },
      projection: { ...preProjections },
      options: { ...preOptions },
    });
    if (!doc) {
      ResponseHandler.handleNotFound(res, {
        ...responseOpts?.notFound,
        errorType: responseOpts?.notFound?.errorType || "space-not-found",
        message: responseOpts?.notFound?.message || "Space not found",
      });
      return;
    }

    // Dump handle
    if (!skipDump) {
      const dumpRes = await dumpUserAction({
        ...dumpArgs,
        isNew: true,
        // @ts-ignore
        dump: {
          ...dumpArgs?.dump,
          collection: "spaces",
          data: {
            ...dumpArgs?.dump?.data,
            id: id,
            name: doc.name,
          },
          metadata: {
            id: id,
            name: doc.name,
          },
          action: dumpActions.REMOVE,
        },
        req: req,
      });
      if (dumpRes.disAllowed || dumpRes.levelInvalid) {
        ResponseHandler.handleUnauthorized(res, {
          errorType: "dump-unauthorized",
          message: "Dump action was unauthorized",
        });
        return;
      }
      if (dumpRes.error) {
        ResponseHandler.handleUnauthorized(res, {
          errorType: "dump-failed",
          message: "Dump action was failed",
        });
        return;
      }
    }

    // Allowed to delete directly
    if (!onlyDump) {
      doc = await pipelineDBs.SPACE.deleteData({
        filter: { ...preFilters, _id: id },
        options: { ...preOptions },
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
        message: responseOpts?.success?.message || "Space deleted successfully",
        data: { ...responseOpts?.success?.data, ...data },
      });
      return;
    }

    // Allowed to dump only
    const data = convertDataToJSON(doc);
    ResponseHandler.handleSuccess(res, {
      ...responseOpts?.success,
      message:
        responseOpts?.success?.message || "Dumped space deletion successfully",
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
