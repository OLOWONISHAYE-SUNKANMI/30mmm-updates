"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { ChevronDown, LogOut, SquarePen, User } from "lucide-react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function UserMenu({ mobile }) {
  const [isOpen, setIsOpen] = useState(false);
  const { authState, setAuthState } = useAuth();

  const userInfo = authState.user;

  // Add null check to prevent errors during initial render
  if (!userInfo) {
    return null;
  }

  // Handle logout
  const handleLogout = () => {
    console.log("Logging out...");

    // Set signing out flag to differentiate from initial loading
    setAuthState({
      isAuthenticated: false,
      user: null,
      loading: true,
      signingOut: true,
    });

    // Use signOut with callbackUrl to redirect to landing page
    signOut({ callbackUrl: "/" });
  };

  // Get initials for avatar fallback
  const getInitials = (name) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  // Mobile version of user menu (expanded in sheet)
  if (mobile) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3 pb-2">
          <Avatar className="h-10 w-10">
            <AvatarImage
              src={userInfo.image || ""}
              alt={userInfo.name}
            />
            <AvatarFallback>{getInitials(userInfo.name)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{userInfo.name}</p>
            <p className="text-sm text-gray-500">{userInfo.email}</p>
          </div>
        </div>

        <Link
          href="/dashboard/profile"
          className="flex items-center gap-2 rounded-md p-2 hover:bg-gray-100"
        >
          <User size={16} />
          <span>Profile</span>
        </Link>

        <Link
          href="/dashboard/feedback"
          className="flex items-center gap-2 rounded-md p-2 hover:bg-gray-100"
        >
          <SquarePen size={16} />
          <span>Feedback</span>
        </Link>

        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-2 rounded-md p-2 text-left text-red-600 hover:bg-gray-100"
        >
          <LogOut size={16} />
          <span>Log out</span>
        </button>
      </div>
    );
  }

  // Desktop version (dropdown)
  return (
    <DropdownMenu
      open={isOpen}
      onOpenChange={setIsOpen}
    >
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="user-menu-trigger flex items-center gap-2 px-2"
        >
          <Avatar className="h-8 w-8">
            <AvatarImage
              src={userInfo.image || ""}
              alt={userInfo.name}
            />
            <AvatarFallback>{getInitials(userInfo.name)}</AvatarFallback>
          </Avatar>
          <span className="hidden md:inline">{userInfo.name}</span>
          <ChevronDown
            size={16}
            className="text-gray-500"
          />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-56"
      >
        <div className="flex items-center gap-2 p-2">
          <div className="flex flex-col space-y-1 leading-none">
            <p className="font-medium">{userInfo.name}</p>
            <p className="text-sm text-gray-500">{userInfo.email}</p>
          </div>
        </div>

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <Link
            href="/dashboard/profile"
            className="flex cursor-pointer items-center"
          >
            <User className="mr-2 h-4 w-4" />
            <span>Profile</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link
            href="/dashboard/feedback"
            className="flex cursor-pointer items-center"
          >
            <SquarePen className="mr-2 h-4 w-4" />
            <span>Feedback</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={handleLogout}
          className="text-red-600 focus:bg-red-50 focus:text-red-600"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
