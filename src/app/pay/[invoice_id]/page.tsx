"use client";

import React from "react";
import { useParams } from "next/navigation";
import { ProfessionalInvoiceView } from "@/components/ProfessionalInvoiceView";

export default function ClientPublicInvoicePage() {
  const params = useParams<{ invoice_id: string }>();
  const invoiceId = params?.invoice_id ?? "";

  return (
    <ProfessionalInvoiceView
      invoiceIdOrToken={invoiceId}
      viewerMode="client"
    />
  );
}
