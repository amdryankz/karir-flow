"use client";

import * as React from "react";
import {
  Briefcase,
  FileText,
  Home,
  LogOut,
  Menu,
  MessageSquare,
  Moon,
  Sun,
  User,
  X,
} from "lucide-react";
import { useTheme } from "next-themes";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { signOut, useSession } from "@/lib/authClient";
import { resetCvStatusCache } from "@/hooks/use-cv-status";
import { cn } from "@/lib/utils";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

// Menu items
const menuItems = [
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

export function AppNavbar() {
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();
  const [showLogoutDialog, setShowLogoutDialog] = React.useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const handleLogout = async () => {
    resetCvStatusCache();
    await signOut();
    router.push("/login");
  };

  return (
    <>
      <nav className="sticky top-0 z-50 w-full border-b border-[#e4ebe4] dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-lg supports-backdrop-filter:bg-white/60 dark:supports-backdrop-filter:bg-zinc-950/60">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between pe-6 ps-2 lg:pe-8 lg:ps-4">
          {/* Logo */}
          <Link
            href="/dashboard"
            className="flex items-center gap-2 transition-opacity hover:opacity-80"
          >
            {mounted ? (
              <Image
                src={
                  theme === "dark"
                    ? "/logo-dashboard-darkmode.svg"
                    : "/logo-dashboard-lightmode.svg"
                }
                alt="Karir Flow"
                width={200}
                height={200}
                className="h-14 w-auto"
                priority
              />
            ) : (
              <Image
                src="/logo-dashboard-lightmode.svg"
                alt="Karir Flow"
                width={200}
                height={200}
                className="h-14 w-auto"
                priority
              />
            )}
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {menuItems.map((item) => {
              // Check if upload-offering should highlight Check Offering tab
              const isUploadOfferingActive =
                item.url === "/check-offering" &&
                pathname === "/upload-offering";
              const isActive =
                pathname === item.url ||
                pathname.startsWith(item.url + "/") ||
                isUploadOfferingActive;
              return (
                <Link
                  key={item.title}
                  href={item.url}
                  className={cn(
                    "relative flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200",
                    isActive
                      ? "text-[#14a800] bg-[#14a800]/10 dark:bg-[#14a800]/20"
                      : "text-foreground/70 hover:text-foreground hover:bg-muted"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.title}</span>
                  {isActive && (
                    <span className="absolute bottom-0 left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-full bg-[#14a800]" />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-2">
            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="hidden md:inline-flex rounded-lg hover:bg-muted"
            >
              {mounted && theme === "dark" ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </Button>

            {/* User Menu - Desktop */}
            <div className="hidden md:block">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-10 gap-2 rounded-lg px-3 hover:bg-muted"
                  >
                    <Avatar className="h-7 w-7">
                      <AvatarImage
                        src={session?.user?.image || ""}
                        alt={session?.user?.name || "User"}
                      />
                      <AvatarFallback className="bg-[#14a800]/10 text-[#14a800] text-xs font-semibold">
                        {session?.user?.name?.slice(0, 2).toUpperCase() || "CN"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden lg:block text-left text-sm">
                      <div className="font-medium text-foreground">
                        {session?.user?.name || "User"}
                      </div>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 rounded-xl">
                  <div className="flex items-center gap-2 p-2">
                    <Avatar className="h-10 w-10">
                      <AvatarImage
                        src={session?.user?.image || ""}
                        alt={session?.user?.name || "User"}
                      />
                      <AvatarFallback className="bg-[#14a800]/10 text-[#14a800] font-semibold">
                        {session?.user?.name?.slice(0, 2).toUpperCase() || "CN"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">
                        {session?.user?.name || "User"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {session?.user?.email || "user@example.com"}
                      </p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => router.push("/profile")}
                    className="rounded-lg cursor-pointer"
                  >
                    <User className="mr-2 h-4 w-4" />
                    <span>View Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={toggleTheme}
                    className="rounded-lg cursor-pointer md:hidden"
                  >
                    {theme === "dark" ? (
                      <Sun className="mr-2 h-4 w-4" />
                    ) : (
                      <Moon className="mr-2 h-4 w-4" />
                    )}
                    <span>
                      Switch to {theme === "dark" ? "Light" : "Dark"} Mode
                    </span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setShowLogoutDialog(true)}
                    className="rounded-lg cursor-pointer text-red-600 focus:text-red-600 dark:text-red-400"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Mobile Menu */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden rounded-lg"
                >
                  {mobileMenuOpen ? (
                    <X className="h-5 w-5" />
                  ) : (
                    <Menu className="h-5 w-5" />
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <SheetHeader>
                  <SheetTitle>Menu</SheetTitle>
                </SheetHeader>
                <div className="flex flex-col gap-4 mt-8">
                  {/* User Info */}
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
                    <Avatar className="h-12 w-12">
                      <AvatarImage
                        src={session?.user?.image || ""}
                        alt={session?.user?.name || "User"}
                      />
                      <AvatarFallback className="bg-[#14a800]/10 text-[#14a800] font-semibold">
                        {session?.user?.name?.slice(0, 2).toUpperCase() || "CN"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">
                        {session?.user?.name || "User"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {session?.user?.email || "user@example.com"}
                      </p>
                    </div>
                  </div>

                  {/* Navigation Links */}
                  <div className="flex flex-col gap-1">
                    {menuItems.map((item) => {
                      // Check if upload-offering should highlight Check Offering tab
                      const isUploadOfferingActive =
                        item.url === "/check-offering" &&
                        pathname === "/upload-offering";
                      const isActive =
                        pathname === item.url ||
                        pathname.startsWith(item.url + "/") ||
                        isUploadOfferingActive;
                      return (
                        <Link
                          key={item.title}
                          href={item.url}
                          onClick={() => setMobileMenuOpen(false)}
                          className={cn(
                            "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors",
                            isActive
                              ? "text-[#14a800] bg-[#14a800]/10 dark:bg-[#14a800]/20"
                              : "text-foreground hover:bg-muted"
                          )}
                        >
                          <item.icon className="h-5 w-5" />
                          <span>{item.title}</span>
                        </Link>
                      );
                    })}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 pt-4 border-t">
                    <Button
                      variant="ghost"
                      onClick={() => {
                        router.push("/profile");
                        setMobileMenuOpen(false);
                      }}
                      className="justify-start rounded-lg"
                    >
                      <User className="mr-2 h-4 w-4" />
                      View Profile
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={toggleTheme}
                      className="justify-start rounded-lg"
                    >
                      {theme === "dark" ? (
                        <Sun className="mr-2 h-4 w-4" />
                      ) : (
                        <Moon className="mr-2 h-4 w-4" />
                      )}
                      Switch to {theme === "dark" ? "Light" : "Dark"} Mode
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        setShowLogoutDialog(true);
                      }}
                      className="justify-start rounded-lg text-red-600 hover:text-red-600 dark:text-red-400"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Log out
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </nav>

      {/* Logout Dialog */}
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl">
              Are you sure you want to logout?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              You will be redirected to the login page and will need to sign in
              again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLogout}
              className="rounded-full bg-red-600 hover:bg-red-700 text-white"
            >
              Logout
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
