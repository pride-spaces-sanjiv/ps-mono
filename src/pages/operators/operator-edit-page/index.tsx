import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { MessageSquareWarning, Plus } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useStatesCities } from "@/services/hooks/use-states-cities";
import { useUser } from "@/services/hooks/use-user";
import {
  operatorSchema,
  type BranchSchema,
  type OperatorSchema,
} from "@/utils/schemas/operators";
import {
  getOperatorById,
  updateOperator,
} from "@/services/apis/admin/operators";
import { deleteDump, updateDump } from "@/services/apis/admin/dump";
import {
  setSinglePrimaryBranch,
  notifyPrimarySingleBranch,
} from "@/utils/data/branches";
import { highlightFieldClassName } from "@/utils/string/field-change-classname";
import { compareFields } from "@/utils/object/compare";
import { queryKeys } from "@/utils/query-keys";
import { DialogModal } from "@/components/dialog";
import SpacesTabledResults from "@/containers/spaces-table";
import MultiStateDialog from "@/containers/operator/multi-state-dialog";
import { MultiStateCard } from "@/containers/multi-state/multi-state-card";
import FormField from "@/components/form/field";
import ActionButton from "@/components/buttons/action-btn";
import FormSectionTitle from "@/components/form/section/title";
import OperatorChangePasswordDialog from "@/containers/operator/change-password";
import type { MultiStateItem } from "@/containers/multi-state/types";
import type { Dump } from "@/types/data/dump";
import type { Operator } from "@/types/data/operators";
import { adminLevels } from "@/utils/data/admin";
import { dumpStatuses } from "@/utils/data/dump";

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

  const { userLevel } = useUser();

  const isDump = useMemo(
    () => fromRoute === "notifications" && !!locData,
    [fromRoute, locData],
  );

  const isSupportCorrectionFlow =
    isDump &&
    locData?.status === dumpStatuses.RECORRECT &&
    userLevel === "support";
  const isDumpDisabled =
    isDump &&
    !!(locData?.status === dumpStatuses.APPROVED || locData?.disabled);

  const { statesData, groupedCities, citiesData } = useStatesCities();
  const [states, setStates] = useState<MultiStateItem[]>([]);
  const [isStateDialogOpen, setIsStateDialogOpen] = useState(false);
  const [editingState, setEditingState] = useState<MultiStateItem | null>(null);
  const [correctionComment, setCorrectionComment] = useState("");
  const [isCorrectionDialogOpen, setIsCorrectionDialogOpen] = useState(false);

  const { data: res } = useQuery({
    queryKey: [queryKeys.OPERATORS, id],
    queryFn: () => getOperatorById({ url: `/${id}` }),
    enabled: !!id,
  });

  console.log("operator data", res?.data);
  console.log("Dump operator data :", locData);

  // Get added or changed fields
  const { mainChanges, headQuarterChanges, personChanges } = useMemo(() => {
    return {
      mainChanges: compareFields(
        res?.data?.data,
        fromRoute === "notifications" ? locData?.data : undefined,
        {
          excludeFields: ["id", "totalSpaces", "createdAt", "updatedAt"],
        },
      ),
      headQuarterChanges: compareFields(
        res?.data?.data?.headquarter,
        fromRoute === "notifications" ? locData?.data?.headquarter : undefined,
      ),
      personChanges: compareFields(
        res?.data?.data?.person,
        fromRoute === "notifications" ? locData?.data?.person : undefined,
      ),
    };
  }, [res?.data, locData?.data, fromRoute]);

  const {
    changedFields,
    changedData,
    newFields,
    newData,
    allFields: allUpdatedFields,
    allData: allUpdatedData,
  } = useMemo(() => mainChanges, [mainChanges]);
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

  // const { mutateAsync: dumpMutator, isPending: approvalPending } =
  //   useMutation({
  //     mutationKey: [queryKeys.DUMPS, id, "delete"],
  //     mutationFn: deleteDump,
  //   });

  const { mutateAsync: dumpMutator, isPending: dumpPending } = useMutation({
    mutationKey: [queryKeys.DUMPS, id, "recorrect"],
    mutationFn: updateDump,
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

      const res = await mutateAsync({
        url: id,
        body,
      });

      if (res.status === 200) {
        // If support fixed a correction request,
        // move existing dump back to pending
        if (isSupportCorrectionFlow && locData?.id) {
          await dumpMutator({
            url: locData.id,
            body: {
              status: "pending",
            },
          });
        }

        toast.success(
          `Operator ${
            isSupportCorrectionFlow
              ? "updated"
              : isDump
                ? "approved"
                : "updated"
          } successfully`,
        );

        navigate(
          isDump || isSupportCorrectionFlow ? "/notifications" : "/operators",
        );
        return;
      }
      throw new Error("Invalid response");
    } catch (err) {
      console.error("Error updating operator:", err);
      toast.error("Failed to update operator");
    }
  };

  const handleSendToCorrection = async () => {
    if (!locData?.id) return;

    if (!correctionComment.trim()) {
      toast.error("Please add a correction comment");
      return;
    }

    try {
      const res = await dumpMutator({
        url: locData.id,
        body: {
          comment: correctionComment.trim(),
          status: "recorrect",
        },
      });

      if (res.status === 200) {
        toast.success("Sent to correction");
        setIsCorrectionDialogOpen(false);
        navigate("/notifications");
        return;
      }

      throw new Error("Invalid response");
    } catch (err) {
      console.error("Error sending correction:", err);
      toast.error("Failed to send correction");
    }
  };

  const handleApprove = async (body: Omit<OperatorSchema, "password">) => {
    if (!locData?.id) {
      throw new Error("Invalid dump ID");
    }

    try {
      const dumpRes = await dumpMutator({
        url: locData.id,
        body: {
          data: body,
          status: dumpStatuses.APPROVED,
        },
      });
      if (dumpRes.status === 200) {
        toast.success("Approved operator changes");
        navigate("/notifications");
        return;
      }

      throw new Error("Invalid response");
    } catch (err) {
      console.error("Error approving operator changes :", err);
      toast.error("Failed to approve operator changes");
    }
  };

  const updateDumpData = async (body: Omit<OperatorSchema, "password">) => {
    if (!locData?.id) {
      throw new Error("Invalid dump ID");
    }

    try {
      const dumpRes = await dumpMutator({
        url: locData.id,
        body: {
          data: body,
          status: dumpStatuses.PENDING,
        },
      });
      if (dumpRes.status === 200) {
        toast.success("Updated operator changes");
        navigate("/notifications");
        return;
      }

      throw new Error("Invalid response");
    } catch (err) {
      console.error("Error updating dump operator changes :", err);
      toast.error("Failed to update operator changes");
    }
  };

  const handleBranchesUpdate = async (branches: BranchSchema[]) => {
    try {
      if (isDump) {
        return;
      }
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
        {isDump && locData?.comment && !isDumpDisabled && (
          <div className="mb-5 rounded-md border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100">
            <div className="mb-2 flex items-center gap-2 font-semibold text-amber-200">
              <MessageSquareWarning className="size-4" />
              Correction requested
            </div>
            <p className="leading-relaxed text-amber-50/90">
              {locData.comment}
            </p>
          </div>
        )}

        <form
          onSubmit={handleSubmit(
            isDump && userLevel !== "support"
              ? handleApprove
              : isDump
                ? updateDumpData
                : onSubmit,
            (errors) => {
              console.log("Operator form err", errors);
            },
          )}
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
            embeddedWrapperProps={{
              className: highlightFieldClassName(allUpdatedData, "name"),
            }}
          />

          <FormField
            label="Brand Name"
            placeholder="Brand Name"
            labelPosition="embedded"
            {...register("brandName")}
            error={errors.brandName}
            embeddedWrapperProps={{
              className: highlightFieldClassName(allUpdatedData, "brandName"),
            }}
          />

          <FormField
            label="Slug"
            labelPosition="embedded"
            placeholder="operator-slug"
            {...register("slug")}
            error={errors.slug}
            embeddedWrapperProps={{
              className: highlightFieldClassName(allUpdatedData, "slug"),
            }}
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
            embeddedWrapperProps={{
              className: highlightFieldClassName(allUpdatedData, "email"),
            }}
          />

          {/* SECTION: Headquarter Details */}

          <FormField
            label="HQ Address"
            labelPosition="embedded"
            placeholder="Enter headquarter address"
            {...register("headquarter.address")}
            error={errors.headquarter?.address}
            inputType="textarea"
            embeddedWrapperProps={{
              className: highlightFieldClassName(
                headQuarterChanges.allData,
                "address",
              ),
            }}
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
            embeddedWrapperProps={{
              className: highlightFieldClassName(
                headQuarterChanges.allData,
                "contactNo",
              ),
            }}
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
            embeddedWrapperProps={{
              className: highlightFieldClassName(personChanges.allData, "name"),
            }}
          />

          <FormField
            label="HQ POC Email"
            labelPosition="embedded"
            type="email"
            placeholder="john.doe@example.com"
            {...register("person.email")}
            error={errors?.person?.email}
            embeddedWrapperProps={{
              className: highlightFieldClassName(
                personChanges.allData,
                "email",
              ),
            }}
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
            embeddedWrapperProps={{
              className: highlightFieldClassName(
                personChanges.allData,
                "contactNo",
              ),
            }}
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
            embeddedWrapperProps={{
              className: highlightFieldClassName(personChanges.allData, "role"),
            }}
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
            embeddedWrapperProps={{
              className: highlightFieldClassName(allUpdatedData, "gstNo"),
            }}
          />

          <FormField
            label="CIN/LLPIN Number"
            labelPosition="embedded"
            placeholder="Enter CIN/LLPIN Number"
            {...register("cinNo")}
            error={errors?.cinNo}
            embeddedWrapperProps={{
              className: highlightFieldClassName(allUpdatedData, "cinNo"),
            }}
          />

          {/* Multi State Cards */}
          <div className="col-span-full mt-6">
            <MultiStateCard
              onlyView={isDumpDisabled}
              // @ts-ignore
              branches={watch("branches", []) || []}
              changedBranches={
                allUpdatedData?.branches
                  ? Object.fromEntries(
                      allUpdatedData.branches.map((br) => [br.code, br]),
                    )
                  : {}
              }
              errors={errors.branches}
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
                !isDump && handleBranchesUpdate(updatedBranches);
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

                !isDump && handleBranchesUpdate(updatedBranches);
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
                disabled={isDumpDisabled}
              />
            </div>
          </div>

          {/* <div className="col-span-full mt-6 flex justify-start"> </div> */}
          {!isDumpDisabled && (
            <div className="col-span-full mt-6 flex gap-2 items-center">
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
                  !isDump && handleBranchesUpdate(branches);
                  notifyPrimarySingleBranch(branches, data);
                }}
                isEditing={false}
                triggerButtonProps={{ loading: branchesLoading }}
              />

              {/* Change Password Dialog */}
              {userLevel &&
                adminLevels
                  .filter((lv) => lv !== "support")
                  .includes(userLevel as any) && (
                  <OperatorChangePasswordDialog
                    id={id}
                    triggerBtnProps={{ className: "p-5" }}
                  />
                )}

              {/* RIGHT SIDE */}
              {/* Submit */}
              <div className="flex flex-wrap items-center justify-end gap-2 ml-auto">
                {isDump &&
                  !isSupportCorrectionFlow &&
                  userLevel !== "support" && (
                    <DialogModal
                      open={isCorrectionDialogOpen}
                      onOpenChange={setIsCorrectionDialogOpen}
                      triggerProps={{
                        children: (
                          <ActionButton
                            type="button"
                            variant="outline"
                            className="px-5 py-5"
                            loading={dumpPending}
                          >
                            <div className="flex items-center gap-2">
                              <MessageSquareWarning className="size-4" />
                              <span>Send to correction</span>
                            </div>
                          </ActionButton>
                        ),
                      }}
                      titleProps={{ children: "Send To Correction" }}
                      descriptionProps={{
                        children:
                          "Add a short note explaining what needs to be corrected before approval.",
                      }}
                      footerProps={{
                        children: (
                          <ActionButton
                            type="button"
                            loading={dumpPending}
                            onClick={handleSendToCorrection}
                          >
                            Send
                          </ActionButton>
                        ),
                      }}
                    >
                      <FormField
                        label="Correction comment"
                        inputType="textarea"
                        labelPosition="out"
                        placeholder="Mention what needs to be corrected..."
                        value={correctionComment}
                        onChange={(event) =>
                          setCorrectionComment(event.currentTarget.value)
                        }
                      />
                    </DialogModal>
                  )}

                <ActionButton
                  type="submit"
                  loading={updateLoading || branchesLoading || dumpPending}
                  className="px-5 py-5"
                >
                  {isDump &&
                  locData?.status === dumpStatuses.RECORRECT &&
                  userLevel === "support"
                    ? "Send for Correction"
                    : isDump && userLevel !== "support"
                      ? "Approve"
                      : "Update Operator"}
                </ActionButton>
              </div>
            </div>
          )}
        </form>
      </div>

      {!isDump && (
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
      )}
    </div>
  );
};

export default OperatorEditPage;
