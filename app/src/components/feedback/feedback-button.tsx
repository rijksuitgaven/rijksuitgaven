'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { MessageSquare, X, Camera, Send, Loader2, Check, RefreshCw } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { useAnalytics } from '@/hooks/use-analytics'
import { MUTATION_HEADERS } from '@/lib/api-config'
import { AnnotationCanvas } from './annotation-canvas'

type FeedbackState = 'idle' | 'form' | 'capturing' | 'annotating' | 'sending' | 'success'

const COOKIE_BANNER_KEY = 'cookie-banner-dismissed'

export function FeedbackButton() {
  const { isLoggedIn, userEmail } = useAuth()
  const { track } = useAnalytics()
  const [state, setState] = useState<FeedbackState>('idle')
  const [category, setCategory] = useState<'suggestie' | 'bug' | 'vraag'>('suggestie')
  const [message, setMessage] = useState('')
  const [screenshot, setScreenshot] = useState<string | null>(null)
  const [screenshotError, setScreenshotError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [rawScreenshot, setRawScreenshot] = useState<string | null>(null)

  // Cookie banner awareness — push feedback button up when banner is visible
  const [cookieBannerVisible, setCookieBannerVisible] = useState(false)

  const savedMessageRef = useRef('')

  useEffect(() => {
    try {
      setCookieBannerVisible(!localStorage.getItem(COOKIE_BANNER_KEY))
    } catch {
      setCookieBannerVisible(false)
    }
    const handleChange = () => {
      try {
        setCookieBannerVisible(!localStorage.getItem(COOKIE_BANNER_KEY))
      } catch {
        setCookieBannerVisible(false)
      }
    }
    window.addEventListener('cookie-banner-change', handleChange)
    return () => window.removeEventListener('cookie-banner-change', handleChange)
  }, [])

  // Reset
  const reset = useCallback(() => {
    setState('idle')
    setCategory('suggestie')
    setMessage('')
    setScreenshot(null)
    setRawScreenshot(null)
    setScreenshotError(null)
    setSubmitError(null)
    savedMessageRef.current = ''
  }, [])

  // Auto-close success
  useEffect(() => {
    if (state === 'success') {
      const timer = setTimeout(reset, 2000)
      return () => clearTimeout(timer)
    }
  }, [state, reset])

  // Escape key handler (form and screenshotting states — annotation canvas handles its own)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (state === 'capturing') {
          setMessage(savedMessageRef.current)
          setState('form')
        } else if (state === 'form') {
          reset()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [state, reset])

  // Open form
  const handleOpen = useCallback(() => {
    setState('form')
  }, [])

  // Start screenshot capture — 'capturing' state renders NO UI so the page is clean
  const startScreenshot = useCallback(async () => {
    savedMessageRef.current = message
    setScreenshotError(null)
    setState('capturing')

    // Wait for all feedback UI to unmount and DOM to repaint
    await new Promise<void>(r => requestAnimationFrame(() => requestAnimationFrame(() => r())))

    // Temporarily strip box-shadows to prevent html2canvas thick border artifacts
    const style = document.createElement('style')
    style.setAttribute('data-feedback-capture', '')
    style.textContent = '*, *::before, *::after { box-shadow: none !important; }'
    document.head.appendChild(style)

    try {
      const html2canvas = (await import('html2canvas-pro')).default
      const canvas = await html2canvas(document.body, {
        useCORS: true,
        allowTaint: true,
        logging: false,
        scale: 1,
        width: window.innerWidth,
        height: window.innerHeight,
        windowWidth: window.innerWidth,
        windowHeight: window.innerHeight,
        x: window.scrollX,
        y: window.scrollY,
      })
      const dataUrl = canvas.toDataURL('image/png')
      style.remove()
      setRawScreenshot(dataUrl)
      setState('annotating')
    } catch (err) {
      style.remove()
      console.error('[Feedback] Screenshot capture failed:', err)
      setScreenshotError('Screenshot kon niet worden gemaakt')
      setMessage(savedMessageRef.current)
      setState('form')
    }
  }, [message])

  // Annotation done — receive the annotated PNG
  const handleAnnotationDone = useCallback((annotatedDataUrl: string) => {
    setScreenshot(annotatedDataUrl)
    setRawScreenshot(null)
    setMessage(savedMessageRef.current)
    setState('form')
  }, [])

  // Annotation cancelled
  const handleAnnotationCancel = useCallback(() => {
    setRawScreenshot(null)
    setMessage(savedMessageRef.current)
    setState('form')
  }, [])

  // Remove screenshot
  const removeScreenshot = useCallback(() => {
    setScreenshot(null)
    setRawScreenshot(null)
    setScreenshotError(null)
  }, [])

  // Submit feedback
  const handleSubmit = useCallback(async () => {
    if (!message.trim()) return
    setState('sending')
    setSubmitError(null)

    try {
      const res = await fetch('/api/v1/feedback', {
        method: 'POST',
        headers: MUTATION_HEADERS,
        body: JSON.stringify({
          category,
          message: message.trim(),
          screenshot: screenshot || undefined,
          pageUrl: window.location.href,
          userAgent: navigator.userAgent,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Verzenden mislukt')
      }

      setState('success')
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Verzenden mislukt')
      setState('form')
      track('error', undefined, { message: err instanceof Error ? err.message : 'Feedback submit failed', trigger: 'feedback_submit' })
    }
  }, [message, category, screenshot])

  if (!isLoggedIn) return null

  return (
    <>
      {/* Annotation canvas overlay */}
      {state === 'annotating' && rawScreenshot && (
        <AnnotationCanvas
          screenshotDataUrl={rawScreenshot}
          onDone={handleAnnotationDone}
          onCancel={handleAnnotationCancel}
        />
      )}

      {/* 'capturing' state renders nothing — clean page for html2canvas */}

      {/* Feedback form panel */}
      {(state === 'form' || state === 'sending') && (
        <div className={`fixed right-5 z-50 w-[360px] bg-white rounded-lg shadow-2xl border border-gray-200 overflow-hidden transition-all duration-300 ease-in-out ${cookieBannerVisible ? 'bottom-[7.5rem]' : 'bottom-20'}`}>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
            <span className="text-base font-semibold text-[#0E3261]">Feedback</span>
            <button
              onClick={reset}
              className="p-1 hover:bg-gray-200 rounded transition-colors"
              aria-label="Sluiten"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          <div className="p-4">
            {/* Category pills */}
            <div className="flex gap-1 mb-3">
              {(['suggestie', 'bug', 'vraag'] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                    category === cat
                      ? 'bg-[#0E3261] text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {cat === 'suggestie' ? 'Suggestie' : cat === 'bug' ? 'Bug' : 'Vraag'}
                </button>
              ))}
            </div>

            {/* Message textarea */}
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={
                category === 'suggestie' ? 'Ik wil graag... zodat ik...'
                : category === 'bug' ? 'Wat gaat er mis...'
                : 'Hoe kan ik...'
              }
              className="w-full h-[72px] px-3 py-2 text-sm border border-gray-200 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-[#0E3261]/20 focus:border-[#0E3261]"
              disabled={state === 'sending'}
              autoFocus
            />

            {/* Screenshot section */}
            <div className="mt-3">
              {screenshot ? (
                /* Screenshot attachment chip */
                <div className="flex items-center gap-3 rounded-md border border-gray-200 bg-gray-50 px-3 py-2">
                  <img
                    src={screenshot}
                    alt="Screenshot"
                    className="h-10 w-14 object-cover rounded border border-gray-200 flex-shrink-0"
                  />
                  <span className="text-xs text-gray-500 truncate flex-1 min-w-0">
                    Screenshot
                  </span>
                  <div className="flex gap-1 flex-shrink-0">
                    <button
                      onClick={startScreenshot}
                      className="p-1 hover:bg-gray-200 rounded transition-colors"
                      aria-label="Opnieuw screenshot maken"
                      title="Opnieuw screenshot maken"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-gray-400" />
                    </button>
                    <button
                      onClick={removeScreenshot}
                      className="p-1 hover:bg-gray-200 rounded transition-colors"
                      aria-label="Verwijderen"
                      title="Verwijderen"
                    >
                      <X className="w-3.5 h-3.5 text-gray-400" />
                    </button>
                  </div>
                </div>
              ) : (
                /* Screenshot button */
                <button
                  onClick={startScreenshot}
                  disabled={state === 'sending'}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2.5 border border-dashed border-gray-300 rounded-md text-sm text-gray-500 hover:border-[#E62D75] hover:text-[#E62D75] hover:bg-[#E62D75]/5 disabled:opacity-50 transition-colors"
                >
                  <Camera className="w-4 h-4" />
                  Screenshot maken
                </button>
              )}
            </div>

            {/* Screenshot error */}
            {screenshotError && (
              <p className="mt-2 text-xs text-amber-600">{screenshotError}</p>
            )}

            {/* Submit error */}
            {submitError && (
              <p className="mt-2 text-xs text-red-600">{submitError}</p>
            )}

            {/* Footer */}
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs text-gray-400">
                {userEmail}
              </span>
              <button
                onClick={handleSubmit}
                disabled={!message.trim() || state === 'sending'}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#E62D75] text-white text-sm font-medium rounded-md hover:bg-[#d0256a] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {state === 'sending' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                Verstuur
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success state */}
      {state === 'success' && (
        <div className={`fixed right-5 z-50 bg-white rounded-lg shadow-2xl border border-gray-200 px-6 py-4 flex items-center gap-3 transition-all duration-300 ${cookieBannerVisible ? 'bottom-[7.5rem]' : 'bottom-20'}`}>
          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
            <Check className="w-5 h-5 text-green-600" />
          </div>
          <span className="text-sm font-medium text-gray-700">Bedankt voor uw feedback!</span>
        </div>
      )}

      {/* Floating button */}
      {state === 'idle' && (
        <button
          onClick={handleOpen}
          className={`fixed right-5 z-50 flex items-center gap-2 px-4 py-2.5 bg-[#0E3261] text-white text-sm font-medium rounded-full shadow-lg hover:bg-[#0a2750] transition-all duration-300 ${cookieBannerVisible ? 'bottom-16' : 'bottom-5'}`}
        >
          <MessageSquare className="w-4 h-4" />
          Feedback
        </button>
      )}
    </>
  )
}
