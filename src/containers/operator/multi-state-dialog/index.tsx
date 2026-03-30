import { useEffect, useMemo, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, PlusIcon } from "lucide-react";
import { Field, FieldGroup } from "@/components/ui/field";
import { useStatesCities } from "@/services/hooks/use-states-cities";
import { branchSchema, type BranchSchema } from "@/utils/schemas/operators";
import { cn } from "@/utils/className";
import { DialogModal } from "@/components/dialog";
import { GroupedSearchSelect } from "@/components/search-select";
import FormField from "@/components/form/field";
import ActionButton from "@/components/buttons/action-btn";

type Props = {
  dialogModalProps: React.ComponentProps<typeof DialogModal>;
  triggerButtonProps: React.ComponentProps<typeof ActionButton>;
  onSave: (data: BranchSchema) => any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultData: BranchSchema;
  hideTrigger: boolean;
  isEditing: boolean;
};

export default function MultiState({
  dialogModalProps,
  triggerButtonProps,
  onSave,
  defaultData,
  hideTrigger,
  isEditing = false,
}: Partial<Props>) {
  const { statesData, groupedCities, citiesData } = useStatesCities();

  const {
    register,
    handleSubmit,
    formState: { isValid, errors, defaultValues },
    watch,
    setValue,
    reset,
    trigger,
  } = useForm({
    resolver: zodResolver(branchSchema),
  });

  const dialogClose = useRef<HTMLButtonElement | null>(null);

  const stateOnlyCities = useMemo(() => {
    // console.log(citiesData, watch("code", ""));
    return citiesData.filter((city) => city.state === watch("code", ""));
  }, [watch("code", ""), citiesData]);

  useEffect(() => {
    defaultData && reset(defaultData);
  }, [defaultData]);

  return (
    <DialogModal
      {...dialogModalProps}
      onOpenChange={(open) => {
        open && reset(defaultData);
        !open && reset(branchSchema.partial().safeParse({}).data);
      }}
      titleProps={{
        children: `Operator State ${isEditing ? "Edit" : "Addon"}`,
        ...dialogModalProps?.titleProps,
      }}
      descriptionProps={{
        children: `Fill the details to ${isEditing ? "edit" : "add"} ${isEditing ? "the" : "a"} state branch for the operator`,
        ...dialogModalProps?.descriptionProps,
      }}
      triggerProps={{
        children: (
          <ActionButton
            variant="outline"
            type="button"
            {...triggerButtonProps}
            className="flex items-center gap-2 h-10 px-4"
          >
            <div className="flex gap-2 items-center">
              {isEditing ? "Edit" : "Add a"} state <PlusIcon />
            </div>
          </ActionButton>
        ),
        ...dialogModalProps?.triggerProps,
      }}
      closeProps={{ ref: dialogClose, ...dialogModalProps?.closeProps }}
      footerProps={{
        children: (
          <ActionButton
            type="button"
            onClick={async () => {
              const valid = await trigger();
              valid && onSave?.(watch());
              dialogClose?.current?.click();
            }}
          >
            {isEditing ? "Update" : "Save"} changes
          </ActionButton>
        ),
        ...dialogModalProps?.footerProps,
      }}
    >
      <FieldGroup>
        <FormField
          key={`states-${statesData.length}`}
          label="State"
          labelPosition="embedded"
          // inputType="select"
          // items={statesData.map((st) => ({
          //   label: st.name,
          //   value: st.code,
          // }))}
          // pickerProps={{
          //   valueProps: { placeholder: "Maharashtra" },
          //   wrapperProps: {
          //     onValueChange: (val) => {
          //       console.log("State selected :", val);
          //     },
          //   },
          // }}
          error={errors?.name || errors?.code}
        >
          <GroupedSearchSelect
            items={statesData
              .map((st) => ({
                label: st.name,
                value: st.code as string,
                searchValue: st.name,
              }))
              .filter((item) => item.value)}
            defaultSelected={{
              label: "",
              value: defaultValues?.code,
              searchValue: "",
            }}
            onSelect={(item) => {
              setValue("name", item.label as string, { shouldValidate: true });
              setValue("code", item.value as string, { shouldValidate: true });
            }}
            triggerProps={{
              children: (
                <ActionButton variant={"outline"}>
                  {watch("name") || "Select State"}
                </ActionButton>
              ),
            }}
            inputProps={{ placeholder: "Search State" }}
          ></GroupedSearchSelect>
        </FormField>

        {!!watch("name") && watch("code", "") && (
          <FormField
            key={`cities-${watch("code", "")}-${stateOnlyCities.length}`}
            label="City"
            labelPosition="embedded"
            error={errors?.city}
          >
            <GroupedSearchSelect
              items={stateOnlyCities
                .map((city) => ({
                  label: city.name,
                  value: city.name as string,
                  searchValue: city.name,
                }))
                .filter((item) => item.value)}
              onSelect={(item) => {
                setValue("city", item.label as string, {
                  shouldValidate: true,
                });
              }}
              triggerProps={{
                children: (
                  <ActionButton variant={"outline"}>
                    {watch("city") || "Select City"}
                  </ActionButton>
                ),
              }}
              defaultSelected={{
                label: "",
                value: defaultValues?.city,
                searchValue: "",
              }}
              inputProps={{ placeholder: "Search City" }}
            ></GroupedSearchSelect>
          </FormField>
        )}

        <FormField
          label="Zip/Postal Code"
          labelPosition="embedded"
          {...register("postalCode")}
          error={errors.postalCode}
        />

        <FormField
          label="HQ State Branch Address"
          labelPosition="embedded"
          inputType="textarea"
          {...register("address")}
          error={errors.address}
        />

        <FormField
          label="HQ POC Mobile No"
          labelPosition="embedded"
          error={errors.person?.contactNo}
          key={`hq-poc-phone-${defaultValues?.person?.contactNo}`}
          type="tel"
          inputMode="tel"
          inputType="phone"
          defaultValue={defaultValues?.person?.contactNo}
          placeholder="+1-123-456-7890"
          onChange={(val) => {
            console.log(val);
            setValue("person.contactNo", val?.toString() || "", {
              shouldValidate: true,
            });
          }}
        />

        <FormField
          label="GST Number"
          labelPosition="embedded"
          placeholder="Enter GST Number"
          {...register("gstNo")}
          error={errors?.gstNo}
        />
      </FieldGroup>
    </DialogModal>
  );
}
