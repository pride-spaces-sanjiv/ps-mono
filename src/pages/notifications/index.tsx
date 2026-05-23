import { useNavigate } from "react-router-dom";
import NotificationList from "@/components/notifications/list";
import ActionButton from "@/components/buttons/action-btn";

export default function NotificationsPage() {
  const navigate = useNavigate();

  return (
    <div className="admin-page-shell">
      <div className="admin-page-header">
        <h1 className="text-2xl font-semibold">Notifications</h1>
        <ActionButton
          variant="secondary"
          onClick={() => {
            navigate("/notifications");
          }}
        >
          Refresh
        </ActionButton>
      </div>
      <NotificationList />
    </div>
  );
}
