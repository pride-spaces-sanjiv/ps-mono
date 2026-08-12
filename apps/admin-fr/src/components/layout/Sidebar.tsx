import { useMemo, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";
import { ADMIN_PERMISSIONS } from "@pride-spaces/types";
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
  SidebarMenuSub,
  SidebarMenuSubItem,
  // SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  BellIcon,
  Building2Icon,
  ChevronDown,
  GlobeIcon,
  Home,
  LogOutIcon,
  UserIcon,
  UsersIcon,
  CircleUser,
  type LucideIcon,
  HardDriveUpload,
  ArrowUpRight,
} from "lucide-react";
import { tokenStore, userStore } from "@/services/store/user";
import { useUser } from "@/services/hooks/use-user";
import { logoutAPI } from "@/services/apis/auth";
import { cn } from "@/utils/className";
import { validateNumber } from "@/utils/number";
import { queryKeys } from "@/utils/query-keys";
import ActionButton from "../buttons/action-btn";

type SidebarItem = {
  id: string;
  title: string;
  url: string;
  icon: LucideIcon;
  activeUrls?: string[];
  tabs?: SidebarSubItem[];
  isExternal?: boolean;
};

type SidebarSubItem = {
  title: string;
  url: string;
  activeUrls?: string[];
};

const sidebarPermissions: Record<string, string[]> = {
  "super-admin": ADMIN_PERMISSIONS,
  admin: ADMIN_PERMISSIONS,
  support: ADMIN_PERMISSIONS,

  operator: ["settings", "dashboard", "operators", "notifications"],

  builder: [],
};
// Menu items with icons and routes
const items: SidebarItem[] = [
  {
    id: "settings",
    title: "Profile",
    url: "/settings",
    icon: CircleUser,
  },
  {
    id: "dashboard",
    title: "Dashboard",
    url: "/dashboard",
    icon: Home,
  },
  {
    id: "operators",
    title: "Space Operators",
    url: "/operators",
    icon: GlobeIcon,
    // activeUrls: ["/operators", "/spaces"],
    tabs: [
      {
        title: "Operator",
        url: "/operators",
        activeUrls: ["/operators"],
      },
      {
        title: "Centre",
        url: "/spaces",
        activeUrls: ["/operators", "/spaces"],
      },
    ],
  },
  {
    id: "conventional",
    title: "Conventional Spaces",
    url: "/conventional",
    icon: Building2Icon,
    tabs: [
      {
        title: "Grade A",
        url: "/conventional?grade=A",
        activeUrls: ["/conventional?grade=A"],
      },
      {
        title: "Others",
        url: "/conventional?grade=other",
        activeUrls: ["/conventional?grade=other"],
      },
    ],
  },

  {
    id: "amenities",
    title: "Amenities",
    url: "/amenities",
    icon: LogOutIcon,
  },
  {
    id: "team",
    title: "Team",
    url: "/team",
    icon: UsersIcon,
  },
  {
    id: "users",
    title: "Users",
    url: "/users",
    icon: UserIcon,
  },
  {
    id: "notifications",
    title: "Notifications",
    url: "/notifications",
    icon: BellIcon,
  },
  {
    id: "migrations",
    title: "Bulk Upload",
    url: "/migrations",
    icon: HardDriveUpload,
  },
  {
    id: "crm",
    title: "CRM Portal",
    url: import.meta.env.VITE_CRM_URL || "http://localhost:3001",
    icon: ArrowUpRight,
    isExternal: true,
  },
];

export function AppSidebar() {
  const location = useLocation();
  const [openSubtabs, setOpenSubtabs] = useState<Record<string, boolean>>({});
  const tokenState = tokenStore();
  const userState = userStore();
  const { userLevel } = useUser();
  const validItems = useMemo(() => {
    if (!userLevel) return items;

    const allowed = sidebarPermissions[userLevel] ?? ADMIN_PERMISSIONS;

    return items.filter((item) => allowed.includes(item.id));
  }, [userLevel]);

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

  const isItemActive = (item: SidebarItem | SidebarSubItem) => {
    const currentUrl = `${location.pathname}${location.search}`;
    const routes = [item.url, ...(item.activeUrls || [])];

    return routes.some((url) =>
      url.includes("?")
        ? currentUrl === url
        : location.pathname.startsWith(url),
    );
  };

  const toggleSubtabs = (title: string) => {
    setOpenSubtabs((prev) => ({
      ...prev,
      [title]: !prev[title],
    }));
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
                    {item.isExternal ? (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 rounded-lg px-3 py-2 text-accent-foreground transition-all hover:text-primary-foreground hover:bg-primary"
                      >
                        <item.icon className="h-4 w-4" />
                        <span className="min-w-0 flex-1 truncate">
                          {item.title}
                        </span>
                        <ArrowUpRight className="h-4 w-4 shrink-0 opacity-75" />
                      </a>
                    ) : (
                      <NavLink
                        to={item.tabs ? "" : item.url}
                        onClick={() => {
                          if (item.tabs?.length) {
                            toggleSubtabs(item.title);
                          }
                        }}
                        className={({ isActive }) =>
                          `flex items-center gap-2 rounded-lg px-3 py-2 text-accent-foreground transition-all hover:text-primary-foreground hover:bg-primary ${
                            isActive || isItemActive(item)
                              ? "text-accent-foreground font-medium bg-muted/65"
                              : ""
                          }`
                        }
                      >
                        <item.icon className="h-4 w-4" />
                        <span className="min-w-0 flex-1 truncate">
                          {item.title}
                        </span>
                        {item.tabs?.length ? (
                          <ChevronDown
                            className={cn(
                              "h-4 w-4 shrink-0 transition-transform",
                              openSubtabs[item.title] ? "rotate-180" : "",
                            )}
                          />
                        ) : null}
                        {/* Active indicator dot at the end if selected/active */}
                        {isItemActive(item) && !item.tabs?.length && (
                          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                        )}
                      </NavLink>
                    )}
                  </SidebarMenuButton>
                  {item.tabs?.length && openSubtabs[item.title] ? (
                    <SidebarMenuSub className="mx-0 ml-[31px] mt-1 gap-0 border-l border-accent-foreground/20 px-0 py-1">
                      {item.tabs.map((tab) => (
                        <SidebarMenuSubItem key={tab.title}>
                          <NavLink
                            to={tab.url}
                            className={() =>
                              `group flex min-h-8 items-center gap-2 rounded-md py-1.5 pl-4 pr-2 text-sm text-accent-foreground transition-all hover:text-primary-foreground hover:bg-primary ${
                                isItemActive(tab) ? "font-medium" : ""
                              }`
                            }
                          >
                            <span
                              className={cn(
                                "h-1.5 w-1.5 shrink-0 rounded-full bg-accent-foreground/50 transition-colors group-hover:bg-primary",
                                isItemActive(tab) ? "bg-primary" : "",
                              )}
                            />
                            <span>{tab.title}</span>
                          </NavLink>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  ) : null}
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
