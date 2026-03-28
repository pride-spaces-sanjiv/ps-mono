import React, { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useMutation, useQuery } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { updateAmenity, getAmenity } from "@/services/apis/admin/amenity";
import { amenitySchema, type AmenitySchema } from "@/utils/schemas/amenity";
import { queryKeys } from "@/utils/query-keys";
import AmenityIconSelector from "@/components/amenity/selector";
import FormField from "@/components/form/field";
import ActionButton from "@/components/buttons/action-btn";
import { datifyObjectValues } from "@/utils/object/datify";

export default function EditAmenity() {
  const navigate = useNavigate();
  const { id = "" } = useParams();

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

  const { data: res, isFetching } = useQuery({
    queryKey: [queryKeys.AMENITIES, "update", id],
    queryFn: () => getAmenity({ url: id }),
  });

  const { mutateAsync, isPending: isUpdating } = useMutation({
    mutationKey: [queryKeys.AMENITIES, "update", id],
    mutationFn: updateAmenity,
  });

  const onSubmit = async (body: AmenitySchema) => {
    try {
      console.log("Amenity body", body);
      const res = await mutateAsync({
        body,
        url: id,
      });

      if (res.status === 200) {
        toast.success("Amenity updated successfully");
        navigate("/amenities");
        return;
      }
      throw new Error("Invalid response");
    } catch (err) {
      toast.error("Failed to update amenity");
    }
  };

  useEffect(() => {
    if (res?.data) {
      const modified = datifyObjectValues(res.data?.data, [
        "createdAt",
        "updatedAt",
      ]);
      reset({ ...defaultValues, ...modified });
    }
  }, [res?.data]);

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center my-4">
        <h1 className="text-2xl font-bold">{watch("name", "")}</h1>
      </div>
      <div className="w-full max-w-4xl mx-auto py-8">
        <form
          onSubmit={handleSubmit(onSubmit, (errors) => {
            console.log("Amenity form err", errors);
          })}
          className="auto-form-grid"
        >
          {/* SECTION: Amenity Details */}

          <div className="col-span-full  mb-8 ">
            <div className="flex items-center gap-3">
              <h1 className="text-base font-semibold  italic text-white/90 tracking-wide ">
                Edit Amenity
              </h1>
              <div className="flex-1 border-t border-muted-foreground/20"></div>
            </div>
          </div>

          <FormField
            label="Name"
            placeholder="High Speed WiFi"
            // labelPosition="embedded"
            {...register("name")}
            error={errors.name}
          />

          <FormField label="Icon" error={errors.icon}>
            <AmenityIconSelector
              defaultIconKey={defaultValues?.icon}
              onSelect={(key) => {
                setValue("icon", key, { shouldValidate: true });
              }}
            />
          </FormField>

          {/* Status */}
          <div className="col-span-full flex gap-8">
            <div className="flex items-center gap-4">
              <label className="text-white text-sm">{"Active Status"}</label>
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
              loading={isUpdating || isFetching}
              className="max-w-fit"
            >
              Update Amenity
            </ActionButton>
          </div>
        </form>
      </div>
    </div>
  );
}
