"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { formatCFA, formatDate } from "@/lib/format";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

interface PublicDocPayload {
  number: string;
  docType: "invoice" | "quote" | "credit_note";
  issueDate: string;
  dueDate: string;
  clientName: string;
  total: number;
  paidTotal: number;
  balance: number;
  org: {
    name: string;
    city: string;
    phone: string;
    niu: string;
    rccm: string;
    mtnMomoNumber: string;
    orangeMoneyNumber: string;
  };
  lines: Array<{
    label: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
}

export default function PublicInvoicePage() {
  const params = useParams<{ token: string }>();
  const token = params?.token ?? "";
  const [view, setView] = useState<PublicDocPayload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token || !isSupabaseConfigured()) {
      setLoading(false);
      return;
    }
    const supabase = createClient();
    supabase
      .rpc("get_public_document", { p_token: token })
      .then(({ data }) => {
        if (data && data.number) {
          const total = Number(data.total ?? 0);
          const balance = Number(data.balance ?? 0);
          setView({
            number: data.number,
            docType: data.type || "invoice",
            issueDate: data.issue_date || new Date().toISOString().slice(0, 10),
            dueDate: data.due_date || new Date().toISOString().slice(0, 10),
            clientName: data.client_name || "Client",
            total,
            paidTotal: Math.max(total - balance, 0),
            balance,
            org: {
              name: data.org?.name || "Entreprise",
              city: data.org?.city || "",
              phone: data.org?.phone || "",
              niu: data.org?.niu || "",
              rccm: data.org?.rccm || "",
              mtnMomoNumber: data.org?.mtn_momo_number || "",
              orangeMoneyNumber: data.org?.orange_money_number || "",
            },
            lines: Array.isArray(data.lines)
              ? data.lines.map(
                  (l: {
                    label?: string;
                    quantity?: number;
                    unit_price?: number;
                    total?: number;
                  }) => ({
                    label: String(l.label ?? "Article"),
                    quantity: Number(l.quantity ?? 1),
                    unitPrice: Number(l.unit_price ?? 0),
                    total: Number(l.total ?? 0),
                  })
                )
              : [],
          });
        }
        setLoading(false);
      });
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6 text-xs text-slate-500">
        Chargement du document...
      </div>
    );
  }

  if (!view) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center max-w-md space-y-4">
          <h1 className="text-lg font-extrabold text-[#0B1F3A]">
            Document introuvable
          </h1>
          <p className="text-xs text-slate-500">
            Ce lien de facture n&apos;existe pas ou le document est encore à l&apos;état de brouillon.
          </p>
          <Link
            href="/app/documents"
            className="inline-block px-4 py-2 rounded-xl bg-[#0B1F3A] text-white text-xs font-bold"
          >
            ← Retour aux factures
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 py-8 px-4">
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm no-print">
          <Link
            href="/app/documents"
            className="text-xs font-bold text-slate-600 hover:text-slate-900"
          >
            ← Retour aux factures
          </Link>
          <button
            type="button"
            onClick={() => window.print()}
            className="px-4 py-2 rounded-xl bg-[#0B1F3A] hover:bg-[#132D54] text-white text-xs font-extrabold shadow-sm"
          >
            🖨️ Télécharger / Imprimer en PDF (A4)
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-10 shadow-sm space-y-8">
          <div className="flex flex-col sm:flex-row justify-between gap-4 border-b border-slate-200 pb-6">
            <div>
              <div className="text-xl font-extrabold text-[#0B1F3A]">
                {view.org.name}
              </div>
              {view.org.city || view.org.phone ? (
                <div className="text-xs text-slate-600 mt-1">
                  {view.org.city} {view.org.phone ? `· ${view.org.phone}` : ""}
                </div>
              ) : null}
              {view.org.niu || view.org.rccm ? (
                <div className="text-xs text-slate-500">
                  {view.org.niu ? `NIU : ${view.org.niu} ` : ""}
                  {view.org.rccm ? `· RCCM : ${view.org.rccm}` : ""}
                </div>
              ) : null}
            </div>

            <div className="sm:text-right">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-extrabold bg-slate-100 text-[#0B1F3A]">
                {view.docType === "quote" ? "DEVIS" : "FACTURE"}
              </span>
              <div className="text-2xl font-extrabold text-[#0B1F3A] mt-1">
                {view.number}
              </div>
              <div className="text-xs text-slate-500">
                Date : {formatDate(view.issueDate)} · Échéance :{" "}
                {formatDate(view.dueDate)}
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
            <div className="text-slate-500 uppercase font-bold">Facturé à :</div>
            <div className="text-base font-extrabold text-[#0B1F3A]">
              {view.clientName}
            </div>
          </div>

          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b-2 border-slate-200 text-slate-500 uppercase text-[11px]">
                <th className="py-2">Désignation</th>
                <th className="py-2 text-right">Qté</th>
                <th className="py-2 text-right">Prix Unitaire</th>
                <th className="py-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {view.lines.map((l, i) => (
                <tr key={i}>
                  <td className="py-3 font-semibold text-slate-800">{l.label}</td>
                  <td className="py-3 text-right">{l.quantity}</td>
                  <td className="py-3 text-right">{formatCFA(l.unitPrice)}</td>
                  <td className="py-3 text-right font-bold">
                    {formatCFA(l.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex flex-col sm:flex-row justify-between gap-6 pt-4 border-t border-slate-200">
            <div className="space-y-2 text-xs">
              {view.org.mtnMomoNumber || view.org.orangeMoneyNumber ? (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 space-y-1">
                  {view.org.mtnMomoNumber ? (
                    <div>
                      💛 <strong>MTN MoMo :</strong> {view.org.mtnMomoNumber}
                    </div>
                  ) : null}
                  {view.org.orangeMoneyNumber ? (
                    <div>
                      🧡 <strong>Orange Money :</strong>{" "}
                      {view.org.orangeMoneyNumber}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>

            <div className="w-full sm:w-64 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Total TTC :</span>
                <span className="font-bold">{formatCFA(view.total)}</span>
              </div>
              <div className="flex justify-between text-emerald-700">
                <span>Déjà payé :</span>
                <span className="font-bold">{formatCFA(view.paidTotal)}</span>
              </div>
              <div className="flex justify-between text-base font-extrabold text-[#0B1F3A] pt-2 border-t border-slate-200">
                <span>Reste à payer :</span>
                <span>{formatCFA(view.balance)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
