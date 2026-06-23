import React, { type ReactNode } from "react";
import { cn } from "@/utils/cn";
import type { UploadedFile } from "@/components/form/file-upload";
import { Button } from "@/components/ui/button";
import { formatFileSize } from "@/utils/object/file";
import { Trash2, X } from "lucide-react";

type Render = ReactNode | ((file: UploadedFile) => ReactNode);
type Props = {
  btnProps: React.ComponentProps<typeof Button>;
  delBtnProps: React.ComponentProps<typeof Button>;
  textWrapperProps: React.HTMLAttributes<HTMLDivElement>;
  nameProps: React.HTMLAttributes<HTMLDivElement>;
  sizeProps: React.HTMLAttributes<HTMLDivElement>;
  file: UploadedFile;
  canPreview: boolean;
  renderPreview: Render;
  renderName: Render;
  renderSize: Render;
};

const handleRender = (render: Render, file?: UploadedFile) => {
  if (typeof render === "function") {
    return file ? render?.(file) : undefined;
  }
  return render as ReactNode;
};

export default function FilePreview({
  btnProps,
  textWrapperProps,
  nameProps,
  sizeProps,
  delBtnProps,
  className,
  file,
  canPreview = false,
  renderPreview,
  renderName,
  renderSize,
  ...props
}: Partial<Props & Omit<React.ComponentProps<"div">, keyof Props>>) {
  const [hovered, setHovered] = React.useState(false);
  return (
    <div
      {...props}
      className={cn(
        "flex gap-2 bg-secondary w-fit rounded-lg h-fit p-2 overflow-hidden",
        className,
      )}
      onMouseOver={(e) => {
        setHovered(true);
        props?.onMouseOver?.(e);
      }}
      onMouseLeave={(e) => {
        setHovered(false);
        props?.onMouseLeave?.(e);
      }}
    >
      <Button
        type="button"
        {...btnProps}
        className={cn(
          "object-contain size-[100px] aspect-square bg-black rounded-lg",
          canPreview ? "cursor-pointer" : "cursor-default",
          btnProps?.className,
          8,
        )}
      >
        {handleRender(renderPreview, file) || btnProps?.children}
      </Button>
      {/* Texts */}
      <div
        {...textWrapperProps}
        className={cn(
          "px-2 py-3 self-stretch text-left relative",
          textWrapperProps?.className,
        )}
      >
        <div
          title={file?.file.name}
          {...nameProps}
          className={cn(
            "font-bold bg-gray-700 px-3 py-2 rounded-sm max-w-[200px] overflow-hidden overflow-ellipsis text-nowrap",
            nameProps?.className,
          )}
        >
          {nameProps?.children ||
            handleRender(renderName, file) ||
            file?.file.name ||
            "No file name"}
        </div>
        <div
          {...sizeProps}
          className={cn("text-sm pt-3", sizeProps?.className)}
        >
          {sizeProps?.children ||
            handleRender(renderSize, file) ||
            (file ? "Size : " + formatFileSize(file?.file.size) : undefined) ||
            "Unknown file size"}
        </div>
        <Button
          variant={"destructive"}
          type="button"
          {...delBtnProps}
          className={cn(
            "absolute size-fit has-[>svg]:p-0.5 aspect-square rounded-[50%] bottom-[-4px] opacity-0 right-[2px]",
            "transition-all duration-200 ease cursor-pointer",
            hovered ? "opacity-100 bottom-[2px]" : "",
            delBtnProps?.className,
          )}
        >
          {delBtnProps?.children || <X className="size-[13px]" />}
        </Button>
      </div>
    </div>
  );
}
