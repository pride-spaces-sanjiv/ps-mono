import { ResponseHandler } from "@/middlewares/request.js";
import { Operator, operatorNonPassFields } from "@/database/models/operator.js";
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
import { cleanObject, deleteObjectFields } from "@/utils/object/clean.js";
import { getSpaceCountsOfOperator } from "@/utils/mongoose/relations/space-operator.js";
import { compareCryptos, decodeCrypto, encodeCrypto } from "@/utils/crypto.js";
import { AdminLevel, adminLevels } from "@/utils/data/admin.js";
// types
import type { ManagedRequest, ManagedResponse } from "@/types/request.js";
import { OperatorSchema } from "@/database/schemas/operator.js";
import { ModelToDocument } from "@/types/mongoose/document.js";
import { dumpStatuses } from "@/utils/data/dump.js";
import { dumpAdminAction } from "@/utils/data/dumpAction.js";
import { Types } from "mongoose";
import { pipelineDBs } from "@/utils/services/pipeline/db.js";

export const getOperators = async (
  req: ManagedRequest<any, { [k: string]: any }>,
  res: ManagedResponse,
) => {
  try {
    const selfLevel = req.session.user?.userType;

    const { fields, projectors } = getFieldsandProjectors(
      req,
      Operator,
      operatorNonPassFields,
    );
    const searchFilters = getSearchFilters<typeof Operator>(req, {
      fieldMaps: {
        Name: "name",
        Email: "email",
      },
    });
    const { page, metrics, results, errored, err } = await paginatedResults(
      req,
      Operator,
      operatorNonPassFields,
      { limit: 10 },
      {
        projection: projectors,
        filter: cleanObject({ ...searchFilters }, { excludeByValues: [""] }),
      },
    );

    // On results error
    if (errored && err) {
      ResponseHandler.handleError(res, {
        errorType: "get-operators-error",
        message: "Failed to get operators list",
      });
      return;
    }
    if (results.length === 0) {
      ResponseHandler.handleNotFound(res, {
        errorType: "operators-not-found",
        message: "No operators found",
        data: { results, page, metrics },
      });
      return;
    }

    const spaceCounts = await getSpaceCountsOfOperator(
      results.map((r) => r.id),
    );
    const data = cleanPaginatedData({
      results: results,
      page,
      metrics,
      err,
      errored,
    });
    ResponseHandler.handleSuccess(res, {
      message: "Got operators list",
      data: {
        ...data,
        results: data.results.map((r) => ({
          ...r,
          totalSpaces: spaceCounts[r.id] || 0,
        })),
      },
    });
  } catch (err) {
    ResponseHandler.handleError(res, {
      errorType: "get-operators-error-failure",
      message: "Failed to get operators list",
    });
  }
};

export const getOperator = async (
  req: ManagedRequest<any, { [k: string]: any }>,
  res: ManagedResponse,
) => {
  try {
    const { fields, projectors } = getFieldsandProjectors(
      req,
      Operator,
      operatorNonPassFields,
    );

    const doc = await pipelineDBs.OPERATOR.getData({
      filter: { _id: req.params.id },
      projection: projectors,
    });
    if (!doc) {
      ResponseHandler.handleNotFound(res, {
        errorType: "operator-not-found",
        message: "Operator not found",
      });
      return;
    }

    const spaceCounts = await getSpaceCountsOfOperator([doc.id]);
    const data = {
      ...convertDataToJSON(doc),
      totalSpaces: spaceCounts[doc.id] || 0,
    };
    ResponseHandler.handleSuccess(res, {
      data: data,
    });
  } catch (err) {
    ResponseHandler.handleError(res, {
      errorType: "get-operator-error-failure",
      message: "Failed to get operator details",
    });
  }
};

export const createOperator = async (
  req: ManagedRequest<OperatorSchema>,
  res: ManagedResponse,
) => {
  try {
    const sessionUser = req.session.user;
    const body = req.body;
    const encodedPass = encodeCrypto(body.password);

    // Handle dumping actions
    const dumpRes = await dumpAdminAction({
      isNew: true,
      dump: {
        collection: "operators",
        data: { ...body, password: encodedPass, isActive: undefined },
        metadata: {
          id: new Types.ObjectId().toHexString(),
          name: body.brandName || body.name,
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
      const doc = await pipelineDBs.OPERATOR.createData({
        // @ts-ignore
        data: { ...body, password: encodedPass },
      });

      const data = convertDataToJSON(doc);
      ResponseHandler.handleSuccess(res, {
        status: 201,
        message: "Created operator successfully",
        data: data,
      });
      return;
    }

    ResponseHandler.handleSuccess(res, {
      status: 201,
      message: "Dumped new operator successfully",
      data: { ...body, password: undefined },
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
    ResponseHandler.handleError(res, {
      errorType: "create-operator-error-failure",
      message: "Failed to create operator",
    });
  }
};

export const updateOperator = async (
  req: ManagedRequest<Partial<Omit<OperatorSchema, "password">>>,
  res: ManagedResponse,
) => {
  try {
    const body = req.body;
    const sessionUser = req.session.user;

    let doc = await pipelineDBs.OPERATOR.getData({
      filter: { _id: req.params.id },
    });
    if (!doc) {
      ResponseHandler.handleNotFound(res, {
        errorType: "operator-not-found",
        message: "Operator not found",
      });
      return;
    }

    // Create dump for every update, support will request and others auto approve
    // Handle dumping actions
    const dumpRes = await dumpAdminAction({
      dump: {
        collection: "operators",
        data: { ...body, isActive: undefined, id: req.params.id },
        metadata: { id: req.params.id, name: doc.brandName || doc.name },
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
      doc = await pipelineDBs.OPERATOR.updateData({
        filter: { _id: req.params.id },
        updateData: body,
        options: {
          new: true,
        },
      });
      if (!doc) {
        ResponseHandler.handleNotFound(res, {
          errorType: "operator-not-found",
          message: "Operator not found",
        });
        return;
      }
    }

    const spaceCounts = await getSpaceCountsOfOperator([doc.id]);
    const data = {
      ...convertDataToJSON(doc),
      totalSpaces: spaceCounts[doc.id] || 0,
    };
    ResponseHandler.handleSuccess(res, {
      data: data,
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
    ResponseHandler.handleError(res, {
      errorType: "update-operator-error-failure",
      message: "Failed to update operator details",
    });
  }
};

export const deleteOperator = async (
  req: ManagedRequest,
  res: ManagedResponse,
) => {
  try {
    const sessionUser = req.session.user;

    const doc = await pipelineDBs.OPERATOR.getData({
      filter: { _id: req.params.id },
    });
    if (!doc) {
      ResponseHandler.handleNotFound(res, {
        errorType: "operator-not-found",
        message: "Operator not found",
      });
      return;
    }

    // Handle dumping actions
    const dumpRes = await dumpAdminAction({
      isNew: true,
      dump: {
        collection: "operators",
        data: {},
        metadata: {
          id: doc.id,
          name: doc.brandName || doc.name,
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
      const doc = await pipelineDBs.OPERATOR.getData({
        filter: { _id: req.params.id },
      });
      if (!doc) {
        ResponseHandler.handleNotFound(res, {
          errorType: "operator-not-found",
          message: "Operator not found",
        });
        return;
      }
      ResponseHandler.handleSuccess(res, {
        message: "Operator deleted successfully",
        data: { id: doc.id },
      });
      return;
    }
    ResponseHandler.handleSuccess(res, {
      message: "Dumped operator-removal successfully",
      data: { id: doc.id },
    });
  } catch (err) {
    ResponseHandler.handleError(res, {
      errorType: "delete-operator-error-failure",
      message: "Failed to delete operator",
    });
  }
};

// Password
export const getPassword = async (
  req: ManagedRequest,
  res: ManagedResponse,
) => {
  try {
    const body = req.body;
    const sessionUser = req.session.user;

    let doc = await pipelineDBs.OPERATOR.getData({
      filter: { _id: req.params.id },
      projection: { password: 1, _id: 1 },
    });
    if (!doc) {
      ResponseHandler.handleNotFound(res, {
        errorType: "operator-not-found",
        message: "Operator not found",
      });
      return;
    }

    const decodedPass = decodeCrypto(doc.password);
    const data = { ...convertDataToJSON(doc), decodedPassword: decodedPass };

    ResponseHandler.handleSuccess(res, {
      message: "Operator password retrieved successfully",
      data: data,
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
    ResponseHandler.handleError(res, {
      errorType: "get-operator-password-error-failure",
      message: "Failed to get operator password",
    });
  }
};

export const updatePassword = async (
  req: ManagedRequest<Pick<OperatorSchema, "password">>,
  res: ManagedResponse,
) => {
  try {
    const body = req.body;
    const sessionUser = req.session.user;
    const password = encodeCrypto(body.password);

    let doc = await pipelineDBs.OPERATOR.getData({
      filter: { _id: req.params.id },
      projection: { password: 1, _id: 1 },
    });
    if (!doc) {
      ResponseHandler.handleNotFound(res, {
        errorType: "operator-not-found",
        message: "Operator not found",
      });
      return;
    }

    if (compareCryptos(doc.password, password)) {
      ResponseHandler.handleError(res, {
        errorType: "password-matched",
        message: "New password cannot be the same as the current password",
      });
      return;
    }

    // Handle dumping actions
    const dumpRes = await dumpAdminAction({
      dump: {
        collection: "operators",
        data: { id: req.params.id, password: password },
        metadata: {
          id: req.params.id,
          name: doc.brandName || doc.name,
          description: "Password was updated",
        },
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

    doc = await pipelineDBs.OPERATOR.updateData({
      filter: { _id: req.params.id },
      updateData: { password: password },
      options: {
        new: true,
        projection: { password: 1, _id: 1 },
      },
    });
    if (!doc) {
      ResponseHandler.handleNotFound(res, {
        errorType: "operator-not-found",
        message: "Operator not found",
      });
      return;
    }

    const data = {
      ...convertDataToJSON(doc),
    };
    ResponseHandler.handleSuccess(res, {
      message: "Operator password updated successfully",
      data: data,
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
    ResponseHandler.handleError(res, {
      errorType: "update-operator-password-error-failure",
      message: "Failed to update operator password",
    });
  }
};
