import type { Metadata, Viewport } from "next";
import "./globals.css";
import { LanguageProvider } from "@/lib/i18n";
import { StoreProvider } from "@/lib/store";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "EggBill Pro — Smart Egg Billing & Inventory System",
  description: "Next-generation egg billing, vehicle trip loading, tray counts, and stock management app.",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#388087",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased bg-brand-cream text-brand-dark">
        <LanguageProvider>
          <StoreProvider>
            {children}
            <Toaster position="top-right" richColors />
          </StoreProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
