import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import moment from "moment";
import { queryKeys } from "@/utils/query-keys";
import FormField from "@/components/form/field";
import ActionButton from "@/components/buttons/action-btn";
import { operatorSchema, type OperatorSchema } from "@/utils/schemas/operators";
import { getOperatorById, updateOperator } from "@/services/apis/admin/operators";
import SpacesTabledResults from "@/containers/spaces-table";

const defaultTime = moment().hour(0).minute(0).toDate();

const OperatorEditPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: res, isFetching } = useQuery({
    queryKey: [queryKeys.OPERATORS, id],
    queryFn: () => getOperatorById({ url: `/${id}` }),
    enabled: !!id,
  });

  console.log("operator data", res?.data);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, defaultValues },
    watch,
    setValue,
  } = useForm({
    resolver: zodResolver(operatorSchema),
  });

  useEffect(() => {
    if (res?.data.data) {
      reset(res?.data.data);
    }
  }, [res]);

  const {
    mutateAsync,
    isPending: updateLoading,
  } = useMutation({
    mutationFn: updateOperator,
  });

  const onSubmit = async (body: OperatorSchema) => {
    try {
      console.log("Operator edit body", body);

      await mutateAsync({
        url: id,
        body,
      });

      toast.success("Operator updated successfully");

      navigate("/operators");

    } catch (err) {
      toast.error("Failed to update operator");
    }
  };

return (
  <div className="container mx-auto p-6">
    <div className="flex justify-between items-center my-4">
      <h1 className="text-2xl font-bold">
        {watch("name", "")}
      </h1>
    </div>

    <div className="w-full max-w-4xl mx-auto py-8">
      <form onSubmit={handleSubmit(onSubmit)} className="auto-form-grid">

        {/* Name */}
        <FormField
          label="Operator Name"
          placeholder="Operator Name"
          {...register("name")}
          error={errors.name}
        />

        {/* Slug */}
        <FormField
          label="Slug"
          placeholder="operator-slug"
          {...register("slug")}
          error={errors.slug}
        />

        {/* Email */}
        <FormField
          label="Operator Email"
          type="email"
          placeholder="operator@example.com"
          {...register("email")}
          error={errors.email}
        />

        {/* Password */}
        {/* <FormField
          label="Password"
          type="password"
          placeholder="Enter password"
          {...register("password")}
          error={errors.password}
        /> */}

        {/* Headquarter Address */}
        <FormField
          label="Headquarter Address"
          placeholder="Enter headquarter address"
          {...register("headquarter.address")}
          error={errors.headquarter?.address}
          inputType="textarea"
        />

        {/* Headquarter Contact */}
        <FormField
          label="Headquarter Contact No"
          placeholder="Enter contact number"
          {...register("headquarter.contactNo")}
          error={errors.headquarter?.contactNo}
        />

        {/* Person Name */}
        <FormField
          label="Contact Person Name"
          placeholder="Enter person name"
          {...register("person.name")}
          error={errors.person?.name}
        />

        {/* Person Email */}
        <FormField
          label="Contact Person Email"
          type="email"
          placeholder="person@example.com"
          {...register("person.email")}
          error={errors.person?.email}
        />

        {/* Person Role */}
        <FormField
          label="Contact Person Role"
          placeholder="Operations Head"
          {...register("person.role")}
          error={errors.person?.role}
        />

        {/* Submit */}

        <div className="col-span-full flex justify-end">
          <ActionButton
            type="submit"
            loading={updateLoading}
            className="max-w-fit"
          >
            Update Operator
          </ActionButton>
        </div>

      </form>
    </div>
  
  


  <div className="w-full max-w-6xl mx-auto">
    <div className="flex justify-between items-center my-2">
      <h2 className="text-xl font-semibold">
        Spaces under this Operator
      </h2>
    </div>

    {/* Your existing spaces container/table goes here */}

    {/* <SpacesTableContainer operatorId={id} /> */}
    <SpacesTabledResults />

  </div>
</div>
);
};

export default OperatorEditPage;
