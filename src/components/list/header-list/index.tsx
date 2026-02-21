import React, {
  useEffect,
  useState,
  type ComponentProps,
  type JSX,
} from "react";
import { Plus, Trash } from "lucide-react";
import { cn } from "@/utils/className";
import ActionButton from "@/components/buttons/action-btn";
import { Input } from "@/components/ui/input";

type Props = {
  onChange: (items: [string, string][]) => any;
  buttonProps: ComponentProps<typeof ActionButton>;
  delProps: JSX.IntrinsicElements["button"];
  itemProps: JSX.IntrinsicElements["div"];
  wrapperProps: JSX.IntrinsicElements["div"];
};
export default function HeaderList({
  buttonProps,
  delProps,
  itemProps,
  wrapperProps,
  onChange,
}: Partial<Props>) {
  const [items, setItems] = useState<{ id: number; pair: [string, string] }[]>(
    [],
  );

  useEffect(() => {
    onChange?.(items.map((d) => d.pair));
  }, [items]);

  return (
    <div className={cn("flex flex-col gap-4", wrapperProps?.className)}>
      {items.map((item, i) => (
        <div
          key={`header-item-${item.id}`}
          {...itemProps}
          className={cn("flex gap-2", itemProps?.className)}
        >
          <Input
            onChange={(e) => {
              setItems((prev) => {
                let arr = [...prev];
                const ind = arr.findIndex((d) => d.id === item.id);
                arr[ind] = {
                  ...arr[ind],
                  pair: [e.currentTarget.value.trim(), arr[ind].pair[1]],
                };
                return arr;
              });
            }}
          />
          <Input
            onChange={(e) => {
              setItems((prev) => {
                let arr = [...prev];
                const ind = arr.findIndex((d) => d.id === item.id);
                arr[ind] = {
                  ...arr[ind],
                  pair: [arr[ind].pair[0], e.currentTarget.value.trim()],
                };
                return arr;
              });
            }}
          />
          <ActionButton
            type="button"
            variant={"destructive"}
            {...delProps}
            className={cn("", delProps?.className)}
            onClick={() => {
              setItems((prev) => prev.filter((d) => d.id !== item.id));
            }}
          >
            <Trash />
          </ActionButton>
        </div>
      ))}
      <ActionButton
        type="button"
        {...buttonProps}
        className={cn("w-fit bg-green-400", buttonProps?.className)}
        onClick={() => {
          setItems((prev) => [
            ...prev,
            { id: Date.now(), pair: ["", ""] as [string, string] },
          ]);
        }}
      >
        <div className="flex gap-2 items-center">
          Add <Plus />
        </div>
      </ActionButton>
    </div>
  );
}
