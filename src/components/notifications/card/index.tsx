import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "@/services/hooks/use-user";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageSquareWarning, MousePointerClick, Trash2 } from "lucide-react";
import { cn } from "@/utils/className";
import type { Dump } from "@/types/data/dump";
import { datifyObjectValues } from "@/utils/object/datify";
import moment from "moment";
import type { Operator } from "@/types/data/operators";
import type { Space } from "@/types/data/spaces";
import { dumpCollectionNames } from "@/utils/data/dump";

export default function NotificationCard({
  notification,
  onDelete,
  isDeleting = false,
}: {
  notification: Dump<Operator | Space>;
  onDelete?: (id: string) => void;
  isDeleting?: boolean;
}) {
  const navigate = useNavigate();
  const { userLevel } = useUser();

  const { collection, action, updatedAt, data, metadata, from, to, status } =
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
  const workflowStatus = useMemo(() => {
    switch (status) {
      case "approved":
        return {
          label: "Approved",
          className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
        };

      case "pending":
        return {
          label: "Pending",
          className: "border-yellow-500/30 bg-yellow-500/10 text-yellow-300",
        };

      case "recorrect":
        return {
          label: "Recorrect",
          className: "border-orange-500/30 bg-orange-500/10 text-orange-300",
        };

      default:
        return {
          label: "Unknown",
          className: "border-border bg-muted text-muted-foreground",
        };
    }
  }, [status]);

  const ageText = useMemo(() => {
    return moment(updatedAt || Date.now()).fromNow();
  }, [updatedAt]);


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

  const requestDetails = useMemo(() => {
    const requester = from?.name || from?.email || "Someone";

    const recipient = to?.name || to?.email || "";
    const actionLabel =
      action === "add"
        ? "creation"
        : action === "remove"
          ? "removal"
          : "update";
    const subject = `${entityTypeLabel.toLowerCase()} ${metadata?.name || "N/A"}`;

    if (recipient) {
      if (status === "approved") {
        return {
          requester,
          recipient,
          prefix: "",
          middle: " requested for approval - Approved by ",
          suffix: `.`,
        };
      }

      if (status === "recorrect") {
        return {
          requester,
          recipient,
          prefix: "",
          middle: " sent corrections to ",
          suffix: ` for ${subject}.`,
        };
      }

      return {
        requester,
        recipient,
        prefix: "",
        middle: " requested approval from ",
        suffix: ` for ${subject}.`,
      };
    }

    return {
      requester,
      recipient: "",
      prefix: "",
      middle: ` requested ${actionLabel}.`,
      suffix: "",
    };
  }, [action, entityTypeLabel, from, metadata, status, to]);

  // const entityLabel =
  //   type === "operator"
  //     ? `Operator: ${entityName}`
  //     : `Centre: ${entityName}${operatorName ? ` - Operator: ${operatorName}` : ""}`;

  const handleView = () => {
    if (collection === dumpCollectionNames.OPERATOR)
      navigate(`/operators/${metadata?.id}`, {
        state: { from: "notifications", data: notification },
      });
    else
      navigate(`/spaces/${metadata?.id}`, {
        state: { from: "notifications", data: notification },
      });
  };
  const isSupportUser = userLevel === "support";
  const isSupportUser = userLevel === "support";

  const isCorrectionView =
    status === "recorrect" && isSupportUser;

  const isCorrectionSentView =
    status === "recorrect" && !isSupportUser;

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
      {/* TOP RIGHT BADGES */}
      <div className="absolute right-2 top-2 flex items-center gap-1">
        {/* STATUS */}
        <Badge
          className={cn(
            "rounded-full border px-2 py-0.5 text-[10px] font-medium",
            workflowStatus.className,
          )}
        >
          {workflowStatus.label}
        </Badge>

        {/* ACTION */}
        <Badge
          className={cn(
            "rounded-full border px-2 py-0.5 text-[10px] font-medium",

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
        <Badge
          variant="outline"
          className="rounded-full px-2 py-0.5 text-[10px] text-muted-foreground border-border/60"
        >
          {ageText}
        </Badge>
      </div>

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
        <p className="min-w-0 truncate text-xs leading-snug text-muted-foreground">
          {requestDetails.prefix}
          <span className="font-semibold text-foreground">
            {requestDetails.requester}
          </span>
          {requestDetails.middle}
          {requestDetails.recipient && (
            <span className="font-semibold text-foreground">
              {requestDetails.recipient}
            </span>
          )}
          {requestDetails.suffix}
        </p>

        <div className="flex shrink-0 items-center justify-end gap-1.5">

          <Button
            size="sm"
            variant="default"
            onClick={handleView}
            disabled={isCorrectionSentView}
            aria-label={
              isCorrectionView
                ? `Make corrections for ${entityTypeLabel.toLowerCase()}`
                : isCorrectionSentView
                  ? `Sent for correction for ${entityTypeLabel.toLowerCase()}`
                  : `Take action on ${entityTypeLabel.toLowerCase()}`
                ? `Make corrections for ${entityTypeLabel.toLowerCase()}`
                : isCorrectionSentView
                  ? `Sent for correction for ${entityTypeLabel.toLowerCase()}`
                  : `Take action on ${entityTypeLabel.toLowerCase()}`
            }
            className="h-7 px-2 text-xs"
          >
            {isCorrectionView ? (
              <MessageSquareWarning className="size-3.5" />
            ) : (
              <MousePointerClick className="size-3.5" />
            )}
            {isCorrectionView
              ? "Make corrections"
              : isCorrectionSentView
                ? "Sent for correction"
                : "Take action"}

          </Button >
                    <Button
            size="sm"
            variant="destructive"
            onClick={() => onDelete?.(notification.id)}
            disabled={isDeleting}
            aria-label="Delete notification"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
