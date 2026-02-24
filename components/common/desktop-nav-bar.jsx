import SidePanel from "@/components/Dashboard/SidePanel/SidePanel";
import AuthButtons from "./nav-auth-buttons";
import NavLogo from "./nav-bar-logo";
import NavLinks from "./nav-links";
import UserMenu from "./user-menu";

export default function DesktopNavBar({
  isAuthenticated,
  user,
  showInternalMenu,
}) {
  return (
    <nav className="fixed left-0 right-0 top-0 z-50 bg-white shadow-sm backdrop-blur-sm">
      <div className="mx-4 flex items-center justify-between p-3 text-black lg:mx-6 lg:p-4 xl:mx-10">
        {/* Left section: Logo */}
        <div className="flex items-center">
          <NavLogo />
        </div>

        {/* Center section: Navigation Links */}
        <div className="hidden items-center justify-center gap-4 md:flex lg:gap-6">
          <NavLinks
            isAuthenticated={isAuthenticated}
            showInternalMenu={showInternalMenu}
          />
        </div>

        {/* Right section: Auth buttons or User menu */}
        <div className="flex items-center justify-end gap-2 lg:gap-4">
          {isAuthenticated ? (
            // if authenticated and on an internal menu page, display the user menu for the internal pages
            showInternalMenu ? (
              <UserMenu user={user} />
            ) : (
              // if logged in but not able to see internal menu, display nothing
              <AuthButtons />
            )
          ) : (
            <AuthButtons />
          )}
          {isAuthenticated && showInternalMenu && <SidePanel />}
        </div>
      </div>
    </nav>
  );
}
