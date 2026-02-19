"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { usePathname } from "next/navigation";
import DesktopNavBar from "./desktop-nav-bar";
import LoadingNavBar from "./loading-nav-bar";
import MobileNavBar from "./mobile-nav-bar";

// Pages where the internal navigation menu should be shown
const INTERNAL_PAGES = [
  "/dashboard",
  "/dashboard/profile",
  // "/dashboard/settings",
  "/dashboard/videos",
];

export default function NavBar() {
  const [isMobile, setIsMobile] = useState(false);
  const { authState } = useAuth();
  const pathname = usePathname();
  const showInternalMenu = INTERNAL_PAGES.includes(pathname);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Initial check
    checkMobile();

    // Add listener for resize events
    window.addEventListener("resize", checkMobile);

    // Clean up
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Show loading state
  if (authState.loading) {
    return <LoadingNavBar />;
  }

  // Show error state briefly if needed (optional)
  if (authState.error) {
    console.warn("NavBar auth error:", authState.error);
    // Still render the navbar but in unauthenticated state
  }

  return isMobile ? (
    <MobileNavBar
      isAuthenticated={authState.isAuthenticated}
      user={authState.user}
      showInternalMenu={showInternalMenu}
    />
  ) : (
    <DesktopNavBar
      isAuthenticated={authState.isAuthenticated}
      user={authState.user}
      showInternalMenu={showInternalMenu}
    />
  );
}
