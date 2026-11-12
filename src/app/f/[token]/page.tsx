"use client";

import React from "react";
import { useParams } from "next/navigation";
import { ProfessionalInvoiceView } from "@/components/ProfessionalInvoiceView";

export default function PublicTokenInvoicePage() {
  const params = useParams<{ token: string }>();
  const token = params?.token ?? "";

  return (
    <ProfessionalInvoiceView
      invoiceIdOrToken={token}
      viewerMode="admin"
    />
  );
}
