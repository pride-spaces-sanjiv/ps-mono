import { SelectPicker } from "@/components/select";

type Props = {
  defaultLimit: number;
  onLimitChange: (limit: number) => any;
};

const limits = [20, 50, 100, 200];

export default function LimitSelector({
  defaultLimit,
  onLimitChange,
}: Partial<Props>) {
  return (
    <SelectPicker
      key={defaultLimit}
      wrapperProps={{
        defaultValue: String(defaultLimit || limits[0]),
        onValueChange(value) {
          // setLimit(Number(value));
          onLimitChange?.(Number(value));
        },
      }}
      items={limits.map((limit) => ({
        label: limit.toString(),
        value: limit.toString(),
      }))}
      labelProps={{ children: "Select Limit" }}
      valueProps={{ placeholder: "Select limit" }}
      className="w-[80px]"
    />
  );
}
