import { SessionData as OldData } from "express-session";

declare module "express-session" {
  interface SessionData extends OldData {
    user?: Partial<{
      id: string;
      email: string;
      username: string;
      level: number;
    }>;
  }
  interface RequiredSessionData extends SessionData {
    user: {
      id: string;
      email: string;
      username: string;
      level: number;
    };
  }
}
