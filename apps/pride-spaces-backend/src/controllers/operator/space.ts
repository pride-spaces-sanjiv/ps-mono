import { ResponseHandler } from "@/middlewares/request.js";
import type { ManagedRequest, ManagedResponse } from "@/types/request.js";
import { SpaceSchema } from "@/database/schemas/space.js";
import * as generalControllers from "../general/space.js";
import { dumpStatuses } from "@/utils/data/dump.js";
import { handleMongooseError } from "@/utils/mongoose/error.js";

export const getSpaces = async (
  req: ManagedRequest<
    any,
    { [k: string]: any } & Partial<{ operator: string; branch: string }>
  >,
  res: ManagedResponse,
) => {
  try {
    const selfId = req.session.user?.id;
    await generalControllers.getSpaces(req, res, {
      preFilters: { operator: selfId },
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
    const selfId = req.session.user?.id;
    await generalControllers.getSpace(req, res, {
      preFilters: { operator: selfId },
    });
  } catch (err) {
    ResponseHandler.handleError(res, {
      errorType: "get-space-error-failure",
      message: "Failed to get space details",
    });
  }
};

export const createSpace = async (
  req: ManagedRequest<Omit<SpaceSchema, "operator">>,
  res: ManagedResponse,
) => {
  try {
    const selfId = req.session.user?.id;
    await generalControllers.createSpace(req, res, {
      preBody: { operator: selfId },
      onlyDump: true,
      dumpArgs: { dump: { status: dumpStatuses.PENDING } },
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
    const body = req.body;
    const selfId = req.session.user?.id;
    await generalControllers.updateSpace(req, res, {
      preFilters: { operator: selfId },
      onlyDump: true,
      dumpArgs: { dump: { status: dumpStatuses.PENDING } },
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
    const body = req.body;
    const selfId = req.session.user?.id;
    await generalControllers.deleteSpace(req, res, {
      preFilters: { operator: selfId },
      onlyDump: true,
      dumpArgs: { dump: { status: dumpStatuses.PENDING } },
    });
  } catch (err) {
    ResponseHandler.handleError(res, {
      errorType: "delete-space-error-failure",
      message: "Failed to delete space",
    });
  }
};
