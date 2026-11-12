"use client";

import React from "react";
import { useParams } from "next/navigation";
import { ProfessionalInvoiceView } from "@/components/ProfessionalInvoiceView";

export default function AdminInvoiceDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";

  return (
    <ProfessionalInvoiceView
      invoiceIdOrToken={id}
      viewerMode="admin"
    />
  );
}
