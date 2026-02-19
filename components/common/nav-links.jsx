"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

// Regular navigation links for public pages
const PUBLIC_NAV_LINKS = [
  { href: "/about", label: "About" },
  { href: "/founders-bio", label: "Founder's Bio" },
  { href: "/individuals", label: "For Individuals" },
  { href: "/churches", label: "For Churches" },
  { href: "/scholarship", label: "Scholarship" },
  { href: "/testimonials", label: "Testimonials" },
  { href: "/donate", label: "Donate" },
];

// Internal navigation links for dashboard pages
const INTERNAL_NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard/videos", label: "Videos" },
  { href: "/dashboard/profile", label: "Profile" },
];

export default function NavLinks({
  isAuthenticated,
  onLinkClick,
  isMobile = false,
  showInternalMenu = false,
}) {
  const pathname = usePathname();

  // Choose which links to display
  const links = isAuthenticated ? INTERNAL_NAV_LINKS : PUBLIC_NAV_LINKS;

  const linkClassName = (href) =>
    cn(
      isMobile
        ? "block rounded-md px-3 py-2 text-base font-medium transition-colors hover:bg-gray-100"
        : "text-sm font-medium transition-colors hover:text-gray-600",
      pathname === href
        ? isMobile
          ? "bg-gray-100 text-gray-900"
          : "text-gray-900"
        : "text-gray-600",
    );

  return (
    <>
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={linkClassName(link.href)}
          onClick={onLinkClick}
        >
          {link.label}
        </Link>
      ))}
    </>
  );
}
