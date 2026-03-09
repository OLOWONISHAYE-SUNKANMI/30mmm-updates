"use client";

import { Button } from "@/components/ui/button";
import { signOut } from "next-auth/react";

export default function SignOutButton({ className, variant = "default" }) {
  const handleSignOut = () => {
    signOut({ callbackUrl: "/" });
  };

  return (
    <Button
      onClick={handleSignOut}
      className={
        className || "w-full bg-primary-red text-white hover:bg-red-800"
      }
      variant={variant}
    >
      Sign Out
    </Button>
  );
}
