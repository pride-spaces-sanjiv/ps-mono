import { NextFunction } from "express";
import { AdminLevel, adminLevels } from "@/utils/data/admin.js";
import { ResponseHandler } from "@/middlewares/request.js";
import { DumpSchema } from "@/database/schemas/dump.js";
import { Dump } from "@/database/models/dump.js";
import { dumpStatuses } from "./dump.js";
import { ManagedRequest, ManagedResponse } from "@/types/request.js";

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
  }: Partial<{
    fromAllowedLevels: [...F[]];
    toAllowedLevels: [...T[]];
    /**
     * @default true
     */
    isNew: N;
    id: string | (N extends true ? undefined : never);
  }> & {
    dump: Omit<DumpSchema, "from" | "to">;
    req: ManagedRequest<any, any>;
  } = {},
) => {
  const result = {
    levelInvalid: false,
    disAllowed: false,
    dumped: false,
    notFound: false,
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
    if (isNew) {
      const newDump = new Dump({
        ...dump,
        [sender]: req.session.user,
        status:
          dump.status ||
          (sender === "from" ? dumpStatuses.PENDING : dumpStatuses.APPROVED),
      });
      await newDump.save();
      result.dumped = true;
    } else {
      const doc = await Dump.findOneAndUpdate(
        { _id: id },
        {
          ...dump,
          [sender]: req.session.user,
          status:
            dump.status ||
            (sender === "from" ? dumpStatuses.PENDING : dumpStatuses.APPROVED),
        },
        { new: true },
      );
      if (!doc) {
        result.notFound = true;
        return result;
      }
      result.dumped = true;
    }

    return result;
  } catch (err: any) {
    result.error = err;
    return result;
  }
};
