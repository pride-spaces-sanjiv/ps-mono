import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import {
  Upload,
  X,
  FileText,
  Image,
  Video,
  Music,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/utils/cn";
import {
  getFileIntoBase64,
  formatFileSize,
  type FileSizeNotation,
  resolveFileSize,
} from "@/utils/object/file";
import { allowedExtensions, type MediaType } from "@/utils/data/media";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import moment from "moment";

export type UploadedFile = {
  id: string;
  file: File;
  imageSrc?: string;
  progress: number;
  status: "pending" | "uploading" | "completed" | "error";
  error?: string;
};

type Labels = {
  title: ReactNode;
  description: ReactNode;
  dndTitle: ReactNode;
  dndBrowse: ReactNode;
};

type Props = {
  className?: string;
  labels: Partial<Labels>;
  fileType: MediaType;
  sizeLimit: { val: number; notation?: FileSizeNotation };
  onFilesUpload: (files: UploadedFile[]) => any;
  processFileUpload: (
    file: UploadedFile,
    filesStateSetter: React.Dispatch<React.SetStateAction<UploadedFile[]>>,
  ) => Promise<
    Pick<UploadedFile, "status" | "error"> &
      Partial<Omit<UploadedFile, "status" | "error">>
  >;
  simulationOptions: Partial<{
    flowType: "linear" | "random";
    linearPause: number;
    estimatedTime: number;
    linearStep: number;
  }>;
};

export const simulateFileUpload = (
  fileId: string,
  filesStateSetter: React.Dispatch<React.SetStateAction<UploadedFile[]>>,
  options: Partial<{
    flowType: "linear" | "random";
    linearPause: number;
    estimatedTime: number;
    linearStep: number;
  }> = {},
) => {
  let progress = 0;
  const {
    flowType = "linear",
    linearPause = 80,
    estimatedTime = 1000,
    linearStep = 18,
  } = options;
  const estimatedMsStep = (estimatedTime * 1000) / linearStep;
  if (flowType === "linear") {
    const interval = setInterval(() => {
      progress += linearStep;
      if (progress >= 100) {
        filesStateSetter((prev) =>
          prev.map((f) =>
            f.id === fileId ? { ...f, progress: 100, status: "completed" } : f,
          ),
        );
        clearInterval(interval);
        return;
      }
      filesStateSetter((prev) =>
        prev.map((f) =>
          f.id === fileId
            ? {
                ...f,
                progress: Math.min(Math.floor(progress), 99),
                status: "uploading",
              }
            : f,
        ),
      );
    }, estimatedMsStep);
  }
};

export default function FileUpload({
  className,
  labels,
  fileType = "image",
  onFilesUpload,
  processFileUpload,
  simulationOptions = {},
  sizeLimit = { val: 0 },
}: Partial<Props>) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const {
    flowType,
    linearPause,
    estimatedTime,
    linearStep,
    estimatedMs,
    estimatedMsStep,
  } = useMemo(() => {
    const {
      flowType = "linear",
      linearPause = 80,
      estimatedTime = 60,
      linearStep = 2,
    } = simulationOptions;
    const estimatedMs = estimatedTime * 1000;
    const estimatedMsStep = estimatedMs * 0.01 * linearStep;
    return {
      flowType,
      linearPause,
      estimatedTime,
      linearStep,
      estimatedMs,
      estimatedMsStep,
    };
  }, [simulationOptions]);

  const inpRef = useRef<HTMLInputElement | null>(null);

  const getFileIcon = (file: File) => {
    const type = file.type.split("/")[0];
    if (type === "image") return <Image className="size-5 text-primary" />;
    if (type === "video") return <Video className="size-5 text-purple-500" />;
    if (type === "audio") return <Music className="size-5 text-emerald-500" />;
    return <FileText className="size-5 text-muted-foreground" />;
  };

  const simulateUpload = async (file: UploadedFile) => {
    let progress = 0;
    const fileId = file.id;

    // Just process and flag update after its done, if process handle exists
    let processedState: UploadedFile["status"] | undefined = undefined;
    const startTime = Date.now();
    processFileUpload?.(file, setFiles)
      .then((data) => {
        processedState = data.status;
      })
      .catch((err) => {
        processedState = "error";
      });

    // Only for linear animation
    if (flowType === "linear") {
      const interval = setInterval(() => {
        progress += linearStep;
        const duration = moment
          .duration(Date.now() - startTime, "ms")
          .seconds();
        // console.log("File Progress :", {
        //   progress,
        //   processedState,
        //   duration,
        //   estimatedTime,
        // });
        if (
          progress >= 100 ||
          duration >= estimatedTime ||
          processedState === "completed" ||
          processedState === "error"
        ) {
          const status = processFileUpload
            ? processedState || "error"
            : "completed";
          setFiles((prev) => {
            const updatedFiles = prev.map((f) =>
              f.id === fileId
                ? {
                    ...f,
                    progress: 100,
                    status: status,
                  }
                : f,
            );
            return updatedFiles;
          });
          clearInterval(interval);
          return;
        }

        progress = Math.min(Math.floor(progress), linearPause);
        setFiles((prev) => {
          const updatedFiles = prev.map((f) =>
            f.id === fileId
              ? {
                  ...f,
                  progress: progress,
                  status: "uploading" as const,
                }
              : f,
          );
          return updatedFiles;
        });
      }, estimatedMsStep);
    }
  };

  const handleFiles = async (newFiles: FileList | File[]) => {
    const fileArray = Array.from(newFiles)
      .map((file) => {
        const ext = file.name.match(/\.([^.]+)$/)?.[1];
        // Validate files
        if (!ext) {
          toast.error("Got Unexpected file type");
          return undefined;
        }
        if (!allowedExtensions[fileType]?.includes(ext)) {
          toast.error(`.${ext} File type is not supported`);
          return undefined;
        }
        const limitSize = resolveFileSize(sizeLimit.val, sizeLimit.notation);
        if (file.size > limitSize) {
          toast.error(
            `File size exceeds the limit of ${formatFileSize(limitSize)}`,
          );
          return undefined;
        }
        if (!allowedExtensions[fileType]?.includes(ext)) {
          toast.error(`.${ext} File type is not supported`);
          return undefined;
        }
        // Return post validations
        return file;
      })
      .filter((file) => typeof file !== "undefined");

    // Handle
    const prs = await Promise.allSettled(
      fileArray.map(async (file) => {
        let imageSrc: string | undefined = undefined;
        if (fileType === "image") {
          try {
            imageSrc = await getFileIntoBase64(file);
          } catch (err) {}
        }
        const data = {
          id: Math.random().toString(36).substring(2) + Date.now().toString(36),
          file,
          imageSrc: imageSrc,
          progress: 0,
          status: "pending",
        } as UploadedFile;
        return data;
      }),
    );

    const newUploads = prs
      .filter((rs) => rs.status === "fulfilled")
      .map((result) => result.value);

    setFiles((prev) => [...prev, ...newUploads]);

    newUploads.forEach((upload) => {
      setTimeout(() => {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === upload.id ? { ...f, status: "uploading" } : f,
          ),
        );
        simulateUpload(upload);
      }, 10);
    });
  };

  // Events
  const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  }, []);

  const onDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) handleFiles(e.target.files);
  };

  useEffect(() => {
    onFilesUpload?.(files);
  }, [files]);

  return (
    <div className={cn("w-full flex flex-col gap-4", className)}>
      {/* Header */}
      <div className="flex items-center gap-3.5 pb-3 border-b border-border/60">
        <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <Upload className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-base sm:text-lg font-semibold text-foreground tracking-tight leading-tight">
            {labels?.title ||
              `Upload ${fileType === "image" ? "Images" : fileType.toUpperCase()}`}
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {labels?.description ||
              `Drag & drop or browse multiple ${fileType}s`}
            {!!sizeLimit?.val && (
              <span className="ml-1.5 text-xs text-muted-foreground/80 font-normal">
                (Max:{" "}
                {formatFileSize(
                  resolveFileSize(sizeLimit.val, sizeLimit.notation),
                )}
                )
              </span>
            )}
          </p>
        </div>
      </div>

      {/* DND Dropzone */}
      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onClick={() => inpRef.current?.click()}
        className={cn(
          "group relative border-2 border-dashed rounded-xl px-4 py-7 sm:py-8 cursor-pointer transition-all duration-200 text-center flex flex-col items-center justify-center gap-2",
          "bg-muted/20 hover:bg-muted/40 hover:border-primary/60",
          isDragging
            ? "border-primary bg-primary/10 ring-2 ring-primary/20 scale-[0.99]"
            : "border-border/80",
        )}
      >
        <input
          ref={inpRef}
          placeholder="file"
          type="file"
          multiple
          className="hidden"
          onChange={handleFileSelect}
        />
        <div className="size-11 rounded-full bg-background border border-border/60 shadow-xs flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors">
          <Upload className="size-5 text-primary" />
        </div>
        <div className="space-y-1">
          <p className="text-sm sm:text-base font-medium text-foreground">
            {labels?.dndTitle || `Drop your ${fileType}s here, or`}{" "}
            <span className="text-primary font-semibold hover:underline">
              {labels?.dndBrowse || `browse`}
            </span>
          </p>
          <p className="text-xs text-muted-foreground">
            {fileType === "image"
              ? "Supports PNG, JPG, JPEG, WEBP"
              : "Supported files"}
            {!!sizeLimit?.val &&
              ` • up to ${formatFileSize(resolveFileSize(sizeLimit.val, sizeLimit.notation))}`}
          </p>
        </div>
      </div>

      {/* Files List & Uploading Process */}
      {files.length > 0 && (
        <div className="flex flex-col gap-2.5 mt-1">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-foreground">
                Files
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                {files.length}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2.5 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => setFiles([])}
            >
              Clear All
            </Button>
          </div>

          <div className="max-h-[250px] overflow-y-auto space-y-2 pr-1">
            {files.map((upload) => (
              <div
                key={upload.id}
                className="flex items-center gap-3 bg-muted/30 border border-border/50 rounded-xl p-2.5 sm:p-3 hover:bg-muted/50 transition-colors"
              >
                {/* Thumbnail / Icon */}
                <div className="size-11 rounded-lg bg-background border border-border/60 overflow-hidden flex items-center justify-center shrink-0">
                  {upload.imageSrc ? (
                    <img
                      src={upload.imageSrc}
                      alt={upload.file.name}
                      className="size-full object-cover"
                    />
                  ) : (
                    getFileIcon(upload.file)
                  )}
                </div>

                {/* File info and Progress */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <p
                      className="text-sm font-medium text-foreground truncate"
                      title={upload.file.name}
                    >
                      {upload.file.name}
                    </p>
                    <span className="text-xs text-muted-foreground font-mono shrink-0">
                      {formatFileSize(upload.file.size)}
                    </span>
                  </div>

                  <Progress
                    value={upload.progress}
                    className="h-1.5 bg-muted/80 mb-1.5"
                    style={{ transitionDuration: `${estimatedMsStep}ms` }}
                  />

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span
                      className={cn(
                        "capitalize font-medium text-xs flex items-center gap-1.5",
                        upload.status === "completed" &&
                          "text-emerald-500 font-semibold",
                        upload.status === "uploading" && "text-primary",
                        upload.status === "error" && "text-destructive",
                      )}
                    >
                      {upload.status === "completed" && (
                        <CheckCircle2 className="size-3.5" />
                      )}
                      {upload.status === "error" && (
                        <AlertCircle className="size-3.5" />
                      )}
                      {upload.status === "completed"
                        ? "Completed"
                        : upload.status}
                    </span>
                    <span className="font-mono text-xs">
                      {upload.progress}%
                    </span>
                  </div>
                </div>

                {/* Remove file button */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
                  onClick={() => removeFile(upload.id)}
                >
                  <X className="size-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
