import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Field, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useStatesCities } from "@/services/hooks/use-states-cities";
import { operatorSchema, type OperatorSchema } from "@/utils/schemas/operators";
import {
  getOperatorById,
  updateOperator,
} from "@/services/apis/admin/operators";
import { queryKeys } from "@/utils/query-keys";
import { DialogModal } from "@/components/dialog";
import SpacesTabledResults from "@/containers/spaces-table";
import FormField from "@/components/form/field";
import ActionButton from "@/components/buttons/action-btn";
import MultiStateDialog from "@/containers/multi-state/multi-state-dialog";
import { MultiStateCard } from "@/containers/multi-state/multi-state-card";
import type { MultiStateItem } from "@/containers/multi-state/types";

const OperatorEditPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

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
      reset(res?.data.data);
    }
  }, [res]);

  const { mutateAsync, isPending: updateLoading } = useMutation({
    mutationFn: updateOperator,
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
            label="Admin Email"
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
            label="POC Mobile No."
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
            label="CIN Number"
            labelPosition="embedded"
            placeholder="Enter CIN Number"
            {...register("cinNo")}
            error={errors?.cinNo}
          />

          <div className="col-span-full mt-6">
            <MultiStateCard
              states={states}
              onEdit={handleEditState}
              onDelete={handleDeleteState}
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

          {/* <div className="col-span-full mt-6 flex justify-start">

          </div> */}
          <div className="col-span-full mt-6 flex justify-between items-center">
            {/* LEFT SIDE */}
            <MultiStateDialog
              open={isStateDialogOpen}
              onOpenChange={(open) => {
                setIsStateDialogOpen(open);
                if (!open) {
                  setEditingState(null);
                }
              }}
              onSave={handleSaveState}
              editingState={editingState}
            />

            {/* RIGHT SIDE */}
            {/* Submit */}
            <ActionButton
              type="submit"
              loading={updateLoading}
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
                  Delete Operator
                </ActionButton>
              ),
            }}
            titleProps={{ children: "Operator Delete Confirmation" }}
            descriptionProps={{
              children:
                "Are you sure to delete this operator ? You cannot undo this action.",
            }}
          >
            <ActionButton variant={"destructive"}>Delete Operator</ActionButton>
          </DialogModal>
        </div>
      </div>
    </div>
  );
};

export default OperatorEditPage;
