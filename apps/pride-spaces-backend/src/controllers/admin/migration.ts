import { ResponseHandler } from "@/middlewares/request.js";
import { ManagedRequest, ManagedResponse } from "@/types/request.js";
import * as generalControllers from "@/controllers/general/migration.js";
import { MigrationSchema } from "@/controllers/general/migration.js";

export const getMigrations = async (
  req: ManagedRequest<any, { [k: string]: any }>,
  res: ManagedResponse,
) => {
  try {
    await generalControllers.getMigrations(req, res);
  } catch (err) {
    ResponseHandler.handleError(res, {
      errorType: "get-migrations-error-failure",
      message: "Failed to get migrations list",
    });
  }
};

export const getMigration = async (
  req: ManagedRequest<any, { [k: string]: any }>,
  res: ManagedResponse,
) => {
  try {
    await generalControllers.getMigration(req, res);
  } catch (err) {
    ResponseHandler.handleError(res, {
      errorType: "get-migration-error-failure",
      message: "Failed to get migration details",
    });
  }
};
