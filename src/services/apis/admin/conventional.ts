import { ADMIN_BUILDER, ADMIN_CONVENTIONAL } from "../config";
import { APIBodyValidationWrapper } from "@/utils/axios/wrappers";
import { queryToString } from "@/utils/axios/query";
import { builderSchema } from "@/utils/schemas/builder";
import { conventionalPropertySchema } from "@/utils/schemas/conventional";
import type {
  GeneralResponseWithError,
  PaginatedResponse,
} from "@/types/axios/response";
import type { Builder } from "@/types/data/builder";
import type { ConventionalProperty } from "@/types/data/conventional";

type ListRes<T> = GeneralResponseWithError<
  PaginatedResponse<
    Partial<{
      results: T[];
      references: Record<
        string,
        Partial<{ results: any[]; metrics: { total: number } }>
      >;
    }>
  >
>;

const listUrl = (param?: { url?: string; query?: Record<string, any> }) =>
  (`/` + (param?.url || "") + queryToString(param?.query)).replace(
    /\/+/g,
    "/",
  );

export const getBuilders = APIBodyValidationWrapper({
  handle: async (param, config) => {
    const res = await ADMIN_BUILDER.get<ListRes<Builder>>(
      listUrl(param),
      config,
    );
    return res;
  },
});

export const getBuilderById = APIBodyValidationWrapper({
  handle: async (param, config) => {
    const res = await ADMIN_BUILDER.get<GeneralResponseWithError<Builder>>(
      listUrl(param),
      config,
    );
    return res;
  },
});

export const updateBuilder = APIBodyValidationWrapper({
  schema: builderSchema.omit({ password: true }).partial(),
  handle: async (param, config) => {
    const res = await ADMIN_BUILDER.put<GeneralResponseWithError<Builder>>(
      `/${param?.url}`,
      param?.body,
      config,
    );
    return res;
  },
});

export const getConventionalProperties = APIBodyValidationWrapper({
  handle: async (param, config) => {
    const res = await ADMIN_CONVENTIONAL.get<ListRes<ConventionalProperty>>(
      listUrl(param),
      config,
    );
    return res;
  },
});

export const getConventionalPropertyById = APIBodyValidationWrapper({
  handle: async (param, config) => {
    const res = await ADMIN_CONVENTIONAL.get<
      GeneralResponseWithError<ConventionalProperty>
    >(listUrl(param), config);
    return res;
  },
});

export const updateConventionalProperty = APIBodyValidationWrapper({
  schema: conventionalPropertySchema.partial(),
  handle: async (param, config) => {
    const res = await ADMIN_CONVENTIONAL.put<
      GeneralResponseWithError<ConventionalProperty>
    >(`/${param?.url}`, param?.body, config);
    return res;
  },
});
