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
  ...props
}: Partial<Props>) {
  return (
    <Dialog {...props}>
      <DialogTrigger
        {...triggerProps}
        className={cn("", triggerProps?.className)}
        asChild
      >
        {triggerProps?.children || (
          <ActionButton variant="outline">Open Dialog</ActionButton>
        )}
      </DialogTrigger>
      <DialogContent
        {...contentProps}
        className={cn(
          "sm:max-w-[425px] grid-rows-[auto_1fr]",
          contentProps?.className,
        )}
      >
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
