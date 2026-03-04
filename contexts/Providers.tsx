"use client";

import { SessionProvider } from "next-auth/react";
import { AuthProvider } from "@/contexts/AuthContext";
import DashboardProvider from "@/contexts/dashboard/dashboard-provider";
import { DevotionalProvider } from "@/contexts/DevotionalContext";

function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AuthProvider>
        <DevotionalProvider>
          <DashboardProvider>{children}</DashboardProvider>
        </DevotionalProvider>
      </AuthProvider>
    </SessionProvider>
  );
}

export default Providers;