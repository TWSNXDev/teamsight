"use client";

import { useTheme } from "next-themes";
import { LogOut, Moon, Sun } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOut } from "@/lib/auth-client";

interface DashboardNavProps {
  user: { name: string; email: string; role: string };
  onlineCount: number;
}

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function roleLabel(role: string) {
  return role.charAt(0) + role.slice(1).toLowerCase();
}

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();

  if (resolvedTheme === undefined) {
    return <Button variant="ghost" size="icon" aria-label="Toggle theme" />;
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      aria-label="Toggle theme"
    >
      {resolvedTheme === "dark" ? <Sun /> : <Moon />}
    </Button>
  );
}

export function DashboardNav({ user, onlineCount }: DashboardNavProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-sm">
      <div className="flex h-14 items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 text-sm font-semibold tracking-tight">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary font-bold text-primary-foreground">
            T
          </span>
          <span className="hidden sm:inline">Teamsight</span>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            {onlineCount} online
          </div>

          <ThemeToggle />

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <button className="flex items-center gap-2 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
                  <Avatar size="sm">
                    <AvatarFallback className="bg-accent text-accent-foreground">
                      {initials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                </button>
              }
            />
            <DropdownMenuContent align="end" className="w-64 p-0 overflow-hidden">
              <div className="flex items-center gap-3 bg-muted/40 px-4 py-3.5">
                <Avatar size="lg">
                  <AvatarFallback className="bg-accent text-sm font-medium text-accent-foreground">
                    {initials(user.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex min-w-0 flex-col gap-1">
                  <span className="truncate text-sm font-medium text-foreground">
                    {user.name}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">{user.email}</span>
                  <Badge variant="secondary" className="w-fit">
                    {roleLabel(user.role)}
                  </Badge>
                </div>
              </div>
              <DropdownMenuSeparator className="my-0" />
              <div className="p-1.5">
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => signOut()}
                  className="py-1.5"
                >
                  <LogOut />
                  Sign out
                </DropdownMenuItem>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
