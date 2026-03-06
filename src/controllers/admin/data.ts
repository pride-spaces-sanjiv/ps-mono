import { ResponseHandler } from "@/middlewares/request.js";
import { Admin, adminNonPassFields } from "@/database/models/user.js";
import {
  cleanPaginatedData,
  paginatedResults,
} from "@/utils/mongoose/pagination.js";
import { getFieldsandProjectors } from "@/utils/mongoose/filters.js";
import { handleMongooseError } from "@/utils/mongoose/error.js";
import { convertDataToJSON } from "@/utils/mongoose/conversion.js";
import { encodeCrypto } from "@/utils/crypto.js";
import { AdminLevel, getAdminLowerLevels } from "@/utils/data/admin.js";
import { type AdminSchema } from "@/database/schemas/user.js";
import type { ManagedRequest, ManagedResponse } from "@/types/request.js";

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

    const doc = await Admin.findOne({ _id: req.session.user?.id }, projectors);
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

export const updateAdmin = async (
  req: ManagedRequest<Omit<AdminSchema, "password">>,
  res: ManagedResponse,
) => {
  try {
    const body = req.body;
    const doc = await Admin.findOneAndUpdate(
      { _id: req.session.user?.id },
      body,
      {
        new: true,
      },
    );
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
  } catch (err: any) {
    const errorData = handleMongooseError(err, res, {
      uniqueError: {
        errorType: "admin-unique-error",
        msgPre: "Admin",
      },
    });
    if (errorData.handled) {
      return;
    }
    ResponseHandler.handleError(res, {
      errorType: "update-admin-error-failure",
      message: "Failed to update admin",
    });
  }
};
