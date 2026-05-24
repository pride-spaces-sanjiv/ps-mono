import { useNavigate } from "react-router-dom";
import NotificationList from "@/components/notifications/list";
import ActionButton from "@/components/buttons/action-btn";
import { useState } from "react";

export default function NotificationsPage() {
  const navigate = useNavigate();
  const [now, setNow] = useState(Date.now());

  return (
    <div className="admin-page-shell">
      <div className="admin-page-header">
        <h1 className="text-2xl font-semibold">Notifications</h1>
        <ActionButton
          variant="secondary"
          onClick={() => {
            // navigate("/notifications");
            setNow(Date.now());
          }}
        >
          Refresh
        </ActionButton>
      </div>
      <NotificationList key={`${now}`} />
    </div>
  );
}
