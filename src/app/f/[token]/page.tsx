"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { DEMO_ORGS } from "@/lib/demo-data";
import { formatCFA, formatDate } from "@/lib/format";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

interface PublicDocPayload {
  number: string;
  docType: "invoice" | "quote" | "credit_note";
  issueDate: string;
  dueDate: string;
  clientName: string;
  whatsappPhone: string;
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
  const [livePayload, setLivePayload] = useState<PublicDocPayload | null>(null);

  const allDocs = [
    ...DEMO_ORGS.commerce.documents.map((d) => ({
      doc: d,
      org: DEMO_ORGS.commerce,
    })),
    ...DEMO_ORGS.etablissement.documents.map((d) => ({
      doc: d,
      org: DEMO_ORGS.etablissement,
    })),
  ];

  const demoMatch = allDocs.find((x) => x.doc.publicToken === token);

  useEffect(() => {
    if (demoMatch || !token || !isSupabaseConfigured()) return;
    const supabase = createClient();
    supabase
      .rpc("get_public_document", { p_token: token })
      .then(({ data }) => {
        if (data && data.number) {
          const total = Number(data.total ?? 0);
          const balance = Number(data.balance ?? 0);
          setLivePayload({
            number: data.number,
            docType: data.type || "invoice",
            issueDate: data.issue_date || new Date().toISOString().slice(0, 10),
            dueDate: data.due_date || new Date().toISOString().slice(0, 10),
            clientName: data.client_name || "Client",
            whatsappPhone: "",
            total,
            paidTotal: Math.max(total - balance, 0),
            balance,
            org: {
              name: data.org?.name || "Entreprise",
              city: data.org?.city || "Cameroun",
              phone: data.org?.phone || "",
              niu: data.org?.niu || "Non renseigné",
              rccm: data.org?.rccm || "Non renseigné",
              mtnMomoNumber: data.org?.mtn_momo_number || "Non renseigné",
              orangeMoneyNumber: data.org?.orange_money_number || "Non renseigné",
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
      });
  }, [demoMatch, token]);

  const fallback = demoMatch ?? allDocs[0];
  const view: PublicDocPayload = livePayload ?? {
    number: fallback.doc.number,
    docType: fallback.doc.docType,
    issueDate: fallback.doc.issueDate,
    dueDate: fallback.doc.dueDate,
    clientName: fallback.doc.clientName,
    whatsappPhone: fallback.doc.whatsappPhone,
    total: fallback.doc.total,
    paidTotal: fallback.doc.paidTotal,
    balance: fallback.doc.balance,
    org: {
      name: fallback.org.name,
      city: fallback.org.city,
      phone: fallback.org.phone,
      niu: fallback.org.niu,
      rccm: fallback.org.rccm,
      mtnMomoNumber: fallback.org.mtnMomoNumber,
      orangeMoneyNumber: fallback.org.orangeMoneyNumber,
    },
    lines: fallback.doc.lines.map((l) => ({
      label: l.label,
      quantity: l.quantity,
      unitPrice: l.unitPrice,
      total: l.total,
    })),
  };

  return (
    <div className="min-h-screen bg-slate-100 py-8 px-4">
      <div className="max-w-3xl mx-auto space-y-4">
        {/* Barre d'actions (masquée à l'impression PDF) */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm no-print">
          <Link
            href="/app/documents"
            className="text-xs font-bold text-slate-600 hover:text-slate-900"
          >
            ← Retour aux documents
          </Link>
          <button
            type="button"
            onClick={() => window.print()}
            className="px-4 py-2 rounded-xl bg-[#0B1F3A] hover:bg-[#132D54] text-white text-xs font-extrabold shadow-sm"
          >
            🖨️ Télécharger / Imprimer en PDF (A4)
          </button>
        </div>

        {/* Feuille de facture imprimable */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-10 shadow-sm space-y-8">
          <div className="flex flex-col sm:flex-row justify-between gap-4 border-b border-slate-200 pb-6">
            <div>
              <div className="text-xl font-extrabold text-[#0B1F3A]">
                {view.org.name}
              </div>
              <div className="text-xs text-slate-600 mt-1">
                📍 {view.org.city} {view.org.phone ? `· Tél : ${view.org.phone}` : ""}
              </div>
              <div className="text-xs text-slate-500">
                NIU : {view.org.niu} · RCCM : {view.org.rccm}
              </div>
            </div>

            <div className="sm:text-right">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-extrabold bg-slate-100 text-[#0B1F3A]">
                {view.docType === "quote" ? "DEVIS" : "FACTURE"}
              </span>
              <div className="text-2xl font-extrabold text-[#0B1F3A] mt-1">
                {view.number}
              </div>
              <div className="text-xs text-slate-500">
                Date : {formatDate(view.issueDate)} · Échéance : {formatDate(view.dueDate)}
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
            <div className="text-slate-500 uppercase font-bold">Facturé à :</div>
            <div className="text-base font-extrabold text-[#0B1F3A]">
              {view.clientName}
            </div>
            {view.whatsappPhone ? (
              <div className="text-slate-600">WhatsApp : {view.whatsappPhone}</div>
            ) : null}
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
                  <td className="py-3 text-right font-bold">{formatCFA(l.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex flex-col sm:flex-row justify-between gap-6 pt-4 border-t border-slate-200">
            <div className="space-y-2 text-xs">
              <div className="font-extrabold text-[#0B1F3A] uppercase">
                Règlement par Mobile Money :
              </div>
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 space-y-1">
                <div>
                  💛 <strong>MTN MoMo :</strong> {view.org.mtnMomoNumber}
                </div>
                <div>
                  🧡 <strong>Orange Money :</strong> {view.org.orangeMoneyNumber}
                </div>
                <div className="text-[11px] text-slate-600 pt-1">
                  Indiquez la référence <strong>{view.number}</strong> lors du paiement.
                </div>
              </div>
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

          {/* Mention légale R-6 / DOC-10 */}
          <div className="pt-6 border-t border-slate-100 text-[11px] text-slate-400 flex flex-col sm:flex-row justify-between gap-2">
            <span>
              Document commercial généré via InnovTech Encaisse — Document non certifié par la DGI (Règle R-6).
            </span>
            <span>Propulsé par InnovTech AI</span>
          </div>
        </div>
      </div>
    </div>
  );
}
