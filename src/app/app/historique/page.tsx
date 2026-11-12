"use client";

import React, { useEffect, useState } from "react";
import { useAppState } from "@/components/AppContext";
import { createClient } from "@/lib/supabase/client";

interface AuditEntry {
  time: string;
  actor: string;
  action: string;
  entity: string;
  detail: string;
}

export default function AuditHistoryPage() {
  const { org } = useAppState();
  const [liveLogs, setLiveLogs] = useState<AuditEntry[] | null>(null);

  useEffect(() => {
    if (!org.isLiveDb) {
      setLiveLogs(null);
      return;
    }
    const supabase = createClient();
    supabase
      .from("audit_logs")
      .select("action, entity, entity_id, details, created_at")
      .eq("org_id", org.id)
      .order("created_at", { ascending: false })
      .limit(30)
      .then(({ data }) => {
        if (data && data.length > 0) {
          setLiveLogs(
            data.map((row) => ({
              time: new Date(row.created_at).toLocaleString("fr-FR"),
              actor: "Utilisateur authentifié",
              action: String(row.action).toUpperCase(),
              entity: row.entity,
              detail:
                typeof row.details === "object" && row.details
                  ? JSON.stringify(row.details).slice(0, 120)
                  : String(row.entity_id || ""),
            }))
          );
        }
      });
  }, [org.id, org.isLiveDb]);

  const demoLogs: AuditEntry[] = [
    {
      time: "11/11/2026 à 21:14",
      actor: "Propriétaire (owner)",
      action: "INSERT",
      entity: "payments",
      detail: `Encaissement validé + génération du reçu ${
        org.payments[0]?.receiptNumber ?? "REC-2026-0088"
      }`,
    },
    {
      time: "11/11/2026 à 18:40",
      actor: "Propriétaire (owner)",
      action: "INSERT",
      entity: "reminder_logs",
      detail: `Relance WhatsApp envoyée sur ${org.documents[0]?.number ?? "FAC"}`,
    },
    {
      time: "08/11/2026 à 10:15",
      actor: "Gestionnaire (manager)",
      action: "UPDATE",
      entity: "documents",
      detail: `Émission et verrouillage de la facture ${
        org.documents[0]?.number ?? "FAC"
      }`,
    },
    {
      time: "01/11/2026 à 09:00",
      actor: "Système PostgreSQL",
      action: "INSERT",
      entity: "organizations",
      detail: `Création de ${org.name} avec essai Pro de 14 jours`,
    },
  ];

  const logs = liveLogs ?? demoLogs;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-[#0B1F3A]">
          🛡️ Historique des opérations (Journal d&apos;Audit)
        </h1>
        <p className="text-xs text-slate-500">
          Traçabilité inaltérable alimentée automatiquement par le trigger PostgreSQL `audit_row()` (Exigence HIST-1 & HIST-2).
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 shadow-sm">
        {logs.map((log, i) => (
          <div
            key={i}
            className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
          >
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-slate-100 font-bold text-[#0B1F3A]">
                  {log.action} · {log.entity}
                </span>
                <span className="font-semibold text-slate-800">{log.detail}</span>
              </div>
              <div className="text-slate-500">Par : {log.actor}</div>
            </div>
            <div className="text-slate-400 font-mono shrink-0">{log.time}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
