import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { getSpaceById, updateSpace } from "@/services/apis/admin/spaces";
import { spaceSchema, type SpaceSchema } from "@/utils/schemas/spaces";
import { datifyObjectValues } from "@/utils/object/datify";
import { queryKeys } from "@/utils/query-keys";
import FormField from "@/components/form/field";
import { SelectPicker } from "@/components/select";
import GroupsSelectPicker from "@/components/groups-selector";
import { GroupedSearchSelect } from "@/components/search-select";
import ActionButton from "@/components/buttons/action-btn";
import { Checkbox } from "@/components/ui/checkbox";

const SpaceEditPage = () => {
  const { id } = useParams();
  const { data: res, isFetching: isLoading } = useQuery({
    queryKey: [queryKeys.SPACES, id],
    queryFn: () =>
      getSpaceById({ query: { withOperator: true }, url: `/${id}` }),
    enabled: !!id,
  });
  console.log("space data", res?.data);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, defaultValues },
    watch,
    setValue,
  } = useForm({ resolver: zodResolver(spaceSchema) });

  // useEffect(() => {
  //   if (data) {
  //     reset(data);
  //   }
  // }, [data]);
  useEffect(() => {
    if (res?.data.data) {
      const modified = datifyObjectValues(res?.data.data, [
        "closeTime",
        "openTime",
        "createdAt",
        "updatedAt",
      ]);
      reset(modified as NonNullable<typeof modified>);
    }
  }, [res]);

  const { mutateAsync } = useMutation({
    mutationFn: updateSpace,
  });

  const onSubmit = async (body: any) => {
    await mutateAsync({
      query: { id },
      body,
    });
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center my-4">
        <h1 className="text-2xl font-bold"> Edit Space: {watch("name", "")}</h1>
      </div>

      <div className="w-full max-w-4xl mx-auto py-8">
        <form onSubmit={handleSubmit(onSubmit)} className="auto-form-grid">
          {/* Name */}
          <FormField
            label="Space Name"
            placeholder="My Space"
            {...register("name")}
            error={errors.name}
          />

          {/* Email */}
          <FormField
            label="Email"
            type="email"
            placeholder="my-space@example.com"
            {...register("email")}
            error={errors.email}
          />

          {/* Branch */}
          <FormField
            label="Branch"
            placeholder="Mumbai"
            {...register("branch")}
            readOnly
            disabled
            error={errors.branch}
          />

          {/* Enterprise */}
          <FormField
            label="Operator"
            placeholder="My Space Org"
            {...register("operator")}
            readOnly
            disabled
            error={errors.operator}
          />

          {/* Open Days */}
          <FormField
            label="Open Days"
            placeholder="My Space Org"
            error={{
              message: errors.openDays?.message,
              type: errors.openDays?.type || "validate",
            }}
          >
            <GroupedSearchSelect
              key={`days-${defaultValues?.openDays?.length}`}
              type="multiple"
              defaultSelected={defaultValues?.openDays}
              items={[
                "Monday",
                "Tuesday",
                "Wednesday",
                "Thursday",
                "Friday",
                "Saturday",
                "Sunday",
              ].map((dt, i) => ({
                label: dt,
                value: i + 1,
              }))}
              triggerProps={{
                children: (
                  <ActionButton
                    type="button"
                    variant={"secondary"}
                    className={"min-h-[40px]"}
                  >
                    {watch("openDays", []).length > 0
                      ? watch("openDays", []).length
                      : "Select Days"}
                  </ActionButton>
                ),
              }}
              contentProps={{ className: "max-h-[300px]" }}
              onSelect={(items) => {
                setValue(
                  "openDays",
                  items.filter((val) => typeof val === "number"),
                );
              }}
            />
          </FormField>

          {/* Description */}
          <FormField
            label="Description"
            placeholder="Enter a description for your space"
            {...register("description")}
            error={errors.description}
            inputType="textarea"
          />

          {/* Location Section */}
          <FormField
            label="City"
            placeholder="Enter the city for your space"
            {...register("location.city")}
            error={errors.location?.city}
          />
          <FormField
            label="State"
            placeholder="Enter the state for your space"
            {...register("location.state")}
            error={errors.location?.state}
          />
          <FormField
            label="Country"
            placeholder="Enter the country for your space"
            {...register("location.country")}
            error={errors.location?.country}
          />
          {/* Address */}
          <FormField
            label="Address"
            placeholder="Enter the address for your space"
            {...register("location.address")}
            error={errors.location?.address}
            inputType="textarea"
          />

          {/* Status */}
          <div className="flex items-center gap-4">
            <label className="text-white text-sm">Active</label>
            <Checkbox
              defaultChecked={!!defaultValues?.isActive}
              {...register("isActive")}
            />
          </div>

          <div className="flex items-center gap-4">
            <label className="text-white text-sm">Verified</label>
            <Checkbox
              defaultChecked={!!defaultValues?.isVerified}
              {...register("isVerified")}
            />
          </div>

          {/* Submit */}
          <ActionButton
            type="submit"
            className="max-w-fit self-end col-span-full"
          >
            Save Changes
          </ActionButton>
        </form>
      </div>
      {/* <UserCreateModal /> */}
      {/* <UsersTabledResults /> */}
    </div>
  );
};

export default SpaceEditPage;
