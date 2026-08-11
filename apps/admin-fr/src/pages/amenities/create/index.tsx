import React from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { createAmenity } from "@/services/apis/admin/amenity";
import { amenitySchema, type AmenitySchema } from "@/utils/schemas/amenity";
import { queryKeys } from "@/utils/query-keys";
import AmenityIconSelector from "@/components/amenity/selector";
import FormField from "@/components/form/field";
import FormSectionTitle from "@/components/form/section/title";
import ActionButton from "@/components/buttons/action-btn";

export default function CreateAmenity() {
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, defaultValues },
    watch,
    setValue,
  } = useForm({
    resolver: zodResolver(amenitySchema),
    defaultValues: { isActive: true },
  });

  const { mutateAsync, isPending: createLoading } = useMutation({
    mutationKey: [queryKeys.AMENITIES, "create"],
    mutationFn: createAmenity,
  });

  const onSubmit = async (body: AmenitySchema) => {
    try {
      console.log("Amenity body", body);
      const res = await mutateAsync({
        body,
      });

      if (res.status === 201) {
        toast.success("Amenity created successfully");
        navigate("/amenities");
        return;
      }
      throw new Error("Invalid response");
    } catch (err) {
      toast.error("Failed to create amenity");
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center my-4">
          <h1 className="text-2xl font-bold">{watch("name", "") || "Create Amenity"}</h1>
        </div>
      </div>
      <div className="w-full max-w-4xl mx-auto py-8">
        <form
          onSubmit={handleSubmit(onSubmit, (errors) => {
            console.log("Amenity form err", errors);
          })}
          className="auto-form-grid"
        >
          {/* SECTION: Amenity Details */}

          <FormSectionTitle>Create a New Amenity</FormSectionTitle>

          <FormField
            label="Name"
            placeholder="High Speed WiFi"
            // labelPosition="embedded"
            {...register("name")}
            error={errors.name}
          />

          <FormField label="Icon" error={errors.icon}>
            <AmenityIconSelector
              onSelect={(key) => {
                setValue("icon", key, { shouldValidate: true });
              }}
            />
          </FormField>

          {/* Status */}
          <div className="col-span-full flex gap-8">
            <div className="flex items-center gap-4">
              <label className="text-muted-foreground text-sm">{"Active Status"}</label>
              <Switch
                key={defaultValues?.isActive ? "active" : "inactive"}
                className="data-[state=checked]:bg-green-400 data-[state=unchecked]:bg-red-400"
                defaultChecked={!!defaultValues?.isActive}
                {...register("isActive")}
              />
            </div>
          </div>

          {/* Submit */}
          <div className="col-span-full mt-6 flex justify-end">
            <ActionButton
              type="submit"
              loading={createLoading}
              className="max-w-fit"
            >
              Create Amenity
            </ActionButton>
          </div>
        </form>
      </div>
    </div>
  );
}
