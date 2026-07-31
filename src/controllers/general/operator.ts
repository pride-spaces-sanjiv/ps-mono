import { ResponseHandler } from "@/middlewares/request.js";
import {
  Operator,
  operatorFields,
  operatorNonPassFields,
} from "@/database/models/operator.js";
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
import { dumpActions } from "@/utils/data/dump.js";
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
    error: Partial<typeof ResponseHandler.options.handleErrorOptions>;
    notFound: Partial<typeof ResponseHandler.options.handleNotFound>;
    unAuthorized: Partial<
      typeof ResponseHandler.options.handleUnauthorizedOptions
    >;
    success: Partial<typeof ResponseHandler.options.handleSuccess>;
  }>;
}>;
type CreateOptions = Omit<GetOptions, "preFilters"> &
  Partial<{
    preBody: Partial<OperatorSchema>;
    bodyHandle: <T = Partial<OperatorSchema>>(body: T) => T | Promise<T>;
    dumpDataHandle: <T = Partial<OperatorSchema>>(body: T) => T | Promise<T>;
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
      operatorNonPassFields,
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
      preOptions,
      bodyHandle,
      dumpDataHandle,
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
      let dumpData = { ...dumpArgs?.dump?.data, ...body };
      if (dumpDataHandle) {
        dumpData = await dumpDataHandle(dumpData);
      }

      const dumpRes = await dumpUserAction({
        isNew: true,
        ...dumpArgs,
        // @ts-ignore
        dump: {
          ...dumpArgs?.dump,
          collection: "operators",
          data: dumpData,
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
        options: preOptions,
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
    const doc = Operator.hydrate(
      { _id: id, ...body },
      preOptions?.projection as any,
    );
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
  req: ManagedRequest<Partial<OperatorSchema>>,
  res: ManagedResponse,
  options: CreateOptions &
    Pick<GetOptions, "preFilters"> &
    Partial<{
      proceedToProcess: (
        body: Partial<OperatorSchema>,
        doc: Awaited<ReturnType<typeof pipelineDBs.OPERATOR.getData>>,
      ) => Promise<boolean | undefined | null> | boolean | null | undefined;
    }> = {},
) => {
  try {
    const {
      preBody,
      bodyHandle,
      dumpDataHandle,
      proceedToProcess,
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
    } as OperatorSchema;
    if (bodyHandle) {
      body = await bodyHandle(body);
    }

    // Password encryption on existence
    if (body.password?.trim()) {
      body.password = encodeCrypto(body.password);
    }

    const id = req.params.id;

    // Check exists or not first
    let doc = await pipelineDBs.OPERATOR.getData({
      filter: { ...preFilters, _id: id },
      projection: { ...preProjections },
      options: { ...preOptions },
    });
    if (!doc) {
      ResponseHandler.handleNotFound(res, {
        ...responseOpts?.notFound,
        errorType: responseOpts?.notFound?.errorType || "operator-not-found",
        message: responseOpts?.notFound?.message || "Operator not found",
      });
      return;
    }

    // Mid process flow handler
    if (proceedToProcess) {
      const shouldProceed = await proceedToProcess(body, doc);
      if (!shouldProceed) {
        return;
      }
    }

    // Dump handle
    if (!skipDump) {
      let dumpData = { ...dumpArgs?.dump?.data, ...body };
      if (dumpDataHandle) {
        dumpData = await dumpDataHandle(dumpData);
      }

      const dumpRes = await dumpUserAction({
        isNew: true,
        ...dumpArgs,
        // @ts-ignore
        dump: {
          ...dumpArgs?.dump,
          collection: "operators",
          data: dumpData,
          metadata: {
            id: id,
            name: body.brandName || doc.brandName || body.name || doc.name,
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
      doc = await pipelineDBs.OPERATOR.updateData({
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
          errorType: responseOpts?.notFound?.errorType || "operator-not-found",
          message: responseOpts?.notFound?.message || "Operator not found",
        });
        return;
      }
      const data = convertDataToJSON(doc);
      ResponseHandler.handleSuccess(res, {
        ...responseOpts?.success,
        message:
          responseOpts?.success?.message || "Operator updated successfully",
        data: { ...responseOpts?.success?.data, ...data },
      });
      return;
    }

    // Allowed to dump only
    const data = convertDataToJSON(doc);
    ResponseHandler.handleSuccess(res, {
      ...responseOpts?.success,
      message:
        responseOpts?.success?.message || "Dumped operator data successfully",
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

// DELETE
export const deleteOperator = async (
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
    let doc = await pipelineDBs.OPERATOR.getData({
      filter: { ...preFilters, _id: id },
      projection: { ...preProjections },
      options: { ...preOptions },
    });
    if (!doc) {
      ResponseHandler.handleNotFound(res, {
        ...responseOpts?.notFound,
        errorType: responseOpts?.notFound?.errorType || "operator-not-found",
        message: responseOpts?.notFound?.message || "Operator not found",
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
          collection: "operators",
          data: {
            ...dumpArgs?.dump?.data,
            id: id,
            name: doc.name,
          },
          metadata: {
            id: id,
            name: doc.brandName || doc.name,
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
      doc = await pipelineDBs.OPERATOR.deleteData({
        filter: { ...preFilters, _id: id },
        options: { ...preOptions },
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
      ResponseHandler.handleSuccess(res, {
        ...responseOpts?.success,
        message:
          responseOpts?.success?.message || "Operator deleted successfully",
        data: { ...responseOpts?.success?.data, ...data },
      });
      return;
    }

    // Allowed to dump only
    const data = convertDataToJSON(doc);
    ResponseHandler.handleSuccess(res, {
      ...responseOpts?.success,
      message:
        responseOpts?.success?.message ||
        "Dumped operator deletion successfully",
      data: { ...responseOpts?.success?.data, ...data },
    });
  } catch (err) {
    throw err;
  }
};
