import * as React from "react";
import { Eye, EyeOff, type LucideProps } from "lucide-react";
import { cn } from "@/utils/className";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground border-input flex h-auto w-full min-w-0 rounded-md border bg-background px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-base",
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        "aria-invalid:ring-destructive/20 aria-invalid:border-destructive",
        className,
      )}
      {...props}
    />
  );
}

function TextArea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground border-input flex h-auto w-full min-w-0 rounded-md border bg-background px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-base",
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        "aria-invalid:ring-destructive/20 aria-invalid:border-destructive",
        className,
      )}
      {...props}
    ></textarea>
  );
}

export function PasswordInput({
  className,
  type,
  wrapperProps,
  Icon,
  iconProps,
  iconButtonProps,
  onToggleType,
  ...props
}: React.ComponentProps<"input"> &
  Partial<{
    wrapperProps: React.JSX.IntrinsicElements["div"];
    Icon: typeof Eye;
    iconProps: Partial<LucideProps>;
    iconButtonProps: React.JSX.IntrinsicElements["button"];
    /** Callback for password show state */
    onToggleType: (show: boolean) => any;
  }>) {
  const [show, setShow] = React.useState(false);

  React.useEffect(() => {
    onToggleType?.(show);
  }, [show]);

  return (
    <div
      {...wrapperProps}
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground border-input flex gap-2 items-center h-9 w-full min-w-0 rounded-md border bg-background px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        "focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px]",
        "aria-invalid:ring-destructive/20 aria-invalid:border-destructive h-auto",
        wrapperProps?.className,
      )}
    >
      <Input
        {...props}
        type={show ? type || "text" : "password"}
        data-slot="input"
        className={cn(
          "w-full p-0 rounded-[initial] border-transparent shadow-[transparent]",
          "focus-visible:border-transparent focus-visible:ring-0",
          className,
        )}
      />
      <button
        type="button"
        {...iconButtonProps}
        onClick={(e) => {
          setShow((prev) => !prev);
          iconButtonProps?.onClick?.(e);
        }}
        className={cn(
          "shrink-0 cursor-pointer aspect-square h-[20px]",
          iconButtonProps?.className,
        )}
      >
        {(Icon && <Icon {...iconProps} />) ||
          (show ? (
            <Eye
              {...iconProps}
              className={cn("size-[20px]", iconProps?.className)}
            />
          ) : (
            <EyeOff
              {...iconProps}
              className={cn("size-[20px]", iconProps?.className)}
            />
          ))}
      </button>
    </div>
  );
}

export { Input, TextArea };
