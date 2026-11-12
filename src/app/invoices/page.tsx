"use client";

import React from "react";
import { WorkspaceShell } from "@/components/WorkspaceShell";
import DocumentsPage from "@/app/app/documents/page";

export default function ProtectedInvoicesRoute() {
  return (
    <WorkspaceShell>
      <DocumentsPage />
    </WorkspaceShell>
  );
}
