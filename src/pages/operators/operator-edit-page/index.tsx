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
import {
  getOperatorById,
  updateOperator,
} from "@/services/apis/admin/operators";
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

  const { mutateAsync, isPending: updateLoading } = useMutation({
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
        <h1 className="text-2xl font-bold">{watch("name", "")}</h1>
      </div>
      <div className="w-full max-w-4xl mx-auto py-8">
        <form onSubmit={handleSubmit(onSubmit)} className="auto-form-grid">

          {/* SECTION: Operator Details */}

          <div className="col-span-full  mb-8 ">
            <div className="flex items-center gap-3">
              <h1 className="text-base font-semibold  italic text-white/90 tracking-wide ">
                Operator Details
              </h1>
              <div className="flex-1 border-t border-muted-foreground/20"></div>
            </div>
          </div>

          <FormField
            label="Name"
            placeholder="Operator Name"
            {...register("name")}
            error={errors.name}
          />

          <FormField
            label="Slug"
            placeholder="operator-slug"
            {...register("slug")}
            error={errors.slug}
          />

          <FormField
            label="Email"
            type="email"
            placeholder="operator@example.com"
            {...register("email")}
            error={errors.email}
          />

          {/* SECTION: Headquarter Details */}

          <FormField
            label="HQ Address"
            placeholder="Enter headquarter address"
            {...register("headquarter.address")}
            error={errors.headquarter?.address}
            inputType="textarea"
          />

          <FormField
            label="HQ Telephone"
            placeholder="Enter contact number"
            {...register("headquarter.contactNo")}
            error={errors.headquarter?.contactNo}
          />

          {/* SECTION: Operator Point of Contact */}

          <div className="col-span-full mt-6 mb-8 ">
            <div className="flex items-center gap-3">
              <h1 className="text-base font-semibold  italic text-white/90 tracking-wide ">
                Point of Contact Details
              </h1>
              <div className="flex-1 border-t border-muted-foreground/20"></div>
            </div>
          </div>


          <FormField
            label="Person"
            placeholder="Enter person name"
            {...register("person.name")}
            error={errors.person?.name}
          />

          <FormField
            label="Email"
            type="email"
            placeholder="person@example.com"
            {...register("person.email")}
            error={errors.person?.email}
          />

          <FormField
            label="Telephone"
            type="tel"
            inputMode="tel"
            placeholder="1234567890"
          // {...register("person.contactNo")}
          // error={errors?.person?.contactNo}
          />

          <FormField
            label="Designation"
            placeholder="Operations Head"
            {...register("person.role")}
            error={errors.person?.role}
          />

          {/* SECTION: GST Details */}

          <div className="col-span-full mt-6 mb-8 ">
            <div className="flex items-center gap-3">
              <h1 className="text-base font-semibold  italic text-white/90 tracking-wide ">
                GST Details
              </h1>
              <div className="flex-1 border-t border-muted-foreground/20"></div>
            </div>
          </div>

          <FormField
            label="GST Number"
            placeholder="Enter GST Number"
          // {...register("gstNumber")}
          // error={errors?.gstNumber}
          />

          <FormField
            label="CIN Number"
            placeholder="Enter CIN Number"
          // {...register("cinNumber")}
          // error={errors?.cinNumber}
          />

          {/* Submit */}

          <div className="col-span-full mt-6 flex justify-end">
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
          <h2 className="text-xl font-semibold">Centres under this Operator:</h2>
        </div>

        {/* Your existing spaces container/table goes here */}

        {/* <SpacesTableContainer operatorId={id} /> */}
        <SpacesTabledResults operatorId={res?.data?.data?.id} />
      </div>
    </div>
  );
};

export default OperatorEditPage;
