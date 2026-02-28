"use client";

import React from "react";
import { AuthProvider } from "@/contexts/AuthContext";
import DashboardProvider from "@/contexts/dashboard/dashboard-provider";
import { DevotionalProvider } from "@/contexts/DevotionalContext";

function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AuthProvider>
        <DevotionalProvider>
          <DashboardProvider>{children}</DashboardProvider>
        </DevotionalProvider>
      </AuthProvider>
    </>
  );
}

export default Providers;
