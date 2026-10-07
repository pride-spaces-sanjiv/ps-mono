import React, { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  ChevronLeft,
  ChevronRight,
  ImagePlus,
  X,
} from "lucide-react";
import { uploadImageFile } from "@/services/apis/admin/file";
import { mediaTypes, type MediaType } from "@/utils/data/media";
import CollapsibleFormSection from "@/components/form/section/collapsible";
import type FormSectionTitle from "@/components/form/section/title";
import { DialogModal } from "@/components/dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/utils/cn";
import FilePreview from "@/components/file/preview";
import FileUpload, { type UploadedFile } from "@/components/form/file-upload";
import ActionButton from "@/components/buttons/action-btn";
import type { SpaceFormProps } from "@/types/form/space";

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

const getImageUrl = (id: string | UploadedFile | null | undefined): string => {
  if (!id) return "";
  if (typeof id === "object") {
    return id.imageSrc || "";
  }
  if (
    id.startsWith("http://") ||
    id.startsWith("https://") ||
    id.startsWith("blob:") ||
    id.startsWith("data:")
  ) {
    return id;
  }
  return imageURL.replace("{{id}}", id);
};

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
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);

  const currentImages: string[] = useMemo(() => {
    const fileList = watch("files", {})?.[`${mediaTypes.IMAGE}s`];
    if (!Array.isArray(fileList)) return [];
    return fileList.filter((item): item is string => typeof item === "string");
  }, [watch("files", {})?.[`${mediaTypes.IMAGE}s`]]);

  const currentImageId =
    previewIndex !== null && currentImages[previewIndex]
      ? currentImages[previewIndex]
      : null;

  useEffect(() => {
    if (previewIndex !== null) {
      if (currentImages.length === 0) {
        setPreviewIndex(null);
      } else if (previewIndex >= currentImages.length) {
        setPreviewIndex(currentImages.length - 1);
      }
    }
  }, [currentImages.length, previewIndex]);

  const handlePrev = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (currentImages.length <= 1) return;
    setPreviewIndex((prev) => {
      if (prev === null) return 0;
      return prev > 0 ? prev - 1 : currentImages.length - 1;
    });
  };

  const handleNext = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (currentImages.length <= 1) return;
    setPreviewIndex((prev) => {
      if (prev === null) return 0;
      return prev < currentImages.length - 1 ? prev + 1 : 0;
    });
  };

  useEffect(() => {
    if (previewIndex === null) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        handlePrev();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        handleNext();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [previewIndex, currentImages.length]);

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

  const hasError = Boolean(errors?.files?.images);

  return (
    <CollapsibleFormSection
      title={titleProps?.children || "Images"}
      titleProps={titleProps}
      hasError={hasError}
    >
      {/* File Previews */}
      <div className="col-span-full flex gap-2 flex-wrap">
        {currentImages.map((id, i) => (
          <FilePreview
            key={`existing-${fileType}-${i}`}
            file={id}
            canPreview={true}
            delBtnProps={{
              onClick: () => {
                if (typeof id === "string") {
                  const postRemovalFiles = new Set(
                    watch("files", {})?.[`${mediaTypes.IMAGE}s`] || [],
                  );
                  postRemovalFiles.delete(id);
                  setValue("files", {
                    ...watch("files", {}),
                    [`${mediaTypes.IMAGE}s`]: Array.from(postRemovalFiles),
                  });
                }
              },
            }}
            btnProps={{
              onClick: () => {
                setPreviewIndex(i);
              },
            }}
            renderPreview={(file) => (
              <img
                src={getImageUrl(file)}
                alt="Preview"
                className="w-full h-full object-contain"
              />
            )}
          />
        ))}
      </div>

      {/* Attractive Lightbox Dialog for Image Preview */}
      <Dialog
        open={previewIndex !== null && !!currentImageId}
        onOpenChange={(state) => {
          if (!state) setPreviewIndex(null);
        }}
      >
        <DialogContent
          showCloseButton={false}
          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[96vw] sm:max-w-[96vw] md:max-w-6xl lg:max-w-7xl h-[90vh] sm:h-[92vh] max-h-[95vh] p-0 gap-0 border border-white/15 bg-neutral-950/95 backdrop-blur-2xl rounded-2xl shadow-2xl flex flex-col justify-between overflow-hidden outline-none z-50 text-white"
        >
          <DialogTitle className="sr-only">Image Preview</DialogTitle>
          <DialogDescription className="sr-only">
            Preview of uploaded image{" "}
            {previewIndex !== null ? previewIndex + 1 : 1} of{" "}
            {currentImages.length} with navigation controls
          </DialogDescription>

          {/* Top Bar: Counter & Close */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-3 bg-black/40 border-b border-white/10 z-20 shrink-0">
            <span className="text-xs sm:text-sm font-medium tracking-wide text-white/90">
              Image {previewIndex !== null ? previewIndex + 1 : 1} of{" "}
              {currentImages.length}
            </span>

            <button
              type="button"
              onClick={() => setPreviewIndex(null)}
              title="Close preview (Esc)"
              aria-label="Close image preview"
              className="p-1.5 sm:p-2 rounded-lg text-white/70 hover:text-white bg-white/5 hover:bg-white/15 border border-white/10 transition-colors cursor-pointer"
            >
              <X className="size-4 sm:size-5" />
            </button>
          </div>

          {/* Middle: Left Arrow, Image, Right Arrow */}
          <div className="relative flex-1 flex items-center justify-center px-12 sm:px-20 py-2 sm:py-4 overflow-hidden min-h-0 bg-neutral-950/40">
            {/* Left Navigation Arrow */}
            {currentImages.length > 1 && (
              <button
                type="button"
                onClick={handlePrev}
                title="Previous image (Left Arrow)"
                aria-label="Previous image"
                className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-20 size-11 sm:size-12 rounded-full bg-black/60 hover:bg-black/85 active:scale-95 text-white/90 hover:text-white border border-white/20 hover:border-white/50 backdrop-blur-md flex items-center justify-center shadow-2xl transition-all duration-200 hover:scale-105 cursor-pointer group"
              >
                <ChevronLeft className="size-6 transition-transform group-hover:-translate-x-0.5" />
              </button>
            )}

            {/* Main Preview Image Container */}
            <div className="flex items-center justify-center w-full h-full max-w-full max-h-full min-h-0 min-w-0">
              {currentImageId && (
                <img
                  key={currentImageId}
                  src={getImageUrl(currentImageId)}
                  alt={`Preview ${previewIndex !== null ? previewIndex + 1 : 1}`}
                  className="max-h-full max-w-full w-auto h-auto object-contain rounded-xl shadow-2xl select-none animate-in fade-in zoom-in-95 duration-200"
                />
              )}
            </div>

            {/* Right Navigation Arrow */}
            {currentImages.length > 1 && (
              <button
                type="button"
                onClick={handleNext}
                title="Next image (Right Arrow)"
                aria-label="Next image"
                className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-20 size-11 sm:size-12 rounded-full bg-black/60 hover:bg-black/85 active:scale-95 text-white/90 hover:text-white border border-white/20 hover:border-white/50 backdrop-blur-md flex items-center justify-center shadow-2xl transition-all duration-200 hover:scale-105 cursor-pointer group"
              >
                <ChevronRight className="size-6 transition-transform group-hover:translate-x-0.5" />
              </button>
            )}
          </div>

          {/* Bottom Thumbnails Strip */}
          {currentImages.length > 1 && (
            <div className="flex items-center justify-center gap-2 px-4 py-3 bg-black/50 border-t border-white/10 overflow-x-auto max-w-full shrink-0">
              {currentImages.map((id, idx) => (
                <button
                  key={`thumb-${id}-${idx}`}
                  type="button"
                  onClick={() => setPreviewIndex(idx)}
                  title={`Jump to image ${idx + 1}`}
                  aria-label={`Thumbnail ${idx + 1}`}
                  className={cn(
                    "relative size-12 sm:size-14 rounded-lg overflow-hidden border-2 transition-all shrink-0 cursor-pointer bg-neutral-900",
                    idx === previewIndex
                      ? "border-primary ring-2 ring-primary/40 scale-105 opacity-100 shadow-md"
                      : "border-transparent opacity-50 hover:opacity-90 hover:border-white/30",
                  )}
                >
                  <img
                    src={getImageUrl(id)}
                    alt={`Thumbnail ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

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
            "w-[95vw] sm:max-w-xl md:max-w-2xl max-h-[88vh] p-5 sm:p-6 overflow-y-auto rounded-2xl border shadow-xl",
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
    </CollapsibleFormSection>
  );
}
