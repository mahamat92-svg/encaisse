"use client";

import React from "react";
import { WorkspaceShell } from "@/components/WorkspaceShell";
import ClientsPage from "@/app/app/clients/page";

export default function ProtectedClientsRoute() {
  return (
    <WorkspaceShell>
      <ClientsPage />
    </WorkspaceShell>
  );
}
