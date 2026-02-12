import type { Metadata } from "next";
import { Libre_Franklin, Brawler } from "next/font/google";
import { CookieBanner } from "@/components/cookie-banner";
import { AppShell } from "@/components/app-shell/app-shell";
import { Footer } from "@/components/footer";
import "./globals.css";

// Body text - Libre Franklin (matches WordPress)
const libreFranklin = Libre_Franklin({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
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
        className={`${libreFranklin.variable} ${brawler.variable}`}
        style={{ fontFamily: "var(--font-body), sans-serif" }}
      >
        <AppShell>
          {children}
        </AppShell>
        <Footer />
        <CookieBanner />
      </body>
    </html>
  );
}
