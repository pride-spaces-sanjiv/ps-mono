import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import moment from "moment";
import { Switch } from "@/components/ui/switch";
import { operatorSchema, type OperatorSchema } from "@/utils/schemas/operators";
import {
  getOperatorById,
  updateOperator,
  createOperator,
} from "@/services/apis/admin/operators";
import { generatePassword } from "@/utils/string/password";
import { queryKeys } from "@/utils/query-keys";
import { DialogModal } from "@/components/dialog";
import SpacesTabledResults from "@/containers/spaces-table";
import FormField from "@/components/form/field";
import ActionButton from "@/components/buttons/action-btn";

const defaultTime = moment().hour(0).minute(0).toDate();

const OperatorCreatePage = () => {
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, defaultValues },
    watch,
    setValue,
  } = useForm({
    resolver: zodResolver(operatorSchema),
    defaultValues: { isActive: true, password: generatePassword() },
  });

  const { mutateAsync, isPending: createLoading } = useMutation({
    mutationFn: createOperator,
  });

  const onSubmit = async (body: OperatorSchema) => {
    try {
      console.log("Operator body", body);
      const res = await mutateAsync({
        body,
      });

      if (res.status === 201) {
        toast.success("Operator created successfully");
        navigate("/operators");
        return;
      }
      throw new Error("Invalid response");
    } catch (err) {
      toast.error("Failed to create operator");
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center my-4">
        <h1 className="text-2xl font-bold">{watch("name", "")}</h1>
      </div>
      <div className="w-full max-w-4xl mx-auto py-8">
        <form
          onSubmit={handleSubmit(onSubmit, (errors) => {
            console.log("Operator form err", errors);
          })}
          className="auto-form-grid"
        >
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
            label="Register Name"
            placeholder="Register Name"
            labelPosition="embedded"
            {...register("name")}
            error={errors.name}
          />
          <FormField
            label="Brand Name"
            placeholder="Brand Name"
            labelPosition="embedded"
            {...register("brandName")}
            error={errors.brandName}
          />
          <FormField
            label="Slug"
            labelPosition="embedded"
            placeholder="operator-slug"
            {...register("slug")}
            error={errors.slug}
          />

          <FormField
            label="Admin Email"
            labelPosition="embedded"
            type="email"
            placeholder="operator@example.com"
            {...register("email")}
            error={errors.email}
          />
          <FormField
            label="Password"
            labelPosition="embedded"
            inputType="password"
            placeholder="••••••••"
            {...register("password")}
            error={errors.password}
          />

          {/* SECTION: Headquarter Details */}

          <FormField
            label="HQ Address"
            labelPosition="embedded"
            placeholder="Enter headquarter address"
            {...register("headquarter.address")}
            error={errors.headquarter?.address}
            inputType="textarea"
          />

          <FormField
            label="HQ Telephone"
            labelPosition="embedded"
            error={errors.headquarter?.contactNo}
            key={`hq-contact-${defaultValues?.headquarter?.contactNo}`}
            type="tel"
            inputMode="tel"
            inputType="phone"
            defaultValue={defaultValues?.headquarter?.contactNo}
            placeholder="+1-123-456-7890"
            onChange={(val) => {
              console.log(val);
              setValue("headquarter.contactNo", val?.toString() || "", {
                shouldValidate: true,
              });
            }}
          />

          {/* SECTION: Operator Point of Contact */}

          {/* <div className="col-span-full mt-6 mb-8 ">
            <div className="flex items-center gap-3">
              <h1 className="text-base font-semibold  italic text-white/90 tracking-wide ">
                Point of Contact Details
              </h1>
              <div className="flex-1 border-t border-muted-foreground/20"></div>
            </div>
          </div> */}

          <FormField
            label="POC Name"
            labelPosition="embedded"
            placeholder="John Doe"
            {...register("person.name")}
            error={errors?.person?.name}
          />

          <FormField
            label="POC Email"
            labelPosition="embedded"
            type="email"
            placeholder="john.doe@example.com"
            {...register("person.email")}
            error={errors?.person?.email}
          />

          <FormField
            key={`poc-${defaultValues?.person?.contactNo}`}
            label="POC Mobile No"
            labelPosition="embedded"
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
            error={errors?.person?.contactNo}
          />

          <FormField
            label="POC Designation"
            placeholder="Centre Manager"
            labelPosition="embedded"
            {...register("person.role")}
            error={errors?.person?.role}
          />

          {/* SECTION: GST Details */}

          {/* <div className="col-span-full mt-6 mb-8 ">
            <div className="flex items-center gap-3">
              <h1 className="text-base font-semibold  italic text-white/90 tracking-wide ">
                GST Details
              </h1>
              <div className="flex-1 border-t border-muted-foreground/20"></div>
            </div>
          </div> */}

          <FormField
            label="GST Number"
            labelPosition="embedded"
            placeholder="Enter GST Number"
            {...register("gstNo")}
            error={errors?.gstNo}
          />

          <FormField
            label="CIN Number"
            labelPosition="embedded"
            placeholder="Enter CIN Number"
            {...register("cinNo")}
            error={errors?.cinNo}
          />

          {/* Status */}
          <div className="col-span-full flex gap-8">
            <div className="flex items-center gap-4">
              <label className="text-white text-sm">{"Active Operator"}</label>
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
              Create Operator
            </ActionButton>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OperatorCreatePage;
