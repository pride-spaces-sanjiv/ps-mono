import { SessionData as OldData } from "express-session";

type UserType = "admin" | "super-admin" | "support" | "operator" | "user";
declare module "express-session" {
  interface SessionData extends OldData {
    user?: Partial<{
      id: string;
      email: string;
      userType: UserType;
    }>;
  }
  interface RequiredSessionData extends SessionData {
    user: {
      id: string;
      email: string;
      userType: UserType;
    };
  }
}
