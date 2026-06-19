import React, { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Upload, X, FileText, Image, Video, Music } from "lucide-react";
import { cn } from "@/utils/cn";
import { getFileIntoBase64, formatFileSize } from "@/utils/object/file";
import { allowedExtensions, type MediaType } from "@/utils/data/media";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";

export type UploadedFile = {
  id: string;
  file: File;
  imageSrc?: string;
  progress: number;
  status: "pending" | "uploading" | "completed" | "error";
  error?: string;
};

type Props = {
  fileType: MediaType;
  onFilesUpload: (files: UploadedFile[]) => any;
  processFileUpload: (
    file: UploadedFile,
    filesStateSetter: React.Dispatch<React.SetStateAction<UploadedFile[]>>,
  ) => any;
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
  fileType = "image",
  onFilesUpload,
  processFileUpload,
}: Partial<Props>) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const getFileIcon = (file: File) => {
    const type = file.type.split("/")[0];
    if (type === "image") return <Image className="w-10 h-10 text-blue-500" />;
    if (type === "video")
      return <Video className="w-10 h-10 text-purple-500" />;
    if (type === "audio") return <Music className="w-10 h-10 text-green-500" />;
    return <FileText className="w-10 h-10 text-gray-500" />;
  };

  const simulateUpload = (fileId: string) => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 18;
      if (progress >= 100) {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileId ? { ...f, progress: 100, status: "completed" } : f,
          ),
        );
        clearInterval(interval);
        return;
      }
      setFiles((prev) =>
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
    }, 180);
  };

  const handleFiles = async (newFiles: FileList | File[]) => {
    const fileArray = Array.from(newFiles)
      .map((file) => {
        const ext = file.name.match(/\.([^.]+)$/)?.[1];
        if (!ext) {
          toast.error("Got Unexpected file type");
          return undefined;
        }
        if (!allowedExtensions[fileType]?.includes(ext)) {
          toast.error(`.${ext} File type is not supported`);
          return undefined;
        }
        return file;
      })
      .filter((file) => typeof file !== "undefined");

    // Validate files

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
        simulateUpload(upload.id);
      }, 80);
    });
  };

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
    <div className="max-w-[1200px] w-full mx-auto p-6 col-span-full">
      <Card className="w-full py-0">
        <CardContent className="p-10">
          <div className="text-center mb-10">
            <div className="mx-auto w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
              <Upload className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-3xl font-semibold mb-2">Multi File Upload</h2>
            <p className="text-muted-foreground text-lg">
              Drag & drop or click to upload multiple files
            </p>
          </div>

          <div
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onClick={() => document.getElementById("file-input")?.click()}
            className={cn(
              "border-2 border-dashed px-4 py-16 rounded-2xl cursor-pointer transition-all hover:bg-muted/50",
              isDragging
                ? "border-primary bg-primary/5 scale-[1.01]"
                : "border-muted-foreground/30",
            )}
          >
            <input
              id="file-input"
              type="file"
              multiple
              className="hidden"
              onChange={handleFileSelect}
            />
            <div className="text-center">
              <Upload className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-xl font-medium">Drop your files here</p>
              <p className="text-sm text-muted-foreground mt-2">
                or{" "}
                <span className="text-primary font-medium">browse files</span>
              </p>
            </div>
          </div>

          {files.length > 0 && (
            <div className="mt-10">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold">
                  Files ({files.length})
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFiles([])}
                >
                  Clear All
                </Button>
              </div>

              <div className="space-y-4">
                {files.map((upload) => (
                  <div
                    key={upload.id}
                    className="flex gap-5 bg-muted/60 rounded-xl p-5 group hover:bg-muted transition-colors"
                  >
                    <div className="flex-shrink-0 pt-1">
                      {getFileIcon(upload.file)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between mb-2">
                        <p className="font-medium truncate pr-4">
                          {upload.file.name}
                        </p>
                        <p className="text-xs text-muted-foreground font-mono">
                          {formatFileSize(upload.file.size)}
                        </p>
                      </div>
                      <Progress value={upload.progress} className="h-2 mb-2" />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span
                          className={
                            upload.status === "completed"
                              ? "text-green-600 font-medium"
                              : ""
                          }
                        >
                          {upload.status}
                        </span>
                        <span>{upload.progress}%</span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 transition-all"
                      onClick={() => removeFile(upload.id)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
