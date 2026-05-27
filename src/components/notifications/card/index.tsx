import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MousePointerClick } from "lucide-react";
import { cn } from "@/utils/className";
import type { Dump } from "@/types/data/dump";
import { datifyObjectValues } from "@/utils/object/datify";
import moment from "moment";
import type { Operator } from "@/types/data/operators";
import type { Space } from "@/types/data/spaces";

export default function NotificationCard({
  notification,
}: {
  notification: Dump<Operator | Space>;
}) {
  const navigate = useNavigate();

  const { collection, action, updatedAt, data, metadata } =
    datifyObjectValues(notification, ["createdAt", "updatedAt"]) || {};

  const statusText = useMemo(
    () =>
      action === "add"
        ? "Created"
        : action === "remove"
          ? "Removed"
          : "Updated",
    [action],
  );

  const entityTypeLabel = collection === "operators" ? "Operator" : "Centre";
  const title = useMemo(
    () =>
      // @ts-ignore
      `${entityTypeLabel}: ${metadata?.name || "N/A"}`,
    [data, entityTypeLabel, metadata],
  );
  const formattedTimestamp = moment(updatedAt || Date.now()).format(
    "DD MMM YYYY [at] HH:mm A",
  );
  const operatorName = "-";

  // const entityLabel =
  //   type === "operator"
  //     ? `Operator: ${entityName}`
  //     : `Centre: ${entityName}${operatorName ? ` - Operator: ${operatorName}` : ""}`;

  const handleView = () => {
    if (collection === "operators")
      navigate(`/operators/${metadata?.id}`, {
        state: { from: "notifications", data: notification },
      });
    else
      navigate(`/spaces/${metadata?.id}`, {
        state: { from: "notifications", data: notification },
      });
  };

  return (
    <Card
      className={cn(
        "relative overflow-hidden",
        action === "add"
          ? "border border-border/80"
          : "border border-primary/20 shadow-lg",
        "transition-all duration-200 hover:-translate-y-0.5",
        "py-1 gap-0",
      )}
    >
      <Badge
        className={cn(
          "absolute right-2 top-2 rounded-full border px-2 py-0.5 text-[10px] font-medium",
          action === "add" &&
            "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
          action === "remove" &&
            "border-destructive/30 bg-destructive/10 text-red-300",
          action === "update" &&
            "border-amber-500/30 bg-amber-500/10 text-amber-300",
        )}
      >
        {statusText}
      </Badge>

      <CardHeader className="px-3 py-1.5">
        <div className="flex items-start justify-between gap-2 pr-16">
          {/* LEFT SECTION */}
          <div className="flex items-start gap-2 min-w-0">
            {/* ICON */}
            <div
              className={cn(
                "size-7 rounded-xl flex items-center justify-center shrink-0",
                action === "remove"
                  ? "bg-destructive/10 text-destructive"
                  : "bg-primary/10 text-primary",
              )}
            >
              <span className="text-xs font-semibold">
                {action === "remove" ? "!" : action === "add" ? "+" : "~"}
              </span>
            </div>

            {/* CONTENT */}
            <div className="min-w-0 flex flex-col gap-0.5">
              {/* TITLE */}
              <div className="flex items-center gap-2 flex-wrap">
                <CardTitle className="text-sm font-semibold leading-tight truncate">
                  {title}
                </CardTitle>
              </div>

              {/* META */}
              <span className="text-[10px] leading-tight text-muted-foreground">
                {collection === "spaces" && operatorName
                  ? `Operator: ${operatorName} - Edited: ${formattedTimestamp}`
                  : `Edited: ${formattedTimestamp}`}
              </span>
            </div>
          </div>
        </div>
      </CardHeader>

      {/* DESCRIPTION */}
      <CardContent className="flex items-center justify-between gap-3 px-3 pb-1.5 pt-0">
        <p className="min-w-0 truncate text-[11px] leading-tight text-muted-foreground">
          {`${title} ${
            action === "add"
              ? "was added"
              : action === "remove"
                ? "was deleted"
                : "was updated"
          }`}
        </p>

        <div className="flex shrink-0 items-center justify-end gap-1.5">
          <Button
            size="sm"
            variant="default"
            onClick={handleView}
            aria-label={`Take action on ${entityTypeLabel.toLowerCase()}`}
            className="h-7 px-2 text-xs"
          >
            <MousePointerClick className="size-3.5" />
            Take action
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
