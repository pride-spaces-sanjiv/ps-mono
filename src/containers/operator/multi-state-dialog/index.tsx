import { useMemo, useRef } from "react";
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
};

export default function MultiState({
  dialogModalProps,
  triggerButtonProps,
  onSave,
}: Partial<Props>) {
  const { statesData, groupedCities, citiesData } = useStatesCities();

  const {
    register,
    handleSubmit,
    formState: { isValid, errors, defaultValues },
    watch,
    setValue,
  } = useForm({
    resolver: zodResolver(branchSchema),
  });

  const dialogClose = useRef<HTMLButtonElement | null>(null);

  const stateOnlyCities = useMemo(() => {
    console.log(citiesData, watch("code", ""));
    return citiesData.filter((city) => city.state === watch("code", ""));
  }, [watch("code", ""), citiesData]);

  return (
    <DialogModal
      titleProps={{ children: "Operator State addon" }}
      descriptionProps={{
        children: "Fill the details to add a state branch for the operator",
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
              Add a state <PlusIcon />
            </div>
          </ActionButton>
        ),
      }}
      closeProps={{ ref: dialogClose }}
      footerProps={{
        children: (
          <ActionButton
            type="button"
            onClick={() => {
              isValid && onSave?.(watch());
            }}
          >
            Save changes
          </ActionButton>
        ),
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
            onSelect={(item) => {
              setValue("name", item.label as string, { shouldValidate: true });
              setValue("code", item.value, { shouldValidate: true });
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
            // inputType="select"
            // items={citiesData.map((city) => ({
            //   label: city.name,
            //   value: city.rId,
            // }))}
            // pickerProps={{
            //   valueProps: { placeholder: "Mumbai" },
            //   wrapperProps: {
            //     onValueChange: (val) => {
            //       console.log("City selected :", val);
            //     },
            //   },
            // }}
            error={errors?.city}
          >
            <GroupedSearchSelect
              items={stateOnlyCities
                .map((city) => ({
                  label: city.name,
                  value: city.rId as number,
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
              inputProps={{ placeholder: "Search City" }}
            ></GroupedSearchSelect>
          </FormField>
        )}

        <FormField
          label="Branch Address"
          labelPosition="embedded"
          inputType="textarea"
          {...register("address")}
          error={errors.address}
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
