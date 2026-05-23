import React from "react";
import NotificationCard from "@/components/notifications/card";
import type { Notification } from "@/components/notifications/card";
import { notifications as staticNotifications } from "@/utils/data/notifications";

export default function NotificationList() {
  const items: Notification[] = staticNotifications;

  return (
    <div className="flex flex-col gap-4 p-4 sm:p-6 w-full mx-auto">
      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-muted p-6 text-center text-muted-foreground">
          No notifications yet. Refresh the page or check back later.
        </div>
      ) : (
        items.map((n) => (
          <NotificationCard
            key={n.id}
            notification={n}
            onDelete={() => undefined}
          />
        ))
      )}
    </div>
  );
}
