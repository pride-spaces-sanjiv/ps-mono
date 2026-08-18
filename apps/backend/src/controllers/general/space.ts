import { ResponseHandler } from "@/middlewares/request.js";
import {
  Space,
  spaceFields,
} from "@pride-spaces/backend/database/models/space.js";
import { getSpaceOperatorsData } from "@pride-spaces/backend/utils/mongoose/relations/space-operator.js";
import {
  cleanPaginatedData,
  paginatedResults,
} from "@pride-spaces/backend/utils/mongoose/pagination.js";
import {
  getFieldsandProjectors,
  getMultiFilters,
  getRangedFilters,
  getSearchFilters,
} from "@pride-spaces/backend/utils/mongoose/filters.js";
import { handleMongooseError } from "@pride-spaces/backend/utils/mongoose/error.js";
import { convertDataToJSON } from "@pride-spaces/backend/utils/mongoose/conversion.js";
import { cleanObject } from "@pride-spaces/common/utils/object/clean.js";
import type {
  ManagedRequest,
  ManagedResponse,
} from "@pride-spaces/backend/types/request.js";
import { SpaceSchema } from "@pride-spaces/backend/database/schemas/space.js";
import { Types } from "mongoose";
import { pipelineDBs } from "@pride-spaces/backend/utils/services/pipeline/db.js";
import { dumpUserAction } from "@pride-spaces/backend/utils/data/dumpAction.js";
import {
  dumpActions,
  dumpStatuses,
} from "@pride-spaces/common/utils/data/dump.js";
import { generateSpaceKeyword } from "@pride-spaces/common/utils/data/name-keyword.js";
import { areasUpdateMQ } from "@pride-spaces/backend/utils/services/rabbitmq/rabbitmq.js";
import { GeneralizedControllers } from "@pride-spaces/backend/types/data/general-controllers.js";

type ModelType = typeof Space;
type GetOptions = GeneralizedControllers.GetOptions<ModelType>;
type CreateOptions = GeneralizedControllers.CreateOptions<
  ModelType,
  SpaceSchema
>;
type UpdateOptions = GeneralizedControllers.UpdateOptions<
  ModelType,
  SpaceSchema
>;
type FieldsAndProjectorsOptions =
  GeneralizedControllers.FieldsAndProjectorsOptions<ModelType>;

// GET
export const getSpaces = async (
  req: ManagedRequest<
    any,
    { [k: string]: any } & Partial<{ operator: string; branch: string }>
  >,
  res: ManagedResponse,
  options: GetOptions & Partial<FieldsAndProjectorsOptions> = {},
) => {
  try {
    const {
      preFilters = {},
      preProjections = undefined,
      preOptions,
      response: responseOpts,
      allowedProjectionFields = spaceFields,
    } = options;

    const withOperator =
      String(req.parsedQuery?.withOperator || "").toLowerCase() === "true";

    const { fields, projectors } = getFieldsandProjectors(
      req,
      Space,
      allowedProjectionFields,
    );
    const searchFilters = getSearchFilters<typeof Space>(req, {
      fieldMaps: {
        Name: "name",
        Email: "email",
        City: "location.city",
        State: "location.state",
        Area: "location.area",
        SpaceType: "specs.spaceType",
        Category: "specs.category",
      },
    });
    const multiFilters = getMultiFilters<typeof Space>(req, {
      fieldMaps: {
        Category: "specs.category",
        City: "location.city",
        State: "location.state",
        Area: "location.area",
        SpaceType: "specs.spaceType",
        Grade: "specs.grade",
        Oc: "flags.isOc",
        Sez: "flags.isSez",
        Operator: "operator",
      },
    });
    const rangedFilters = getRangedFilters<typeof Space>(req, {
      rangedFieldMaps: {
        Seats: {
          fields: "seats.total",
          ranges: [
            { id: 1, min: 0, max: 10 },
            { id: 2, min: 10, max: 50 },
            { id: 3, min: 50, max: 100 },
            { id: 4, min: 100, max: 500 },
            { id: 4, min: 500 },
          ],
        },
        AvailableSeats: {
          fields: ["seats.total", "seats.booked"],
          ranges: [
            { id: 1, min: 0, max: 10 },
            { id: 2, min: 10, max: 50 },
            { id: 3, min: 50, max: 100 },
            { id: 4, min: 100, max: 500 },
            { id: 4, min: 500 },
          ],
        },
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
          {
            ...preFilters,
            ...searchFilters,
            ...multiFilters,
            ...rangedFilters,
          },
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

// GET SINGLE
export const getSpace = async (
  req: ManagedRequest<any, { [k: string]: any }>,
  res: ManagedResponse,
  options: GetOptions & Partial<FieldsAndProjectorsOptions> = {},
) => {
  try {
    const {
      preFilters = {},
      preProjections = undefined,
      preOptions,
      response: responseOpts,
      allowedProjectionFields = spaceFields,
    } = options;

    const { fields, projectors } = getFieldsandProjectors(
      req,
      Space,
      allowedProjectionFields,
    );
    const withOperator =
      String(req.parsedQuery?.withOperator || "").toLowerCase() === "true";

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

// CREATE
export const createSpace = async (
  req: ManagedRequest<Partial<SpaceSchema>>,
  res: ManagedResponse,
  options: CreateOptions = {},
) => {
  try {
    const {
      preBody,
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
      fullKeyword: generateSpaceKeyword(req.body?.name || "") || undefined,
    } as SpaceSchema;
    if (bodyHandle) {
      body = await bodyHandle(body);
    }

    // Handle city-area on upload
    if (body.location?.city && body.location?.area) {
      areasUpdateMQ.sendMessage({
        pairs: [
          {
            city: body?.location?.city?.trim(),
            area: body?.location?.area?.trim(),
          },
        ],
      });
    }

    const id = new Types.ObjectId().toHexString();

    // Dump handle
    if (!skipDump) {
      let dumpData = { ...dumpArgs?.dump?.data, ...body };
      if (dumpDataHandle) {
        dumpData = await dumpDataHandle(dumpData);
      }

      const dumpRes = await dumpUserAction({
        ...dumpArgs,
        isNew: true,
        // @ts-ignore
        dump: {
          ...dumpArgs?.dump,
          collection: "spaces",
          data: dumpData,
          metadata: {
            id: id,
            name: body.name,
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
      return;
    }

    // Allowed to dump only
    const doc = Space.hydrate({ _id: id, ...body });
    const data = convertDataToJSON(doc);
    ResponseHandler.handleSuccess(res, {
      ...responseOpts?.success,
      status: responseOpts?.success?.status || 201,
      message:
        responseOpts?.success?.message || "Dumped new space successfully",
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

// UPDATE
export const updateSpace = async (
  req: ManagedRequest<Omit<Partial<SpaceSchema>, "branch" | "operator">>,
  res: ManagedResponse,
  options: UpdateOptions = {},
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

    // Mid process flow handler
    if (proceedToProcess) {
      const shouldProceed = await proceedToProcess(body, doc);
      if (!shouldProceed) {
        return;
      }
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
      let dumpData = { ...dumpArgs?.dump?.data, ...body };
      if (dumpDataHandle) {
        dumpData = await dumpDataHandle(dumpData);
      }

      const dumpRes = await dumpUserAction({
        ...dumpArgs,
        isNew: true,
        // @ts-ignore
        dump: {
          ...dumpArgs?.dump,
          collection: "spaces",
          data: dumpData,
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
