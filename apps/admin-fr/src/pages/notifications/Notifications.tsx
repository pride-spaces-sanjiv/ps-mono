import React from "react";
import NotificationList from "@/components/notifications/list";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function NotificationsPage() {
  return (
    <div className="w-full min-h-dvh p-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle>Notifications</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <NotificationList />
        </CardContent>
      </Card>
    </div>
  );
}
