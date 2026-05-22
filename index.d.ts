import { SessionData as OldData } from "express-session";

type UserType =
  | "admin"
  | "super-admin"
  | "lead"
  | "support"
  | "operator"
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
