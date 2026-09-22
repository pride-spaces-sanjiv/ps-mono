import React, { useMemo, useState } from "react";
import FormSectionTitle from "@/components/form/section/title";
import { DialogModal } from "@/components/dialog";
import { mediaTypes, type MediaType } from "@/utils/data/media";
import FilePreview from "@/components/file/preview";
import FileUpload, { type UploadedFile } from "@/components/form/file-upload";
import ActionButton from "@/components/buttons/action-btn";
import { ImagePlus } from "lucide-react";
import type { SpaceFormProps } from "@/types/form/space";
import type { AxiosResponse } from "axios";
import { uploadImageFile } from "@/services/apis/admin/file";
import { toast } from "sonner";

type Props<U extends any = ReturnType<typeof uploadImageFile>> = {
  formProps: SpaceFormProps;
  existingFiles: string[];
  titleProps: React.ComponentProps<typeof FormSectionTitle>;
  fileType: MediaType;
  files: UploadedFile[];
  uploaderHandle: U;
  processUpload: React.ComponentProps<typeof FileUpload>["processFileUpload"];
};

const imageURL = (import.meta.env.VITE_RUSTFS_BASE as string).concat(
  "/pridespaces/images/{{id}}",
);

export default function SpaceImagesUploadSection<
  U extends ReturnType<typeof uploadImageFile>,
>({
  formProps,
  existingFiles = [],
  titleProps,
  fileType = "image",
  files = [],
  uploaderHandle,
  processUpload,
}: Partial<Props<U>>) {
  const { register, watch, setValue, formState } = useMemo<SpaceFormProps>(
    // @ts-ignore
    () => formProps || {},
    [formProps],
  );
  const { errors, defaultValues } = useMemo(() => formState || {}, [formState]);

  const [images, setImages] = useState<UploadedFile[]>([]);

  const handleFileUpload = async (file: UploadedFile) => {
    try {
      const formData = new FormData();
      formData.append("file", file.file);
      formData.append("name", file.file.name);
      formData.append("id", file.id);
      formData.append("contentType", file.file.type);
      formData.append("fileType", mediaTypes.IMAGE);
      const res = await uploadImageFile({ body: formData });

      if (res.status === 201 && res?.data?.data?.files) {
        const resFile = res.data?.data?.files[0];
        const oldAllFiles = watch("files", {});
        const currentFiles = new Set([
          ...(oldAllFiles?.[`${fileType}s` as keyof typeof oldAllFiles] || []),
          resFile.filename,
        ]);
        setValue("files", {
          ...oldAllFiles,
          [`${mediaTypes.IMAGE}s`]: Array.from(currentFiles),
        });
        toast.success(
          `File uploaded successfully: ${mediaTypes.IMAGE} ${file.file.name}`,
        );
        return res;
      }
      throw new Error("Invalid response");
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error(`Failed to upload ${mediaTypes.IMAGE} : ${file.file.name}`);
      throw error;
    }
  };

  const removeFileFromList = (fileName: string) => {
    const filteredFiles = watch("files", {})?.[`${mediaTypes.IMAGE}s`]?.filter(
      (id: string) => id !== fileName,
    );
    filteredFiles &&
      setValue("files", {
        ...watch("files", {}),
        [`${mediaTypes.IMAGE}s`]: filteredFiles,
      });
  };

  return (
    <>
      <FormSectionTitle {...titleProps}>
        {titleProps?.children || "Images"}
      </FormSectionTitle>
      {/* File Previews */}
      <div className="col-span-full flex gap-2 flex-wrap">
        {/* {images.map((file, i) => (
          <FilePreview
            key={`${fileType}-${i}`}
            file={file}
            canPreview={true}
            renderPreview={(file) => (
              <img
                src={typeof file === "string" ? file : file?.imageSrc}
                alt="Preview"
                className="w-full h-full object-contain"
              />
            )}
          />
        ))} */}
        {watch("files", {})?.[`${mediaTypes.IMAGE}s`]?.map((id, i) => (
          <FilePreview
            key={`existing-${fileType}-${i}`}
            file={id}
            canPreview={true}
            btnProps={{
              onClick: () => {},
            }}
            renderPreview={(file) => (
              <img
                src={
                  typeof file === "string"
                    ? imageURL.replace("{{id}}", file)
                    : ""
                }
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
          sizeLimit={{ val: 4, notation: "mb" }}
          simulationOptions={{ estimatedTime: 20 }}
          processFileUpload={
            processUpload ||
            (async (file, setter) => {
              try {
                const fileRes = await handleFileUpload(file);
                if (!fileRes) {
                  throw new Error("Incomplete");
                }
                return {
                  status: "completed",
                };
              } catch (err) {
                return { status: "error" };
              }
            })
          }
        />
      </DialogModal>
    </>
  );
}
