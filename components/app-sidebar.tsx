"use client";

import * as React from "react";
import {
  Briefcase,
  FileText,
  Home,
  LogOut,
  MessageSquare,
  Moon,
  Sun,
  User,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "@/lib/authClient";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

// Menu items.
const items = [
  {
    title: "Home",
    url: "/dashboard",
    icon: Home,
  },
  {
    title: "Job Recommendation",
    url: "/job-recommendation",
    icon: Briefcase,
  },
  {
    title: "Practice Interview",
    url: "/practice-interview",
    icon: MessageSquare,
  },
  {
    title: "Check Offering",
    url: "/check-offering",
    icon: FileText,
  },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const { data: session } = useSession();
  const [showLogoutDialog, setShowLogoutDialog] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const handleLogout = async () => {
    await signOut();
    router.push("/login");
  };

  return (
    <>
      <Sidebar collapsible="icon" {...props}>
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild>
                <a href="/dashboard" className="flex items-center w-full">
                  {/* Expanded: dashboard banner logo */}
                  <div className="w-full group-data-[collapsible=icon]:hidden">
                    {mounted ? (
                      <img
                        src={
                          theme === "dark"
                            ? "/logo-dashboard-darkmode.svg"
                            : "/logo-dashboard-lightmode.svg"
                        }
                        alt="Karir Flow"
                        className="h-10 w-full object-contain"
                      />
                    ) : (
                      <img
                        src="/logo-dashboard-lightmode.svg"
                        alt="Karir Flow"
                        className="h-10 w-full object-contain"
                      />
                    )}
                  </div>

                  {/* Collapsed: tab logo */}
                  <div className="hidden group-data-[collapsible=icon]:inline-flex w-full items-center justify-center">
                    {mounted ? (
                      <img
                        src={
                          theme === "dark"
                            ? "/logo-tab-darkmode.svg"
                            : "/logo-tab.svg"
                        }
                        alt="Karir Flow"
                        className="h-8 w-8 object-contain"
                      />
                    ) : (
                      <img
                        src="/logo-tab.svg"
                        alt="Karir Flow"
                        className="h-8 w-8 object-contain"
                      />
                    )}
                  </div>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Menu</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild tooltip={item.title}>
                      <a href={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem className="flex items-center gap-2 p-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="h-auto w-full justify-start gap-2 px-2 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  >
                    <Avatar className="h-8 w-8 rounded-lg">
                      <AvatarImage
                        src={session?.user?.image || ""}
                        alt={session?.user?.name || "User"}
                      />
                      <AvatarFallback className="rounded-lg">
                        {session?.user?.name?.slice(0, 2).toUpperCase() || "CN"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                      <span className="truncate font-semibold">
                        {session?.user?.name || "User"}
                      </span>
                      <span className="truncate text-xs">
                        {session?.user?.email || "user@example.com"}
                      </span>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="right" align="end" className="w-56">
                  <DropdownMenuItem onClick={() => router.push("/profile")}>
                    <User className="mr-2 h-4 w-4" />
                    <span>View Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={toggleTheme}>
                    <Sun className="mr-2 h-4 w-4" />
                    <span>Toggle Theme</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowLogoutDialog(true)}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Are you sure you want to logout?
            </AlertDialogTitle>
            <AlertDialogDescription>
              You will be redirected to the login page.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogout}>
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
