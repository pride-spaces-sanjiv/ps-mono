import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useStatesCities } from "@/services/hooks/use-states-cities";
import { branchSchema } from "@/utils/schemas/operators";
import { DialogClose } from "@/components/ui/dialog";
import { GroupedSearchSelect } from "@/components/search-select";
import { DialogModal } from "@/components/dialog";
import { FieldGroup } from "@/components/ui/field";
import FormField from "@/components/form/field";
import ActionButton from "@/components/buttons/action-btn";
import { PlusIcon } from "lucide-react";

type Props = {
  dialogModalProps: React.ComponentProps<typeof DialogModal>;
  triggerButtonProps: React.ComponentProps<typeof ActionButton>;
};

export default function StateBranchDialogForm({
  dialogModalProps,
  triggerButtonProps,
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

  return (
    <DialogModal
      headerProps={{ children: "Operator State addon" }}
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
      footerProps={{
        children: <ActionButton type="button">Save changes</ActionButton>,
      }}
    >
      <FieldGroup>
        <FormField
          key={`states-${statesData.length}`}
          label="State"
          labelPosition="embedded"
          inputType="select"
          items={statesData.map((st) => ({
            label: st.name,
            value: st.code,
          }))}
          pickerProps={{
            valueProps: { placeholder: "Maharashtra" },
            wrapperProps: {
              onValueChange: (val) => {
                console.log("State selected :", val);
              },
            },
          }}
          // {...register("state")}
          // error={errors?.state}
        >
          <GroupedSearchSelect
            
            items={statesData.map((st) => ({
              label: st.name,
              value: st.code as string,
              searchValue: st.name,
            }))}
          ></GroupedSearchSelect>
        </FormField>

        <FormField
          label="City"
          labelPosition="embedded"
          inputType="select"
          items={citiesData.map((st) => ({
            label: st.name,
            value: st.rId,
          }))}
          pickerProps={{
            valueProps: { placeholder: "Mumbai" },
            wrapperProps: {
              onValueChange: (val) => {
                console.log("City selected :", val);
              },
            },
          }}
          //  {...register("city")}
          //  error={errors?.city}
        />
        <FormField
          label="Branch Address"
          labelPosition="embedded"
          inputType="textarea"
          // {...register("location.branchAddress")}
          // error={errors.location?.branchAddress}
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
