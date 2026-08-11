import type { Datified } from "@/utils/object/datify";
import type { GeneralData } from "./general";
import type { DeepInfer } from "./infer";

export type RawMigrationData = {
  collection: string;
  fileId: string;
  uploadedFileName?: string;
  stats: {
    total: number;
    processed: number;
    success: number;
    failed: number;
    parts: number;
    uploadedParts: number;
  };
};

export type MigrationData = DeepInfer<GeneralData & Partial<RawMigrationData>>;

export type DatifiedMigrationData = DeepInfer<
  Datified<MigrationData, ["createdAt", "updatedAt"]>
>;
