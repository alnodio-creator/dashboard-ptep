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
import { SIDEBAR_DASHBOARD, basePath } from "@/constants/menu-sidebar";
import { cn } from "@/lib/utils";

export function AppSidebar() {
  const pathname = usePathname();

  // Hilangkan basePath jika pathname menyertakannya.
  const normalizedPath = pathname.startsWith(basePath)
    ? pathname.slice(basePath.length) || "/"
    : pathname;

  console.log({
    pathname,
    normalizedPath,
    basePath,
  });

  return (
    <Sidebar>
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

      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {SIDEBAR_DASHBOARD.map((item) => {
              const isActive =
                normalizedPath === item.path ||
                normalizedPath.startsWith(`${item.path}/`);

              const fullPath = `${basePath}${item.path}`;

              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    tooltip={item.title}
                    isActive={isActive}
                    className="mb-4 h-auto p-0"
                  >
                    <a
                      href={fullPath}
                      className={cn(
                        "flex h-auto w-full items-center gap-1 rounded-md px-4 py-2 transition-colors",
                        isActive
                          ? "bg-teal-500! text-white hover:bg-teal-500 hover:text-white"
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

      <SidebarFooter />
    </Sidebar>
  );
}
