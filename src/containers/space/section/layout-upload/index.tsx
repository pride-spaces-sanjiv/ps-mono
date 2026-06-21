import React, { useState } from "react";
import FormSectionTitle from "@/components/form/section/title";
import { DialogModal } from "@/components/dialog";
import { mediaTypes, type MediaType } from "@/utils/data/media";
import FilePreview from "@/components/file/preview";
import FileUpload, { type UploadedFile } from "@/components/form/file-upload";
import ActionButton from "@/components/buttons/action-btn";
import { ImagePlus } from "lucide-react";

type Props = {
  titleProps: React.ComponentProps<typeof FormSectionTitle>;
  fileType: MediaType;
  files: UploadedFile[];
  processUpload: React.ComponentProps<typeof FileUpload>["processFileUpload"];
};

export default function SpaceLayoutsUploadSection({
  titleProps,
  fileType = "image",
  // files = [],
  processUpload,
}: Partial<Props>) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  return (
    <>
      <FormSectionTitle {...titleProps}>
        {titleProps?.children || "Layouts"}
      </FormSectionTitle>
      {/* File Previews */}
      <div className="col-span-full flex gap-2 flex-wrap">
        {files.map((file, i) => (
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
        ))}
      </div>
      {/* Upload button with dialog */}
      <DialogModal
        useDefaultLayout={false}
        triggerProps={{
          children: (
            <ActionButton variant={"secondary"} className="max-w-fit px-5 py-6">
              <div className="flex gap-2 items-center">
                Upload Layouts <ImagePlus />
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
          fileType={mediaTypes.LAYOUT}
          onFilesUpload={(files) => {
            console.log("All uploaded layouts :", files);
            setFiles((prev) =>
              [...prev, ...files].filter((file) => file.status === "completed"),
            );
          }}
          sizeLimit={{ val: 10, notation: "mb" }}
          simulationOptions={{ estimatedTime: 20 }}
          processFileUpload={processUpload}
        />
      </DialogModal>
    </>
  );
}
