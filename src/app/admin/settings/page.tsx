"use client";

import React from "react";
import { WorkspaceShell } from "@/components/WorkspaceShell";
import MerchantSettingsFormPage from "@/app/app/parametres/page";

export default function AdminSettingsRoute() {
  return (
    <WorkspaceShell>
      <MerchantSettingsFormPage />
    </WorkspaceShell>
  );
}
