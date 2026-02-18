"use client";

import { useAuth } from "@/contexts/AuthContext";
import MainBody from "@/components/Dashboard/MainBody";
import PaymentVerification from "@/components/Dashboard/payment-verification";

export default function Dashboard() {
  const { authState } = useAuth();

  // Show loading state while auth is being determined
  if (authState.loading) {
    return (
      <div className="relative mx-2 2xs:mx-3 xs:mx-4 sm:mx-6 md:mx-8 lg:mx-12 xl:mx-16 flex min-h-screen flex-col items-center justify-center px-2 2xs:px-3 xs:px-4">
        <div className="flex flex-col items-center gap-3 2xs:gap-4">
          <div className="h-6 w-6 2xs:h-7 2xs:w-7 xs:h-8 xs:w-8 animate-spin rounded-full border-2 2xs:border-3 xs:border-4 border-gray-300 border-t-red-700"></div>
          <p className="text-gray-600 text-xs 2xs:text-sm sm:text-base text-center">
            {authState.signingOut ? "Signing out..." : "Loading dashboard..."}
          </p>
        </div>
      </div>
    );
  }

  // Show message if not authenticated
  if (!authState.isAuthenticated || !authState.user) {
    return (
      <div className="relative mx-2 2xs:mx-3 xs:mx-4 sm:mx-6 md:mx-8 lg:mx-12 xl:mx-16 flex min-h-screen flex-col items-center justify-center px-2 2xs:px-3 xs:px-4">
        <div className="flex flex-col items-center gap-3 2xs:gap-4">
          <p className="text-gray-600 text-xs 2xs:text-sm sm:text-base text-center">
            Please log in to view your progress.
          </p>
        </div>
      </div>
    );
  }

  // Only render dashboard if user is fully authenticated
  return (
    <div className="relative mx-2 2xs:mx-3 xs:mx-4 sm:mx-6 md:mx-8 lg:mx-12 xl:mx-16 flex min-h-screen flex-col items-center justify-start px-1 2xs:px-2 xs:px-3 sm:px-4">
      <PaymentVerification>
        <MainBody />
      </PaymentVerification>
    </div>
  );
}
