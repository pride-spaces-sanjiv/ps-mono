import type { Datified } from "@/utils/object/datify";
// import type { UserSchema, AdminSchema } from "@/utils/schemas/user";
import type { GeneralData } from "./general";
import type {
  DumpAction,
  DumpCollectionName,
  DumpStatus,
} from "@/utils/data/dump";
import type { AdminLevel } from "@/utils/data/admin";

type DumpUser = {
  id: string;
  name: string;
  email: string;
  userType: AdminLevel;
};

export type RawDump<T extends any = any> = {
  collection: DumpCollectionName;
  action: DumpAction;
  metadata: { id: string; name?: string };
  data: T;
  from?: DumpUser;
  to?: DumpUser;
  status: DumpStatus;
  comment?: string;
  disabled?: boolean;
};

export type Dump<T extends any = any> = GeneralData & RawDump<T>;

export type DatifiedDump<T extends any = any> = Datified<
  Dump<T>,
  ["createdAt", "updatedAt"]
>;
