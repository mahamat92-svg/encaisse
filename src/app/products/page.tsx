"use client";

import React from "react";
import { WorkspaceShell } from "@/components/WorkspaceShell";
import CatalogPage from "@/app/app/catalogue/page";

export default function ProtectedProductsRoute() {
  return (
    <WorkspaceShell>
      <CatalogPage />
    </WorkspaceShell>
  );
}

