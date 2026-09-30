import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/utils/className";
import ActionButton from "../buttons/action-btn";
import { X } from "lucide-react";

type Props = {
  closeProps: React.ComponentProps<typeof DialogClose>;
  contentProps: React.ComponentProps<typeof DialogContent>;
  descriptionProps: React.ComponentProps<typeof DialogDescription>;
  footerProps: React.ComponentProps<typeof DialogFooter>;
  headerProps: React.ComponentProps<typeof DialogHeader>;
  titleProps: React.ComponentProps<typeof DialogTitle>;
  triggerProps: React.ComponentProps<typeof DialogTrigger>;
  showClose: boolean;
  showHeader: boolean;
  useDefaultLayout: boolean;
} & React.ComponentProps<typeof Dialog>;

export function DialogModal({
  children,
  closeProps,
  contentProps,
  descriptionProps,
  footerProps,
  headerProps,
  titleProps,
  triggerProps,
  showClose = true,
  showHeader = true,
  useDefaultLayout = true,
  ...props
}: Partial<Props>) {
  return (
    <Dialog {...props}>
      {(props.open === undefined || triggerProps?.children) && (
        <DialogTrigger
          {...triggerProps}
          className={cn("", triggerProps?.className)}
          asChild
        >
          {triggerProps?.children || (
            <ActionButton variant="outline">Open Dialog</ActionButton>
          )}
        </DialogTrigger>
      )}
      <DialogContent
        {...contentProps}
        showCloseButton={false}
        className={cn(
          "",
          useDefaultLayout
            ? "sm:max-w-[425px] grid-rows-[auto_1fr]"
            : "sm:max-w-none",
          contentProps?.className,
        )}
      >
        {/* Cross button */}
        {contentProps?.showCloseButton !== false && (
          <div className="sticky top-0 flex justify-end">
            <DialogClose className="absolute z-100 -top-5 -right-5 cursor-pointer px-2 py-2 bg-secondary-foreground rounded-xl flex justify-center items-center text-white">
              <X size={18} />
            </DialogClose>
          </div>
        )}

        {!!showHeader && (
          <DialogHeader
            {...headerProps}
            className={cn("", headerProps?.className)}
          >
            {headerProps?.children || (
              <>
                <DialogTitle
                  {...titleProps}
                  className={cn("", titleProps?.className)}
                >
                  {titleProps?.children}
                </DialogTitle>
                <DialogDescription
                  {...descriptionProps}
                  className={cn("", descriptionProps?.className)}
                >
                  {descriptionProps?.children}
                </DialogDescription>
              </>
            )}
          </DialogHeader>
        )}
        {children}
        <DialogFooter
          {...footerProps}
          className={cn("", footerProps?.className)}
        >
          {!!showClose && (
            <DialogClose
              {...closeProps}
              className={cn("", closeProps?.className)}
              asChild
            >
              {closeProps?.children || (
                <ActionButton variant="outline">Cancel</ActionButton>
              )}
            </DialogClose>
          )}
          {footerProps?.children}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
