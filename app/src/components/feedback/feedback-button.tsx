'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { MessageSquare, X, Camera, Send, Loader2, Check, RefreshCw } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'

type FeedbackState = 'idle' | 'form' | 'capturing' | 'selecting' | 'sending' | 'success'

interface SelectionRect {
  startX: number
  startY: number
  endX: number
  endY: number
}

export function FeedbackButton() {
  const { isLoggedIn, userEmail } = useAuth()
  const [state, setState] = useState<FeedbackState>('idle')
  const [message, setMessage] = useState('')
  const [screenshot, setScreenshot] = useState<string | null>(null)
  const [screenshotError, setScreenshotError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // Screenshot selection state
  const [pageCapture, setPageCapture] = useState<string | null>(null)
  const [selection, setSelection] = useState<SelectionRect | null>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const overlayRef = useRef<HTMLDivElement>(null)

  // Preserve message across screenshot flow
  const savedMessageRef = useRef('')

  // Reset everything
  const reset = useCallback(() => {
    setState('idle')
    setMessage('')
    setScreenshot(null)
    setScreenshotError(null)
    setSubmitError(null)
    setPageCapture(null)
    setSelection(null)
    setIsDrawing(false)
    savedMessageRef.current = ''
  }, [])

  // Auto-close success state
  useEffect(() => {
    if (state === 'success') {
      const timer = setTimeout(reset, 2000)
      return () => clearTimeout(timer)
    }
  }, [state, reset])

  // Escape key to cancel selection or close form
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (state === 'selecting' || state === 'capturing') {
          // Cancel screenshot, return to form
          setPageCapture(null)
          setSelection(null)
          setIsDrawing(false)
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

  // Open form (button click)
  const handleOpen = useCallback(() => {
    setState('form')
  }, [])

  // Start screenshot capture (from inside form)
  const startCapture = useCallback(async () => {
    savedMessageRef.current = message
    setScreenshotError(null)
    setState('capturing')

    try {
      // Small delay so the form panel disappears before capture
      await new Promise(resolve => setTimeout(resolve, 150))

      const html2canvas = (await import('html2canvas')).default
      const canvas = await html2canvas(document.body, {
        useCORS: true,
        allowTaint: true,
        logging: false,
        scale: 1,
        windowWidth: document.documentElement.scrollWidth,
        windowHeight: document.documentElement.scrollHeight,
      })
      setPageCapture(canvas.toDataURL('image/png'))
      setState('selecting')
    } catch (err) {
      console.error('[Feedback] html2canvas error:', err)
      setScreenshotError('Schermafbeelding mislukt — probeer opnieuw')
      setMessage(savedMessageRef.current)
      setState('form')
    }
  }, [message])

  // Mouse handlers for area selection
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Ignore clicks on toolbar buttons
    if ((e.target as HTMLElement).closest('[data-toolbar]')) return
    const rect = overlayRef.current?.getBoundingClientRect()
    if (!rect) return
    setIsDrawing(true)
    setSelection({
      startX: e.clientX - rect.left,
      startY: e.clientY - rect.top,
      endX: e.clientX - rect.left,
      endY: e.clientY - rect.top,
    })
  }, [])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDrawing) return
    const rect = overlayRef.current?.getBoundingClientRect()
    if (!rect) return
    setSelection(prev => prev ? {
      ...prev,
      endX: e.clientX - rect.left,
      endY: e.clientY - rect.top,
    } : null)
  }, [isDrawing])

  const handleMouseUp = useCallback(() => {
    setIsDrawing(false)
  }, [])

  // Crop the selection
  const captureSelection = useCallback(() => {
    if (!pageCapture || !selection || !overlayRef.current) return

    const overlay = overlayRef.current
    const x = Math.min(selection.startX, selection.endX)
    const y = Math.min(selection.startY, selection.endY)
    const w = Math.abs(selection.endX - selection.startX)
    const h = Math.abs(selection.endY - selection.startY)

    if (w < 10 || h < 10) {
      setScreenshotError('Selectie te klein — probeer opnieuw')
      setMessage(savedMessageRef.current)
      setPageCapture(null)
      setState('form')
      return
    }

    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const scaleX = img.width / overlay.clientWidth
      const scaleY = img.height / overlay.clientHeight
      canvas.width = w * scaleX
      canvas.height = h * scaleY
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(
          img,
          x * scaleX, y * scaleY,
          canvas.width, canvas.height,
          0, 0,
          canvas.width, canvas.height,
        )
        setScreenshot(canvas.toDataURL('image/png'))
      }
      setPageCapture(null)
      setSelection(null)
      setMessage(savedMessageRef.current)
      setState('form')
    }
    img.src = pageCapture
  }, [pageCapture, selection])

  // Cancel selection, return to form
  const cancelSelection = useCallback(() => {
    setPageCapture(null)
    setSelection(null)
    setIsDrawing(false)
    setMessage(savedMessageRef.current)
    setState('form')
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
    }
  }, [message, screenshot])

  // Don't render for logged-out users
  if (!isLoggedIn) return null

  // Selection rectangle for overlay
  const selRect = selection ? {
    left: Math.min(selection.startX, selection.endX),
    top: Math.min(selection.startY, selection.endY),
    width: Math.abs(selection.endX - selection.startX),
    height: Math.abs(selection.endY - selection.startY),
  } : null

  return (
    <>
      {/* Screenshot area selection overlay */}
      {state === 'selecting' && pageCapture && (
        <div
          ref={overlayRef}
          className="fixed inset-0 z-[9999] cursor-crosshair"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        >
          {/* Dimmed page capture */}
          <img
            src={pageCapture}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            style={{ filter: 'brightness(0.4)' }}
            draggable={false}
          />

          {/* Selection highlight */}
          {selRect && selRect.width > 2 && selRect.height > 2 && (
            <div
              className="absolute border-2 border-white/90 overflow-hidden pointer-events-none shadow-lg"
              style={{
                left: selRect.left,
                top: selRect.top,
                width: selRect.width,
                height: selRect.height,
              }}
            >
              <img
                src={pageCapture}
                alt=""
                className="absolute"
                style={{
                  left: -selRect.left,
                  top: -selRect.top,
                  width: overlayRef.current?.clientWidth,
                  height: overlayRef.current?.clientHeight,
                }}
                draggable={false}
              />
            </div>
          )}

          {/* Toolbar */}
          <div
            data-toolbar
            className="fixed top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-white rounded-lg shadow-xl px-4 py-2.5 z-[10000]"
          >
            <span className="text-sm text-gray-700 mr-2">
              Sleep om een gebied te selecteren
            </span>
            {selRect && selRect.width > 10 && selRect.height > 10 && !isDrawing && (
              <button
                onClick={captureSelection}
                className="px-3 py-1.5 bg-[#E62D75] text-white text-sm font-medium rounded hover:bg-[#d0256a] transition-colors"
              >
                Gebruik selectie
              </button>
            )}
            {selection && (
              <button
                onClick={() => setSelection(null)}
                className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm font-medium rounded hover:bg-gray-200 transition-colors"
              >
                Opnieuw
              </button>
            )}
            <button
              onClick={cancelSelection}
              className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm font-medium rounded hover:bg-gray-200 transition-colors"
            >
              Annuleren
            </button>
          </div>
        </div>
      )}

      {/* Loading state while capturing */}
      {state === 'capturing' && (
        <div className="fixed inset-0 z-[9999] bg-black/50 flex items-center justify-center">
          <div className="bg-white rounded-lg px-6 py-4 flex items-center gap-3 shadow-xl">
            <Loader2 className="w-5 h-5 animate-spin text-[#0E3261]" />
            <span className="text-sm text-gray-700">Scherm vastleggen...</span>
          </div>
        </div>
      )}

      {/* Feedback form panel */}
      {(state === 'form' || state === 'sending') && (
        <div className="fixed bottom-20 right-5 z-50 w-[360px] bg-white rounded-lg shadow-2xl border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
            <div>
              <span className="text-sm font-semibold text-[#0E3261]">Feedback</span>
              <p className="text-xs text-gray-500 mt-0.5">Laat ons weten wat beter kan</p>
            </div>
            <button
              onClick={reset}
              className="p-1 hover:bg-gray-200 rounded transition-colors"
              aria-label="Sluiten"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          <div className="p-4">
            {/* Message textarea */}
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Beschrijf wat u opvalt..."
              className="w-full h-24 px-3 py-2 text-sm border border-gray-200 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-[#0E3261]/20 focus:border-[#0E3261]"
              disabled={state === 'sending'}
              autoFocus
            />

            {/* Screenshot section */}
            <div className="mt-3">
              {screenshot ? (
                /* Screenshot preview with actions */
                <div className="relative rounded-md border border-gray-200 overflow-hidden">
                  <img
                    src={screenshot}
                    alt="Schermafbeelding"
                    className="w-full max-h-40 object-cover"
                  />
                  <div className="absolute top-1.5 right-1.5 flex gap-1">
                    <button
                      onClick={startCapture}
                      className="p-1.5 bg-black/60 hover:bg-black/80 rounded-full transition-colors"
                      aria-label="Opnieuw selecteren"
                      title="Opnieuw selecteren"
                    >
                      <RefreshCw className="w-3 h-3 text-white" />
                    </button>
                    <button
                      onClick={() => setScreenshot(null)}
                      className="p-1.5 bg-black/60 hover:bg-black/80 rounded-full transition-colors"
                      aria-label="Verwijder schermafbeelding"
                      title="Verwijderen"
                    >
                      <X className="w-3 h-3 text-white" />
                    </button>
                  </div>
                </div>
              ) : (
                /* Add screenshot button */
                <button
                  onClick={startCapture}
                  disabled={state === 'sending'}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2.5 border border-dashed border-gray-300 rounded-md text-sm text-gray-500 hover:border-[#0E3261] hover:text-[#0E3261] hover:bg-[#0E3261]/5 disabled:opacity-50 transition-colors"
                >
                  <Camera className="w-4 h-4" />
                  Voeg schermafbeelding toe
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

      {/* Floating button — always visible when idle */}
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
