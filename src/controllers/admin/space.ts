import { ResponseHandler } from "@/middlewares/request.js";
import { Space, spaceFields } from "@/database/models/space.js";
import { Dump } from "@/database/models/dump.js";
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
import { AdminLevel, adminLevels } from "@/utils/data/admin.js";
// types
import type { ManagedRequest, ManagedResponse } from "@/types/request.js";
import { SpaceSchema } from "@/database/schemas/space.js";
import { ModelToDocument } from "@/types/mongoose/document.js";
import { dumpStatuses } from "@/utils/data/dump.js";
import { dumpAdminAction } from "@/utils/data/dumpAction.js";
import { Types } from "mongoose";
import { pipelineDBs } from "@/utils/services/pipeline/db.js";

export const getSpaces = async (
  req: ManagedRequest<
    any,
    { [k: string]: any } & Partial<{
      operator: string;
      branch: string;
      withOperator: string;
    }>
  >,
  res: ManagedResponse,
) => {
  try {
    const selfLevel = req.session.user?.userType;
    const branchId = (req.query?.branch || "").trim();
    const operatorId = (req.query?.operator || "").trim();
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
        Email: "person.email",
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
        projection: projectors,
        filter: cleanObject(
          { operator: operatorId, branch: branchId, ...searchFilters },
          { excludeByValues: [""] },
        ),
      },
    );

    // On results error
    if (errored && err) {
      ResponseHandler.handleError(res, {
        errorType: "get-spaces-error",
        message: "Failed to get spaces list",
      });
      return;
    }
    if (results.length === 0) {
      ResponseHandler.handleNotFound(res, {
        errorType: "spaces-not-found",
        message: "No spaces found",
        data: { results, page, metrics },
      });
      return;
    }

    const data = cleanPaginatedData({ results, page, metrics, err, errored });
    const operators = withOperator
      ? (
          await getSpaceOperatorsData(
            data.results.map((space) => space.operator),
          )
        )
          // @ts-ignore
          .map((d) => convertDataToJSON(d))
      : [];
    ResponseHandler.handleSuccess(res, {
      message: "Got spaces list",
      data: {
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
    ResponseHandler.handleError(res, {
      errorType: "get-spaces-error-failure",
      message: "Failed to get spaces list",
    });
  }
};

export const getSpace = async (
  req: ManagedRequest<any, { [k: string]: any }>,
  res: ManagedResponse,
) => {
  try {
    const { fields, projectors } = getFieldsandProjectors(
      req,
      Space,
      spaceFields,
    );
    const withOperator =
      String(req.query?.withOperator || "").toLowerCase() === "true";

    const doc = await pipelineDBs.SPACE.getData({
      filter: { _id: req.params.id },
      projection: projectors,
    });
    if (!doc) {
      ResponseHandler.handleNotFound(res, {
        errorType: "space-not-found",
        message: "Space not found",
      });
      return;
    }

    const data = convertDataToJSON(doc);
    const operators = withOperator
      ? (await getSpaceOperatorsData([data?.operator as string])).map((d) =>
          // @ts-ignore
          convertDataToJSON(d),
        )
      : [];
    ResponseHandler.handleSuccess(res, {
      data: {
        ...data,
        references: withOperator ? { operator: operators[0] } : undefined,
      },
    });
  } catch (err) {
    ResponseHandler.handleError(res, {
      errorType: "get-space-error-failure",
      message: "Failed to get space details",
    });
  }
};

export const createSpace = async (
  req: ManagedRequest<SpaceSchema>,
  res: ManagedResponse,
) => {
  try {
    const sessionUser = req.session.user;
    const body = req.body;
    const id = new Types.ObjectId().toHexString();

    // Handle dumping actions
    const dumpRes = await dumpAdminAction({
      isNew: true,
      dump: {
        collection: "spaces",
        data: { ...body, isActive: undefined },
        metadata: {
          id: id,
          name: body.name,
        },
        action: "add",
        status:
          sessionUser?.userType === "support"
            ? dumpStatuses.PENDING
            : dumpStatuses.APPROVED,
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

    // For lead and above direct create
    if (
      sessionUser?.userType &&
      sessionUser?.userType !== "support" &&
      adminLevels.includes(sessionUser.userType as AdminLevel)
    ) {
      const doc = pipelineDBs.SPACE.createData({ data: { ...body, _id: id } });

      const data = convertDataToJSON(doc);
      ResponseHandler.handleSuccess(res, {
        status: 201,
        message: "Created space successfully",
        data: data,
      });
      return;
    }

    ResponseHandler.handleSuccess(res, {
      status: 201,
      message: "Dumped new space successfully",
      data: body,
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
    ResponseHandler.handleError(res, {
      errorType: "create-space-error-failure",
      message: "Failed to create space",
    });
  }
};

export const updateSpace = async (
  req: ManagedRequest<Omit<SpaceSchema, "branch" | "operator">>,
  res: ManagedResponse,
) => {
  try {
    const body = req.body;
    const sessionUser = req.session.user;
    let doc: ModelToDocument<typeof Space> | null = null;

    // Create dump for every update, support will request and others auto approve
    doc = await pipelineDBs.SPACE.getData({ filter: { _id: req.params.id } });
    if (!doc) {
      ResponseHandler.handleNotFound(res, {
        errorType: "space-not-found",
        message: "Space not found",
      });
      return;
    }
    // Handle dumping actions
    const dumpRes = await dumpAdminAction({
      dump: {
        collection: "spaces",
        data: { ...body, isActive: undefined, id: req.params.id },
        metadata: { id: req.params.id, name: doc.name },
        action: "update",
        status:
          sessionUser?.userType === "support"
            ? dumpStatuses.PENDING
            : dumpStatuses.APPROVED,
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
      ResponseHandler.handleError(res, {
        errorType: "dump-failed",
        message: "Dump action was failed",
      });
      return;
    }

    // For lead and above direct update
    if (
      sessionUser?.userType &&
      sessionUser?.userType !== "support" &&
      adminLevels.includes(sessionUser.userType as AdminLevel)
    ) {
      doc = await pipelineDBs.SPACE.updateData({
        filter: { _id: req.params.id },
        updateData: body,
        options: { new: true },
      });
      if (!doc) {
        ResponseHandler.handleNotFound(res, {
          errorType: "space-not-found",
          message: "Space not found",
        });
        return;
      }
    }

    const data = convertDataToJSON(doc);
    ResponseHandler.handleSuccess(res, {
      data: data,
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
    ResponseHandler.handleError(res, {
      errorType: "update-space-error-failure",
      message: "Failed to update space details",
    });
  }
};

export const deleteSpace = async (
  req: ManagedRequest,
  res: ManagedResponse,
) => {
  try {
    const sessionUser = req.session.user;

    const doc = await pipelineDBs.SPACE.getData({
      filter: { _id: req.params.id },
    });
    if (!doc) {
      ResponseHandler.handleNotFound(res, {
        errorType: "space-not-found",
        message: "Space not found",
      });
      return;
    }

    // Handle dumping actions
    const dumpRes = await dumpAdminAction({
      isNew: true,
      dump: {
        collection: "spaces",
        data: {},
        metadata: {
          id: doc.id,
          name: doc.name,
        },
        action: "remove",
        status:
          sessionUser?.userType === "support"
            ? dumpStatuses.PENDING
            : dumpStatuses.APPROVED,
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

    // For lead and above direct delete
    if (
      sessionUser?.userType &&
      sessionUser?.userType !== "support" &&
      adminLevels.includes(sessionUser.userType as AdminLevel)
    ) {
      const doc = await pipelineDBs.SPACE.deleteData({
        filter: { _id: req.params.id },
      });
      if (!doc) {
        ResponseHandler.handleNotFound(res, {
          errorType: "space-not-found",
          message: "Space not found",
        });
        return;
      }
      ResponseHandler.handleSuccess(res, {
        message: "Space deleted successfully",
        data: { id: doc.id },
      });
      return;
    }
    ResponseHandler.handleSuccess(res, {
      message: "Dumped space-removal successfully",
      data: { id: doc.id },
    });
  } catch (err) {
    ResponseHandler.handleError(res, {
      errorType: "delete-space-error-failure",
      message: "Failed to delete space",
    });
  }
};
