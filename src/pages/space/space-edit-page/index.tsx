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
            error={errors.openDays}
          >
            <SelectPicker
              defaultValue={defaultValues?.openDays}
              items={[
                "Monday",
                "Tuesday",
                "Wednesday",
                "Thursday",
                "Friday",
                "Saturday",
                "Sunday",
              ].map((day, i) => ({ label: day, value: i + 1 }))}
              wrapperProps={{
                onValueChange: (val) =>
                  setValue("openDays", Number(val), { shouldValidate: true }),
              }}
            />
          </FormField>

          {/* Description */}
          <div className="flex flex-col gap-2 md:col-span-2">
            <label className="text-white text-sm">Description</label>
            <textarea
              rows={3}
              {...register("description")}
              className="p-2 rounded-md border border-gray-600 bg-transparent"
            />
          </div>

          {/* Location Section */}
          <div className="md:col-span-2">
            <label className="text-white text-sm mb-2 block">Location</label>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-white text-xs opacity-80">Address</label>
                <input
                  {...register("location.address")}
                  className="p-2 rounded-md border border-gray-600 bg-transparent"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-white text-xs opacity-80">City</label>
                <input
                  {...register("location.city")}
                  className="p-2 rounded-md border border-gray-600 bg-transparent"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-white text-xs opacity-80">State</label>
                <input
                  {...register("location.state")}
                  className="p-2 rounded-md border border-gray-600 bg-transparent"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-white text-xs opacity-80">
                  Postal Code
                </label>
                <input
                  {...register("location.postalCode")}
                  className="p-2 rounded-md border border-gray-600 bg-transparent"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-white text-xs opacity-80">Country</label>
                <input
                  {...register("location.country")}
                  className="p-2 rounded-md border border-gray-600 bg-transparent"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-white text-xs opacity-80">
                  Latitude
                </label>
                <input
                  type="number"
                  step="any"
                  {...register("location.lat")}
                  className="p-2 rounded-md border border-gray-600 bg-transparent"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-white text-xs opacity-80">
                  Longitude
                </label>
                <input
                  type="number"
                  step="any"
                  {...register("location.lng")}
                  className="p-2 rounded-md border border-gray-600 bg-transparent"
                />
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center gap-4">
            <label className="text-white text-sm">Active</label>
            <input type="checkbox" {...register("isActive")} />
          </div>

          <div className="flex items-center gap-4">
            <label className="text-white text-sm">Verified</label>
            <input type="checkbox" {...register("isVerified")} />
          </div>

          {/* Submit */}
          <div className="md:col-span-2 flex justify-end mt-4">
            <button
              type="submit"
              className="px-6 py-2 rounded-md border border-gray-500 hover:opacity-80"
            >
              Update Space
            </button>
          </div>
        </form>
      </div>
      {/* <UserCreateModal /> */}
      {/* <UsersTabledResults /> */}
    </div>
  );
};

export default SpaceEditPage;
