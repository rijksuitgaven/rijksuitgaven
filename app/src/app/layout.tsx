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
  metadataBase: new URL('https://rijksuitgaven.nl'),
  title: {
    default: 'Rijksuitgaven.nl | Snel inzicht voor krachtige analyses',
    template: '%s | Rijksuitgaven.nl',
  },
  description: 'Overheidsbestedingen snel tot in detail doorzoeken en vergelijken. Rijksuitgaven is hét onafhankelijke platform voor inzicht in overheidsuitgaven.',
  openGraph: {
    title: 'Rijksuitgaven.nl | Snel inzicht voor krachtige analyses',
    description: 'Overheidsbestedingen snel tot in detail doorzoeken en vergelijken. Rijksuitgaven is hét onafhankelijke platform voor inzicht in overheidsuitgaven.',
    type: 'website',
    locale: 'nl_NL',
    siteName: 'Rijksuitgaven.nl',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Rijksuitgaven.nl | Snel inzicht voor krachtige analyses',
    description: 'Overheidsbestedingen snel tot in detail doorzoeken en vergelijken. Rijksuitgaven is hét onafhankelijke platform voor inzicht in overheidsuitgaven.',
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: 'Rijksuitgaven.nl',
              url: 'https://rijksuitgaven.nl',
              description: 'Overheidsbestedingen snel tot in detail doorzoeken en vergelijken. Rijksuitgaven is hét onafhankelijke platform voor inzicht in overheidsuitgaven.',
              logo: 'https://rijksuitgaven.nl/logo.png',
              contactPoint: {
                '@type': 'ContactPoint',
                telephone: '+31-85-0806960',
                email: 'contact@rijksuitgaven.nl',
                contactType: 'customer service',
                availableLanguage: 'Dutch',
              },
              sameAs: [
                'https://x.com/rijksuitgaven',
                'https://www.linkedin.com/company/rijksuitgaven/',
                'https://rijksuitgaven.bsky.social/',
              ],
            }),
          }}
        />
        <AppShell>
          {children}
        </AppShell>
        <Footer />
        <CookieBanner />
      </body>
    </html>
  );
}
