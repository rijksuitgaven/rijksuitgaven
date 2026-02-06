import type { Metadata } from "next";
import { IBM_Plex_Sans_Condensed, Brawler } from "next/font/google";
import { CookieBanner } from "@/components/cookie-banner";
import { MobileBanner } from "@/components/mobile-banner";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import "./globals.css";

// Body text - IBM Plex Sans Condensed
const ibmPlexSansCondensed = IBM_Plex_Sans_Condensed({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

// Headings - Brawler (serif)
const brawler = Brawler({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "Rijksuitgaven.nl",
  description: "Snel inzicht voor krachtige analyses",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="nl">
      <body
        className={`${ibmPlexSansCondensed.variable} ${brawler.variable} antialiased`}
        style={{ fontFamily: "var(--font-body), sans-serif" }}
      >
        <Header />
        {children}
        <Footer />
        <CookieBanner />
        <MobileBanner />
      </body>
    </html>
  );
}
