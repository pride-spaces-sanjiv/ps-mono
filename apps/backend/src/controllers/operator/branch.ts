import { ResponseHandler } from "@/middlewares/request.js";
import {
  Branch,
  branchFields,
} from "@pride-spaces/backend/database/models/branch.js";
import {
  cleanPaginatedData,
  paginatedResults,
} from "@pride-spaces/backend/utils/mongoose/pagination.js";
import { getFieldsandProjectors } from "@pride-spaces/backend/utils/mongoose/filters.js";
import { handleMongooseError } from "@pride-spaces/backend/utils/mongoose/error.js";
import { convertDataToJSON } from "@pride-spaces/backend/utils/mongoose/conversion.js";
import { cleanObject } from "@pride-spaces/common/utils/object/clean.js";
import type {
  ManagedRequest,
  ManagedResponse,
} from "@pride-spaces/backend/types/request.js";
import { BranchSchema } from "@pride-spaces/backend/database/schemas/branch.js";

export const getBranches = async (
  req: ManagedRequest<any, { [k: string]: any }>,
  res: ManagedResponse,
) => {
  try {
    const selfId = req.session.user?.id;

    const { fields, projectors } = getFieldsandProjectors(
      req,
      Branch,
      branchFields,
    );
    const { page, metrics, results, errored, err } = await paginatedResults(
      req,
      Branch,
      branchFields,
      { limit: 10 },
      {
        projection: projectors,
        filter: cleanObject({ operator: selfId }, { excludeByValues: [""] }),
      },
    );

    // On results error
    if (errored && err) {
      ResponseHandler.handleError(res, {
        errorType: "get-branches-error",
        message: "Failed to get branches list",
      });
      return;
    }
    if (results.length === 0) {
      ResponseHandler.handleNotFound(res, {
        errorType: "branches-not-found",
        message: "No branches found",
        data: { results, page, metrics },
      });
      return;
    }

    const data = cleanPaginatedData({ results, page, metrics, err, errored });
    ResponseHandler.handleSuccess(res, {
      message: "Got branches list",
      data: data,
    });
  } catch (err) {
    ResponseHandler.handleError(res, {
      errorType: "get-branches-error-failure",
      message: "Failed to get branches list",
    });
  }
};

export const getBranch = async (
  req: ManagedRequest<any, { [k: string]: any }>,
  res: ManagedResponse,
) => {
  try {
    const { fields, projectors } = getFieldsandProjectors(
      req,
      Branch,
      branchFields,
    );

    const doc = await Branch.findOne(
      { _id: req.params.id, operator: req.session.user?.id },
      projectors,
    );
    if (!doc) {
      ResponseHandler.handleNotFound(res, {
        errorType: "branch-not-found",
        message: "Branch not found",
      });
      return;
    }

    const data = convertDataToJSON(doc);
    ResponseHandler.handleSuccess(res, {
      data: data,
    });
  } catch (err) {
    ResponseHandler.handleError(res, {
      errorType: "get-branch-error-failure",
      message: "Failed to get branch details",
    });
  }
};

export const createBranch = async (
  req: ManagedRequest<Omit<BranchSchema, "operator">>,
  res: ManagedResponse,
) => {
  try {
    const body = req.body;
    const doc = new Branch({ ...body, operator: req.session.user?.id });
    await doc.save();

    const data = convertDataToJSON(doc);
    ResponseHandler.handleSuccess(res, {
      status: 201,
      message: "Created branch successfully",
      data: data,
    });
  } catch (err: any) {
    const errorData = handleMongooseError(err, res, {
      uniqueError: {
        errorType: "branch-unique-error",
        msgPre: "Branch",
      },
    });
    if (errorData.handled) {
      return;
    }
    ResponseHandler.handleError(res, {
      errorType: "create-branch-error-failure",
      message: "Failed to create branch",
    });
  }
};

export const updateBranch = async (
  req: ManagedRequest<Omit<BranchSchema, "operator">>,
  res: ManagedResponse,
) => {
  try {
    const body = req.body;
    const doc = await Branch.findOneAndUpdate(
      { _id: req.params.id, operator: req.session.user?.id },
      body,
      {
        new: true,
      },
    );
    if (!doc) {
      ResponseHandler.handleNotFound(res, {
        errorType: "branch-not-found",
        message: "Branch not found",
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
        errorType: "branch-unique-error",
        msgPre: "Branch",
      },
    });
    if (errorData.handled) {
      return;
    }
    ResponseHandler.handleError(res, {
      errorType: "update-branch-error-failure",
      message: "Failed to update branch details",
    });
  }
};

export const deleteBranch = async (
  req: ManagedRequest,
  res: ManagedResponse,
) => {
  try {
    const doc = await Branch.findOneAndDelete({
      _id: req.params.id,
      operator: req.session.user?.id,
    });
    if (!doc) {
      ResponseHandler.handleNotFound(res, {
        errorType: "branch-not-found",
        message: "Branch not found",
      });
      return;
    }

    const data = convertDataToJSON(doc);
    ResponseHandler.handleSuccess(res, {
      data: { id: data?.id },
    });
  } catch (err) {
    ResponseHandler.handleError(res, {
      errorType: "delete-branch-error-failure",
      message: "Failed to delete branch",
    });
  }
};
