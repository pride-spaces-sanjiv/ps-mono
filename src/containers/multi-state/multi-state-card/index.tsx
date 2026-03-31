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
import MultiStateDialog from "@/containers/operator/multi-state-dialog";
import ActionButton from "@/components/buttons/action-btn";
import { Badge } from "@/components/ui/badge";

type MultiStateCardProps = {
  branches: BranchSchema[];
  onEdit: (branch: BranchSchema, i: number) => void;
  onDelete: (branch: BranchSchema, i: number) => void;
};

export function MultiStateCard({
  branches,
  onEdit,
  onDelete,
}: MultiStateCardProps) {
  const [expandedIds, setExpandedIds] = useState<string[]>([]);

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) =>
      prev.includes(id)
        ? prev.filter((itemId) => itemId !== id)
        : [...prev, id],
    );
  };

  if (!branches.length) {
    return (
      <Card className="w-full border-dashed">
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          Added states will appear here.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="auto-form-grid gap-4 ">
      {branches.map((item, i) => {
        const isExpanded = expandedIds.includes(item.code);

        return (
          <Card key={item.code} className="w-full h-fit relative">
            {!!item.isPrimary && (
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
                </div>
              </div>
              <CardAction>
                <Button
                  variant="ghost"
                  size="icon"
                  type="button"
                  onClick={() => toggleExpanded(item.code)}
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
                </CardContent>
                <CardFooter className="justify-end gap-2 border-t pt-4">
                  <MultiStateDialog
                    // Disallow other states listed
                    disAllowedStates={branches
                      .map((b) => b.code)
                      .filter((br) => br !== item.code)}
                    defaultData={item}
                    dialogModalProps={{
                      triggerProps: {
                        children: (
                          <ActionButton type="button" variant={"outline"}>
                            <div className="flex items-center gap-2">
                              <Pencil className="size-4" />
                              Edit{" "}
                            </div>
                          </ActionButton>
                        ),
                      },
                    }}
                    onSave={(data) => {
                      console.log(data);
                      onEdit?.(data, i);
                    }}
                    isEditing={true}
                  />

                  <Button
                    variant="destructive"
                    type="button"
                    onClick={() => onDelete(item, i)}
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
