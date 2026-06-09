import { ResponseHandler } from "@/middlewares/request.js";
import {
  ConventionalProperty,
  conventionalPropertyFields,
} from "@/database/models/conventional.js";
import { pipelineDBs, PipelineModel } from "@/utils/services/pipeline/db.js";
import { handleMongooseError } from "@/utils/mongoose/error.js";
import {
  cleanPaginatedData,
  paginatedResults,
} from "@/utils/mongoose/pagination.js";
import {
  getFieldsandProjectors,
  getSearchFilters,
} from "@/utils/mongoose/filters.js";
import { convertDataToJSON } from "@/utils/mongoose/conversion.js";
import { cleanObject } from "@/utils/object/clean.js";
import { AdminLevel, adminLevels } from "@/utils/data/admin.js";
// types
import type { ManagedRequest, ManagedResponse } from "@/types/request.js";
import { ConventionalPropertySchema } from "@/database/schemas/conventional.js";
import { ModelToDocument } from "@/types/mongoose/document.js";
import { dumpStatuses } from "@/utils/data/dump.js";
import { dumpAdminAction } from "@/utils/data/dumpAction.js";
import { Types } from "mongoose";

export const getConventionals = async (
  req: ManagedRequest<any, { [k: string]: any }>,
  res: ManagedResponse,
) => {
  try {
    const selfLevel = req.session.user?.userType;

    const { fields, projectors } = getFieldsandProjectors(
      req,
      ConventionalProperty,
      conventionalPropertyFields,
    );
    const searchFilters = getSearchFilters<typeof ConventionalProperty>(req, {
      fieldMaps: {
        Name: "name",
        Slug: "slug",
        Email: "person.email",
        City: "location.city",
        State: "location.state",
      },
    });
    const { page, metrics, results, errored, err } = await paginatedResults<
      PipelineModel<"CONVENTIONAL">
    >(
      req,
      "CONVENTIONAL",
      conventionalPropertyFields,
      { limit: 10 },
      {
        projection: projectors,
        filter: cleanObject({ ...searchFilters }, { excludeByValues: [""] }),
      },
    );

    // On results error
    if (errored && err) {
      ResponseHandler.handleError(res, {
        errorType: "get-conventionals-error",
        message: "Failed to get conventional properties list",
      });
      return;
    }
    if (results.length === 0) {
      ResponseHandler.handleNotFound(res, {
        errorType: "conventionals-not-found",
        message: "No conventional properties found",
        data: { results, page, metrics },
      });
      return;
    }

    const data = cleanPaginatedData({
      results: results,
      page,
      metrics,
      err,
      errored,
    });
    ResponseHandler.handleSuccess(res, {
      message: "Got conventional properties list",
      data: data,
    });
  } catch (err) {
    ResponseHandler.handleError(res, {
      errorType: "get-conventionals-error-failure",
      message: "Failed to get conventional properties list",
    });
  }
};

export const getConventional = async (
  req: ManagedRequest<any, { [k: string]: any }>,
  res: ManagedResponse,
) => {
  try {
    const { fields, projectors } = getFieldsandProjectors(
      req,
      ConventionalProperty,
      conventionalPropertyFields,
    );

    const doc = await pipelineDBs.CONVENTIONAL.getData({
      filter: { _id: req.params.id },
      projection: projectors,
    });
    if (!doc) {
      ResponseHandler.handleNotFound(res, {
        errorType: "conventional-not-found",
        message: "Conventional property not found",
      });
      return;
    }

    const data = convertDataToJSON(doc);
    ResponseHandler.handleSuccess(res, {
      data: data,
    });
  } catch (err) {
    ResponseHandler.handleError(res, {
      errorType: "get-conventional-error-failure",
      message: "Failed to get conventional property details",
    });
  }
};

export const createConventional = async (
  req: ManagedRequest<ConventionalPropertySchema>,
  res: ManagedResponse,
) => {
  try {
    const sessionUser = req.session.user;
    const body = req.body;

    // Handle dumping actions
    const dumpRes = await dumpAdminAction({
      isNew: true,
      dump: {
        collection: "conventionals",
        data: { ...body },
        metadata: {
          id: new Types.ObjectId().toHexString(),
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
      const doc = await pipelineDBs.CONVENTIONAL.createData({
        // @ts-ignore
        data: body,
      });

      const data = convertDataToJSON(doc);
      ResponseHandler.handleSuccess(res, {
        status: 201,
        message: "Created conventional property successfully",
        data: data,
      });
      return;
    }

    ResponseHandler.handleSuccess(res, {
      status: 201,
      message: "Dumped new operator successfully",
      data: { ...body },
    });
  } catch (err: any) {
    const errorData = handleMongooseError(err, res, {
      uniqueError: {
        errorType: "conventional-unique-error",
        msgPre: "Conventional property",
      },
    });
    if (errorData.handled) {
      return;
    }
    ResponseHandler.handleError(res, {
      errorType: "create-conventional-error-failure",
      message: "Failed to create conventional property",
    });
  }
};

export const updateConventional = async (
  req: ManagedRequest<Partial<Omit<ConventionalPropertySchema, "password">>>,
  res: ManagedResponse,
) => {
  try {
    const body = req.body;
    const sessionUser = req.session.user;

    let doc = await pipelineDBs.CONVENTIONAL.getData({
      filter: { _id: req.params.id },
    });
    if (!doc) {
      ResponseHandler.handleNotFound(res, {
        errorType: "conventional-not-found",
        message: "Conventional property not found",
      });
      return;
    }

    // Create dump for every update, support will request and others auto approve
    // Handle dumping actions
    const dumpRes = await dumpAdminAction({
      dump: {
        collection: "conventionals",
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
      doc = await pipelineDBs.CONVENTIONAL.updateData({
        filter: { _id: req.params.id },
        updateData: body,
        options: {
          new: true,
        },
      });
      if (!doc) {
        ResponseHandler.handleNotFound(res, {
          errorType: "conventional-not-found",
          message: "Conventional property not found",
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
        errorType: "conventional-unique-error",
        msgPre: "Conventional property",
      },
    });
    if (errorData.handled) {
      return;
    }
    ResponseHandler.handleError(res, {
      errorType: "update-conventional-error-failure",
      message: "Failed to update conventional property details",
    });
  }
};

export const deleteConventional = async (
  req: ManagedRequest,
  res: ManagedResponse,
) => {
  try {
    const sessionUser = req.session.user;

    const doc = await pipelineDBs.CONVENTIONAL.getData({
      filter: { _id: req.params.id },
    });
    if (!doc) {
      ResponseHandler.handleNotFound(res, {
        errorType: "conventional-not-found",
        message: "Operator not found",
      });
      return;
    }

    // Handle dumping actions
    const dumpRes = await dumpAdminAction({
      isNew: true,
      dump: {
        collection: "conventionals",
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
      const doc = await pipelineDBs.CONVENTIONAL.getData({
        filter: { _id: req.params.id },
      });
      if (!doc) {
        ResponseHandler.handleNotFound(res, {
          errorType: "conventional-not-found",
          message: "Conventional property not found",
        });
        return;
      }
      ResponseHandler.handleSuccess(res, {
        message: "Conventional property deleted successfully",
        data: { id: doc.id },
      });
      return;
    }
    ResponseHandler.handleSuccess(res, {
      message: "Dumped conventional property-removal successfully",
      data: { id: doc.id },
    });
  } catch (err) {
    ResponseHandler.handleError(res, {
      errorType: "delete-conventional-error-failure",
      message: "Failed to delete conventional property",
    });
  }
};
