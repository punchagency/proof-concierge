"use client";

import { Input } from "@/components/ui/input";
import Profile from "@/icons/Profile";
import ProofLogo from "@/icons/Proof";
import Settings from "@/icons/Settings";
import Search from "@/icons/Search";
import NavBar from "./NavBar";
import Link from "next/link";
import { Button } from "./ui/button";
import { LogOut, UserPlus } from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import NotificationBell from "./notifications/NotificationBell";

export default function Header() {
  const { isAuthenticated, logout, user, isSuperAdmin } = useAuth();

  return (
    <div className="">
      <div className="flex flex-row justify-between px-[24px] py-[20px] w-full h-[88px] items-center">
        <div>
          <ProofLogo />
        </div>
        {isAuthenticated && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#AAB5C2]" />
            <Input
              type="email"
              placeholder="Search here"
              className="w-[496px] h-[40px] pl-10 text-[#AAB5C2]"
            />
          </div>
        )}
        <div className="flex flex-row gap-[24px] justify-center items-center">
          {isAuthenticated ? (
            <>
              <Settings />
              <NotificationBell />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="focus:outline-none">
                    <Profile />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5 text-sm font-medium">
                    {user?.name}
                    <div className="text-xs text-muted-foreground">
                      {user?.role}
                    </div>
                  </div>
                  {isSuperAdmin && (
                    <Link href="/admin/users">
                      <DropdownMenuItem>
                        <UserPlus className="mr-2 h-4 w-4" />
                        <span>Manage Users</span>
                      </DropdownMenuItem>
                    </Link>
                  )}
                  <DropdownMenuItem onClick={logout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Link href="/login">
              <Button>Sign In</Button>
            </Link>
          )}
        </div>
      </div>
      {isAuthenticated && <NavBar />}
    </div>
  );
}
