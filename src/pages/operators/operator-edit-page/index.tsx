import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useStatesCities } from "@/services/hooks/use-states-cities";
import {
  operatorSchema,
  type BranchSchema,
  type OperatorSchema,
} from "@/utils/schemas/operators";
import {
  getOperatorById,
  updateOperator,
} from "@/services/apis/admin/operators";
import {
  setSinglePrimaryBranch,
  notifyPrimarySingleBranch,
} from "@/utils/data/branches";
import { compareFields } from "@/utils/object/compare";
import { queryKeys } from "@/utils/query-keys";
import { DialogModal } from "@/components/dialog";
import SpacesTabledResults from "@/containers/spaces-table";
import MultiStateDialog from "@/containers/operator/multi-state-dialog";
import { MultiStateCard } from "@/containers/multi-state/multi-state-card";
import FormField from "@/components/form/field";
import ActionButton from "@/components/buttons/action-btn";
import type { MultiStateItem } from "@/containers/multi-state/types";
import FormSectionTitle from "@/components/form/section/title";
import type { Dump } from "@/types/data/dump";
import type { Operator } from "@/types/data/operators";

const OperatorEditPage = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const { from: fromRoute, data: locData } = useMemo(() => {
    const state = location.state as
      | undefined
      | null
      | { from?: string; data?: Dump<Operator> };
    return state || {};
  }, [location.state]);

  const { statesData, groupedCities, citiesData } = useStatesCities();
  const [states, setStates] = useState<MultiStateItem[]>([]);
  const [isStateDialogOpen, setIsStateDialogOpen] = useState(false);
  const [editingState, setEditingState] = useState<MultiStateItem | null>(null);

  const { data: res } = useQuery({
    queryKey: [queryKeys.OPERATORS, id],
    queryFn: () => getOperatorById({ url: `/${id}` }),
    enabled: !!id,
  });

  console.log("operator data", res?.data);

  // Get added or changed fields
  const {
    changedFields,
    changedData,
    newFields,
    newData,
    allFields: allUpdatedFields,
    allData: allUpdatedData,
  } = useMemo(() => {
    const comparedRes = compareFields(res?.data?.data, locData?.data, {
      excludeFields: ["id", "totalSpaces", "createdAt", "updatedAt"],
    });
    return comparedRes;
  }, [res?.data, locData?.data]);
  console.log("Changed operator data :", allUpdatedFields, allUpdatedData);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, defaultValues },
    watch,
    setValue,
  } = useForm({
    resolver: zodResolver(operatorSchema.omit({ password: true })),
  });

  useEffect(() => {
    if (res?.data.data) {
      const operatorData = { ...res.data.data, ...allUpdatedData };
      const mergedBranches = operatorData.branches?.map((branch) => ({
        ...branch,
        person: {
          ...branch.person,
          name: branch.person?.name ?? operatorData.person?.name,
          email: branch.person?.email ?? operatorData.person?.email,
          role: branch.person?.role ?? operatorData.person?.role,
        },
      }));

      reset({
        ...operatorData,
        branches: mergedBranches,
      });
    }
  }, [res, reset, allUpdatedData]);

  const { mutateAsync, isPending: updateLoading } = useMutation({
    mutationKey: [queryKeys.OPERATORS, id],
    mutationFn: updateOperator,
  });

  const { mutateAsync: branchesMutater, isPending: branchesLoading } =
    useMutation({
      mutationKey: [queryKeys.OPERATORS, id, "branches"],
      mutationFn: (branches: BranchSchema[]) =>
        updateOperator({
          body: { branches: branches },
          url: id,
        }),
    });

  const onSubmit = async (body: Omit<OperatorSchema, "password">) => {
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

  const handleBranchesUpdate = async (branches: BranchSchema[]) => {
    try {
      const res = await branchesMutater(branches);
      if (res.status === 200 && res.data?.data?.branches) {
        toast.success("Updated state branches");
        return;
      }
      throw new Error("Invalid response");
    } catch (err: any) {
      console.error("Error state branches update :", err);
      toast.error("Failed to update state branches");
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

          <FormSectionTitle>Operator Details</FormSectionTitle>

          <FormField
            label="Register Name"
            placeholder="Operator Name"
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
            label={
              <>
                Company Email
                <br />
                (For Admin User Login)
              </>
            }
            labelPosition="embedded"
            type="email"
            placeholder="operator@example.com"
            {...register("email")}
            error={errors.email}
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
            label="HQ Landline/Customer Care No"
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
            label="HQ POC Name"
            labelPosition="embedded"
            placeholder="John Doe"
            {...register("person.name")}
            error={errors?.person?.name}
          />

          <FormField
            label="HQ POC Email"
            labelPosition="embedded"
            type="email"
            placeholder="john.doe@example.com"
            {...register("person.email")}
            error={errors?.person?.email}
          />

          <FormField
            key={`poc-${defaultValues?.person?.contactNo}`}
            label="HQ POC Mobile No."
            labelPosition="embedded"
            type="tel"
            inputMode="tel"
            inputType="phone"
            value={
              watch("person.contactNo") ||
              defaultValues?.person?.contactNo ||
              ""
            }
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
            label="Designation"
            placeholder="Centre Manager"
            labelPosition="embedded"
            {...register("person.role")}
            error={errors?.person?.role}
          />

          {/* SECTION: GST Details */}
          {/* 
          <div className="col-span-full mt-6 mb-8 ">
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

          {/* Multi State Cards */}
          <div className="col-span-full mt-6">
            <MultiStateCard
              // @ts-ignore
              branches={watch("branches", []) || []}
              changedBranches={
                allUpdatedData?.branches
                  ? Object.fromEntries(
                      allUpdatedData.branches.map((br) => [br.code, br]),
                    )
                  : {}
              }
              onEdit={(branch, i) => {
                const branches = (watch("branches", []) ||
                  []) as BranchSchema[];
                const updatedBranches = setSinglePrimaryBranch(
                  branches || [],
                  branch as BranchSchema,
                );

                setValue("branches", updatedBranches, { shouldValidate: true });

                notifyPrimarySingleBranch(
                  updatedBranches,
                  branch as BranchSchema,
                );
                handleBranchesUpdate(updatedBranches);
              }}
              onDelete={(branch, i) => {
                const branches = (watch("branches", [])?.filter(
                  (_, idx) => idx !== i,
                ) || []) as BranchSchema[];
                const updatedBranches = setSinglePrimaryBranch(
                  branches || [],
                  branches?.[0] as BranchSchema,
                );
                setValue("branches", updatedBranches, { shouldValidate: true });

                handleBranchesUpdate(updatedBranches);
              }}
            />
          </div>

          {/* Status */}
          <div className="col-span-full flex gap-8 justify-end">
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

          {/* <div className="col-span-full mt-6 flex justify-start"> </div> */}
          <div className="col-span-full mt-6 flex justify-between items-center">
            {/* LEFT SIDE - Add State Branch */}
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
                handleBranchesUpdate(branches);
                notifyPrimarySingleBranch(branches, data);
              }}
              isEditing={false}
              triggerButtonProps={{ loading: branchesLoading }}
            />

            {/* RIGHT SIDE */}
            {/* Submit */}
            <ActionButton
              type="submit"
              loading={updateLoading || branchesLoading}
              className="px-5 py-5"
            >
              Update Operator
            </ActionButton>
          </div>
        </form>
      </div>

      <div className="w-full max-w-6xl mx-auto">
        <div className="flex justify-between items-center my-2">
          <h2 className="text-xl font-semibold">
            Centres under {res?.data?.data?.name || "Operator"}
          </h2>
          <ActionButton
            onClick={() => {
              navigate("/spaces/new", {
                state: { operatorData: res?.data?.data },
              });
            }}
          >
            <div className="flex gap-2 items-center">
              List Centre
              <Plus />
            </div>
          </ActionButton>
        </div>

        {/* Your existing spaces container/table goes here */}

        {/* <SpacesTableContainer operatorId={id} /> */}
        <SpacesTabledResults operatorId={res?.data?.data?.id} />

        {/* Delete trigger */}
        <div className="col-span-full flex justify-center pt-4">
          <DialogModal
            triggerProps={{
              children: (
                <ActionButton
                  type="button"
                  variant={"destructive"}
                  loading={updateLoading}
                  className="max-w-fit"
                >
                  Move to bin
                </ActionButton>
              ),
            }}
            titleProps={{ children: "Operator Delete Confirmation" }}
            descriptionProps={{
              children:
                "Are you sure to delete this operator ? You cannot undo this action.",
            }}
          >
            <ActionButton variant={"destructive"}>Move to bin</ActionButton>
          </DialogModal>
        </div>
      </div>
    </div>
  );
};

export default OperatorEditPage;
