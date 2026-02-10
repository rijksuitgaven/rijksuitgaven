'use client'

import Image from 'next/image'
import Link from 'next/link'

// Social media icons as inline SVGs for consistency
function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

function BlueskyIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 600 530" className={className} fill="currentColor" aria-hidden="true">
      <path d="m135.72 44.03c66.496 49.921 138.02 151.14 164.28 205.46 26.262-54.316 97.782-155.54 164.28-205.46 47.98-36.021 125.72-63.892 125.72 24.795 0 17.712-10.155 148.79-16.111 170.07-20.703 73.984-96.144 92.854-163.25 81.433 117.3 19.964 147.14 86.092 82.697 152.22-122.39 125.59-175.91-31.511-189.63-71.766-2.514-7.3797-3.6904-10.832-3.7077-7.8964-0.0174-2.9357-1.1937 0.51669-3.7077 7.8964-13.714 40.255-67.233 197.36-189.63 71.766-64.444-66.128-34.605-132.26 82.697-152.22-67.108 11.421-142.55-7.4491-163.25-81.433-5.9562-21.282-16.111-152.36-16.111-170.07 0-88.687 77.742-60.816 125.72-24.795z" />
    </svg>
  )
}

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  )
}

import { useAuth } from '@/hooks/use-auth'

export function Footer() {
  const { isLoggedIn, userEmail } = useAuth()
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-[var(--navy-dark)] text-white">
      {/* Main footer content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          {/* Column 1: Logo */}
          <div>
            <Link href="/" className="inline-block">
              <Image
                src="/logo-white.png"
                alt="Rijksuitgaven"
                width={280}
                height={80}
                className="h-16 w-auto"
              />
            </Link>
          </div>

          {/* Column 2: Links - different for logged in vs not */}
          <div>
            {isLoggedIn ? (
              <>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-white/60 mb-4">
                  Support
                </h3>
                <ul className="space-y-2">
                  <li>
                    <Link href="/veelgestelde-vragen" className="text-white/80 hover:text-white transition-colors">
                      Veelgestelde vragen
                    </Link>
                  </li>
                  <li>
                    <Link href="/contact" className="text-white/80 hover:text-white transition-colors">
                      Contact opnemen
                    </Link>
                  </li>
                  <li>
                    <Link href="/feedback" className="text-white/80 hover:text-white transition-colors">
                      Feedback geven
                    </Link>
                  </li>
                </ul>

                <h3 className="text-sm font-semibold uppercase tracking-wider text-white/60 mt-6 mb-4">
                  Juridisch
                </h3>
                <ul className="space-y-2">
                  <li>
                    <Link href="/privacybeleid" className="text-white/80 hover:text-white transition-colors">
                      Privacy beleid
                    </Link>
                  </li>
                  <li>
                    <Link href="/privacybeleid#cookies" className="text-white/80 hover:text-white transition-colors">
                      Cookiebeleid
                    </Link>
                  </li>
                </ul>
              </>
            ) : (
              <>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-white/60 mb-4">
                  Ontdek Rijksuitgaven
                </h3>
                <ul className="space-y-2">
                  <li>
                    <Link href="/over" className="text-white/80 hover:text-white transition-colors">
                      Over ons
                    </Link>
                  </li>
                  <li>
                    <Link href="/veelgestelde-vragen" className="text-white/80 hover:text-white transition-colors">
                      Veelgestelde vragen
                    </Link>
                  </li>
                  <li>
                    <Link href="/vacatures" className="text-white/80 hover:text-white transition-colors">
                      Vacatures
                    </Link>
                  </li>
                  <li>
                    <Link href="/abonnementen" className="text-white/80 hover:text-white transition-colors">
                      Abonnementen
                    </Link>
                  </li>
                  <li>
                    <Link href="/privacybeleid" className="text-white/80 hover:text-white transition-colors">
                      Privacy beleid
                    </Link>
                  </li>
                  <li>
                    <Link href="/login" className="text-white/80 hover:text-white transition-colors">
                      Inloggen
                    </Link>
                  </li>
                </ul>
              </>
            )}
          </div>

          {/* Column 3: Social & Contact */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white/60 mb-4">
              Volg ons
            </h3>
            <div className="flex items-center gap-4 mb-6">
              <a
                href="https://x.com/rijksuitgaven"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/80 hover:text-white transition-colors"
                aria-label="Volg ons op X (Twitter)"
              >
                <XIcon className="h-6 w-6" />
              </a>
              <a
                href="https://rijksuitgaven.bsky.social/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/80 hover:text-white transition-colors"
                aria-label="Volg ons op Bluesky"
              >
                <BlueskyIcon className="h-6 w-6" />
              </a>
              <a
                href="https://www.linkedin.com/company/rijksuitgaven/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/80 hover:text-white transition-colors"
                aria-label="Volg ons op LinkedIn"
              >
                <LinkedInIcon className="h-6 w-6" />
              </a>
            </div>

            <h3 className="text-sm font-semibold uppercase tracking-wider text-white/60 mb-4">
              Contact
            </h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="tel:0850806960"
                  className="text-white/80 hover:text-white transition-colors"
                >
                  085-0806960
                </a>
              </li>
              <li>
                <a
                  href="mailto:contact@rijksuitgaven.nl"
                  className="text-white/80 hover:text-white transition-colors"
                >
                  contact@rijksuitgaven.nl
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-white/60">
            <p suppressHydrationWarning>&copy; {currentYear} Rijksuitgaven &ndash; Alle rechten voorbehouden.</p>
            {isLoggedIn && userEmail && (
              <div className="flex items-center gap-4">
                <span>{userEmail}</span>
                <Link href="/auth/logout" className="text-white/80 hover:text-white transition-colors">
                  Uitloggen
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </footer>
  )
}
