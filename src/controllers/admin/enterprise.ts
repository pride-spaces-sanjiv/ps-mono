import { ResponseHandler } from "@/middlewares/request.js";
import {
  Enterprise,
  enterpriseNonPassFields,
} from "@/database/models/enterprise.js";
import {
  cleanPaginatedData,
  paginatedResults,
} from "@/utils/mongoose/pagination.js";
import { getFieldsandProjectors } from "@/utils/mongoose/filters.js";
import { convertDataToJSON } from "@/utils/mongoose/conversion.js";
import { encodeCrypto } from "@/utils/crypto.js";
import { AdminLevel, getAdminLowerLevels } from "@/utils/data/admin.js";
import type { ManagedRequest, ManagedResponse } from "@/types/request.js";
import { EnterpriseSchema } from "@/database/schemas/enterprise.js";

export const getEnterprises = async (
  req: ManagedRequest<any, { [k: string]: any }>,
  res: ManagedResponse,
) => {
  try {
    const selfLevel = req.session.user?.userType;
    const lowerLevels = getAdminLowerLevels(selfLevel as AdminLevel);
    console.log(lowerLevels);

    const { fields, projectors } = getFieldsandProjectors(
      req,
      Enterprise,
      enterpriseNonPassFields,
    );
    const { page, metrics, results, errored, err } = await paginatedResults(
      req,
      Enterprise,
      enterpriseNonPassFields,
      { limit: 10 },
      { projection: projectors },
    );

    // On results error
    if (errored && err) {
      ResponseHandler.handleError(res, {
        errorType: "get-enterprises-error",
        message: "Failed to get enterprises list",
      });
      return;
    }
    if (results.length === 0) {
      ResponseHandler.handleNotFound(res, {
        errorType: "enterprises-not-found",
        message: "No enterprises found",
        data: { results, page, metrics },
      });
      return;
    }

    const data = cleanPaginatedData({ results, page, metrics, err, errored });
    ResponseHandler.handleSuccess(res, {
      message: "Got enterprises list",
      data: data,
    });
  } catch (err) {
    ResponseHandler.handleError(res, {
      errorType: "get-enterprises-error-failure",
      message: "Failed to get enterprises list",
    });
  }
};

export const getEnterprise = async (
  req: ManagedRequest<any, { [k: string]: any }>,
  res: ManagedResponse,
) => {
  try {
    const { fields, projectors } = getFieldsandProjectors(
      req,
      Enterprise,
      enterpriseNonPassFields,
    );

    const doc = await Enterprise.findOne({ _id: req.params.id }, projectors);
    if (!doc) {
      ResponseHandler.handleNotFound(res, {
        errorType: "enterprise-not-found",
        message: "Enterprise not found",
      });
      return;
    }

    const data = convertDataToJSON(doc);
    ResponseHandler.handleSuccess(res, {
      data: data,
    });
  } catch (err) {
    ResponseHandler.handleError(res, {
      errorType: "get-enterprise-error-failure",
      message: "Failed to get enterprise details",
    });
  }
};

export const createEnterprise = async (
  req: ManagedRequest<EnterpriseSchema>,
  res: ManagedResponse,
) => {
  try {
    const body = req.body;
    const encodedPass = encodeCrypto(body.password);
    const doc = new Enterprise({
      ...body,
      password: encodedPass,
    });
    await doc.save();

    const data = convertDataToJSON(doc);
    ResponseHandler.handleSuccess(res, {
      status: 201,
      message: "Created enterprise successfully",
      data: data,
    });
  } catch (err) {
    ResponseHandler.handleError(res, {
      errorType: "create-enterprise-error-failure",
      message: "Failed to create enterprise",
    });
  }
};

export const updateEnterprise = async (
  req: ManagedRequest<Omit<EnterpriseSchema, "password">>,
  res: ManagedResponse,
) => {
  try {
    const body = req.body;
    const doc = await Enterprise.findOneAndUpdate(
      { _id: req.params.id },
      body,
      {
        new: true,
      },
    );
    if (!doc) {
      ResponseHandler.handleNotFound(res, {
        errorType: "enterprise-not-found",
        message: "Enterprise not found",
      });
      return;
    }

    const data = convertDataToJSON(doc);
    ResponseHandler.handleSuccess(res, {
      data: data,
    });
  } catch (err) {
    ResponseHandler.handleError(res, {
      errorType: "update-enterprise-error-failure",
      message: "Failed to update enterprise details",
    });
  }
};

export const deleteEnterprise = async (
  req: ManagedRequest,
  res: ManagedResponse,
) => {
  try {
    const doc = await Enterprise.findOneAndDelete({ _id: req.params.id });
    if (!doc) {
      ResponseHandler.handleNotFound(res, {
        errorType: "enterprise-not-found",
        message: "Enterprise not found",
      });
      return;
    }

    ResponseHandler.handleSuccess(res, {
      data: { id: doc.id },
    });
  } catch (err) {
    ResponseHandler.handleError(res, {
      errorType: "delete-enterprise-error-failure",
      message: "Failed to delete enterprise",
    });
  }
};
