"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { PublicFooter, PublicNavbar } from "@/components/PublicHeaderFooter";
import { CompanyAvatar } from "@/components/CompanyAvatar";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import {
  AFRICA_CITIES,
  AFRICA_SERVICE_CATEGORIES,
  DEFAULT_MERCHANT_CITY,
  formatCFA,
  OFFICIAL_WHATSAPP_DIGITS,
} from "@/lib/format";

interface PublicProductItem {
  id: string;
  name: string;
  price: number;
  description: string;
  category: string;
  city: string;
  shopName: string;
  shopLogoUrl: string;
  whatsappPhone: string;
  imageUrl: string;
  subCategory: string;
  agriType: string;
  unit: string;
  stockQty: number;
  soldQty: number;
  marketName: string;
  harvestDate: string;
  createdAt: string;
}

function formatWaDigits(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  return digits.length >= 8 ? digits : OFFICIAL_WHATSAPP_DIGITS;
}

export default function DiscoverAfricaServicesPage() {
  const [items, setItems] = useState<PublicProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCity, setSelectedCity] = useState<string>("Toutes");
  const [selectedCategory, setSelectedCategory] = useState<string>("Toutes");
  const [searchQuery, setSearchQuery] = useState("");
  const [bulkItemId, setBulkItemId] = useState<string | null>(null);
  const [bulkQty, setBulkQty] = useState<number>(5);

  useEffect(() => {
    async function fetchPublicProducts() {
      if (!isSupabaseConfigured()) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const supabase = createClient();
        let { data, error } = await supabase
          .from("social_products")
          .select(
            "id, name, price, description, category, city, shop_name, shop_logo_url, whatsapp_phone, image_url, sub_category, agri_type, unit, stock_qty, sold_qty, market_name, harvest_date, created_at"
          )
          .order("created_at", { ascending: false })
          .limit(120);

        if (error) {
          const fb = await supabase
            .from("social_products")
            .select(
              "id, name, price, description, category, city, shop_name, shop_logo_url, whatsapp_phone, image_url, created_at"
            )
            .order("created_at", { ascending: false })
            .limit(120);
          data = fb.data as typeof data;
          error = fb.error;
        }

        if (!error && Array.isArray(data)) {
          setItems(
            data.map((row) => ({
              id: String(row.id),
              name: String(row.name ?? ""),
              price: Number(row.price ?? 0),
              description: String(row.description ?? ""),
              category: String(row.category ?? "Boutique & Commerce"),
              city: String(row.city || DEFAULT_MERCHANT_CITY),
              shopName: String(row.shop_name || "Commerçant"),
              shopLogoUrl: String(row.shop_logo_url || ""),
              whatsappPhone: String(
                row.whatsapp_phone || OFFICIAL_WHATSAPP_DIGITS
              ),
              imageUrl: String(row.image_url ?? ""),
              subCategory: String(row.sub_category ?? ""),
              agriType: String(row.agri_type ?? ""),
              unit: String(row.unit ?? ""),
              stockQty: Number(row.stock_qty ?? 0),
              soldQty: Number(row.sold_qty ?? 0),
              marketName: String(row.market_name ?? ""),
              harvestDate: String(row.harvest_date ?? ""),
              createdAt: String(row.created_at ?? ""),
            }))
          );
        }
      } finally {
        setLoading(false);
      }
    }

    fetchPublicProducts();
  }, []);

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return items.filter((item) => {
      const cityMatch =
        selectedCity === "Toutes" ||
        item.city.toLowerCase() === selectedCity.toLowerCase();
      const catMatch =
        selectedCategory === "Toutes" ||
        item.category.toLowerCase() === selectedCategory.toLowerCase();
      const queryMatch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.shopName.toLowerCase().includes(q) ||
        item.city.toLowerCase().includes(q);
      return cityMatch && catMatch && queryMatch;
    });
  }, [items, selectedCity, selectedCategory, searchQuery]);

  return (
    <div className="min-h-screen flex flex-col bg-white text-[#0B1F3A]">
      <PublicNavbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-8">
        {/* HERO PUBLIC /decouvrir : chaque élément sur sa propre ligne sur mobile */}
        <div className="rounded-3xl bg-slate-50 border border-slate-200 p-5 sm:p-8 flex flex-col gap-5">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-extrabold">
              🌍 Place de Marché Afrique — Cameroun &amp; Tchad
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-[#0B1F3A] leading-tight">
              Découvrez les Produits &amp; Services près de chez vous
            </h1>
            <p className="text-sm sm:text-base text-slate-600">
              N&apos;Djamena, Ngaoundéré, Garoua, Douala, Yaoundé... Trouvez un
              commerçant, restaurant, transport ou artisan et contactez-le
              directement sur WhatsApp.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <Link
              href="/produits"
              className="w-full sm:w-auto px-5 py-3.5 rounded-2xl bg-[#0B1F3A] hover:bg-[#132D54] text-white text-sm font-black text-center shadow-sm"
            >
              📣 Publier mon produit
            </Link>
            <Link
              href="/signup"
              className="w-full sm:w-auto px-5 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-black text-center shadow-sm"
            >
              ➕ Créer un compte commerçant
            </Link>
          </div>
        </div>

        {/* FILTRES : VILLE + CATÉGORIE + RECHERCHE */}
        <div className="bg-white rounded-3xl border-2 border-slate-200 p-4 sm:p-6 space-y-4 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-extrabold uppercase text-slate-500 mb-1.5">
                📍 Filtrer par Ville
              </label>
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="w-full px-4 py-3.5 rounded-2xl border border-slate-300 bg-white text-sm font-extrabold text-[#0B1F3A]"
              >
                <option value="Toutes">Toutes les villes</option>
                {AFRICA_CITIES.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-extrabold uppercase text-slate-500 mb-1.5">
                🏷️ Filtrer par Catégorie
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-3.5 rounded-2xl border border-slate-300 bg-white text-sm font-extrabold text-[#0B1F3A]"
              >
                <option value="Toutes">Toutes les catégories</option>
                {AFRICA_SERVICE_CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.emoji} {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-extrabold uppercase text-slate-500 mb-1.5">
                🔍 Rechercher
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Ex: Restaurant, Taxi, Coiffure, Robe..."
                className="w-full px-4 py-3.5 rounded-2xl border border-slate-300 bg-white text-sm"
              />
            </div>
          </div>

          {/* Raccourcis villes populaires : grille propre 2 par ligne sur mobile */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-1">
            {["Toutes", "N'Djamena", "Ngaoundéré", "Garoua", "Douala", "Yaoundé"].map(
              (cityBtn) => (
                <button
                  key={cityBtn}
                  type="button"
                  onClick={() => setSelectedCity(cityBtn)}
                  className={`w-full px-3 py-2.5 rounded-xl text-xs font-extrabold border text-center truncate transition-all ${
                    selectedCity === cityBtn
                      ? "bg-[#0B1F3A] text-white border-[#0B1F3A]"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {cityBtn === "Toutes" ? "🌍 Toutes" : `📍 ${cityBtn}`}
                </button>
              )
            )}
          </div>
        </div>

        {/* CARTE VEDETTE AGRICULTURE & ÉLEVAGE */}
        <button
          type="button"
          onClick={() =>
            setSelectedCategory(
              selectedCategory === "Agriculture & Élevage"
                ? "Toutes"
                : "Agriculture & Élevage"
            )
          }
          className={`w-full text-left rounded-3xl border-2 overflow-hidden shadow-sm transition-all flex flex-col sm:flex-row items-stretch ${
            selectedCategory === "Agriculture & Élevage"
              ? "border-emerald-600 bg-emerald-50"
              : "border-slate-200 bg-white hover:border-emerald-400"
          }`}
        >
          <div className="sm:w-56 h-36 sm:h-auto shrink-0 bg-emerald-950 overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/agriculture-hero.jpg"
              alt="Agriculture et Élevage"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="p-5 flex-1 flex flex-col justify-center space-y-1.5">
            <div className="text-xs font-black uppercase tracking-wider text-emerald-700">
              🌾 Nouveau Service Spécial
            </div>
            <h2 className="text-lg sm:text-xl font-black text-[#0B1F3A]">
              Agriculture &amp; Élevage — Récoltes &amp; Ventes en gros
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Mil, Maïs, Riz, Oignon, Bœuf, Mouton, Lait, Engrais, Tracteurs —
              Cliquez ici pour filtrer les récoltes disponibles.
            </p>
          </div>
        </button>

        {/* GRILLE DES PRODUITS / SERVICES */}
        {loading ? (
          <div className="py-16 text-center text-sm text-slate-500">
            Chargement des produits et services...
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-10 rounded-3xl bg-slate-50 border border-slate-200 text-center space-y-3">
            <div className="text-4xl">🛍️</div>
            <h2 className="text-lg font-black text-[#0B1F3A]">
              Aucun produit ou service trouvé pour ce filtre
            </h2>
            <p className="text-sm text-slate-600 max-w-md mx-auto">
              Essayez une autre ville ou publiez votre premier produit en 1 clic
              sur InnovTech MHA Infinity !
            </p>
            <div className="pt-2 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setSelectedCity("Toutes");
                  setSelectedCategory("Toutes");
                  setSearchQuery("");
                }}
                className="px-5 py-3 rounded-2xl bg-slate-900 text-white text-sm font-black"
              >
                Voir tout
              </button>
              <Link
                href="/signup"
                className="px-5 py-3 rounded-2xl bg-emerald-600 text-white text-sm font-black"
              >
                ➕ Publier mon service
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => {
              const waDigits = formatWaDigits(item.whatsappPhone);
              const contactText = `Bonjour ${item.shopName}, je suis intéressé(e) par "${item.name}" (${formatCFA(item.price)}) vu sur Encaisse - InnovTech MHA Infinity à ${item.city}.`;
              const waHref = `https://wa.me/${waDigits}?text=${encodeURIComponent(
                contactText
              )}`;

              return (
                <div
                  key={item.id}
                  id={`produit-${item.id}`}
                  className="bg-white rounded-3xl border-2 border-slate-200 overflow-hidden shadow-sm flex flex-col justify-between"
                >
                  <div>
                    <div className="relative h-56 w-full bg-slate-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute top-3 left-3 px-3 py-1 rounded-full bg-white/95 text-[#0B1F3A] text-xs font-black shadow-sm">
                        {item.category}
                      </span>
                      <span className="absolute top-3 right-3 px-3 py-1 rounded-full bg-[#0B1F3A]/90 text-white text-xs font-black shadow-sm">
                        📍 {item.city}
                      </span>
                    </div>

                    <div className="p-5 space-y-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                        <CompanyAvatar
                          logoUrl={item.shopLogoUrl}
                          name={item.shopName}
                          size={26}
                        />
                        <span className="truncate">{item.shopName}</span>
                      </div>
                      <h3 className="text-lg font-black text-[#0B1F3A] leading-snug">
                        {item.name}
                      </h3>
                      <div className="text-2xl font-black text-emerald-700">
                        {formatCFA(item.price)}
                      </div>
                      {item.description ? (
                        <p className="text-sm text-slate-600 leading-relaxed line-clamp-3">
                          {item.description}
                        </p>
                      ) : null}

                      {item.category === "Agriculture & Élevage" ? (
                        <div className="mt-2 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-1.5 text-xs">
                          <div className="font-black text-emerald-950 leading-snug">
                            🌾 {item.agriType || item.name} -{" "}
                            {Math.max(0, item.stockQty - item.soldQty)}{" "}
                            {item.unit || "unités"} disponibles -{" "}
                            {formatCFA(item.price)} / {item.unit || "unité"}
                          </div>
                          <div className="font-bold text-emerald-800">
                            {item.marketName || `Marché de ${item.city}`}
                            {item.harvestDate
                              ? ` - Récolté le ${new Date(
                                  item.harvestDate
                                ).toLocaleDateString("fr-FR")}`
                              : ""}
                          </div>
                          <div className="text-[11px] font-semibold text-slate-600">
                            WhatsApp du vendeur : {item.whatsappPhone}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div className="p-5 pt-0 space-y-2.5">
                    {item.category === "Agriculture & Élevage" ? (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setBulkItemId(
                              bulkItemId === item.id ? null : item.id
                            );
                            setBulkQty(5);
                          }}
                          className="w-full py-3 px-4 rounded-2xl bg-[#0B1F3A] hover:bg-[#132D54] text-white text-sm font-black shadow-sm transition-colors"
                        >
                          🛒 Commander en gros
                        </button>
                        {bulkItemId === item.id ? (
                          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-300 space-y-2.5">
                            <label className="block text-xs font-extrabold text-[#0B1F3A]">
                              Je veux combien de {item.unit || "unités"} ?
                            </label>
                            <input
                              type="number"
                              min="1"
                              value={bulkQty}
                              onChange={(e) =>
                                setBulkQty(
                                  Math.max(1, Number(e.target.value) || 1)
                                )
                              }
                              className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-sm font-bold"
                            />
                            <div className="text-sm font-black text-emerald-700">
                              Total : {formatCFA(bulkQty * item.price)}
                            </div>
                            <a
                              href={`https://wa.me/${waDigits}?text=${encodeURIComponent(
                                `Bonjour ${item.shopName}, je veux commander en gros : ${bulkQty} ${item.unit || "unités"} de ${item.agriType || item.name} à ${formatCFA(item.price)} = ${formatCFA(bulkQty * item.price)} (${item.marketName || item.city}).`
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black text-center"
                            >
                              ✅ Envoyer commande ({formatCFA(bulkQty * item.price)})
                            </a>
                          </div>
                        ) : null}
                      </>
                    ) : null}

                    <a
                      href={waHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-4 px-5 rounded-2xl bg-[#25D366] hover:bg-[#1fb857] text-white text-base font-black shadow-md transition-colors flex items-center justify-center gap-2"
                    >
                      <span>💬</span>
                      <span>Contacter sur WhatsApp</span>
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <PublicFooter />
    </div>
  );
}

