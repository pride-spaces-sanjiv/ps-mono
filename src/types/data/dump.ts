import type { Datified } from "@/utils/object/datify";
// import type { UserSchema, AdminSchema } from "@/utils/schemas/user";
import type { GeneralData } from "./general";
import type { dumpActions, dumpCollectionNames } from "@/utils/data/dump";
import type { AdminLevel } from "@/utils/data/admin";

export type RawDump<T extends any = any> = {
  collection: (typeof dumpCollectionNames)[keyof typeof dumpCollectionNames];
  action: (typeof dumpActions)[keyof typeof dumpActions];
  data: T;
  user: {
    id: string;
    name: string;
    email: string;
    userType: AdminLevel;
  };
};

export type Dump<T extends any = any> = GeneralData & RawDump<T>;

export type DatifiedDump<T extends any = any> = Datified<
  Dump<T>,
  ["createdAt", "updatedAt"]
>;
