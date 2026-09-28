"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Presentation } from "lucide-react";
import { usePathname } from "next/navigation";

import { SIDEBAR_DASHBOARD } from "@/constants/menu-sidebar";
import { cn } from "@/lib/utils";

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar>
      {/* Header */}
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="h-auto py-2">
              <div className="flex w-full items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-teal-500 text-white">
                  <Presentation className="size-4" />
                </div>

                <div className="flex flex-col gap-0.5 text-left leading-none">
                  <span className="text-sm font-semibold">Dashboard</span>
                  <span className="text-xs text-muted-foreground">
                    Administrator
                  </span>
                </div>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* Content */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {SIDEBAR_DASHBOARD.map((item) => {
              const isActive =
                pathname === item.path || pathname.startsWith(`${item.path}/`);

              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton tooltip={item.title} className="p-0 mb-4">
                    <a
                      href={item.path}
                      className={cn(
                        "flex h-auto w-full items-center gap-2 rounded-md px-4 py-10 transition-colors",
                        isActive
                          ? "bg-teal-500 text-white hover:bg-teal-500 hover:text-white"
                          : "hover:bg-muted",
                      )}
                    >
                      {item.icon && <item.icon className="size-4" />}
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter />
    </Sidebar>
  );
}
