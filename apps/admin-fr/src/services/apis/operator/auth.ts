import { OPERATOR, OPERATOR_AUTH } from "../config";
import { adminSchema, loginSchema } from "@/utils/schemas/user";
import { APIBodyValidationWrapper } from "@/utils/axios/wrappers";
import type { GeneralResponseWithError } from "@/types/axios/response";
import type { Operator } from "@/types/data/operators";
import type { TokenRes } from "@/types/data/response";
import { operatorSchema } from "@/utils/schemas/operators";

type GetRes = GeneralResponseWithError<Omit<Operator, "password"> | null>;

// Authenticate
export const loginOperator = APIBodyValidationWrapper({
  schema: loginSchema,
  handle: async (param, config) => {
    const res = await OPERATOR_AUTH.post<TokenRes>(
      "/login",
      param?.body,
      config,
    );
    return res;
  },
});

// Crud
export const getSelfData = APIBodyValidationWrapper({
  handle: async (param, config) => {
    const res = await OPERATOR.get<GetRes>("/", config);
    return res;
  },
});
export const updateSelfData = APIBodyValidationWrapper({
  schema: operatorSchema.omit({ password: true , slug: true }),
  handle: async (param, config) => {
    const res = await OPERATOR.put<GetRes>("/", param?.body, config);
    return res;
  },
});
