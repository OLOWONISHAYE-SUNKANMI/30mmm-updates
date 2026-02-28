import DashboardProvider from "@/contexts/dashboard/dashboard-provider";
import React from "react";

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div>
      <DashboardProvider>{children}</DashboardProvider>
    </div>
  );
};

export default DashboardLayout;
