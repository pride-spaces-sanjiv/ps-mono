import { ADMIN_MIGRATION } from "../config";
import { APIBodyValidationWrapper } from "@/utils/axios/wrappers";
import { queryToString } from "@/utils/axios/query";

import type {
  GeneralResponseWithError,
  PaginatedResponse,
} from "@/types/axios/response";
import type { MigrationData } from "@/types/data/migration";

type MigrationsRes = GeneralResponseWithError<
  PaginatedResponse<
    Partial<{
      results: MigrationData[];
    }>
  >
>;

// 🔹 Get All Migrations (Paginated)
export const getMigrations = APIBodyValidationWrapper({
  handle: async (param, config) => {
    const url = (
      `/` +
      (param?.url || "") +
      queryToString(param?.query)
    ).replace(/\/+/g, "/");

    const res = await ADMIN_MIGRATION.get<MigrationsRes>(url, config);
    return res;
  },
});
