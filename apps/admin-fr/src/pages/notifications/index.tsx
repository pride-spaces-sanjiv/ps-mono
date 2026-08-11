import { useNavigate } from "react-router-dom";
import NotificationList from "@/components/notifications/list";
import ActionButton from "@/components/buttons/action-btn";
import { useMemo, useState } from "react";
import { useUser } from "@/services/hooks/use-user";
import { adminLevels, type AdminLevel } from "@/utils/data/admin";

const validUserLevels = adminLevels.filter((lv) => lv !== "support");

export default function NotificationsPage() {
  const navigate = useNavigate();
  const [now, setNow] = useState(Date.now());
  const { userLevel } = useUser();
  // const canView = useMemo(
  //   () =>
  //     !!userLevel &&
  //     validUserLevels.includes(userLevel as (typeof validUserLevels)[number]),
  //   [userLevel],
  // );

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
      {/* {canView ? ( */}
      <NotificationList key={`${now}`} />
      {/* : (
       <div className="py-5 px-3 text-lg">You cannot view notifications</div>
       )} */}
    </div>
  );
}
