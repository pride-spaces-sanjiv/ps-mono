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

type MultiStateCardProps = {
  states: MultiStateItem[];
  onEdit: (state: MultiStateItem) => void;
  onDelete: (id: string) => void;
};

export function MultiStateCard({
  states,
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

  if (!states.length) {
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
      {states.map((item) => {
        const isExpanded = expandedIds.includes(item.id);

        return (
          <Card key={item.id} className="w-full h-fit">
            <CardHeader>
              <div className="flex items-start gap-3">
                <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <MapPin className="size-4" />
                </div>
                <div className="space-y-1">
                  <CardTitle>{item.state}</CardTitle>
                  <p className="text-sm text-muted-foreground">{item.city}</p>
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
                      ? `Hide ${item.state} details`
                      : `Show ${item.state} details`
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
                    <p className="text-sm leading-6">{item.branchAddress}</p>
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      GST Number
                    </p>
                    <p className="text-sm">{item.gstNo}</p>
                  </div>
                </CardContent>
                <CardFooter className="justify-end gap-2 border-t pt-4">
                  <Button
                    variant="outline"
                    type="button"
                    onClick={() => onEdit(item)}
                  >
                    <Pencil className="size-4" />
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    type="button"
                    onClick={() => onDelete(item.id)}
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
