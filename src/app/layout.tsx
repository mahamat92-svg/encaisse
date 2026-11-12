import type { Metadata } from "next";
import "./globals.css";
import { AppProvider } from "@/components/AppContext";

export const metadata: Metadata = {
  title: "InnovTech Encaisse — Facturation 30s, Recouvrement WhatsApp & Mobile Money",
  description:
    "Plateforme SaaS professionnelle pour PME, commerçants et établissements scolaires au Cameroun et en Afrique. Facturez en 30 secondes, suivez qui vous doit combien, et relancez sur WhatsApp.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className="min-h-screen flex flex-col antialiased">
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}

