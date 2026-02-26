import { ResponseHandler } from "@/middlewares/request.js";
import { Admin, adminNonPassFields } from "@/database/models/user.js";
import {
  cleanPaginatedData,
  paginatedResults,
} from "@/utils/mongoose/pagination.js";
import { getFieldsandProjectors } from "@/utils/mongoose/filters.js";
import { convertDataToJSON } from "@/utils/mongoose/conversion.js";
import { encodeCrypto } from "@/utils/crypto.js";
import { AdminLevel, getAdminLowerLevels } from "@/utils/data/admin.js";
import { type AdminSchema } from "@/database/schemas/user.js";
import type { ManagedRequest, ManagedResponse } from "@/types/request.js";

export const getAdmins = async (
  req: ManagedRequest<any, { [k: string]: any }>,
  res: ManagedResponse,
) => {
  try {
    const selfLevel = req.session.user?.userType;
    const lowerLevels = getAdminLowerLevels(selfLevel as AdminLevel);
    console.log(lowerLevels);

    const { fields, projectors } = getFieldsandProjectors(
      req,
      Admin,
      adminNonPassFields,
    );
    const { page, metrics, results, errored, err } = await paginatedResults(
      req,
      Admin,
      adminNonPassFields,
      { limit: 10 },
      { projection: projectors, filter: { level: { $in: lowerLevels } } },
    );

    // On results error
    if (errored && err) {
      ResponseHandler.handleError(res, {
        errorType: "get-admins-error",
        message: "Failed to get admins list",
      });
      return;
    }
    if (results.length === 0) {
      ResponseHandler.handleNotFound(res, {
        errorType: "admins-not-found",
        message: "No admins found",
        data: { results, page, metrics },
      });
      return;
    }

    const data = cleanPaginatedData({ results, page, metrics, err, errored });
    ResponseHandler.handleSuccess(res, {
      message: "Got admins list",
      data,
    });
  } catch (err) {
    ResponseHandler.handleError(res, {
      errorType: "get-admins-error-failure",
      message: "Failed to get admins list",
    });
  }
};

export const getAdmin = async (
  req: ManagedRequest<any, { [k: string]: any }>,
  res: ManagedResponse,
) => {
  try {
    const { fields, projectors } = getFieldsandProjectors(
      req,
      Admin,
      adminNonPassFields,
    );

    const doc = await Admin.findOne({ _id: req.params.id }, projectors);
    if (!doc) {
      ResponseHandler.handleNotFound(res, {
        errorType: "admin-not-found",
        message: "Admin not found",
      });
      return;
    }

    const data = convertDataToJSON(doc);
    ResponseHandler.handleSuccess(res, {
      message: "Got admin details",
      data: data,
    });
  } catch (err) {
    ResponseHandler.handleError(res, {
      errorType: "get-admin-error-failure",
      message: "Failed to get admin details",
    });
  }
};

export const createAdmin = async (
  req: ManagedRequest<AdminSchema>,
  res: ManagedResponse,
) => {
  try {
    const body = req.body;
    const encodedPass = encodeCrypto(body.password);
    const doc = new Admin({
      ...body,
      password: encodedPass,
    });
    await doc.save();

    const data = convertDataToJSON(doc);
    ResponseHandler.handleSuccess(res, {
      status: 201,
      message: "Created admin successfully",
      data: data,
    });
  } catch (err) {
    ResponseHandler.handleError(res, {
      errorType: "create-admin-error-failure",
      message: "Failed to create admin",
    });
  }
};

export const updateAdmin = async (
  req: ManagedRequest<Omit<AdminSchema, "password">>,
  res: ManagedResponse,
) => {
  try {
    const body = req.body;
    const doc = await Admin.findOneAndUpdate({ _id: req.params.id }, body, {
      new: true,
    });
    if (!doc) {
      ResponseHandler.handleNotFound(res, {
        errorType: "admin-not-found",
        message: "Admin not found",
      });
      return;
    }

    const data = convertDataToJSON(doc);
    ResponseHandler.handleSuccess(res, {
      message: "Updated admin successfully",
      data: data,
    });
  } catch (err) {
    ResponseHandler.handleError(res, {
      errorType: "update-admin-error-failure",
      message: "Failed to update admin",
    });
  }
};
