import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MousePointerClick, Trash2 } from "lucide-react";
import { cn } from "@/utils/className";

export type NotificationType = "operator" | "centre";
export type NotificationAction = "add" | "delete" | "update";

export type Notification = {
  id: string;
  type: NotificationType;
  action: NotificationAction;
  entityId: string;
  entityName: string;
  operatorName?: string;
  timestamp: string; // ISO string
  details?: string;
  read?: boolean;
};

export default function NotificationCard({
  notification,
  onDelete,
}: {
  notification: Notification;
  onDelete?: (id: string) => void;
}) {
  const navigate = useNavigate();

  const { type, action, entityName, operatorName, entityId, timestamp, read } =
    notification;

  const statusText =
    action === "add" ? "Created" : action === "delete" ? "Removed" : "Updated";

  const entityTypeLabel = type === "operator" ? "Operator" : "Centre";
  const title = `${entityTypeLabel}: ${entityName}`;
  const formattedTimestamp = new Date(timestamp).toLocaleString();

  const entityLabel =
    type === "operator"
      ? `Operator: ${entityName}`
      : `Centre: ${entityName}${operatorName ? ` - Operator: ${operatorName}` : ""}`;

  const handleView = () => {
    if (type === "operator") navigate(`/operators/${entityId}`);
    else navigate(`/spaces/${entityId}`);
  };

  return (
    <Card
      className={cn(
        "relative overflow-hidden",
        read ? "border border-border/80" : "border border-primary/20 shadow-lg",
        "transition-all duration-200 hover:-translate-y-0.5",
        "py-2 gap-2",
      )}
    >
      <Badge
        className={cn(
          "absolute right-[8px] top-[8px] rounded-full border px-3 py-1 text-xs font-medium",
          action === "add" &&
            "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
          action === "delete" &&
            "border-destructive/30 bg-destructive/10 text-red-300",
          action === "update" &&
            "border-amber-500/30 bg-amber-500/10 text-amber-300",
        )}
      >
        {statusText}
      </Badge>

      <CardHeader className="px-4 py-2">
        <div className="flex items-start justify-between gap-3 pr-20">
          {/* LEFT SECTION */}
          <div className="flex items-start gap-3 min-w-0">
            {/* ICON */}
            <div
              className={cn(
                "size-9 rounded-2xl flex items-center justify-center shrink-0",
                action === "delete"
                  ? "bg-destructive/10 text-destructive"
                  : "bg-primary/10 text-primary",
              )}
            >
              <span className="text-sm font-semibold">
                {action === "delete" ? "!" : action === "add" ? "+" : "~"}
              </span>
            </div>

            {/* CONTENT */}
            <div className="min-w-0 flex flex-col gap-1">
              {/* TITLE */}
              <div className="flex items-center gap-2 flex-wrap">
                <CardTitle className="text-sm font-semibold leading-tight truncate">
                  {title}
                </CardTitle>
              </div>

              {/* META */}
              <span className="text-[11px] text-muted-foreground">
                {type === "centre" && operatorName
                  ? `Operator: ${operatorName} - Edited: ${formattedTimestamp}`
                  : `Edited: ${formattedTimestamp}`}
              </span>
            </div>
          </div>
        </div>
      </CardHeader>

      {/* DESCRIPTION */}
      <CardContent className="px-4 pb-1 pt-0">
        <p className="text-xs leading-snug text-muted-foreground">
          {notification.details ??
            `${entityLabel} ${
              action === "add"
                ? "was added"
                : action === "delete"
                  ? "was deleted"
                  : "was updated"
            }`}
        </p>
      </CardContent>

      {/* FOOTER ACTIONS */}
      <CardFooter className="px-4 pt-2 pb-2">
        <div className="flex w-full justify-end">
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button
              size="sm"
              variant="default"
              onClick={handleView}
              aria-label={`Take action on ${entityTypeLabel.toLowerCase()}`}
            >
              <MousePointerClick className="w-4 h-4" />
              Take action
            </Button>

            <Button
              size="sm"
              variant="destructive"
              onClick={() => onDelete?.(notification.id)}
              aria-label="Delete notification"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
