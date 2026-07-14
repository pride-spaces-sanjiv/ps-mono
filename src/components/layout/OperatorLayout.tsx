import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import * as secureStorage from "@secure-storage/common";
import { Bell, Globe, LogOut } from "lucide-react";
import { tokenStore, userStore } from "@/services/store/user";
import { logoutAPI } from "@/services/apis/auth";
import { queryKeys } from "@/utils/query-keys";
import { cn } from "@/utils/className";
import ActionButton from "@/components/buttons/action-btn";

export default function OperatorLayout() {
  const navigate = useNavigate();
  const tokenState = tokenStore();
  const userState = userStore();

  const { mutateAsync: logoutMutater } = useMutation({
    mutationKey: [queryKeys.USERDATA, "logout"],
    mutationFn: () => logoutAPI(),
    retry: 3,
  });

  const handleLogout = async () => {
    try {
      await logoutMutater().catch(() => null);
      tokenState.setter({
        expiry: new Date(),
        token: "",
        refreshToken: "",
      });
      userState.setter(null);
      userState.setLevel(null);
      secureStorage.localStorage.setItem("__aT__", null);
      toast.success("Logout Successfully");
      window.location.href = "/login?as=operator";
    } catch {
      toast.error("Logout Failed");
    }
  };

  return (
    <div className="operator-portal-shell flex min-h-dvh flex-col">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-card/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <NavLink
            to="/partner"
            className="flex items-center gap-2.5 transition-opacity hover:opacity-80"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/20">
              <Globe className="size-4.5" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-tight leading-none">
                Pride Spaces
              </span>
              <span className="text-[11px] font-medium text-primary">
                Space Partner
              </span>
            </div>
          </NavLink>

          <div className="flex items-center gap-2">
            <ActionButton
              variant="outline"
              size="sm"
              className={cn(
                "relative h-9 gap-2 border-border/60 bg-background/60",
              )}
              onClick={() => navigate("/notifications")}
            >
              <Bell className="size-4" />
              <span className="hidden sm:inline">Notifications</span>
            </ActionButton>

            <ActionButton
              variant="outline"
              size="sm"
              className="h-9 gap-2 border-border/60 hover:border-destructive/40 hover:bg-destructive/5 hover:text-destructive"
              onClick={handleLogout}
            >
              <LogOut className="size-4" />
              <span className="hidden sm:inline">Logout</span>
            </ActionButton>
          </div>
        </div>
      </header>

      <main className="relative flex-1 overflow-x-hidden">
        <Outlet />
      </main>
    </div>
  );
}
