"use client";

import React from "react";
import { WorkspaceShell } from "@/components/WorkspaceShell";
import DashboardPage from "@/app/app/page";

export default function ProtectedDashboardRoute() {
  return (
    <WorkspaceShell>
      <DashboardPage />
    </WorkspaceShell>
  );
}

