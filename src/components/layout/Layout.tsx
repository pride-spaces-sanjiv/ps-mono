import { useState } from "react";
import { Outlet } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./Sidebar";
import { cn } from "@/utils/className";

export default function Layout({
  children,
  ...props
}: React.JSX.IntrinsicElements["main"]) {
  const [open, setOpen] = useState<boolean>(true);
  return (
    <SidebarProvider
      onOpenChange={(open) => {
        setOpen(open);
      }}
      className="relative"
    >
      <AppSidebar />
      <main {...props} className={cn("w-full relative", props?.className)}>
        <SidebarTrigger
          className={cn(
            "fixed bg-background max-[500px]:right-0 transition ease-in-out",
            open ? "" : "",
          )}
        />
        <Outlet />
      </main>
    </SidebarProvider>
  );
}
