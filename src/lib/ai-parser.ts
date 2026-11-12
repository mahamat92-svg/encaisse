import { computeLineTotals, formatCFA, type ReminderTone } from "./format";

export interface ParsedDictationLine {
  label: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface ParsedDictation {
  docType: "invoice" | "quote";
  clientName: string;
  lines: ParsedDictationLine[];
  subtotal: number;
  vat: number;
  total: number;
  applyVat: boolean;
}

/**
 * Analyseur local gratuit (0 FCFA) de dictée de facture en français ou anglais.
 * Exemple d'entrée :
 *   "Facture pour Moussa : 3 sacs de ciment à 5500, 10 barres de fer à 4200, livraison 2000"
 */
export function parseInvoiceDictation(rawText: string, applyVat = false): ParsedDictation {
  const text = rawText.trim();
  const isQuote = /\b(devis|quote|proforma)\b/i.test(text);

  // Extraction du nom du client après "pour", "client", "élève", "for", "to"
  let clientName = "Client Comptoir";
  const clientMatch = text.match(
    /(?:facture|devis|invoice|quote)?\s*(?:pour|client|élève|eleve|for|to)\s+([A-ZÀ-Ÿa-zà-ÿ0-9\s.'&-]{2,35}?)(?=\s*[:,]|\s+\d|$)/i
  );
  if (clientMatch?.[1]) {
    clientName = clientMatch[1].trim();
  }

  // Découpage en segments par virgule, point-virgule, "+" ou retour à la ligne
  const bodyText = text.replace(/^[^:]+:\s*/, "");
  const segments = bodyText
    .split(/[,;\n+]+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const lines: ParsedDictationLine[] = [];

  for (const seg of segments) {
    // Nettoyage du préfixe "Facture pour X" sur le premier segment
    const cleanSeg = seg
      .replace(/^(?:facture|devis|invoice|quote)\s+(?:pour|for|to)\s+[A-ZÀ-Ÿa-zà-ÿ\s.'&-]+?(?=\d)/i, "")
      .trim();

    // Cas 1 : "3 sacs de ciment à 5 500" ou "3 x 5500 ciment"
    const qtyPriceMatch = cleanSeg.match(
      /^(\d+(?:[.,]\d+)?)\s*(?:x\s*)?([A-ZÀ-Ÿa-zà-ÿ0-9\s'()-]+?)\s*(?:à|a|@|at|de|x)\s*(\d[\d\s]*)/i
    );
    if (qtyPriceMatch) {
      const qty = Math.max(parseFloat(qtyPriceMatch[1].replace(",", ".")), 1);
      const rawLabel = qtyPriceMatch[2].replace(/^(de|d')\s+/i, "").trim() || "Article";
      const unitPrice = parseInt(qtyPriceMatch[3].replace(/\s+/g, ""), 10) || 0;
      if (unitPrice > 0) {
        lines.push({
          label: rawLabel.charAt(0).toUpperCase() + rawLabel.slice(1),
          quantity: qty,
          unitPrice,
          total: Math.round(qty * unitPrice),
        });
        continue;
      }
    }

    // Cas 2 : "livraison 2000" ou "transport 15 000"
    const singleMatch = cleanSeg.match(/^([A-ZÀ-Ÿa-zà-ÿ\s'()-]{2,50}?)\s+(\d[\d\s]*)$/);
    if (singleMatch) {
      const rawLabel = singleMatch[1].replace(/(?:à|a|de|pour)$/i, "").trim();
      const unitPrice = parseInt(singleMatch[2].replace(/\s+/g, ""), 10) || 0;
      if (unitPrice > 0) {
        lines.push({
          label: rawLabel.charAt(0).toUpperCase() + rawLabel.slice(1),
          quantity: 1,
          unitPrice,
          total: unitPrice,
        });
      }
    }
  }

  if (lines.length === 0) {
    lines.push({
      label: "Prestation / Marchandise (à préciser)",
      quantity: 1,
      unitPrice: 10000,
      total: 10000,
    });
  }

  const vatRateBp = applyVat ? 1925 : 0;
  let subtotal = 0;
  let vat = 0;
  for (const l of lines) {
    const res = computeLineTotals(l.quantity, l.unitPrice, 0, vatRateBp);
    subtotal += res.subtotal;
    vat += res.vat;
  }

  return {
    docType: isQuote ? "quote" : "invoice",
    clientName,
    lines,
    subtotal,
    vat,
    total: subtotal + vat,
    applyVat,
  };
}

/**
 * Génère un message de relance WhatsApp professionnel en FR ou EN,
 * adapté au ton choisi et incluant les coordonnées Mobile Money.
 */
export function buildReminderMessage(params: {
  orgName: string;
  recipientName: string;
  documentNumber: string;
  balance: number;
  dueDate: string;
  daysOverdue: number;
  tone: ReminderTone;
  locale: "fr" | "en";
  mtnMomo?: string;
  orangeMoney?: string;
  publicUrl?: string;
}): string {
  const amountStr = formatCFA(params.balance);
  const payBlockFr = [
    params.mtnMomo ? `• MTN MoMo : ${params.mtnMomo}` : "",
    params.orangeMoney ? `• Orange Money : ${params.orangeMoney}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const payBlockEn = [
    params.mtnMomo ? `• MTN MoMo: ${params.mtnMomo}` : "",
    params.orangeMoney ? `• Orange Money: ${params.orangeMoney}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const linkFr = params.publicUrl ? `\n📄 Consulter la facture : ${params.publicUrl}` : "";
  const linkEn = params.publicUrl ? `\n📄 View invoice: ${params.publicUrl}` : "";

  if (params.locale === "en") {
    if (params.tone === "courteous") {
      return `Hello ${params.recipientName},\n\nWe hope you are doing well. This is a friendly reminder from *${params.orgName}* regarding invoice *${params.documentNumber}* with a remaining balance of *${amountStr}* (due date: ${params.dueDate}).\n\nYou can settle easily via Mobile Money:\n${payBlockEn}${linkEn}\n\nPlease send us the transaction reference once completed so we can send your official receipt. Thank you!`;
    }
    if (params.tone === "firm") {
      return `Hello ${params.recipientName},\n\nUnless we are mistaken, invoice *${params.documentNumber}* from *${params.orgName}* shows an overdue balance of *${amountStr}* (${params.daysOverdue} days past due).\n\nWe kindly ask you to regularize this payment today via:\n${payBlockEn}${linkEn}\n\nThank you for confirming with the payment reference.`;
    }
    return `URGENT — Final Reminder (${params.orgName})\n\nHello ${params.recipientName},\n\nDespite our previous reminders, invoice *${params.documentNumber}* for *${amountStr}* remains unpaid (${params.daysOverdue} days overdue).\n\nPlease proceed with immediate settlement before file suspension:\n${payBlockEn}${linkEn}\n\nContact us immediately if you have already paid.`;
  }

  // Français par défaut
  if (params.tone === "courteous") {
    return `Bonjour ${params.recipientName},\n\nNous espérons que vous allez bien. Sauf oubli de notre part, nous vous rappelons la facture *${params.documentNumber}* auprès de *${params.orgName}*, dont le solde restant est de *${amountStr}* (échéance : ${params.dueDate}).\n\nVous pouvez régler facilement par Mobile Money :\n${payBlockFr}${linkFr}\n\nMerci de nous envoyer la référence ou capture après paiement pour recevoir votre reçu officiel. Excellente journée !`;
  }
  if (params.tone === "firm") {
    return `Bonjour ${params.recipientName},\n\nSauf erreur de notre part, la facture *${params.documentNumber}* (*${params.orgName}*) présente un solde en retard de *${amountStr}* (${params.daysOverdue} jours après échéance).\n\nNous vous remercions de bien vouloir régulariser ce montant dès aujourd'hui via :\n${payBlockFr}${linkFr}\n\nDès le règlement effectué, transmettez-nous la référence pour mise à jour immédiate de votre dossier.`;
  }
  return `DERNIER RAPPEL — ${params.orgName}\n\nBonjour ${params.recipientName},\n\nMalgré nos précédentes relances, la facture *${params.documentNumber}* d'un montant restant de *${amountStr}* demeure impayée (${params.daysOverdue} jours de retard).\n\nNous vous prions de procéder au règlement immédiat avant suspension des prestations :\n${payBlockFr}${linkEn ? linkFr : ""}\n\nSi votre paiement vient d'être effectué, merci de nous communiquer la référence Mobile Money.`;
}

