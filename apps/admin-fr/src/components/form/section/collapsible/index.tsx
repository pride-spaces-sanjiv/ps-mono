import React, { useEffect, useState } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import FormSectionTitle from "@/components/form/section/title";
import { cn } from "@/utils/className";

export type CollapsibleFormSectionProps = {
  title: React.ReactNode;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  hasError?: boolean;
  className?: string;
  triggerClassName?: string;
  contentClassName?: string;
  gridClassName?: string;
  children?: React.ReactNode;
  rightElement?: React.ReactNode;
  titleProps?: React.ComponentProps<typeof FormSectionTitle>;
};

export default function CollapsibleFormSection({
  title,
  defaultOpen = true,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  hasError,
  className,
  triggerClassName,
  contentClassName,
  gridClassName,
  children,
  rightElement,
  titleProps,
}: CollapsibleFormSectionProps) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : internalOpen;

  // Auto-expand section if validation errors are detected
  useEffect(() => {
    if (hasError && !isOpen) {
      if (!isControlled) {
        setInternalOpen(true);
      }
      controlledOnOpenChange?.(true);
    }
  }, [hasError]);

  const handleOpenChange = (newOpen: boolean) => {
    if (!isControlled) {
      setInternalOpen(newOpen);
    }
    controlledOnOpenChange?.(newOpen);
  };

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={handleOpenChange}
      className={cn("col-span-full w-full", className)}
    >
      <CollapsibleTrigger asChild>
        <div
          role="button"
          tabIndex={0}
          className="w-full focus:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded-sm cursor-pointer select-none"
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleOpenChange(!isOpen);
            }
          }}
        >
          <FormSectionTitle
            collapsible
            isOpen={isOpen}
            hasError={hasError}
            rightElement={rightElement}
            wrapperProps={{
              className: cn("w-full py-4 my-0", triggerClassName),
            }}
            {...titleProps}
          >
            {title}
          </FormSectionTitle>
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent
        className={cn(
          "w-full transition-all data-[state=closed]:hidden",
          contentClassName,
        )}
      >
        <div className={cn("auto-form-grid pt-1 pb-3", gridClassName)}>
          {children}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
