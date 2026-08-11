import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import {
  operatorSchema,
  type BranchSchema,
  type OperatorSchema,
} from "@/utils/schemas/operators";
import { createOperator } from "@/services/apis/admin/operators";
import {
  setSinglePrimaryBranch,
  notifyPrimarySingleBranch,
} from "@/utils/data/branches";
import { generatePassword } from "@/utils/string/password";
import FormField from "@/components/form/field";
import FormSectionTitle from "@/components/form/section/title";
import ActionButton from "@/components/buttons/action-btn";
import MultiStateDialog from "@/containers/operator/multi-state-dialog";
import { MultiStateCard } from "@/containers/multi-state/multi-state-card";
import type { MultiStateItem } from "@/containers/multi-state/types";

const OperatorCreatePage = () => {
  const navigate = useNavigate();
  const [states, setStates] = useState<MultiStateItem[]>([]);
  const [isStateDialogOpen, setIsStateDialogOpen] = useState(false);
  const [editingState, setEditingState] = useState<MultiStateItem | null>(null);

  const {
    register,
    handleSubmit,
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

  const handleSaveState = (state: MultiStateItem) => {
    setStates((prev) => {
      const exists = prev.some((item) => item.id === state.id);
      if (exists) {
        return prev.map((item) => (item.id === state.id ? state : item));
      }

      return [...prev, state];
    });

    setEditingState(null);
  };

  const handleEditState = (state: MultiStateItem) => {
    setEditingState(state);
    setIsStateDialogOpen(true);
  };

  const handleDeleteState = (id: string) => {
    setStates((prev) => prev.filter((item) => item.id !== id));
    setEditingState((prev) => (prev?.id === id ? null : prev));
  };

  return (
    <div className="container px-auto w-full p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center my-4">
          <h1 className="text-2xl font-bold">{watch("name", "") || "Create Operator"}</h1>
        </div>
      </div>
      <div className="w-full max-w-4xl mx-auto py-8">
        <form
          onSubmit={handleSubmit(onSubmit, (errors) => {
            console.log("Operator form err", errors);
          })}
          className="auto-form-grid"
        >
          {/* SECTION: Operator Details */}

          <FormSectionTitle>Operator Details</FormSectionTitle>

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
            label="CIN/LLPIN Number"
            labelPosition="embedded"
            placeholder="Enter CIN/LLPIN Number"
            {...register("cinNo")}
            error={errors?.cinNo}
          />

          {/* Status */}

          <div className="col-span-full mt-6">
            <MultiStateCard
              branches={states}
              onEdit={(branch) => handleEditState(branch as MultiStateItem)}
              onDelete={(branch) =>
                handleDeleteState((branch as MultiStateItem).id)
              }
            />
          </div>

          {/* Submit */}
          <div className="col-span-full mt-6 flex justify-between items-center">
            {/* LEFT SIDE */}
            <MultiStateDialog
              disAllowedStates={watch("branches")?.map((br) => br.code) || []}
              open={isStateDialogOpen}
              onOpenChange={(open) => {
                setIsStateDialogOpen(open);
                if (!open) {
                  setEditingState(null);
                }
              }}
              onSave={(data) => {
                const branches = setSinglePrimaryBranch(
                  [...(watch("branches", []) || [])] as BranchSchema[],
                  data,
                );
                setValue("branches", branches, {
                  shouldValidate: true,
                });
                notifyPrimarySingleBranch(branches, data);
              }}
              isEditing={false}
            />

            {/* RIGHT SIDE */}
            <div className="flex items-center gap-4">
              {/* Toggle */}
              <div className="flex items-center gap-2">
                <label className="text-sm text-muted-foreground">
                  Active Operator
                </label>
                <Switch
                  key={defaultValues?.isActive ? "active" : "inactive"}
                  className="data-[state=checked]:bg-green-400 data-[state=unchecked]:bg-red-400"
                  defaultChecked={!!defaultValues?.isActive}
                  {...register("isActive")}
                />
              </div>

              {/* Button */}
              <ActionButton
                type="submit"
                loading={createLoading}
                className="h-10 px-4"
              >
                Create Operator
              </ActionButton>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OperatorCreatePage;
