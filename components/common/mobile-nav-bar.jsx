"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import SidePanel from "@/components/Dashboard/SidePanel/SidePanel";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import AuthButtons from "./nav-auth-buttons";
import NavLogo from "./nav-bar-logo";
import NavLinks from "./nav-links";
import UserMenu from "./user-menu";

export default function MobileNavBar({
  isAuthenticated,
  user,
  showInternalMenu,
}) {
  const [open, setOpen] = useState(false);
  const closeSheet = () => setOpen(false);

  return (
    <nav className="fixed left-0 right-0 top-0 z-50 bg-white shadow-sm backdrop-blur-sm">
      <div className="mx-2 flex items-center justify-between p-3 text-black xs:mx-4 xs:p-4">
        {/* Left section: Logo */}
        <div className="flex items-center">
          <NavLogo />
        </div>

        {/* Right section: Mobile Menu */}
        <div className="flex items-center justify-end">
          <Sheet
            open={open}
            onOpenChange={setOpen}
          >
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 xs:h-10 xs:w-10"
              >
                <Menu className="h-5 w-5 xs:h-6 xs:w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-full max-w-sm p-4"
            >
              <SheetHeader>
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>
              <div className="mt-6 flex flex-col gap-4">
                {isAuthenticated ? (
                  showInternalMenu ? (
                    // Logged in mobile menu
                    <>
                      <UserMenu
                        user={user}
                        mobile
                      />
                      <NavLinks
                        isAuthenticated={isAuthenticated}
                        onLinkClick={closeSheet}
                        isMobile={true}
                        showInternalMenu={showInternalMenu}
                      />
                      {isAuthenticated && showInternalMenu && <SidePanel />}
                    </>
                  ) : (
                    // if logged in but not able to see internal menu, display nothing
                    <></>
                  )
                ) : (
                  // Logged out mobile menu
                  <>
                    <NavLinks
                      isAuthenticated={isAuthenticated}
                      onLinkClick={closeSheet}
                      isMobile={true}
                      showInternalMenu={showInternalMenu}
                    />
                    <AuthButtons onButtonClick={closeSheet} />
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}
