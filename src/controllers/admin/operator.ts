import { ResponseHandler } from "@/middlewares/request.js";
import * as generalControllers from "@/controllers/general/operator.js";
import { handleMongooseError } from "@/utils/mongoose/error.js";
import { compareCryptos } from "@/utils/crypto.js";
// types
import type { ManagedRequest, ManagedResponse } from "@/types/request.js";
import { OperatorSchema } from "@/database/schemas/operator.js";
import { dumpStatuses } from "@/utils/data/dump.js";

export const getOperators = async (
  req: ManagedRequest<any, { [k: string]: any }>,
  res: ManagedResponse,
) => {
  try {
    await generalControllers.getOperators(req, res);
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
    await generalControllers.getOperator(req, res);
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

    await generalControllers.createOperator(req, res, {
      onlyDump: sessionUser?.userType && sessionUser?.userType === "support",
      dumpDataHandle: (dt) => ({ ...dt, isActive: undefined }),
      dumpArgs: {
        dump: {
          status:
            sessionUser?.userType === "support"
              ? dumpStatuses.PENDING
              : dumpStatuses.APPROVED,
        },
      },
      preOptions: { projection: { password: 0 } },
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

    await generalControllers.updateOperator(req, res, {
      onlyDump: sessionUser?.userType && sessionUser?.userType === "support",
      dumpDataHandle: (dt) => ({ ...dt, isActive: undefined }),
      dumpArgs: {
        dump: {
          status:
            sessionUser?.userType === "support"
              ? dumpStatuses.PENDING
              : dumpStatuses.APPROVED,
        },
      },
      preOptions: { projection: { password: 0 } },
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

    await generalControllers.deleteOperator(req, res, {
      onlyDump: sessionUser?.userType && sessionUser?.userType === "support",
      dumpArgs: {
        dump: {
          status:
            sessionUser?.userType === "support"
              ? dumpStatuses.PENDING
              : dumpStatuses.APPROVED,
        },
      },
      preOptions: { projection: { password: 0 } },
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

    await generalControllers.getOperator(req, res, {
      preProjections: { password: 1, createdAt: 1, updatedAt: 1 },
      response: {
        success: { message: "Operator password retrieved successfully" },
      },
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

    await generalControllers.updateOperator(req, res, {
      onlyDump: sessionUser?.userType && sessionUser?.userType === "support",
      dumpDataHandle: (dt) => ({ ...dt, isActive: undefined }),
      proceedToProcess: (body, doc) => {
        if (compareCryptos(doc?.password, body.password)) {
          ResponseHandler.handleError(res, {
            errorType: "password-matched",
            message: "New password cannot be the same as the current password",
          });
          return false;
        }
        return true;
      },
      dumpArgs: {
        dump: {
          status:
            sessionUser?.userType === "support"
              ? dumpStatuses.PENDING
              : dumpStatuses.APPROVED,
        },
      },
      preOptions: { projection: { password: 1, createdAt: 1, updatedAt: 1 } },
      response: {
        success: { message: "Operator password updated successfully" },
      },
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
