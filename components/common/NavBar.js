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
  "/dashboard/videos",
];

for (let week = 1; week <= 5; week++) {
  // Inner loop for the 7 days
  for (let day = 1; day <= 7; day++) {
    // Construct the URL and push it to the array
    INTERNAL_PAGES.push(`/devotional/${week}-${day}`);
  }
}

// internal pages where the internal navigation menu should NOT be shown
const BLOCKED_ROUTES = ["/profile", "/payment?returnUrl=%2Fprofile"];

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
