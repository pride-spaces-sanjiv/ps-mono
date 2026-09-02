import { ResponseHandler } from "@/middlewares/request.js";
import {
  Space,
  spaceFields,
} from "@pride-spaces/backend/database/models/space.js";
import { Dump } from "@pride-spaces/backend/database/models/dump.js";
import { getSpaceOperatorsData } from "@pride-spaces/backend/utils/mongoose/relations/space-operator.js";
import * as generalControllers from "@/controllers/general/space.js";
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
import {
  AdminLevel,
  adminLevels,
} from "@pride-spaces/common/utils/data/admin.js";
// types
import type {
  ManagedRequest,
  ManagedResponse,
} from "@pride-spaces/backend/types/request.js";
import { SpaceSchema } from "@pride-spaces/backend/database/schemas/space.js";
import { ModelToDocument } from "@pride-spaces/backend/types/mongoose/document.js";
import { dumpStatuses } from "@pride-spaces/common/utils/data/dump.js";
import { dumpAdminAction } from "@pride-spaces/backend/utils/data/dumpAction.js";
import { Types } from "mongoose";
import { pipelineDBs } from "@pride-spaces/backend/utils/services/pipeline/db.js";
import { generateSpaceKeyword } from "@pride-spaces/common/utils/data/name-keyword.js";

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
    const selfId = req.session.user?.id;
    await generalControllers.getSpaces(req, res);
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
    const selfLevel = req.session.user?.userType;
    const selfId = req.session.user?.id;
    await generalControllers.getSpace(req, res);
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

    await generalControllers.createSpace(req, res, {
      onlyDump: false,
      dumpArgs: {
        dump: {
          status:
            sessionUser?.userType === "support"
              ? dumpStatuses.PENDING
              : dumpStatuses.APPROVED,
        },
      },
      skipDump: true,
    });
  } catch (err: any) {
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
    const sessionUser = req.session.user;
    const body = req.body;

    await generalControllers.updateSpace(req, res, {
      onlyDump: false,
      dumpArgs: {
        dump: {
          status:
            sessionUser?.userType === "support"
              ? dumpStatuses.PENDING
              : dumpStatuses.APPROVED,
        },
      },
      skipDump: true,
    });
  } catch (err: any) {
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

    await generalControllers.deleteSpace(req, res, {
      onlyDump: false,
      dumpArgs: {
        dump: {
          status:
            sessionUser?.userType === "support"
              ? dumpStatuses.PENDING
              : dumpStatuses.APPROVED,
        },
      },
      skipDump: true,
    });
  } catch (err) {
    ResponseHandler.handleError(res, {
      errorType: "delete-space-error-failure",
      message: "Failed to delete space",
    });
  }
};
