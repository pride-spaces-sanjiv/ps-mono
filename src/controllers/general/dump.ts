import { ResponseHandler } from "@/middlewares/request.js";
import { Dump, dumpFields } from "@/database/models/dump.js";
import { Space } from "@/database/models/space.js";
import { Operator } from "@/database/models/operator.js";
import {
  cleanPaginatedData,
  paginatedResults,
} from "@/utils/mongoose/pagination.js";
import {
  getFieldsandProjectors,
  getSearchFilters,
} from "@/utils/mongoose/filters.js";
import { handleMongooseError } from "@/utils/mongoose/error.js";
import { convertDataToJSON } from "@/utils/mongoose/conversion.js";
import { type AdminSchema } from "@/database/schemas/user.js";
import type { ManagedRequest, ManagedResponse } from "@/types/request.js";
import { cleanObject } from "@/utils/object/clean.js";
import { dumpCollectionNames } from "@/utils/data/dump.js";
import { spaceSchema } from "@/database/schemas/space.js";
import { operatorSchema } from "@/database/schemas/operator.js";
import { validateDataAndRespond } from "@/utils/schemas/validate.js";

export const getDumps = async (
  req: ManagedRequest<any, { [k: string]: any }>,
  res: ManagedResponse,
) => {
  try {
    const selfLevel = req.session.user?.userType;
    const searchFilters = getSearchFilters<typeof Dump>(req, {
      fieldMaps: {
        Collection: "collection",
      },
    });

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
        filter: cleanObject({ ...searchFilters }, { excludeByValues: [""] }),
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
    const { fields, projectors } = getFieldsandProjectors(
      req,
      Dump,
      dumpFields,
    );

    const doc = await Dump.findOne({ _id: req.params.id }, projectors);
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
    const doc = new Dump(body);
    await doc.save();

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
  req: ManagedRequest<{
    collection: (typeof dumpCollectionNames)[keyof typeof dumpCollectionNames];
    data: any;
  }>,
  res: ManagedResponse,
) => {
  try {
    const body = req.body;
    const doc = await Dump.findOneAndUpdate({ _id: req.params.id }, body, {
      new: true,
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
      message: "Updated dump successfully",
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
    const doc = await Dump.findOne({ _id: req.params.id });
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
    const updatedDoc = await model?.findOneAndUpdate(
      { _id: id },
      {
        ...parsed,
        approval: {
          name: req.session.user?.name,
          level: req.session.user?.userType,
          lastRequested: doc.updatedAt,
        },
      },
      { new: true, projection: { password: 0 } },
    );

    ResponseHandler.handleSuccess(res, {
      message: "Approved dump successfully",
      data: convertDataToJSON(updatedDoc),
    });
  } catch (err) {
    ResponseHandler.handleError(res, {
      errorType: "approve-dump-error-failure",
      message: "Failed to approve dump",
    });
  }
};
