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

export default function SpaceImagesUploadSection({
  titleProps,
  fileType = "image",
  files = [],
  processUpload,
}: Partial<Props>) {
  const [images, setImages] = useState<UploadedFile[]>([]);
  return (
    <>
      <FormSectionTitle {...titleProps}>
        {titleProps?.children || "Images"}
      </FormSectionTitle>
      {/* File Previews */}
      <div className="col-span-full flex gap-2 flex-wrap">
        {images.map((file, i) => (
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
                Upload Images <ImagePlus />
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
          fileType={mediaTypes.IMAGE}
          onFilesUpload={(files) => {
            console.log("All uploaded images :", files);
            setImages((prev) =>
              [...prev, ...files].filter((file) => file.status === "completed"),
            );
          }}
          simulationOptions={{ estimatedTime: 20 }}
          processFileUpload={processUpload}
        />
      </DialogModal>
    </>
  );
}
