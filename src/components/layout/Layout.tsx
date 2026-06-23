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
      className="relative h-full"
    >
      <AppSidebar />
      <main
        {...props}
        className={cn(
          "relative h-full min-w-0 w-full grow overflow-x-hidden",
          props?.className,
        )}
      >
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
