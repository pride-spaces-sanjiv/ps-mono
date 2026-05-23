import { ResponseHandler } from "@/middlewares/request.js";
import { Space, spaceFields } from "@/database/models/space.js";
import { Dump } from "@/database/models/dump.js";
import { getSpaceOperatorsData } from "@/utils/mongoose/relations/space-operator.js";
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
import { cleanObject } from "@/utils/object/clean.js";
import { AdminLevel, adminLevels } from "@/utils/data/admin.js";
// types
import type { ManagedRequest, ManagedResponse } from "@/types/request.js";
import { SpaceSchema } from "@/database/schemas/space.js";
import { ModelToDocument } from "@/types/mongoose/document.js";

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
    const branchId = (req.query?.branch || "").trim();
    const operatorId = (req.query?.operator || "").trim();
    const withOperator =
      String(req.query?.withOperator || "").toLowerCase() === "true";

    const { fields, projectors } = getFieldsandProjectors(
      req,
      Space,
      spaceFields,
    );
    const searchFilters = getSearchFilters<typeof Space>(req, {
      fieldMaps: {
        Name: "name",
        Email: "person.email",
        City: "location.city",
        State: "location.state",
      },
    });
    const { page, metrics, results, errored, err } = await paginatedResults(
      req,
      Space,
      spaceFields,
      { limit: 10 },
      {
        projection: projectors,
        filter: cleanObject(
          { operator: operatorId, branch: branchId, ...searchFilters },
          { excludeByValues: [""] },
        ),
      },
    );

    // On results error
    if (errored && err) {
      ResponseHandler.handleError(res, {
        errorType: "get-spaces-error",
        message: "Failed to get spaces list",
      });
      return;
    }
    if (results.length === 0) {
      ResponseHandler.handleNotFound(res, {
        errorType: "spaces-not-found",
        message: "No spaces found",
        data: { results, page, metrics },
      });
      return;
    }

    const data = cleanPaginatedData({ results, page, metrics, err, errored });
    const operators = withOperator
      ? (
          await getSpaceOperatorsData(
            data.results.map((space) => space.operator),
          )
        )
          // @ts-ignore
          .map((d) => convertDataToJSON(d))
      : [];
    ResponseHandler.handleSuccess(res, {
      message: "Got spaces list",
      data: {
        ...data,
        references: withOperator
          ? {
              operators: {
                results: operators,
                metrics: { total: operators.length },
              },
            }
          : undefined,
      },
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
    const { fields, projectors } = getFieldsandProjectors(
      req,
      Space,
      spaceFields,
    );
    const withOperator =
      String(req.query?.withOperator || "").toLowerCase() === "true";

    const doc = await Space.findOne({ _id: req.params.id }, projectors);
    if (!doc) {
      ResponseHandler.handleNotFound(res, {
        errorType: "space-not-found",
        message: "Space not found",
      });
      return;
    }

    const data = convertDataToJSON(doc);
    const operators = withOperator
      ? (await getSpaceOperatorsData([data?.operator as string])).map((d) =>
          // @ts-ignore
          convertDataToJSON(d),
        )
      : [];
    ResponseHandler.handleSuccess(res, {
      data: {
        ...data,
        references: withOperator ? { operator: operators[0] } : undefined,
      },
    });
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
    const body = req.body;
    const doc = new Space(body);
    await doc.save();

    const data = convertDataToJSON(doc);
    ResponseHandler.handleSuccess(res, {
      status: 201,
      message: "Created space successfully",
      data: data,
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
      errorType: "create-user-error-failure",
      message: "Failed to create user",
    });
  }
};

export const updateSpace = async (
  req: ManagedRequest<Omit<SpaceSchema, "branch" | "operator">>,
  res: ManagedResponse,
) => {
  try {
    const body = req.body;
    const sessionUser = req.session.user;
    let doc: ModelToDocument<typeof Space> | null = null;

    // For support admin
    if (
      sessionUser?.userType &&
      adminLevels.includes(sessionUser?.userType as AdminLevel) &&
      sessionUser?.userType === "support"
    ) {
      doc = await Space.findOne({ _id: req.params.id });
      if (!doc) {
        ResponseHandler.handleNotFound(res, {
          errorType: "space-not-found",
          message: "Space not found",
        });
        return;
      }
      const newDump = new Dump({
        collection: "spaces",
        data: { ...body, isActive: undefined, id: req.params.id },
        action: "update",
        user: sessionUser,
      });
      try {
        await newDump.save();
      } catch (err) {
        console.error("Saving spacedump error :", err);
        ResponseHandler.handleError(res, {
          errorType: "update-space-dump-failure",
          message: "Failed to dump-update space details",
        });
        return;
      }
    } else {
      doc = await Space.findOneAndUpdate({ _id: req.params.id }, body, {
        new: true,
      });
      if (!doc) {
        ResponseHandler.handleNotFound(res, {
          errorType: "space-not-found",
          message: "Space not found",
        });
        return;
      }
    }

    const data = convertDataToJSON(doc);
    ResponseHandler.handleSuccess(res, {
      data: data,
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
    const doc = await Space.findOneAndDelete({ _id: req.params.id });
    if (!doc) {
      ResponseHandler.handleNotFound(res, {
        errorType: "space-not-found",
        message: "Space not found",
      });
      return;
    }

    const data = convertDataToJSON(doc);
    ResponseHandler.handleSuccess(res, {
      data: { id: data?.id },
    });
  } catch (err) {
    ResponseHandler.handleError(res, {
      errorType: "delete-space-error-failure",
      message: "Failed to delete space",
    });
  }
};
