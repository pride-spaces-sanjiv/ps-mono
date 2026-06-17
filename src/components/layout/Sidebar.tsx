import { useMemo } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";
import * as secureStorage from "@secure-storage/common";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  // SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  BellIcon,
  Building2Icon,
  GlobeIcon,
  Home,
  LogOutIcon,
  Settings,
  UserIcon,
  UsersIcon,
} from "lucide-react";
import { tokenStore, userStore } from "@/services/store/user";
import { useUser } from "@/services/hooks/use-user";
import { logoutAPI } from "@/services/apis/auth";
import { cn } from "@/utils/className";
import { validateNumber } from "@/utils/number";
import { queryKeys } from "@/utils/query-keys";
import ActionButton from "../buttons/action-btn";

// Menu items with icons and routes
const items = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: Home,
  },
  {
    title: "Space Operators",
    url: "/operators",
    icon: GlobeIcon,
    activeUrls: ["/operators", "/spaces"],
  },
  {
    title: "Conventional Spaces",
    url: "/conventional",
    icon: Building2Icon,
  },
  {
    title: "Amenities",
    url: "/amenities",
    icon: LogOutIcon,
  },
  {
    title: "Notifications",
    url: "/notifications",
    icon: BellIcon,
  },
  {
    title: "Team",
    url: "/team",
    icon: UsersIcon,
  },
  {
    title: "Users",
    url: "/users",
    icon: UserIcon,
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
  },
];

export function AppSidebar() {
  const location = useLocation();
  const tokenState = tokenStore();
  const userState = userStore();
  const { userLevel } = useUser();
  const validItems = useMemo(
    () => (userLevel ? items : items.filter((d) => d.url !== "")),
    [userLevel],
  );

  const expired =
    validateNumber(tokenState?.value?.expiry, { invalidValue: 0 }) <=
    Date.now();

  const { isPending: logoutLoading, mutateAsync: logoutMutater } = useMutation({
    mutationKey: [queryKeys.USERDATA, "logout"],
    mutationFn: () => logoutAPI(),
    retry: 3,
  });

  const handleLogout = async () => {
    try {
      // const res = await logoutMutater();
      // if (res.status === 200 && res.data.data?.id) {
      tokenState.setter({
        expiry: new Date(),
        token: "",
        refreshToken: "",
      });
      userState.setter(null);
      secureStorage.localStorage.setItem("__aT__", null);
      toast.success("Logout Successfully");
      window.location.href = "/login";
      return;
      // }
    } catch (err) {
      toast.error("Logout Failed");
    }
  };

  return (
    <Sidebar className="fixed left-0 top-0 h-screen w-64 border-r">
      <SidebarContent>
        {/* Main Navigation */}
        <SidebarGroup className="gap-2 h-full bg-popover">
          <SidebarGroupLabel className="text-xl self-center font-bold text-accent-foreground flex items-center gap-2">
            {/* <Tv className="w-8 h-8 text-primary" /> */}
            <span className="">Pride Spaces</span>
          </SidebarGroupLabel>
          <SidebarGroupContent className="py-3">
            <SidebarMenu>
              {validItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className={({ isActive }) => {
                        const isRouteActive =
                          isActive ||
                          item.activeUrls?.some((url) =>
                            location.pathname.startsWith(url),
                          );

                        return `flex items-center gap-2 rounded-lg px-3 py-2 text-accent-foreground transition-all hover:text-white hover:bg-primary ${
                          isRouteActive
                            ? "text-accent-foreground font-medium"
                            : ""
                        }`;
                      }}
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
          <SidebarGroupContent className="mt-auto h-auto py-3">
            <ActionButton
              className={cn("mx-auto", expired ? "" : "hover:bg-destructive")}
              onClick={() => {
                handleLogout();
              }}
            >
              <div className="flex gap-2 items-center">
                {/* {expired ? (
                  "Login"
                ) : (
                  <> */}
                <LogOutIcon /> Logout
                {/* </>
                )} */}
              </div>
            </ActionButton>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
