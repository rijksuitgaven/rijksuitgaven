import type { Metadata } from "next";
import { IBM_Plex_Sans, IBM_Plex_Sans_Condensed } from "next/font/google";
import { CookieBanner } from "@/components/cookie-banner";
import { AppShell } from "@/components/app-shell/app-shell";
import { Footer } from "@/components/footer";
import "./globals.css";

// Default body & headings — IBM Plex Sans (public pages, module hub)
const ibmPlexSans = IBM_Plex_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

// Data-dense pages — IBM Plex Sans Condensed (modules, team, profiel)
const ibmPlexSansCondensed = IBM_Plex_Sans_Condensed({
  variable: "--font-condensed",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
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
        className={`${ibmPlexSans.variable} ${ibmPlexSansCondensed.variable}`}
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
