import { useState } from "react";
import {
  Card,
  CardAction,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, MapPin, Pencil, Trash2 } from "lucide-react";
import type { MultiStateItem } from "../types";
import type { BranchSchema } from "@/utils/schemas/operators";
import OperatorMultiStateDialog from "@/containers/operator/multi-state-dialog";
import AddStateDialog from "@/containers/multi-state/multi-state-dialog";
import ActionButton from "@/components/buttons/action-btn";
import { Badge } from "@/components/ui/badge";

type MultiStateCardProps = {
  branches: Array<BranchSchema | MultiStateItem>;
  onEdit: (branch: BranchSchema | MultiStateItem, i: number) => void;
  onDelete: (branch: BranchSchema | MultiStateItem, i: number) => void;
};

type RenderBranch = {
  id: string;
  code: string;
  name: string;
  address: string;
  city: string;
  postalCode: string;
  gstNo?: string;
  isPrimary: boolean;
  hqPocName?: string;
  hqPocEmail?: string;
  hqPocMobile?: string;
  designation?: string;
  original: BranchSchema | MultiStateItem;
};

const isMultiStateItem = (
  branch: BranchSchema | MultiStateItem,
): branch is MultiStateItem => "state" in branch && !("code" in branch);

const normalizeBranch = (branch: BranchSchema | MultiStateItem): RenderBranch => ({
  id: isMultiStateItem(branch) ? branch.id : branch.code,
  code: isMultiStateItem(branch) ? branch.state : branch.code,
  name: isMultiStateItem(branch) ? branch.state : branch.name,
  address: isMultiStateItem(branch) ? branch.branchAddress : branch.address,
  city: branch.city,
  postalCode: isMultiStateItem(branch) ? "" : branch.postalCode,
  gstNo: branch.gstNo ?? "",
  isPrimary: isMultiStateItem(branch) ? false : branch.isPrimary ?? false,
  hqPocName: isMultiStateItem(branch)
    ? branch.hqPocName
    : branch.person?.name,
  hqPocEmail: isMultiStateItem(branch)
    ? branch.hqPocEmail
    : branch.person?.email,
  hqPocMobile: isMultiStateItem(branch)
    ? undefined
    : branch.person?.contactNo,
  designation: isMultiStateItem(branch)
    ? branch.designation
    : branch.person?.role,
  original: branch,
});

export function MultiStateCard({
  branches,
  onEdit,
  onDelete,
}: MultiStateCardProps) {
  const [expandedIds, setExpandedIds] = useState<string[]>([]);
  const [activeEditIndex, setActiveEditIndex] = useState<number | null>(null);

  const normalizedBranches = branches.map(normalizeBranch);

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) =>
      prev.includes(id)
        ? prev.filter((itemId) => itemId !== id)
        : [...prev, id],
    );
  };

  if (!normalizedBranches.length) {
    return (
      <Card className="w-full border-dashed">
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          Added states will appear here.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="auto-form-grid gap-4">
      {normalizedBranches.map((item, i) => {
        const isExpanded = expandedIds.includes(item.id);
        const isEditing = activeEditIndex === i;
        const original = item.original;
        const isItemMultiState = isMultiStateItem(original);

        return (
          <Card key={item.id} className="w-full h-fit relative">
            {item.isPrimary && (
              <Badge className="bg-orange-400 absolute right-[5px] top-[5px] rounded-full">
                Primary HQ
              </Badge>
            )}
            <CardHeader>
              <div className="flex items-start gap-3">
                <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <MapPin className="size-4" />
                </div>
                <div className="space-y-1">
                  <CardTitle>{item.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{item.city}</p>
                  {item.hqPocName && (
                    <p className="text-xs text-muted-foreground">
                      POC: {item.hqPocName}
                    </p>
                  )}
                </div>
              </div>
              <CardAction>
                <Button
                  variant="ghost"
                  size="icon"
                  type="button"
                  onClick={() => toggleExpanded(item.id)}
                  aria-label={
                    isExpanded
                      ? `Hide ${item.name} details`
                      : `Show ${item.name} details`
                  }
                >
                  {isExpanded ? (
                    <ChevronUp className="size-4" />
                  ) : (
                    <ChevronDown className="size-4" />
                  )}
                </Button>
              </CardAction>
            </CardHeader>
            {isExpanded && (
              <>
                <CardContent className="space-y-4">
                  <div className="space-y-1">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Branch Address
                    </p>
                    <p className="text-sm leading-6">{item.address}</p>
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      GST Number
                    </p>
                    <p className="text-sm">{item.gstNo}</p>
                  </div>

                  {(item.hqPocName || item.hqPocEmail || item.designation) && (
                    <div className="space-y-3 rounded-lg border border-border bg-muted p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        HQ POC Details
                      </p>
                      {item.hqPocName && (
                        <p className="text-sm">
                          <span className="font-medium">Name:</span> {item.hqPocName}
                        </p>
                      )}
                      {item.hqPocEmail && (
                        <p className="text-sm">
                          <span className="font-medium">Email:</span> {item.hqPocEmail}
                        </p>
                      )}
                      {item.hqPocMobile && (
                        <p className="text-sm">
                          <span className="font-medium">Mobile:</span> {item.hqPocMobile}
                        </p>
                      )}
                      {item.designation && (
                        <p className="text-sm">
                          <span className="font-medium">Designation:</span> {item.designation}
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
                <CardFooter className="justify-end gap-2 border-t pt-4">
                  {isItemMultiState ? (
                    <AddStateDialog
                      hideTrigger
                      triggerElement={
                        <ActionButton type="button" variant="outline">
                          <div className="flex items-center gap-2">
                            <Pencil className="size-4" />
                            Edit
                          </div>
                        </ActionButton>
                      }
                      open={isEditing}
                      onOpenChange={(open) => setActiveEditIndex(open ? i : null)}
                      editingState={original}
                      onSave={(data) => {
                        onEdit?.(data, i);
                        setActiveEditIndex(null);
                      }}
                    />
                  ) : (
                    <OperatorMultiStateDialog
                      open={isEditing}
                      onOpenChange={(open) => setActiveEditIndex(open ? i : null)}
                      defaultData={original}
                      dialogModalProps={{
                        triggerProps: {
                          children: (
                            <ActionButton type="button" variant="outline">
                              <div className="flex items-center gap-2">
                                <Pencil className="size-4" />
                                Edit
                              </div>
                            </ActionButton>
                          ),
                        },
                      }}
                      onSave={(data) => {
                        onEdit?.(data, i);
                      }}
                      isEditing={true}
                    />
                  )}

                  <Button
                    variant="destructive"
                    type="button"
                    onClick={() => onDelete(item.original, i)}
                  >
                    <Trash2 className="size-4" />
                    Delete
                  </Button>
                </CardFooter>
              </>
            )}
          </Card>
        );
      })}
    </div>
  );
}
