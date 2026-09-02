import { ResponseHandler } from "@/middlewares/request.js";
import {
  User,
  userNonPassFields,
} from "@pride-spaces/backend/database/models/user.js";
import {
  cleanPaginatedData,
  paginatedResults,
} from "@pride-spaces/backend/utils/mongoose/pagination.js";
import { getFieldsandProjectors } from "@pride-spaces/backend/utils/mongoose/filters.js";
import { handleMongooseError } from "@pride-spaces/backend/utils/mongoose/error.js";
import { convertDataToJSON } from "@pride-spaces/backend/utils/mongoose/conversion.js";
import { encodeCrypto } from "@pride-spaces/common/utils/crypto.js";
import type {
  ManagedRequest,
  ManagedResponse,
} from "@pride-spaces/backend/types/request.js";
import { UserSchema } from "@pride-spaces/common/utils/schemas/user.js";

export const getUsers = async (
  req: ManagedRequest<any, { [k: string]: any }>,
  res: ManagedResponse,
) => {
  try {
    const selfLevel = req.session.user?.userType;

    const { fields, projectors } = getFieldsandProjectors(
      req,
      User,
      userNonPassFields,
    );
    const { page, metrics, results, errored, err } = await paginatedResults(
      req,
      User,
      userNonPassFields,
      { limit: 10 },
      { projection: projectors },
    );

    // On results error
    if (errored && err) {
      ResponseHandler.handleError(res, {
        errorType: "get-users-error",
        message: "Failed to get users list",
      });
      return;
    }
    if (results.length === 0) {
      ResponseHandler.handleNotFound(res, {
        errorType: "users-not-found",
        message: "No users found",
        data: { results, page, metrics },
      });
      return;
    }

    const data = cleanPaginatedData({ results, page, metrics, err, errored });
    ResponseHandler.handleSuccess(res, {
      message: "Got users list",
      data: data,
    });
  } catch (err) {
    ResponseHandler.handleError(res, {
      errorType: "get-users-error-failure",
      message: "Failed to get users list",
    });
  }
};

export const getUser = async (
  req: ManagedRequest<any, { [k: string]: any }>,
  res: ManagedResponse,
) => {
  try {
    const { fields, projectors } = getFieldsandProjectors(
      req,
      User,
      userNonPassFields,
    );

    const doc = await User.findOne({ _id: req.params.id }, projectors);
    if (!doc) {
      ResponseHandler.handleNotFound(res, {
        errorType: "user-not-found",
        message: "User not found",
      });
      return;
    }

    const data = convertDataToJSON(doc);
    ResponseHandler.handleSuccess(res, {
      data: data,
    });
  } catch (err) {
    ResponseHandler.handleError(res, {
      errorType: "get-user-error-failure",
      message: "Failed to get user details",
    });
  }
};

export const createUser = async (
  req: ManagedRequest<UserSchema>,
  res: ManagedResponse,
) => {
  try {
    const body = req.body;
    const encodedPass = encodeCrypto(body.password);
    const doc = new User({
      ...body,
      password: encodedPass,
    });
    await doc.save();

    const data = convertDataToJSON(doc);
    ResponseHandler.handleSuccess(res, {
      status: 201,
      message: "Created user successfully",
      data: data,
    });
  } catch (err: any) {
    const errorData = handleMongooseError(err, res, {
      uniqueError: {
        errorType: "user-unique-error",
        msgPre: "User",
      },
    });
    if (errorData.handled) {
      return;
    }
    ResponseHandler.handleError(res, {
      errorType: "create-user-error-failure",
      message: "Failed to create user",
    });
  }
};

export const updateUser = async (
  req: ManagedRequest<Omit<UserSchema, "password">>,
  res: ManagedResponse,
) => {
  try {
    const body = req.body;
    const doc = await User.findOneAndUpdate({ _id: req.params.id }, body, {
      new: true,
    });
    if (!doc) {
      ResponseHandler.handleNotFound(res, {
        errorType: "user-not-found",
        message: "User not found",
      });
      return;
    }

    const data = convertDataToJSON(doc);
    ResponseHandler.handleSuccess(res, {
      data: data,
    });
  } catch (err: any) {
    const errorData = handleMongooseError(err, res, {
      uniqueError: {
        errorType: "user-unique-error",
        msgPre: "User",
      },
    });
    if (errorData.handled) {
      return;
    }
    ResponseHandler.handleError(res, {
      errorType: "update-user-error-failure",
      message: "Failed to update user details",
    });
  }
};

export const deleteUser = async (req: ManagedRequest, res: ManagedResponse) => {
  try {
    const doc = await User.findOneAndDelete({ _id: req.params.id });
    if (!doc) {
      ResponseHandler.handleNotFound(res, {
        errorType: "user-not-found",
        message: "User not found",
      });
      return;
    }

    const data = convertDataToJSON(doc);
    ResponseHandler.handleSuccess(res, {
      data: { id: data?.id },
    });
  } catch (err) {
    ResponseHandler.handleError(res, {
      errorType: "delete-user-error-failure",
      message: "Failed to delete user",
    });
  }
};
