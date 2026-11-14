import type { Metadata } from "next";
import "./globals.css";
import { AppProvider } from "@/components/AppContext";
import { FloatingWhatsAppButton } from "@/components/PublicHeaderFooter";
import { FloatingIaGuide } from "@/components/FloatingIaGuide";

export const metadata: Metadata = {
  title:
    "InnovTech MHA Infinity — Une seule plateforme, tous vos métiers (Encaisse, École, Clinique, Immobilier, Artisan, ONG)",
  description:
    "Facturation + Paiement Orange Money / MTN MoMo / Fapshi / WhatsApp. Contact WhatsApp : +235 66 26 85 03.",
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className="min-h-screen flex flex-col antialiased pb-[90px]">
        <AppProvider>
          {children}
          <FloatingIaGuide />
          <FloatingWhatsAppButton />
        </AppProvider>
      </body>
    </html>
  );
}
