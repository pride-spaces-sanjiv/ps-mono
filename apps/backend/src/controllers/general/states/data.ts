import { ResponseHandler } from "@/middlewares/request.js";
import { State, stateFields } from "@pride-spaces/backend/database/models/state-cities.js";
import {
  cleanPaginatedData,
  paginatedResults,
} from "@pride-spaces/backend/utils/mongoose/pagination.js";
import {
  getFieldsandProjectors,
  getSearchFilters,
} from "@pride-spaces/backend/utils/mongoose/filters.js";
import { convertDataToJSON } from "@pride-spaces/backend/utils/mongoose/conversion.js";
import { cleanObject } from "@pride-spaces/common/utils/object/clean.js";
import type { ManagedRequest, ManagedResponse } from "@/types/request.js";

export const getStates = async (
  req: ManagedRequest<any>,
  res: ManagedResponse,
) => {
  try {
    const { fields, projectors } = getFieldsandProjectors(
      req,
      State,
      stateFields,
    );

    const searchFilters = getSearchFilters<typeof State>(req, {
      fieldMaps: {
        Name: "name",
        Code: "code",
      },
    });

    const { page, metrics, results, errored, err } = await paginatedResults(
      req,
      State,
      stateFields,
      { limit: 10 },
      {
        projection: projectors,
        filter: cleanObject({ ...searchFilters }, { excludeByValues: [""] }),
      },
    );

    if (errored && err) {
      ResponseHandler.handleError(res, {
        errorType: "get-states-error",
        message: "Failed to get states",
      });
      return;
    }

    if (results.length === 0) {
      ResponseHandler.handleNotFound(res, {
        errorType: "states-not-found",
        message: "No states found",
        data: { results, page, metrics },
      });
      return;
    }

    const data = cleanPaginatedData({ results, page, metrics, err, errored });

    ResponseHandler.handleSuccess(res, {
      message: "Got states list",
      data,
    });
  } catch (err) {
    ResponseHandler.handleError(res, {
      errorType: "get-states-error-failure",
      message: "Failed to get states",
    });
  }
};

//  GET SINGLE State
export const getState = async (req: ManagedRequest, res: ManagedResponse) => {
  try {
    const { projectors } = getFieldsandProjectors(req, State, stateFields);

    const doc = await State.findOne({ _id: req.params.id }, projectors);
    if (!doc) {
      ResponseHandler.handleNotFound(res, {
        errorType: "state-not-found",
        message: "State not found",
      });
      return;
    }

    const data = convertDataToJSON(doc);

    ResponseHandler.handleSuccess(res, {
      data,
    });
  } catch (err) {
    ResponseHandler.handleError(res, {
      errorType: "get-state-error-failure",
      message: "Failed to get state",
    });
  }
};
