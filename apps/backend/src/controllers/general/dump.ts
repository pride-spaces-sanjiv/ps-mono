import { ResponseHandler } from "@/middlewares/request.js";
import {
  allDumpFieldsEnabled,
  Dump,
  dumpFields,
} from "@pride-spaces/backend/database/models/dump.js";
import { Space } from "@pride-spaces/backend/database/models/space.js";
import { Operator } from "@pride-spaces/backend/database/models/operator.js";
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
import type {
  ManagedRequest,
  ManagedResponse,
} from "@pride-spaces/backend/types/request.js";
import { cleanObject } from "@pride-spaces/common/utils/object/clean.js";
import {
  dumpCollectionNames,
  dumpStatuses,
} from "@pride-spaces/common/utils/data/dump.js";
import {
  dumpCollectionModels,
  dumpCollectionSchemas,
} from "@pride-spaces/backend/utils/data/dump-maps.js";
import { spaceSchema } from "@pride-spaces/backend/database/schemas/space.js";
import { operatorSchema } from "@pride-spaces/backend/database/schemas/operator.js";
import { pipelineDBs } from "@pride-spaces/backend/utils/services/pipeline/db.js";
import { validateDataAndRespond } from "@pride-spaces/backend/utils/schemas/validate.js";
import {
  AdminLevel,
  adminLevels,
} from "@pride-spaces/common/utils/data/admin.js";
import {
  NonAdminUserType,
  nonAdminUserTypes,
} from "@pride-spaces/common/utils/data/userTypes.js";
import { ObjectDepthKeys } from "@pride-spaces/backend/types/object.js";
import {
  ModelToDocument,
  ModelToRaw,
} from "@pride-spaces/backend/types/mongoose/document.js";
import { RootFilterQuery } from "mongoose";
import { DumpSchema } from "@pride-spaces/backend/database/schemas/dump.js";
import {
  dumpAdminAction,
  dumpUserAction,
} from "@pride-spaces/backend/utils/data/dumpAction.js";

export const getDumps = async (
  req: ManagedRequest<any, { [k: string]: any }>,
  res: ManagedResponse,
) => {
  try {
    const selfLevel = req.session.user?.userType;

    const searchFilters = getSearchFilters<typeof Dump>(req, {
      fieldMaps: {
        Collection: "collection",
        FromId: "from.id",
        ToId: "to.id",
        FromName: "from.name",
        FromEmail: "from.email",
        ToName: "to.name",
        ToEmail: "to.email",
        Action: "action",
        Status: "status",
      },
    });

    const preLevelFilters: RootFilterQuery<ModelToRaw<typeof Dump>> =
      selfLevel === "support" ||
      nonAdminUserTypes.includes(selfLevel as NonAdminUserType)
        ? {
            $or: [
              { "from.id": req.session.user?.id },
              { "to.id": req.session.user?.id },
            ],
          }
        : {};

    const { fields, projectors } = getFieldsandProjectors(
      req,
      Dump,
      dumpFields,
    );
    const { page, metrics, results, errored, err } = await paginatedResults(
      req,
      Dump,
      dumpFields,
      { limit: 10 },
      {
        projection: projectors,
        filter: cleanObject(
          { ...searchFilters, ...preLevelFilters },
          { excludeByValues: [""] },
        ),
      },
      {
        defaultSortField: "updatedAt",
        defaultSortOrder: "desc",
      },
    );

    // On results error
    if (errored && err) {
      ResponseHandler.handleError(res, {
        errorType: "get-dumps-error",
        message: "Failed to get dumps list",
      });
      return;
    }
    if (results.length === 0) {
      ResponseHandler.handleNotFound(res, {
        errorType: "dumps-not-found",
        message: "No dumps found",
        data: { results, page, metrics },
      });
      return;
    }

    const data = cleanPaginatedData({ results, page, metrics, err, errored });
    ResponseHandler.handleSuccess(res, {
      message: "Got dumps list",
      data,
    });
  } catch (err) {
    ResponseHandler.handleError(res, {
      errorType: "get-dumps-error-failure",
      message: "Failed to get dumps list",
    });
  }
};

export const getDump = async (
  req: ManagedRequest<any, { [k: string]: any }>,
  res: ManagedResponse,
) => {
  try {
    const selfLevel = req.session.user?.userType;

    const { fields, projectors } = getFieldsandProjectors(
      req,
      Dump,
      dumpFields,
    );

    const preLevelFilters: RootFilterQuery<ModelToRaw<typeof Dump>> =
      selfLevel === "support" ||
      nonAdminUserTypes.includes(selfLevel as NonAdminUserType)
        ? {
            $or: [
              { "from.id": req.session.user?.id },
              { "to.id": req.session.user?.id },
            ],
          }
        : {};

    const doc = await pipelineDBs.DUMP.getData({
      filter: { _id: req.params.id, ...preLevelFilters },
      projection: projectors,
    });
    if (!doc) {
      ResponseHandler.handleNotFound(res, {
        errorType: "dump-not-found",
        message: "Dump not found",
      });
      return;
    }

    const data = convertDataToJSON(doc);
    ResponseHandler.handleSuccess(res, {
      message: "Got dump details",
      data: data,
    });
  } catch (err) {
    ResponseHandler.handleError(res, {
      errorType: "get-dump-error-failure",
      message: "Failed to get dump details",
    });
  }
};

export const createDump = async (
  req: ManagedRequest<{
    collection: (typeof dumpCollectionNames)[keyof typeof dumpCollectionNames];
    data: any;
  }>,
  res: ManagedResponse,
) => {
  try {
    const body = req.body;
    const doc = await pipelineDBs.DUMP.createData(body);

    const data = convertDataToJSON(doc);
    ResponseHandler.handleSuccess(res, {
      status: 201,
      message: "Created dump successfully",
      data: data,
    });
  } catch (err: any) {
    const errorData = handleMongooseError(err, res, {
      uniqueError: {
        errorType: "dump-unique-error",
        msgPre: "Dump",
      },
    });
    if (errorData.handled) {
      return;
    }
    ResponseHandler.handleError(res, {
      errorType: "create-dump-error-failure",
      message: "Failed to create dump",
    });
  }
};

export const updateDump = async (
  req: ManagedRequest<
    Omit<
      Partial<DumpSchema>,
      "collection" | "action" | "metadata" | "from" | "to"
    >
  >,
  res: ManagedResponse,
) => {
  try {
    const sessionUser = req.session.user;
    const body = req.body;
    const isHigherAdmin =
      !!sessionUser?.userType &&
      adminLevels.includes(sessionUser.userType as AdminLevel) &&
      sessionUser.userType !== "support";

    const doc = await pipelineDBs.DUMP.getData({
      filter: { _id: req.params.id },
    });
    if (!doc) {
      ResponseHandler.handleNotFound(res, {
        errorType: "dump-not-found",
        message: "Dump not found",
      });
      return;
    }

    // Flag to check if last user who did to action is diff from curr
    const doClone = !!(
      isHigherAdmin &&
      doc.to?.id &&
      doc.to.id !== sessionUser.id
    );

    // Update approved dump in real collection
    if (isHigherAdmin && body.status === dumpStatuses.APPROVED) {
      if (!Object.keys(dumpCollectionModels).includes(doc.collection)) {
        ResponseHandler.handleError(res, {
          errorType: "invalid-dump-collection",
          message: "Invalid dump collection",
        });
        return;
      }

      const model =
        dumpCollectionModels[
          doc.collection as keyof typeof dumpCollectionModels
        ];
      const schema =
        dumpCollectionSchemas[
          doc.collection as keyof typeof dumpCollectionSchemas
        ];

      // Validate data first
      const { error, valid, parsed, handled } = validateDataAndRespond(
        schema as NonNullable<typeof schema>,
        // @ts-ignore
        { ...doc.data, ...body?.data },
        res,
        { extractOnlyRequiredFields: true },
      );
      if (handled) {
        return;
      }
      if (error) {
        throw error;
      }
      if (!valid || !parsed) {
        return ResponseHandler.handleError(res, {
          errorType: "invalid-dump-data",
          message: "Invalid dump data provided",
        });
      }

      const id = parsed.id;
      delete parsed.id;
      // @ts-ignore
      const updatedDoc = await model?.findOneAndUpdate(
        { _id: doc.metadata?.id },
        {
          ...parsed,
          approval: {
            ...sessionUser,
            lastRequested: doc.createdAt,
          },
        },
        { new: true, projection: { password: 0 } },
      );

      if (!updatedDoc) {
        return ResponseHandler.handleError(res, {
          errorType: "dump-push-failure",
          message: "Failed to push dump data to real",
        });
      }

      // ResponseHandler.handleSuccess(res, {
      //   message: "Approved dump successfully",
      //   data: convertDataToJSON(updatedDoc),
      // });
    }

    // Handle dumping actions
    const dumpRes = await dumpUserAction({
      dump: {
        ...body,
        status: doClone
          ? doc.status
          : !isHigherAdmin
            ? dumpStatuses.PENDING
            : body.status,
        disabled:
          doClone || (isHigherAdmin && body.status === dumpStatuses.APPROVED),
      },
      req: req,
      senderDisabled: !!doClone,
      isNew: false,
      id: req.params.id,
    });
    if (dumpRes.disAllowed || dumpRes.levelInvalid) {
      ResponseHandler.handleUnauthorized(res, {
        errorType: "update-dump-unauthorized",
        message: "Dump update was unauthorized",
      });
      return;
    }
    if (dumpRes.notFound || !dumpRes.doc) {
      ResponseHandler.handleNotFound(res, {
        errorType: "dump-not-found",
        message: "Dump not found",
      });
      return;
    }
    if (dumpRes.error) {
      throw dumpRes.error;
    }

    // Handle cloning dump
    if (doClone) {
      const dumpRes = await dumpAdminAction({
        // @ts-ignore
        dump: {
          ...doc.toJSON({ versionKey: false, flattenObjectIds: true }),
          _id: undefined,
          ...body,
          // @ts-ignore
          status:
            sessionUser?.userType === "support"
              ? dumpStatuses.PENDING
              : body.status,
          disabled:
            sessionUser?.userType !== "support" &&
            body.status === dumpStatuses.APPROVED,
        },
        req: req,
        isNew: true,
      });
      if (dumpRes.disAllowed || dumpRes.levelInvalid) {
        ResponseHandler.handleUnauthorized(res, {
          errorType: "new-dump-unauthorized",
          message: "Dump clone was unauthorized",
        });
        return;
      }
      if (dumpRes.notFound || !dumpRes.doc) {
        ResponseHandler.handleNotFound(res, {
          errorType: "dump-not-found",
          message: "Dump not found",
        });
        return;
      }
      if (dumpRes.error) {
        throw dumpRes.error;
      }
    }

    const data = convertDataToJSON(dumpRes.doc);
    ResponseHandler.handleSuccess(res, {
      message: "Updated dump successfully",
      data: data,
    });
  } catch (err: any) {
    console.error("Error updating dump :", err);
    const errorData = handleMongooseError(err, res, {
      uniqueError: {
        errorType: "dump-unique-error",
        msgPre: "Dump",
      },
    });
    if (errorData.handled) {
      return;
    }
    ResponseHandler.handleError(res, {
      errorType: "update-dump-error-failure",
      message: "Failed to update dump",
    });
  }
};

export const approveDump = async (
  req: ManagedRequest<any, { [k: string]: any }>,
  res: ManagedResponse,
) => {
  try {
    const doc = await pipelineDBs.DUMP.getData({
      filter: { _id: req.params.id },
    });
    if (!doc) {
      ResponseHandler.handleNotFound(res, {
        errorType: "dump-not-found",
        message: "Dump not found",
      });
      return;
    }

    const data = convertDataToJSON(doc);
    const model =
      data?.collection === "spaces"
        ? Space
        : data?.collection === "operators"
          ? Operator
          : null;
    const schema =
      data?.collection === "spaces"
        ? spaceSchema
        : data?.collection === "operators"
          ? operatorSchema
          : null;
    const pipelineDB =
      data?.collection === "spaces"
        ? pipelineDBs.SPACE
        : data?.collection === "operators"
          ? pipelineDBs.OPERATOR
          : null;

    // Validate data first
    const { error, valid, parsed, handled } = validateDataAndRespond(
      schema as NonNullable<typeof schema>,
      // @ts-ignore
      data.data,
      res,
      { extractOnlyRequiredFields: true },
    );
    if (handled) {
      return;
    }
    if (error) {
      throw error;
    }
    if (!valid || !parsed) {
      return ResponseHandler.handleError(res, {
        errorType: "invalid-dump-data",
        message: "Invalid dump data provided",
      });
    }

    const id = parsed.id;
    delete parsed.id;
    // @ts-ignore
    const updatedDoc = await pipelineDB?.updateData({
      filter: { _id: id },
      updateData: {
        ...parsed,
        approval: {
          id: req.session.user?.id,
          email: req.session.user?.email,
          name: req.session.user?.name,
          userType: req.session.user?.userType,
          lastRequested: doc.updatedAt,
        },
      },
      options: { new: true, projection: { password: 0 } },
    });

    ResponseHandler.handleSuccess(res, {
      message: "Approved dump successfully",
      data: convertDataToJSON(
        // @ts-ignore
        updatedDoc as
          | ModelToDocument<typeof Space>
          | ModelToDocument<typeof Operator>,
      ),
    });
  } catch (err) {
    ResponseHandler.handleError(res, {
      errorType: "approve-dump-error-failure",
      message: "Failed to approve dump",
    });
  }
};

export const deleteDump = async (
  req: ManagedRequest<any, { [k: string]: any }>,
  res: ManagedResponse,
) => {
  try {
    const doc = await pipelineDBs.DUMP.deleteData({
      filter: { _id: req.params.id },
    });

    if (!doc) {
      ResponseHandler.handleNotFound(res, {
        errorType: "dump-not-found",
        message: "Dump not found",
      });
      return;
    }

    const data = convertDataToJSON(doc);
    ResponseHandler.handleSuccess(res, {
      message: "Deleted dump successfully",
      data: data,
    });
  } catch (err) {
    ResponseHandler.handleError(res, {
      errorType: "delete-dump-error-failure",
      message: "Failed to delete dump",
    });
  }
};
