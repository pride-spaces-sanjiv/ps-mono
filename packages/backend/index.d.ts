import { SessionData as OldData } from "express-session";
import "express-serve-static-core";

type UserType =
  | "admin"
  | "super-admin"
  | "lead"
  | "support"
  | "operator"
  | "builder"
  | "user";
declare module "express-session" {
  interface SessionData extends OldData {
    user?: Partial<{
      id: string;
      name: string;
      email: string;
      userType: UserType;
    }>;
  }
  interface RequiredSessionData extends SessionData {
    user: NonNullable<Required<SessionData["user"]>>;
  }
}

declare module "express-serve-static-core" {
  interface Request<
    P = ParamsDictionary,
    ResBody = any,
    ReqBody = any,
    ReqQuery = ParsedQs,
    LocalsObj extends Record<string, any> = Record<string, any>,
  > {
    parsedQuery: ReqQuery;
  }
}
