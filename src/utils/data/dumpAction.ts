import { NextFunction } from "express";
import { AdminLevel, adminLevels } from "@/utils/data/admin.js";
import { ManagedRequest, ManagedResponse } from "@/types/request.js";
import { ResponseHandler } from "../../middlewares/request.js";
import { DumpSchema } from "@/database/schemas/dump.js";
import { Dump } from "@/database/models/dump.js";
import { dumpStatuses } from "./dump.js";

export const dumpAdminAction = async <
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
  }: Partial<{
    fromAllowedLevels: [...F[]];
    toAllowedLevels: [...T[]];
  }> & { dump: Omit<DumpSchema, "from" | "to">; req: ManagedRequest } = {},
) => {
  const result = {
    levelInvalid: false,
    disAllowed: false,
    dumped: false,
    error: null as Error | null,
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

    // Dump
    const newDump = new Dump({
      ...dump,
      [sender]: req.session.user,
      status: sender === "from" ? dumpStatuses.PENDING : dumpStatuses.APPROVED,
    });
    await newDump.save();
    result.dumped = true;

    return result;
  } catch (err: any) {
    result.error = err;
    return result;
  }
};
