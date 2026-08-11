import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FieldGroup } from "@/components/ui/field";
import ActionButton from "@/components/buttons/action-btn";
import { Plus } from "lucide-react";
import FormField from "@/components/form/field";
import { useEffect, useState } from "react";
import type { MultiStateItem } from "../types";

type MultiStateDialogProps = {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSave?: (state: MultiStateItem) => void;
  editingState?: MultiStateItem | null;
  hideTrigger?: boolean;
  triggerElement?: React.ReactNode;
};

const emptyForm = {
  state: "",
  city: "",
  branchAddress: "",
  gstNo: "",
  hqPocName: "",
  hqPocEmail: "",
  designation: "",
};

export default function MultiStateDialog({
  open,
  onOpenChange,
  onSave,
  editingState,
  hideTrigger = false,
}: MultiStateDialogProps) {
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (open) {
      setForm(
        editingState
          ? {
              state: editingState.state,
              city: editingState.city,
              branchAddress: editingState.branchAddress,
              gstNo: editingState.gstNo,
              hqPocName: editingState.hqPocName ?? "",
              hqPocEmail: editingState.hqPocEmail ?? "",
              designation: editingState.designation ?? "",
            }
          : emptyForm,
      );
    }
  }, [editingState, open]);

  const isEditing = !!editingState;

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    onSave?.({
      id: editingState?.id ?? crypto.randomUUID(),
      state: form.state.trim(),
      city: form.city.trim(),
      branchAddress: form.branchAddress.trim(),
      gstNo: form.gstNo.trim(),
      hqPocName: form.hqPocName.trim(),
      hqPocEmail: form.hqPocEmail.trim(),
      designation: form.designation.trim(),
    });

    onOpenChange?.(false);
    setForm(emptyForm);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {triggerElement ? (
        <DialogTrigger asChild>{triggerElement}</DialogTrigger>
      ) : !hideTrigger ? (
        <DialogTrigger asChild>
          <ActionButton
            variant="outline"
            type="button"
            className="flex items-center gap-2 px-5 py-5"
          >
            <div className="flex gap-2 items-center">
              Add a state <Plus />
            </div>
          </ActionButton>
        </DialogTrigger>
      ) : null}

      <DialogContent className="max-w-2xl sm:max-w-3xl">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{isEditing ? "Edit state" : "Add state"}</DialogTitle>
          </DialogHeader>

          <FieldGroup className="grid-cols-1 sm:grid-cols-2">
            <FormField
              label="State"
              labelPosition="embedded"
              placeholder="Maharashtra"
              value={form.state}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, state: event.target.value }))
              }
              required
            />

            <FormField
              label="City"
              labelPosition="embedded"
              placeholder="Mumbai"
              value={form.city}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, city: event.target.value }))
              }
              required
            />
            <FormField
              label="Branch Address"
              labelPosition="embedded"
              inputType="textarea"
              wrapperProps={{ className: "sm:col-span-2" }}
              value={form.branchAddress}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  branchAddress: event.target.value,
                }))
              }
              required
            />
            <FormField
              label="HQ POC Name"
              labelPosition="embedded"
              placeholder="John Doe"
              value={form.hqPocName}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, hqPocName: event.target.value }))
              }
            />
            <FormField
              label="HQ POC Email"
              labelPosition="embedded"
              type="email"
              wrapperProps={{ className: "sm:col-span-2" }}
              placeholder="john.doe@example.com"
              value={form.hqPocEmail}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, hqPocEmail: event.target.value }))
              }
            />
            <FormField
              label="Designation"
              labelPosition="embedded"
              placeholder="Manager"
              value={form.designation}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, designation: event.target.value }))
              }
            />
            <FormField
              label="GST Number"
              labelPosition="embedded"
              placeholder="Enter GST Number"
              value={form.gstNo}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, gstNo: event.target.value }))
              }
              required
            />
          </FieldGroup>

          <DialogFooter className="mt-6">
            <DialogClose asChild>
              <ActionButton variant="outline" type="button">
                Cancel
              </ActionButton>
            </DialogClose>
            <ActionButton type="submit">
              {isEditing ? "Update state" : "Save state"}
            </ActionButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
