import type { Metadata } from "next";
import { IBM_Plex_Sans_Condensed, Brawler } from "next/font/google";
import { CookieBanner } from "@/components/cookie-banner";
import { MobileBanner } from "@/components/mobile-banner";
import { SubscriptionBanner } from "@/components/subscription-banner";
import { FeedbackButton } from "@/components/feedback";
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
  metadataBase: new URL('https://beta.rijksuitgaven.nl'),
  title: {
    default: 'Rijksuitgaven.nl',
    template: '%s | Rijksuitgaven.nl',
  },
  description: 'Snel inzicht in rijksuitgaven voor krachtige analyses',
  openGraph: {
    title: 'Rijksuitgaven.nl',
    description: 'Snel inzicht in rijksuitgaven voor krachtige analyses',
    type: 'website',
    locale: 'nl_NL',
  },
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
        <SubscriptionBanner />
        {children}
        <Footer />
        <FeedbackButton />
        <CookieBanner />
        <MobileBanner />
      </body>
    </html>
  );
}
