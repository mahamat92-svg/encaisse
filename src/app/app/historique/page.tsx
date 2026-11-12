"use client";

import React, { useEffect, useState } from "react";
import { useAppState } from "@/components/AppContext";
import { createClient } from "@/lib/supabase/client";

interface AuditEntry {
  time: string;
  action: string;
  entity: string;
  detail: string;
}

export default function AuditHistoryPage() {
  const { org } = useAppState();
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!org.isLiveDb) {
      setLogs([]);
      setLoading(false);
      return;
    }
    const supabase = createClient();
    supabase
      .from("audit_logs")
      .select("action, entity, entity_id, details, created_at")
      .eq("org_id", org.id)
      .order("created_at", { ascending: false })
      .limit(50)
      .then(({ data }) => {
        if (data) {
          setLogs(
            data.map((row) => ({
              time: new Date(row.created_at).toLocaleString("fr-FR"),
              action: String(row.action).toUpperCase(),
              entity: row.entity,
              detail:
                typeof row.details === "object" && row.details
                  ? JSON.stringify(row.details).slice(0, 120)
                  : String(row.entity_id || ""),
            }))
          );
        }
        setLoading(false);
      });
  }, [org.id, org.isLiveDb]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-[#0B1F3A]">
          🛡️ Historique des opérations
        </h1>
        <p className="text-xs text-slate-500">
          Journal d&apos;audit enregistré en temps réel dans PostgreSQL (`audit_logs`).
        </p>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-xs text-slate-500">
          Chargement du journal d&apos;audit...
        </div>
      ) : logs.length === 0 ? (
        <div className="bg-white rounded-2xl border-2 border-dashed border-slate-300 p-10 text-center space-y-2">
          <div className="text-base font-extrabold text-[#0B1F3A]">
            Aucune opération journalisée
          </div>
          <p className="text-xs text-slate-500">
            Les créations et modifications de clients, factures et paiements apparaîtront automatiquement ici.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 shadow-sm">
          {logs.map((log, i) => (
            <div
              key={i}
              className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
            >
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-slate-100 font-bold text-[#0B1F3A]">
                  {log.action} · {log.entity}
                </span>
                <span className="font-mono text-slate-700 truncate max-w-xl">
                  {log.detail}
                </span>
              </div>
              <div className="text-slate-400 font-mono shrink-0">{log.time}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
