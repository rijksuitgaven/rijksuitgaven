'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { MessageSquare, X, Crosshair, Send, Loader2, Check, RefreshCw } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'

type FeedbackState = 'idle' | 'form' | 'marking' | 'capturing' | 'sending' | 'success'

interface MarkedElement {
  screenshot: string | null
  selector: string
  text: string
  tag: string
  rect: { x: number; y: number; width: number; height: number }
}

/** Build a human-readable CSS selector for an element */
function getSelector(el: Element): string {
  if (el.id) return `#${el.id}`
  const parts: string[] = []
  let current: Element | null = el
  while (current && current !== document.body) {
    let selector = current.tagName.toLowerCase()
    if (current.className && typeof current.className === 'string') {
      const meaningful = current.className
        .split(/\s+/)
        .filter(c => c && !c.startsWith('hover:') && !c.startsWith('focus:') && c.length < 30)
        .slice(0, 2)
      if (meaningful.length) selector += `.${meaningful.join('.')}`
    }
    parts.unshift(selector)
    current = current.parentElement
    if (parts.length >= 3) break
  }
  return parts.join(' > ')
}

/** Get a friendly label for an element */
function getElementLabel(el: Element): string {
  const tag = el.tagName.toLowerCase()
  const labels: Record<string, string> = {
    table: 'Tabel', tr: 'Tabelrij', td: 'Tabelcel', th: 'Tabelkop',
    button: 'Knop', a: 'Link', input: 'Invoerveld', textarea: 'Tekstveld',
    select: 'Selectieveld', img: 'Afbeelding', h1: 'Kop', h2: 'Kop',
    h3: 'Kop', h4: 'Kop', p: 'Tekst', span: 'Tekst', div: 'Sectie',
    header: 'Header', footer: 'Footer', nav: 'Navigatie', main: 'Hoofdinhoud',
    form: 'Formulier', label: 'Label', svg: 'Icoon',
  }
  return labels[tag] || tag
}

export function FeedbackButton() {
  const { isLoggedIn, userEmail } = useAuth()
  const [state, setState] = useState<FeedbackState>('idle')
  const [category, setCategory] = useState<'suggestie' | 'bug' | 'vraag'>('suggestie')
  const [message, setMessage] = useState('')
  const [marked, setMarked] = useState<MarkedElement | null>(null)
  const [screenshotError, setScreenshotError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // Element highlighting state
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null)
  const hoveredElRef = useRef<Element | null>(null)
  const savedMessageRef = useRef('')

  // Reset
  const reset = useCallback(() => {
    setState('idle')
    setCategory('suggestie')
    setMessage('')
    setMarked(null)
    setScreenshotError(null)
    setSubmitError(null)
    setHighlightRect(null)
    hoveredElRef.current = null
    savedMessageRef.current = ''
  }, [])

  // Auto-close success
  useEffect(() => {
    if (state === 'success') {
      const timer = setTimeout(reset, 2000)
      return () => clearTimeout(timer)
    }
  }, [state, reset])

  // Escape key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (state === 'marking' || state === 'capturing') {
          setHighlightRect(null)
          hoveredElRef.current = null
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

  // Set crosshair cursor on body during marking mode
  useEffect(() => {
    if (state === 'marking') {
      document.body.style.cursor = 'crosshair'
      return () => { document.body.style.cursor = '' }
    }
  }, [state])

  // Element highlighting: mousemove + click handlers during marking mode
  useEffect(() => {
    if (state !== 'marking') return

    const handleMouseMove = (e: MouseEvent) => {
      const el = document.elementFromPoint(e.clientX, e.clientY)
      if (!el) return

      // Skip our own overlay/toolbar elements
      if ((el as HTMLElement).closest('[data-feedback-overlay]')) return

      // Find a meaningful element (not too small, not the body)
      let target: Element = el
      const rect = target.getBoundingClientRect()
      // If element is very small (icon, span), go up to parent
      if (rect.width < 20 || rect.height < 20) {
        target = target.parentElement || target
      }
      // Don't highlight body or html
      if (target === document.body || target === document.documentElement) return

      hoveredElRef.current = target
      setHighlightRect(target.getBoundingClientRect())
    }

    const handleClick = async (e: MouseEvent) => {
      // Let toolbar clicks through (Annuleren button etc.)
      if ((e.target as HTMLElement).closest('[data-feedback-overlay]')) return

      e.preventDefault()
      e.stopPropagation()

      const el = hoveredElRef.current
      if (!el) return

      // Capture the clicked element
      setHighlightRect(null)
      setState('capturing')

      const rect = el.getBoundingClientRect()
      const elementInfo = {
        selector: getSelector(el),
        text: (el.textContent || '').trim().slice(0, 200),
        tag: getElementLabel(el),
        rect: {
          x: Math.round(rect.x),
          y: Math.round(rect.y),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        },
      }

      // Try to capture element screenshot
      let screenshot: string | null = null
      try {
        const html2canvas = (await import('html2canvas')).default
        const canvas = await html2canvas(el as HTMLElement, {
          useCORS: true,
          allowTaint: true,
          logging: false,
          scale: 1,
          width: Math.min(rect.width, 800),
          height: Math.min(rect.height, 600),
        })
        screenshot = canvas.toDataURL('image/png')
      } catch (err) {
        console.error('[Feedback] Element capture failed:', err)
        // Not fatal — we still have element info
      }

      setMarked({ ...elementInfo, screenshot })
      setMessage(savedMessageRef.current)
      if (!screenshot) {
        setScreenshotError('Schermafbeelding mislukt, maar element is gemarkeerd')
      }
      setState('form')
    }

    document.addEventListener('mousemove', handleMouseMove, true)
    document.addEventListener('click', handleClick, true)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove, true)
      document.removeEventListener('click', handleClick, true)
    }
  }, [state])

  // Open form
  const handleOpen = useCallback(() => {
    setState('form')
  }, [])

  // Start element marking mode
  const startMarking = useCallback(() => {
    savedMessageRef.current = message
    setScreenshotError(null)
    setState('marking')
  }, [message])

  // Cancel marking, return to form
  const cancelMarking = useCallback(() => {
    setHighlightRect(null)
    hoveredElRef.current = null
    setMessage(savedMessageRef.current)
    setState('form')
  }, [])

  // Remove marked element
  const removeMarked = useCallback(() => {
    setMarked(null)
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          message: message.trim(),
          screenshot: marked?.screenshot || undefined,
          element: marked ? {
            selector: marked.selector,
            text: marked.text,
            tag: marked.tag,
            rect: marked.rect,
          } : undefined,
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
    }
  }, [message, category, marked])

  if (!isLoggedIn) return null

  return (
    <>
      {/* Element highlighting overlay during marking mode */}
      {state === 'marking' && (
        <>
          {/* Highlight box following hovered element */}
          {highlightRect && (
            <div
              className="fixed pointer-events-none z-[9998] border-2 border-[#E62D75] rounded-sm"
              style={{
                left: highlightRect.left - 2,
                top: highlightRect.top - 2,
                width: highlightRect.width + 4,
                height: highlightRect.height + 4,
                backgroundColor: 'rgba(230, 45, 117, 0.08)',
                transition: 'all 50ms ease-out',
              }}
            />
          )}

          {/* Toolbar */}
          <div
            data-feedback-overlay
            className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-3 bg-white rounded-lg shadow-xl px-4 py-2.5 border border-gray-200"
          >
            <Crosshair className="w-4 h-4 text-[#E62D75]" />
            <span className="text-sm text-gray-700">
              Klik op het element dat u wilt melden
            </span>
            <button
              onClick={cancelMarking}
              className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm font-medium rounded hover:bg-gray-200 transition-colors"
            >
              Annuleren
            </button>
          </div>

        </>
      )}

      {/* Loading state while capturing element */}
      {state === 'capturing' && (
        <div className="fixed inset-0 z-[9999] bg-black/30 flex items-center justify-center">
          <div className="bg-white rounded-lg px-6 py-4 flex items-center gap-3 shadow-xl">
            <Loader2 className="w-5 h-5 animate-spin text-[#0E3261]" />
            <span className="text-sm text-gray-700">Element vastleggen...</span>
          </div>
        </div>
      )}

      {/* Feedback form panel */}
      {(state === 'form' || state === 'sending') && (
        <div className="fixed bottom-20 right-5 z-50 w-[360px] bg-white rounded-lg shadow-2xl border border-gray-200 overflow-hidden transition-all duration-200 ease-in-out">
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

            {/* Element marking section */}
            <div className="mt-3">
              {marked ? (
                /* Marked element preview */
                <div className="rounded-md border border-gray-200 overflow-hidden relative group">
                  {marked.screenshot ? (
                    /* Screenshot with hover actions */
                    <div className="relative">
                      <img
                        src={marked.screenshot}
                        alt="Gemarkeerd element"
                        className="w-full max-h-36 object-contain bg-gray-50"
                      />
                      {/* Action buttons — visible on hover */}
                      <div className="absolute top-1.5 right-1.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={startMarking}
                          className="p-1.5 bg-white/90 hover:bg-white rounded shadow-sm transition-colors"
                          aria-label="Opnieuw markeren"
                          title="Opnieuw markeren"
                        >
                          <RefreshCw className="w-3.5 h-3.5 text-gray-600" />
                        </button>
                        <button
                          onClick={removeMarked}
                          className="p-1.5 bg-white/90 hover:bg-white rounded shadow-sm transition-colors"
                          aria-label="Verwijderen"
                          title="Verwijderen"
                        >
                          <X className="w-3.5 h-3.5 text-gray-600" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Fallback: no screenshot, show text + actions */
                    <div className="flex items-center justify-between px-3 py-2 bg-gray-50">
                      <span className="text-xs text-gray-500 truncate">
                        {marked.text.slice(0, 60) || marked.selector}
                      </span>
                      <div className="flex gap-1 flex-shrink-0 ml-2">
                        <button
                          onClick={startMarking}
                          className="p-1 hover:bg-gray-200 rounded transition-colors"
                          aria-label="Opnieuw markeren"
                          title="Opnieuw markeren"
                        >
                          <RefreshCw className="w-3.5 h-3.5 text-gray-500" />
                        </button>
                        <button
                          onClick={removeMarked}
                          className="p-1 hover:bg-gray-200 rounded transition-colors"
                          aria-label="Verwijderen"
                          title="Verwijderen"
                        >
                          <X className="w-3.5 h-3.5 text-gray-500" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Mark element button */
                <button
                  onClick={startMarking}
                  disabled={state === 'sending'}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2.5 border border-dashed border-gray-300 rounded-md text-sm text-gray-500 hover:border-[#E62D75] hover:text-[#E62D75] hover:bg-[#E62D75]/5 disabled:opacity-50 transition-colors"
                >
                  <Crosshair className="w-4 h-4" />
                  Markeer op de pagina
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
        <div className="fixed bottom-20 right-5 z-50 bg-white rounded-lg shadow-2xl border border-gray-200 px-6 py-4 flex items-center gap-3">
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
          className="fixed bottom-5 right-5 z-50 flex items-center gap-2 px-4 py-2.5 bg-[#0E3261] text-white text-sm font-medium rounded-full shadow-lg hover:bg-[#0a2750] transition-colors"
        >
          <MessageSquare className="w-4 h-4" />
          Feedback
        </button>
      )}
    </>
  )
}
