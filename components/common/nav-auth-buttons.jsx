import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import NavLink from "./nav-link";

export default function AuthButtons({ onButtonClick }) {
  const pathname = usePathname();

  // Routes where buttons should be hidden
  const hideButtonRoutes = [
    "/login",
    "/signup",
    "/pricing",
    "/dashboard",
    "/sitemap",
    "/devotional",
    // "/settings",
    "/payment",
    "/contact",
    "/donate",
  ];

  // Routes where "Start Your Journey" button should show
  const landingRoutes = [
    "/",
    "/founders-bio",
    "/about",
    "/scholarship",
    "/scholarship-application",
    "/individuals",
    "/churches",
  ];

  if (hideButtonRoutes.includes(pathname)) {
    return null;
  }

  if (landingRoutes.includes(pathname)) {
    return (
      <>
        <NavLink
          href="/login"
          onClick={onButtonClick}
        >
          <Button
            variant="outline"
            className="w-full border-primary-red text-primary-red hover:bg-primary-red hover:text-white"
          >
            Log In
          </Button>
        </NavLink>
        <NavLink
          href="/signup"
          onClick={onButtonClick}
        >
          <Button className="w-full border border-primary-red bg-primary-red text-white hover:bg-red-800">
            Sign Up
          </Button>
        </NavLink>
      </>
    );
  }

  return (
    <>
      <NavLink
        href="/login"
        onClick={onButtonClick}
      >
        <Button
          variant="outline"
          className="w-full border-primary-red text-primary-red hover:bg-primary-red hover:text-white"
        >
          Log In
        </Button>
      </NavLink>
      <NavLink
        href="/signup"
        onClick={onButtonClick}
      >
        <Button className="w-full bg-primary-red text-white hover:bg-red-800">
          Sign Up
        </Button>
      </NavLink>
    </>
  );
}
