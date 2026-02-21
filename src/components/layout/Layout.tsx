import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./Sidebar";
import { Outlet } from "react-router-dom";
import { cn } from "@/utils/className";

export default function Layout({
  children,
  ...props
}: React.JSX.IntrinsicElements["main"]) {
  return (
    <SidebarProvider className="relative">
      <AppSidebar />
      <main {...props} className={cn("w-full", props?.className)}>
        <SidebarTrigger />
        <Outlet />
      </main>
    </SidebarProvider>
  );
}
