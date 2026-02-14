'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { useAnalytics } from '@/hooks/use-analytics'

function Track404() {
  const { track } = useAnalytics()
  useEffect(() => {
    track('error', undefined, {
      trigger: '404',
      path: window.location.pathname,
    })
  }, [track])
  return null
}

export default function NotFound() {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{
        background: 'var(--navy-dark)',
        fontFamily: 'var(--font-body), sans-serif',
      }}
    >
      <Track404 />
      <div className="text-center max-w-md">
        <p
          className="text-[8rem] leading-none font-bold mb-2"
          style={{
            color: 'var(--pink)',
            fontFeatureSettings: '"tnum"',
          }}
        >
          404
        </p>
        <h1
          className="text-2xl font-semibold mb-3"
          style={{ color: 'var(--gray-light)' }}
        >
          Pagina niet gevonden
        </h1>
        <p
          className="text-base mb-8"
          style={{ color: 'var(--blue-light)' }}
        >
          De pagina die u zoekt bestaat niet of is verplaatst.
        </p>
        <Link
          href="/"
          className="inline-block px-8 py-3 text-white font-semibold rounded-lg hover:opacity-90 transition-opacity"
          style={{ background: 'var(--pink)' }}
        >
          Terug naar de homepage
        </Link>
      </div>
    </div>
  )
}
