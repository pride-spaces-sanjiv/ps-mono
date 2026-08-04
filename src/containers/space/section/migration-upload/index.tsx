import React, { useRef, useState } from "react";
import FormSectionTitle from "@/components/form/section/title";
import { DialogModal } from "@/components/dialog";
import { mediaTypes, type MediaType } from "@/utils/data/media";
import FilePreview from "@/components/file/preview";
import FileUpload, { type UploadedFile } from "@/components/form/file-upload";
import ActionButton from "@/components/buttons/action-btn";
import { DownloadCloud, ImagePlus } from "lucide-react";
import { downloadFile } from "@/utils/file/download";

const centresSampleLink = new URL(
  import.meta.env.VITE_RUSTFS_BASE.replace(/\/$/, "") +
    "/pridespaces/samples/sample-centres-migration.xlsx",
);

type Props = {
  titleProps: React.ComponentProps<typeof FormSectionTitle>;
  fileType: MediaType;
  files: UploadedFile[];
  processUpload: (
    ref: React.RefObject<HTMLButtonElement | null>,
    ...args: Parameters<
      Exclude<
        React.ComponentProps<typeof FileUpload>["processFileUpload"],
        undefined | null
      >
    >
  ) => ReturnType<
    Exclude<
      React.ComponentProps<typeof FileUpload>["processFileUpload"],
      undefined | null
    >
  >;
};

export default function SpaceMigrationsUploadSection({
  titleProps,
  fileType = "migrationfile",
  processUpload,
}: Partial<Props>) {
  const dialogClose = useRef<HTMLButtonElement>(null);
  const [files, setFiles] = useState<UploadedFile[]>([]);

  return (
    <>
      <FormSectionTitle {...titleProps}>
        {titleProps?.children || "Migration Files"}
      </FormSectionTitle>
      {/* File Previews */}
      <div className="col-span-full flex gap-2 flex-wrap justify-between">
        {/* {files.map((file, i) => (
          <FilePreview
            key={`${fileType}-${i}`}
            file={file}
            canPreview={true}
            renderPreview={(file) => (
              <img
                src={file?.imageSrc}
                alt="Preview"
                className="w-full h-full object-contain"
              />
            )}
          />
        ))} */}

        {/* Upload button with dialog */}
        <DialogModal
          useDefaultLayout={false}
          closeProps={{ ref: dialogClose }}
          triggerProps={{
            children: (
              <ActionButton
                variant={"secondary"}
                className="max-w-fit px-5 py-6"
              >
                <div className="flex gap-2 items-center">
                  Upload File <ImagePlus />
                </div>
              </ActionButton>
            ),
          }}
          contentProps={{
            className:
              "w-[80dvw] max-sm:w-[calc(100dvw-20px)] max-w-none max-h-[90dvh]",
          }}
        >
          <FileUpload
            fileType={mediaTypes.MIGRATIONFILE}
            onFilesUpload={(files) => {
              console.log("All uploaded migration files :", files);
              setFiles((prev) =>
                [...prev, ...files].filter(
                  (file) => file.status === "completed",
                ),
              );
            }}
            sizeLimit={{ val: 50, notation: "mb" }}
            simulationOptions={{ estimatedTime: 20 }}
            // @ts-ignore
            processFileUpload={(...args) =>
              processUpload?.(dialogClose, ...args)
            }
          />
        </DialogModal>
        <ActionButton
          className="px-5 py-6"
          onClick={() => {
            downloadFile(
              centresSampleLink.href,
              `centres-sample${centresSampleLink.pathname.match(/\.[^\/.]+$/)?.[0]}`,
            );
          }}
        >
          <div className="flex gap-2 items-center">
            Download Sample <DownloadCloud />
          </div>
        </ActionButton>
      </div>
    </>
  );
}
