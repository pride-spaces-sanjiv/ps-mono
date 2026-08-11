import type { Datified } from "@/utils/object/datify";
import type { SpaceSchema } from "@/utils/schemas/spaces";
import type { GeneralData } from "./general";
import type { DeepInfer } from "./infer";

export type FileUploaded = DeepInfer<{
  filename: string;
  fieldname: string;
  destination: string;
  path: string;
  mimetype: string;
  originalname: string;
  size: number;
}>;

// export type DatifiedFile = DeepInfer<
//   Datified<FileUploaded, ["createdAt", "updatedAt", "openTime", "closeTime"]>
// >;

export type FilesResData = {
  bucket: string;
  files: FileUploaded[];
};
