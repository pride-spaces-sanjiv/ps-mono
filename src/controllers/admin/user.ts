import { ResponseHandler } from "@/middlewares/request.js";
import { User, userNonPassFields } from "@/database/models/user.js";
import { paginatedResults } from "@/utils/mongoose/pagination.js";
import { getFieldsandProjectors } from "@/utils/mongoose/filters.js";
import { convertDataToJSON } from "@/utils/mongoose/conversion.js";
import { encodeCrypto } from "@/utils/crypto.js";
import { AdminLevel, getAdminLowerLevels } from "@/utils/data/admin.js";
import type { ManagedRequest, ManagedResponse } from "@/types/request.js";
import { EnterpriseSchema } from "@/database/schemas/enterprise.js";
import { UserSchema } from "@/database/schemas/user.js";

export const getUsers = async (
  req: ManagedRequest<any, { [k: string]: any }>,
  res: ManagedResponse,
) => {
  try {
    const selfLevel = req.session.user?.userType;
    const lowerLevels = getAdminLowerLevels(selfLevel as AdminLevel);
    console.log(lowerLevels);

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

    ResponseHandler.handleSuccess(res, {
      message: "Got users list",
      data: { results, page, metrics },
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
      message: "Failed to get user",
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
  } catch (err) {
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
  } catch (err) {
    ResponseHandler.handleError(res, {
      errorType: "update-user-error-failure",
      message: "Failed to update user",
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
