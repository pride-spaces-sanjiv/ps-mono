import { NextFunction } from "express";
import { AdminLevel, adminLevels } from "@pride-spaces/common/utils/data/admin.js";
import { ResponseHandler } from "@/middlewares/request.js";
import { DumpSchema } from "@/database/schemas/dump.js";
import { Dump } from "@/database/models/dump.js";
import { dumpStatuses } from "@pride-spaces/common/utils/data/dump.js";
import { ManagedRequest, ManagedResponse } from "@/types/request.js";
import { ModelToDocument } from "@/types/mongoose/document.js";
import { pipelineDBs } from "../services/pipeline/db.js";
import { RequiredSessionData, SessionData } from "express-session";

export const dumpAdminAction = async <
  N extends boolean = true,
  F extends AdminLevel = "support",
  T extends AdminLevel = "super-admin" | "admin" | "lead",
>(
  // @ts-ignore
  {
    fromAllowedLevels = ["support"] as [...F[]],
    toAllowedLevels = ["super-admin", "admin", "lead"] as [...T[]],
    // @ts-ignore
    dump = {},
    req,
    // @ts-ignore
    isNew = true,
    id = undefined,
    senderDisabled = false,
  }: Partial<{
    fromAllowedLevels: [...F[]];
    toAllowedLevels: [...T[]];
    /**
     * @default true
     */
    isNew: N;
    id: string | (N extends true ? undefined : string);
    senderDisabled: boolean;
  }> & {
    dump: Omit<
      N extends true ? DumpSchema : Partial<DumpSchema>,
      "from" | "to"
    >;
    req: ManagedRequest<any, any>;
  } = {},
) => {
  const result = {
    levelInvalid: false,
    disAllowed: false,
    dumped: false,
    notFound: false,
    error: null as Error | null,
    doc: null as ModelToDocument<typeof Dump> | null,
  };
  try {
    const selfLevel = req.session.user?.userType;
    let sender: "from" | "to" | undefined = undefined;

    if (!selfLevel?.trim()) {
      result.levelInvalid = true;
      return result;
    }

    // Get sender type
    if (fromAllowedLevels.includes(selfLevel as F)) {
      sender = "from";
    } else if (toAllowedLevels.includes(selfLevel as T)) {
      sender = "to";
    }
    if (!sender) {
      result.disAllowed = true;
      return result;
    }

    const preparedDump = senderDisabled
      ? {
          ...dump,
          status:
            dump.status ||
            (sender === "from" ? dumpStatuses.PENDING : dumpStatuses.APPROVED),
        }
      : {
          ...dump,
          [sender]: req.session.user,
          status:
            dump.status ||
            (sender === "from" ? dumpStatuses.PENDING : dumpStatuses.APPROVED),
        };

    // Dump
    if (isNew) {
      const newDump = await pipelineDBs.DUMP.createData({ data: preparedDump });
      result.dumped = true;
      result.doc = newDump;
    } else {
      const doc = await pipelineDBs.DUMP.updateData({
        filter: { _id: id },
        updateData: preparedDump,
        options: { new: true },
      });
      if (!doc) {
        result.notFound = true;
        return result;
      }
      result.dumped = true;
      result.doc = doc;
    }

    return result;
  } catch (err: any) {
    console.error("Dump action error :", err);
    result.error = err;
    return result;
  }
};

type UserLevel = RequiredSessionData["user"]["userType"];
export const dumpUserAction = async <
  N extends boolean = true,
  F extends UserLevel = "support" | "operator" | "builder",
  T extends UserLevel = "super-admin" | "admin" | "lead",
>(
  // @ts-ignore
  {
    fromAllowedLevels = ["support", "operator", "builder"] as [...F[]],
    toAllowedLevels = ["super-admin", "admin", "lead"] as [...T[]],
    // @ts-ignore
    dump = {},
    req,
    // @ts-ignore
    isNew = true,
    id = undefined,
    senderDisabled = false,
  }: Partial<{
    fromAllowedLevels: [...F[]];
    toAllowedLevels: [...T[]];
    /**
     * @default true
     */
    isNew: N;
    id: string | (N extends true ? undefined : string);
    senderDisabled: boolean;
  }> & {
    dump: Omit<
      N extends true ? DumpSchema : Partial<DumpSchema>,
      "from" | "to"
    >;
    req: ManagedRequest<any, any>;
  } = {},
) => {
  const result = {
    levelInvalid: false,
    disAllowed: false,
    dumped: false,
    notFound: false,
    error: null as Error | null,
    doc: null as ModelToDocument<typeof Dump> | null,
  };
  try {
    const selfLevel = req.session.user?.userType;
    let sender: "from" | "to" | undefined = undefined;

    if (!selfLevel?.trim()) {
      result.levelInvalid = true;
      return result;
    }

    // Get sender type
    if (fromAllowedLevels.includes(selfLevel as F)) {
      sender = "from";
    } else if (toAllowedLevels.includes(selfLevel as T)) {
      sender = "to";
    }
    if (!sender) {
      result.disAllowed = true;
      return result;
    }

    const preparedDump = senderDisabled
      ? {
          ...dump,
          status:
            dump.status ||
            (sender === "from" ? dumpStatuses.PENDING : dumpStatuses.APPROVED),
        }
      : {
          ...dump,
          [sender]: req.session.user,
          status:
            dump.status ||
            (sender === "from" ? dumpStatuses.PENDING : dumpStatuses.APPROVED),
        };

    // Dump
    if (isNew) {
      const newDump = await pipelineDBs.DUMP.createData({ data: preparedDump });
      result.dumped = true;
      result.doc = newDump;
    } else {
      const doc = await pipelineDBs.DUMP.updateData({
        filter: { _id: id },
        updateData: preparedDump,
        options: { new: true },
      });
      if (!doc) {
        result.notFound = true;
        return result;
      }
      result.dumped = true;
      result.doc = doc;
    }

    return result;
  } catch (err: any) {
    console.error("Dump action error :", err);
    result.error = err;
    return result;
  }
};
