"use client";

import React, { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useAppState } from "@/components/AppContext";
import { formatCFA } from "@/lib/format";

const AGRI_VILLAGES = [
  "Ngaoundéré",
  "Meiganga",
  "Touboro",
  "Tibati",
  "Banyo",
  "Garoua",
  "Maroua",
  "Kousseri",
  "N'Djamena",
];

const AGRI_CROPS = ["Maïs", "Mil", "Arachide", "Tomate", "Manioc"];

const CROP_YIELD_PER_HA: Record<string, { bagsPerHa: number; pricePerBag: number }> = {
  Maïs: { bagsPerHa: 28, pricePerBag: 18000 },
  Mil: { bagsPerHa: 22, pricePerBag: 16000 },
  Arachide: { bagsPerHa: 18, pricePerBag: 28000 },
  Tomate: { bagsPerHa: 45, pricePerBag: 12000 },
  Manioc: { bagsPerHa: 40, pricePerBag: 14000 },
};

interface AgricultureAiSectionProps {
  isSubscriptionPaid: boolean;
  onAddTreatmentProduct?: (title: string, price: number, description: string) => void;
  onPutHarvestOnSale?: (crop: string, bags: number, pricePerBag: number) => void;
}

export function AgricultureAiSection({
  isSubscriptionPaid,
  onAddTreatmentProduct,
  onPutHarvestOnSale,
}: AgricultureAiSectionProps) {
  const { org } = useAppState();

  // 1 & 5 : Météo + Quand Arroser
  const [village, setVillage] = useState("Ngaoundéré");
  const [weatherCrop, setWeatherCrop] = useState("Maïs");
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherData, setWeatherData] = useState<{
    rain3Days: number;
    tempMax: number;
    shouldWater: boolean;
    waterStatus: string;
    advice: string;
  } | null>(null);

  // 2 : Docteur Plante
  const [leafPreview, setLeafPreview] = useState("");
  const [doctorLoading, setDoctorLoading] = useState(false);
  const [doctorResult, setDoctorResult] = useState<{
    maladie: string;
    gravite: string;
    traitement: string;
  } | null>(null);
  const [treatmentAdded, setTreatmentAdded] = useState(false);

  // 3 : Conseil IA
  const [chatQuestion, setChatQuestion] = useState("");
  const [fulfulde, setFulfulde] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatAnswer, setChatAnswer] = useState<string | null>(null);

  // 4 : Ma Récolte
  const [harvestCrop, setHarvestCrop] = useState("Maïs");
  const [surfaceHa, setSurfaceHa] = useState("2");
  const [seedingDate, setSeedingDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [harvestPrediction, setHarvestPrediction] = useState<{
    bags: number;
    pricePerBag: number;
    revenue: number;
  } | null>(null);
  const [harvestListed, setHarvestListed] = useState(false);

  // 6 : Score Agricole (0 à 100) basé sur ventes Encaisse + récolte prédite
  const salesCount = org.documents.length + org.payments.length;
  const baseScore = Math.min(98, 62 + salesCount * 4 + (harvestPrediction ? 8 : 0));

  if (!isSubscriptionPaid) {
    return (
      <section className="p-5 sm:p-6 rounded-3xl bg-amber-50 border-2 border-amber-400 space-y-3">
        <div className="text-base sm:text-lg font-black text-[#0B1F3A] flex items-center gap-2">
          <span>🌾</span>
          <span>IA Agriculture (6 outils Pro)</span>
        </div>
        <p className="text-sm font-extrabold text-amber-950">
          Payez votre abonnement pour utiliser l&apos;IA Agriculture.
        </p>
        <Link
          href="/app/abonnement"
          className="inline-flex items-center justify-center px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-black shadow-sm"
        >
          💳 Payer mon abonnement
        </Link>
      </section>
    );
  }

  async function handleCheckWeather() {
    setWeatherLoading(true);
    try {
      const res = await fetch("/api/ai/agriculture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "weather",
          village,
          culture: weatherCrop,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setWeatherData(data);
      }
    } finally {
      setWeatherLoading(false);
    }
  }

  async function handleLeafUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = typeof reader.result === "string" ? reader.result : "";
      setLeafPreview(dataUrl);
      setDoctorLoading(true);
      setTreatmentAdded(false);
      try {
        const res = await fetch("/api/ai/agriculture", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "doctor",
            imageBase64: dataUrl,
            imageMime: file.type || "image/jpeg",
          }),
        });
        if (res.ok) {
          const diag = await res.json();
          setDoctorResult(diag);
          try {
            const supabase = createClient();
            const {
              data: { user },
            } = await supabase.auth.getUser();
            if (user) {
              await supabase.from("agriculture_diagnostics").insert({
                user_id: user.id,
                photo_url: dataUrl.slice(0, 500),
                maladie: diag.maladie,
                gravite: diag.gravite,
                traitement: diag.traitement,
              });
            }
          } catch {
            // Table optionnelle si migration 0010 non encore exécutée
          }
        }
      } finally {
        setDoctorLoading(false);
      }
    };
    reader.readAsDataURL(file);
  }

  async function handleAskAdvisor(e: React.FormEvent) {
    e.preventDefault();
    if (!chatQuestion.trim()) return;
    setChatLoading(true);
    try {
      const res = await fetch("/api/ai/agriculture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "chat",
          question: chatQuestion.trim(),
          fulfulde,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setChatAnswer(data.answer);
        try {
          const supabase = createClient();
          const {
            data: { user },
          } = await supabase.auth.getUser();
          if (user) {
            await supabase.from("agriculture_conseils").insert({
              user_id: user.id,
              question: chatQuestion.trim(),
              reponse: String(data.answer || ""),
            });
          }
        } catch {
          // ignore if migration pending
        }
      }
    } finally {
      setChatLoading(false);
    }
  }

  async function handlePredictHarvest() {
    const ha = Math.max(0.2, Number(surfaceHa) || 1);
    const info = CROP_YIELD_PER_HA[harvestCrop] || CROP_YIELD_PER_HA["Maïs"];
    const bags = Math.round(ha * info.bagsPerHa);
    const revenue = bags * info.pricePerBag;
    setHarvestPrediction({
      bags,
      pricePerBag: info.pricePerBag,
      revenue,
    });
    setHarvestListed(false);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("agriculture_champs").insert({
          user_id: user.id,
          village,
          culture: harvestCrop,
          surface: ha,
          date_semis: seedingDate,
        });
      }
    } catch {
      // ignore if migration pending
    }
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-2xl">🤖</span>
        <h2 className="text-lg sm:text-xl font-black text-[#0B1F3A]">
          Mes 6 Outils IA Agriculture
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* 1. CARTE Météo de mon champ */}
        <div className="p-5 rounded-3xl bg-white border-2 border-emerald-200 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="text-base font-black text-[#0B1F3A] flex items-center gap-2">
              <span className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                🌦️
              </span>
              <span>1. Météo de mon champ</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={village}
                onChange={(e) => setVillage(e.target.value)}
                className="px-3 py-2.5 rounded-xl border border-slate-300 text-xs font-bold bg-white"
              >
                {AGRI_VILLAGES.map((v) => (
                  <option key={v} value={v}>
                    📍 {v}
                  </option>
                ))}
              </select>
              <select
                value={weatherCrop}
                onChange={(e) => setWeatherCrop(e.target.value)}
                className="px-3 py-2.5 rounded-xl border border-slate-300 text-xs font-bold bg-white"
              >
                {AGRI_CROPS.map((c) => (
                  <option key={c} value={c}>
                    🌱 {c}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={handleCheckWeather}
              disabled={weatherLoading}
              className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-black shadow-sm disabled:opacity-50"
            >
              {weatherLoading ? "Chargement..." : "🌦️ Voir la météo"}
            </button>

            {weatherData ? (
              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs space-y-1.5">
                <div className="font-black text-[#0B1F3A]">
                  🌧️ Pluie (3 jours) : {weatherData.rain3Days} mm · 🌡️{" "}
                  {weatherData.tempMax}°C
                </div>
                <div className="font-bold text-emerald-900">
                  {weatherData.advice}
                </div>
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(
                    `Météo champ (${village} - ${weatherCrop}) : ${weatherData.advice}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-1 px-3 py-1.5 rounded-xl bg-[#25D366] text-white font-extrabold"
                >
                  💬 Envoyer sur WhatsApp
                </a>
              </div>
            ) : null}
          </div>
        </div>

        {/* 2. CARTE Docteur Plante */}
        <div className="p-5 rounded-3xl bg-white border-2 border-emerald-200 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="text-base font-black text-[#0B1F3A] flex items-center gap-2">
              <span className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                🩺
              </span>
              <span>2. Docteur Plante</span>
            </div>
            <label className="block w-full py-3 px-4 rounded-2xl bg-[#0B1F3A] hover:bg-[#132D54] text-white text-sm font-black text-center cursor-pointer shadow-sm">
              📷 Prendre une photo de la feuille malade
              <input
                type="file"
                accept="image/*"
                onChange={handleLeafUpload}
                className="hidden"
              />
            </label>
            {leafPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={leafPreview}
                alt="Feuille analysée"
                className="w-full h-28 object-cover rounded-xl border border-slate-200"
              />
            ) : null}
            {doctorLoading ? (
              <div className="text-xs font-bold text-slate-600">
                Analyse de la feuille en cours...
              </div>
            ) : null}
            {doctorResult ? (
              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs space-y-1.5">
                <div className="font-black text-[#0B1F3A]">
                  🦠 {doctorResult.maladie} (Gravité : {doctorResult.gravite})
                </div>
                <div className="text-slate-700 font-semibold">
                  💊 {doctorResult.traitement}
                </div>
                {onAddTreatmentProduct ? (
                  <button
                    type="button"
                    onClick={() => {
                      onAddTreatmentProduct(
                        `Traitement ${doctorResult.maladie}`,
                        3500,
                        doctorResult.traitement
                      );
                      setTreatmentAdded(true);
                    }}
                    className="w-full mt-1 py-2 px-3 rounded-xl bg-emerald-600 text-white font-extrabold"
                  >
                    {treatmentAdded
                      ? "✅ Préparé dans le formulaire"
                      : "➕ Ajouter ce traitement à mes Produits"}
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>

        {/* 3. CARTE Conseil IA */}
        <div className="p-5 rounded-3xl bg-white border-2 border-emerald-200 shadow-sm flex flex-col justify-between space-y-4">
          <form onSubmit={handleAskAdvisor} className="space-y-3">
            <div className="text-base font-black text-[#0B1F3A] flex items-center gap-2">
              <span className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                💬
              </span>
              <span>3. Conseil IA (Adamaoua / Sahel)</span>
            </div>
            <textarea
              rows={2}
              value={chatQuestion}
              onChange={(e) => setChatQuestion(e.target.value)}
              placeholder="Pose ta question (ex: Quand mettre l'engrais sur le maïs ?)"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
            />
            <label className="inline-flex items-center gap-2 text-xs font-bold text-slate-700">
              <input
                type="checkbox"
                checked={fulfulde}
                onChange={(e) => setFulfulde(e.target.checked)}
              />
              <span>Option Fulfulde 🗣️</span>
            </label>
            <button
              type="submit"
              disabled={chatLoading}
              className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-black shadow-sm disabled:opacity-50"
            >
              {chatLoading ? "Réflexion..." : "💡 Demander conseil"}
            </button>
            {chatAnswer ? (
              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-[#0B1F3A] whitespace-pre-line">
                {chatAnswer}
              </div>
            ) : null}
          </form>
        </div>

        {/* 4. CARTE Ma Récolte */}
        <div className="p-5 rounded-3xl bg-white border-2 border-emerald-200 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="text-base font-black text-[#0B1F3A] flex items-center gap-2">
              <span className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                🌾
              </span>
              <span>4. Ma Récolte</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={harvestCrop}
                onChange={(e) => setHarvestCrop(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold bg-white"
              >
                {AGRI_CROPS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <input
                type="number"
                step="0.5"
                min="0.5"
                value={surfaceHa}
                onChange={(e) => setSurfaceHa(e.target.value)}
                placeholder="Hectares"
                className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold"
              />
            </div>
            <input
              type="date"
              value={seedingDate}
              onChange={(e) => setSeedingDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold"
            />
            <button
              type="button"
              onClick={handlePredictHarvest}
              className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-black shadow-sm"
            >
              📊 Prédire ma récolte
            </button>
            {harvestPrediction ? (
              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs space-y-1">
                <div className="font-black text-[#0B1F3A]">
                  📦 Estimé : {harvestPrediction.bags} sacs
                </div>
                <div className="font-bold text-slate-700">
                  🏷️ Prix Ngaoundéré : {formatCFA(harvestPrediction.pricePerBag)} / sac
                </div>
                <div className="font-black text-emerald-700">
                  💰 Revenu estimé : {formatCFA(harvestPrediction.revenue)}
                </div>
                {onPutHarvestOnSale ? (
                  <button
                    type="button"
                    onClick={() => {
                      onPutHarvestOnSale(
                        harvestCrop,
                        harvestPrediction.bags,
                        harvestPrediction.pricePerBag
                      );
                      setHarvestListed(true);
                    }}
                    className="w-full mt-1 py-2 px-3 rounded-xl bg-[#0B1F3A] text-white font-extrabold"
                  >
                    {harvestListed
                      ? "✅ Pré-rempli dans le formulaire"
                      : "🛒 Mettre en vente dans ma boutique"}
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>

        {/* 5. CARTE Quand Arroser ? */}
        <div className="p-5 rounded-3xl bg-white border-2 border-emerald-200 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="text-base font-black text-[#0B1F3A] flex items-center gap-2">
              <span className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                💧
              </span>
              <span>5. Quand Arroser ?</span>
            </div>
            <div
              className={`p-4 rounded-2xl border-2 text-center space-y-1 ${
                weatherData
                  ? weatherData.shouldWater
                    ? "bg-amber-50 border-amber-300 text-amber-950"
                    : "bg-emerald-50 border-emerald-300 text-emerald-950"
                  : "bg-slate-50 border-slate-200 text-slate-700"
              }`}
            >
              <div className="text-lg font-black">
                {weatherData
                  ? weatherData.shouldWater
                    ? "💧 Arrose aujourd'hui"
                    : "🌧️ N'arrose pas"
                  : "🌦️ Vérifie ta météo"}
              </div>
              <div className="text-xs font-semibold">
                {weatherData
                  ? weatherData.advice
                  : "Clique ci-dessous pour savoir si tu dois arroser à " + village}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={handleCheckWeather}
            className="w-full py-3 rounded-2xl bg-[#0B1F3A] hover:bg-[#132D54] text-white text-sm font-black"
          >
            🔄 Actualiser selon la météo
          </button>
        </div>

        {/* 6. CARTE Mon Score Agricole */}
        <div className="p-5 rounded-3xl bg-emerald-950 text-white shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="text-base font-black flex items-center gap-2">
              <span className="w-9 h-9 rounded-xl bg-emerald-800 text-emerald-200 flex items-center justify-center">
                ⭐
              </span>
              <span>6. Mon Score Agricole</span>
            </div>
            <div className="text-3xl font-black text-emerald-300">
              {baseScore}/100
            </div>
            <div className="text-sm font-extrabold">
              Ton score est {baseScore}/100 — Tu es fiable
            </div>
            <p className="text-xs text-emerald-200">
              Calculé avec tes ventes Encaisse ({salesCount}) et tes prévisions de récolte.
            </p>
          </div>
          <div className="w-full bg-emerald-900 rounded-full h-3 overflow-hidden">
            <div
              className="bg-emerald-400 h-full rounded-full transition-all"
              style={{ width: `${baseScore}%` }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
