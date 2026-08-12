import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Playfair_Display } from "next/font/google";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Hotel Direct Booking",
    template: "%s | Hotel Direct Booking",
  },
  description:
    "Platform landing page hotel untuk direct booking — book langsung dan dapatkan Best Available Rate serta benefit eksklusif.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id" className={`${plusJakarta.variable} ${playfair.variable}`}>
      <body className="min-h-screen bg-surface text-ink font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
