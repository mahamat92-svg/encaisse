import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

const BLOCKED_MSG =
  "Paye ton abonnement pour parler à l'IA Guide, elle va te montrer tout le SaaS.";

const SYSTEM_PROMPT = `Tu es l'IA Guide amicale de "InnovTech MHA Infinity" (Encaisse), un SaaS pour les commerçants et professionnels en Afrique (Cameroun, Tchad, etc.).
RÈGLES STRICTES DE RÉPONSE :
- Parle en français très simple, comme un ami qui aide. Zéro mot compliqué.
- 3 à 4 phrases maximum au total, courtes et claires.
- Comprends le client même s'il écrit avec des fautes d'orthographe ou en français parlé.
- Donne TOUJOURS ces 3 parties exactes :
1. Où cliquer : (le chemin exact et les noms exacts des boutons)
2. Quoi faire : (action simple étape par étape)
3. Exemple : (un exemple concret d'Afrique / FCFA)

CONNAISSANCE DES 7 SERVICES :
1. Encaisse Boutique : Vendre produits, gérer le stock, facture Excel, paiement Mobile Money.
   - Si le client veut vendre : "Clique sur Encaisse Boutique (menu Services ou Catalogue), puis + Ajouter produit, puis Documents > Créer facture."
2. École : Gérer élèves, frais scolaires, notes.
   - Pour inscrire un élève : Menu Services > Choisir École > bouton + Ajouter un élève > remplis nom, classe et frais scolaires en FCFA.
3. Clinique : Gérer patients, consultations, ordonnances.
   - Pour ajouter un patient : Menu Services > Choisir Clinique > bouton + Ajouter un patient > note le nom, téléphone et consultation.
4. Immobilier : Gérer maisons, locations, loyers.
   - Pour ajouter une maison : Menu Services > Choisir Immobilier > bouton + Ajouter une maison > indique le quartier, le loyer mensuel en FCFA et le locataire.
5. Artisan : Gérer commandes, clients, travaux.
   - Pour créer une commande : Menu Services > Choisir Artisan > bouton + Nouvelle commande > écris le travail demandé, le prix et la date.
6. ONG : Gérer membres, projets, dons.
   - Pour ajouter un membre : Menu Services > Choisir ONG > bouton + Ajouter un membre > remplis nom, rôle et cotisation/don.
7. Agriculture & Élevage : Gérer champs, vaches, chèvres, poulets, récolte, météo et 6 outils IA agricoles.
   - Pour ajouter un champ ou un animal : Menu Produits & Stock (ou Services > Agriculture & Élevage) > choisis Agriculture & Élevage > clique + Ajouter un champ ou + Ajouter un animal.

CONNAISSANCE DES FONCTIONS CLÉS :
- Facture Excel : Menu Documents > clique sur "📊 Tableau Excel Intégré". Quantité x Prix Unitaire se calcule tout seul. Utilise "+ Ajouter une ligne", puis "Exporter Excel (.xlsx)" ou "Imprimer / PDF".
- Mon solde : C'est ton argent total = Solde Mobile Money (Orange Money, MTN MoMo, Wave) + Solde Carte Bancaire (Visa / Mastercard). Visible sur le Dashboard (Tableau de bord) et dans la page Clients (bouton "Voir solde").
- Lien Facebook : Dans Clients, chaque client a un champ "Lien Facebook" et une icône Facebook bleue cliquable dans sa fiche et sur ses factures.
- Prix de l'abonnement : Gratuit (essai 7 jours), Pro 5 000 FCFA / mois, Business 15 000 FCFA / mois. Seule l'offre Payée donne accès à l'IA Guide.
- Comment payer : Orange Money (640 633 034), MTN MoMo (651 465 708) au nom de MAHAMAT BOUBA, Wave, Carte Bancaire ou Espèces. Aide WhatsApp : +235 66 26 85 03.
- Si le client est perdu ("je ne comprends pas", "où je clique ?", "comment on fait ?") : donne directement le chemin exact depuis le menu principal avec les noms exacts des boutons.`;

function normalizeText(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function detectService(question: string): string {
  const q = normalizeText(question);
  if (/(excel|factur|devis|pdf|ligne|quantit|tva|remis)/.test(q)) {
    return "Facture Excel";
  }
  if (/(sold|argent|monney|money|carte|bancair|momo|wave|brousse|revenu)/.test(q)) {
    return "Soldes";
  }
  if (/(facebook|fb|lien|fiche)/.test(q)) {
    return "Lien Facebook";
  }
  if (/(abonn|prix|cout|combien|tarif|payer|paiement|offre|gratuit|pro|business|orange|mtn)/.test(q)) {
    return "Abonnement & Paiement";
  }
  if (/(vendr|boutiqu|produit|stock|chaussur|habit|march|commerce|magasin)/.test(q)) {
    return "Encaisse Boutique";
  }
  if (/(ecol|elev|etudian|frais|scolair|note|class|prof|inscrir)/.test(q)) {
    return "École";
  }
  if (/(cliniqu|patient|malad|docteur|medecin|consult|ordonn|sante|pharmaci)/.test(q)) {
    return "Clinique";
  }
  if (/(immobili|maison|loyer|locat|appart|chambre|terrain|baill)/.test(q)) {
    return "Immobilier";
  }
  if (/(artisan|command|travau|atelier|tailleur|coutur|menuis|mecani|coiff)/.test(q)) {
    return "Artisan";
  }
  if (/(ong|membr|projet|don|associat|benevol)/.test(q)) {
    return "ONG";
  }
  if (/(agricult|elevag|champ|vach|chevr|poul|mouton|recolt|meteo|mais|mil|pluie)/.test(q)) {
    return "Agriculture & Élevage";
  }
  return "Général";
}

function buildLocalGuideReply(question: string): {
  reponse: string;
  service: string;
} {
  const service = detectService(question);

  switch (service) {
    case "Encaisse Boutique":
      return {
        service,
        reponse:
          "1. Où cliquer : Clique sur Encaisse Boutique (menu Catalogue), puis + Ajouter produit, puis Documents > Créer facture.\n2. Quoi faire : Ajoute le nom et le prix de ton produit, puis crée la facture pour encaisser par Mobile Money.\n3. Exemple : Tu ajoutes « Sac de riz 25kg » à 15 000 FCFA, puis tu envoies la facture au client.",
      };
    case "École":
      return {
        service,
        reponse:
          "1. Où cliquer : Ouvre le menu Services, clique sur École, puis sur + Ajouter un élève.\n2. Quoi faire : Écris le nom de l'élève, sa classe et les frais scolaires à payer, puis clique Enregistrer.\n3. Exemple : Élève « Moussa Ali », classe 6ème, frais 35 000 FCFA : tu suis ses paiements et ses notes ici.",
      };
    case "Clinique":
      return {
        service,
        reponse:
          "1. Où cliquer : Va dans Services, choisis Clinique, puis clique sur + Ajouter un patient.\n2. Quoi faire : Note le nom du patient, son téléphone, sa consultation et son ordonnance.\n3. Exemple : Patiente « Amina » pour consultation 5 000 FCFA : son dossier reste gardé pour sa prochaine visite.",
      };
    case "Immobilier":
      return {
        service,
        reponse:
          "1. Où cliquer : Ouvre Services, clique sur Immobilier, puis sur + Ajouter une maison.\n2. Quoi faire : Mets le nom de la maison, le quartier, le loyer par mois et le nom du locataire.\n3. Exemple : « Villa Bastos » à 120 000 FCFA/mois : tu vois vite qui a payé son loyer.",
      };
    case "Artisan":
      return {
        service,
        reponse:
          "1. Où cliquer : Clique sur Services, choisis Artisan, puis sur + Nouvelle commande.\n2. Quoi faire : Écris le nom du client, le travail à faire, le prix et la date de livraison.\n3. Exemple : Commande « 2 boubous brodés » à 25 000 FCFA pour samedi, avec avance de 10 000 FCFA.",
      };
    case "ONG":
      return {
        service,
        reponse:
          "1. Où cliquer : Ouvre Services, clique sur ONG, puis sur + Ajouter un membre (ou + Nouveau projet / don).\n2. Quoi faire : Remplis le nom du membre, son rôle et suis les dons reçus pour chaque projet.\n3. Exemple : Membre « Paul » et don de 50 000 FCFA pour le projet « Forage d'eau ».",
      };
    case "Agriculture & Élevage":
      return {
        service,
        reponse:
          "1. Où cliquer : Clique sur Produits & Stock (ou Services > Agriculture & Élevage), puis + Ajouter un champ ou + Ajouter un animal.\n2. Quoi faire : Enregistre tes champs (maïs, mil) ou tes bêtes (vaches, chèvres, poulets) et regarde la météo agricole.\n3. Exemple : Champ « Maïs 2 ha » à Ngaoundéré : tu notes ta récolte et l'IA te dit quand arroser.",
      };
    case "Facture Excel":
      return {
        service,
        reponse:
          "1. Où cliquer : Ouvre le menu Documents, puis clique sur le bouton « 📊 Tableau Excel Intégré ».\n2. Quoi faire : Tape le produit, la quantité et le prix (Quantité x Prix = Total se calcule tout seul), utilise + Ajouter une ligne, puis Exporter Excel (.xlsx) ou Imprimer / PDF.\n3. Exemple : 3 pagnes x 5 000 FCFA = 15 000 FCFA calculé tout seul en 2 secondes.",
      };
    case "Soldes":
      return {
        service,
        reponse:
          "1. Où cliquer : Regarde sur ton Tableau de bord (Dashboard) en haut, ou ouvre la page Clients et clique « Voir solde ».\n2. Quoi faire : Tu vois ton Solde Mobile Money (Orange Money, MTN MoMo, Wave) + ton Solde Carte Bancaire (Visa / Mastercard).\n3. Exemple : Un client paie 20 000 FCFA par Orange Money : son solde et ton Dashboard montent tout seuls.",
      };
    case "Lien Facebook":
      return {
        service,
        reponse:
          "1. Où cliquer : Va dans le menu Clients, puis clique sur + Ajouter un client (ou regarde la liste des clients).\n2. Quoi faire : Colle le lien Facebook du client dans le champ « Lien Facebook » ; une icône bleue cliquable apparaît sur sa fiche et ses factures.\n3. Exemple : Tu mets https://facebook.com/moussa.boutique et tu ouvres sa page en 1 clic.",
      };
    case "Abonnement & Paiement":
      return {
        service,
        reponse:
          "1. Où cliquer : Va dans le menu Abonnement (ou Tarifs) pour voir les offres : Gratuit (7 jours), Pro 5 000 FCFA/mois et Business 15 000 FCFA/mois.\n2. Quoi faire : Paie par Orange Money (640 633 034), MTN MoMo (651 465 708) au nom de MAHAMAT BOUBA, Wave, Carte Bancaire ou Espèces. Seule l'offre Payée donne accès à l'IA.\n3. Exemple : Envoie 5 000 FCFA sur Orange Money 640 633 034 puis écris au +235 66 26 85 03 sur WhatsApp.",
      };
    default:
      return {
        service: "Général",
        reponse:
          "1. Où cliquer : Regarde le menu à gauche (ou en bas sur téléphone) : Tableau de bord, Clients, Produits, Documents, Services et Abonnement.\n2. Quoi faire : Choisis d'abord ton métier dans Services, ajoute un client dans Clients, puis fais ta première facture dans Documents.\n3. Exemple : Clique sur Documents > « 📊 Tableau Excel Intégré » pour créer ta première facture en 10 secondes.",
      };
  }
}

async function checkPaidAccess(supabase: Awaited<ReturnType<typeof createServerSupabase>>, userId: string) {
  const [subRes, adminRpcRes, profileRes] = await Promise.all([
    supabase
      .from("subscriptions")
      .select("status")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase.rpc("is_platform_admin"),
    supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .maybeSingle(),
  ]);

  const isAdmin =
    Boolean(adminRpcRes?.data) || profileRes?.data?.role === "admin";
  const isPaid = subRes?.data?.status === "active";

  return { isPaid: isPaid || isAdmin, isAdmin };
}

export async function GET() {
  try {
    const supabase = await createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({
        authenticated: false,
        isPaid: false,
        messages: [],
      });
    }

    const { isPaid } = await checkPaidAccess(supabase, user.id);
    if (!isPaid) {
      return NextResponse.json({
        authenticated: true,
        isPaid: false,
        message: BLOCKED_MSG,
        messages: [],
      });
    }

    const { data, error } = await supabase
      .from("ia_guide_conversations")
      .select("id, question, reponse, service_concerne, date")
      .eq("user_id", user.id)
      .order("date", { ascending: true })
      .limit(30);

    return NextResponse.json({
      authenticated: true,
      isPaid: true,
      messages: error ? [] : data || [],
    });
  } catch {
    return NextResponse.json({
      authenticated: false,
      isPaid: false,
      messages: [],
    });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { question?: string };
    const question = (body.question || "").trim();

    if (!question) {
      return NextResponse.json(
        { error: "Écris ta question d'abord." },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: BLOCKED_MSG, requiresPayment: true },
        { status: 403 }
      );
    }

    const { isPaid } = await checkPaidAccess(supabase, user.id);
    if (!isPaid) {
      return NextResponse.json(
        { error: BLOCKED_MSG, requiresPayment: true },
        { status: 403 }
      );
    }

    const detectedService = detectService(question);
    let reponse = "";

    const geminiKey = process.env.GEMINI_API_KEY;
    const model = process.env.GEMINI_MODEL || "gemini-2.5-flash-lite";

    if (geminiKey && geminiKey.length > 10) {
      try {
        const resp = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      text: `${SYSTEM_PROMPT}\n\nQuestion du client : "${question}"`,
                    },
                  ],
                },
              ],
              generationConfig: {
                temperature: 0.3,
                maxOutputTokens: 260,
              },
            }),
          }
        );

        if (resp.ok) {
          const data = await resp.json();
          const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (typeof text === "string" && text.trim().length > 10) {
            reponse = text.trim();
          }
        }
      } catch {
        // Fallback local ci-dessous
      }
    }

    if (!reponse) {
      reponse = buildLocalGuideReply(question).reponse;
    }

    // Sauvegarde dans ia_guide_conversations (ne bloque pas la réponse si la migration n'est pas encore exécutée)
    let saved = false;
    try {
      const { error: insertErr } = await supabase
        .from("ia_guide_conversations")
        .insert({
          user_id: user.id,
          question,
          reponse,
          service_concerne: detectedService,
        });
      if (!insertErr) {
        saved = true;
      }
    } catch {
      saved = false;
    }

    return NextResponse.json({
      reponse,
      service_concerne: detectedService,
      saved,
    });
  } catch {
    return NextResponse.json(
      { error: "Erreur serveur. Réessaie dans un instant." },
      { status: 500 }
    );
  }
}
