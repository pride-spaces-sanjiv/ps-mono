import { getSpaceById, updateSpace } from "@/services/apis/admin/spaces";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useParams } from "react-router-dom";

const SpaceEditPage = () => {
  const { id } = useParams();
  const { data, isLoading } = useQuery({
    queryKey: ["space", id],
    queryFn: () => getSpaceById(
      { query: { id } }
    ),
    enabled: !!id,
  });
  console.log("space data",data);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  // useEffect(() => {
  //   if (data) {
  //     reset(data);
  //   }
  // }, [data]);
  useEffect(() => {
  if (data?.data.data) {
    reset(data?.data.data);
  }
}, [data]);
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
        <h1 className="text-2xl font-bold">      Edit Space: {data?.data.data.name}
          </h1>
      </div>

        <div className="w-full max-w-4xl mx-auto py-8">
<form
  onSubmit={handleSubmit(onSubmit)}
  className="grid grid-cols-1 md:grid-cols-2 gap-6"
>

  {/* Name */}
  <div className="flex flex-col gap-2">
    <label className="text-white text-sm">Space Name</label>
    <input
      {...register("name")}
      className="p-2 rounded-md border border-gray-600 bg-transparent"
    />
  </div>

  {/* Email */}
  <div className="flex flex-col gap-2">
    <label className="text-white text-sm">Email</label>
    <input
      {...register("email")}
      className="p-2 rounded-md border border-gray-600 bg-transparent"
    />
  </div>

  {/* Branch */}
  <div className="flex flex-col gap-2">
    <label className="text-white text-sm">Branch</label>
    <input
      {...register("branch")}
      className="p-2 rounded-md border border-gray-600 bg-transparent"
    />
  </div>

  {/* Enterprise */}
  <div className="flex flex-col gap-2">
    <label className="text-white text-sm">Operator</label>
    <input
      {...register("enterprise")}
      className="p-2 rounded-md border border-gray-600 bg-transparent"
    />
  </div>

  {/* Open Days */}
  <div className="flex flex-col gap-2">
    <label className="text-white text-sm">Open Days</label>
    <input
      type="number"
      {...register("openDays")}
      className="p-2 rounded-md border border-gray-600 bg-transparent"
    />
  </div>

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
        <label className="text-white text-xs opacity-80">Postal Code</label>
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
        <label className="text-white text-xs opacity-80">Latitude</label>
        <input
          type="number"
          step="any"
          {...register("location.lat")}
          className="p-2 rounded-md border border-gray-600 bg-transparent"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-white text-xs opacity-80">Longitude</label>
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