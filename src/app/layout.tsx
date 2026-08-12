import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Playfair_Display } from "next/font/google";
import "./globals.css";
import { getHotelMetadata } from "@/lib/seo";
import { AnalyticsScripts } from "@/components/analytics/Scripts";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

// SEO-001: metadata dari CMS (SeoMeta hotel) dengan fallback — satu sumber.
export async function generateMetadata(): Promise<Metadata> {
  return getHotelMetadata();
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id" className={`${plusJakarta.variable} ${playfair.variable}`}>
      <body className="min-h-screen bg-surface text-ink font-sans antialiased">
        {children}
        <AnalyticsScripts />
      </body>
    </html>
  );
}
