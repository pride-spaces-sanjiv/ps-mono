import { ADMIN, ADMIN_AUTH } from "../config";
import { adminSchema, loginSchema } from "@/utils/schemas/user";
import { APIBodyValidationWrapper } from "@/utils/axios/wrappers";
import type { GeneralResponseWithError } from "@/types/axios/response";
import type { Admin } from "@/types/data/user";
import type { TokenRes } from "@/types/data/response";

type GetRes = GeneralResponseWithError<Omit<Admin, "password"> | null>;

// Authenticate
export const loginAdmin = APIBodyValidationWrapper({
  schema: loginSchema,
  handle: async (param, config) => {
    const res = await ADMIN_AUTH.post<TokenRes>("/login", param?.body, config);
    return res;
  },
});

// Crud
export const getSelfData = APIBodyValidationWrapper({
  handle: async (param, config) => {
    const res = await ADMIN.get<GetRes>("/", config);
    return res;
  },
});
export const updateSelfData = APIBodyValidationWrapper({
  schema: adminSchema.omit({ password: true }),
  handle: async (param, config) => {
    const res = await ADMIN.post<GetRes>("/", param?.body, config);
    return res;
  },
});
