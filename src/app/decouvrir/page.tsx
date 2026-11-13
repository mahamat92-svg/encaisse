"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { PublicFooter, PublicNavbar } from "@/components/PublicHeaderFooter";
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
  whatsappPhone: string;
  imageUrl: string;
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

  useEffect(() => {
    async function fetchPublicProducts() {
      if (!isSupabaseConfigured()) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("social_products")
          .select(
            "id, name, price, description, category, city, shop_name, whatsapp_phone, image_url, created_at"
          )
          .order("created_at", { ascending: false })
          .limit(120);

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
              whatsappPhone: String(
                row.whatsapp_phone || OFFICIAL_WHATSAPP_DIGITS
              ),
              imageUrl: String(row.image_url ?? ""),
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
        {/* HERO PUBLIC /decouvrir */}
        <div className="rounded-3xl bg-slate-50 border border-slate-200 p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
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

          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            <Link
              href="/produits"
              className="px-5 py-3.5 rounded-2xl bg-[#0B1F3A] hover:bg-[#132D54] text-white text-sm font-black text-center shadow-sm"
            >
              📣 Publier mon produit
            </Link>
            <Link
              href="/signup"
              className="px-5 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-black text-center shadow-sm"
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

          {/* Raccourcis villes populaires */}
          <div className="flex flex-wrap gap-2 pt-1">
            {["Toutes", "N'Djamena", "Ngaoundéré", "Garoua", "Douala", "Yaoundé"].map(
              (cityBtn) => (
                <button
                  key={cityBtn}
                  type="button"
                  onClick={() => setSelectedCity(cityBtn)}
                  className={`px-3.5 py-2 rounded-full text-xs font-extrabold border transition-all ${
                    selectedCity === cityBtn
                      ? "bg-[#0B1F3A] text-white border-[#0B1F3A]"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {cityBtn === "Toutes" ? "🌍 Toutes les villes" : `📍 ${cityBtn}`}
                </button>
              )
            )}
          </div>
        </div>

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
                      <div className="text-xs font-bold text-slate-500">
                        🏪 {item.shopName}
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
                    </div>
                  </div>

                  <div className="p-5 pt-0">
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

