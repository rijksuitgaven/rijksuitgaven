'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { MessageSquare, X, Camera, Send, Loader2, Check } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'

type FeedbackState = 'idle' | 'selecting' | 'form' | 'sending' | 'success'

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
  const [includeScreenshot, setIncludeScreenshot] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Screenshot selection state
  const [pageCapture, setPageCapture] = useState<string | null>(null)
  const [selection, setSelection] = useState<SelectionRect | null>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)

  // Reset everything
  const reset = useCallback(() => {
    setState('idle')
    setMessage('')
    setScreenshot(null)
    setError(null)
    setPageCapture(null)
    setSelection(null)
    setIsDrawing(false)
    setIncludeScreenshot(true)
  }, [])

  // Auto-close success state
  useEffect(() => {
    if (state === 'success') {
      const timer = setTimeout(reset, 2000)
      return () => clearTimeout(timer)
    }
  }, [state, reset])

  // Start feedback flow
  const handleStart = useCallback(async () => {
    if (includeScreenshot) {
      setState('selecting')
      try {
        // Dynamic import to avoid SSR issues
        const html2canvas = (await import('html2canvas')).default
        const canvas = await html2canvas(document.body, {
          useCORS: true,
          logging: false,
          scale: 1,
        })
        setPageCapture(canvas.toDataURL('image/png'))
      } catch {
        // If screenshot fails, go directly to form
        setState('form')
      }
    } else {
      setState('form')
    }
  }, [includeScreenshot])

  // Screenshot selection mouse handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
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
    if (!isDrawing || !selection) return
    const rect = overlayRef.current?.getBoundingClientRect()
    if (!rect) return
    setSelection(prev => prev ? {
      ...prev,
      endX: e.clientX - rect.left,
      endY: e.clientY - rect.top,
    } : null)
  }, [isDrawing, selection])

  const handleMouseUp = useCallback(() => {
    setIsDrawing(false)
  }, [])

  // Crop the selection from the page capture
  const captureSelection = useCallback(() => {
    if (!pageCapture || !selection || !overlayRef.current) return

    const overlay = overlayRef.current
    const scaleX = overlay.scrollWidth / overlay.clientWidth
    const scaleY = overlay.scrollHeight / overlay.clientHeight

    const x = Math.min(selection.startX, selection.endX) * scaleX
    const y = Math.min(selection.startY, selection.endY) * scaleY
    const w = Math.abs(selection.endX - selection.startX) * scaleX
    const h = Math.abs(selection.endY - selection.startY) * scaleY

    if (w < 10 || h < 10) {
      // Selection too small, skip
      setState('form')
      return
    }

    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      // Scale coordinates to image dimensions
      const imgScaleX = img.width / overlay.clientWidth
      const imgScaleY = img.height / overlay.clientHeight
      canvas.width = w * imgScaleX / scaleX
      canvas.height = h * imgScaleY / scaleY
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(
          img,
          x * imgScaleX / scaleX,
          y * imgScaleY / scaleY,
          canvas.width,
          canvas.height,
          0, 0,
          canvas.width,
          canvas.height,
        )
        setScreenshot(canvas.toDataURL('image/png'))
      }
      setPageCapture(null)
      setState('form')
    }
    img.src = pageCapture
  }, [pageCapture, selection])

  // Skip screenshot, go to form
  const skipScreenshot = useCallback(() => {
    setPageCapture(null)
    setSelection(null)
    setState('form')
  }, [])

  // Submit feedback
  const handleSubmit = useCallback(async () => {
    if (!message.trim()) return
    setState('sending')
    setError(null)

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
      setError(err instanceof Error ? err.message : 'Verzenden mislukt')
      setState('form')
    }
  }, [message, screenshot])

  // Don't render for logged-out users
  if (!isLoggedIn) return null

  // Selection rectangle dimensions for overlay
  const selRect = selection ? {
    left: Math.min(selection.startX, selection.endX),
    top: Math.min(selection.startY, selection.endY),
    width: Math.abs(selection.endX - selection.startX),
    height: Math.abs(selection.endY - selection.startY),
  } : null

  return (
    <>
      {/* Screenshot selection overlay */}
      {state === 'selecting' && pageCapture && (
        <div
          ref={overlayRef}
          className="fixed inset-0 z-[9999] cursor-crosshair"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        >
          {/* Dimmed page capture background */}
          <img
            src={pageCapture}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            style={{ filter: 'brightness(0.4)' }}
            draggable={false}
          />

          {/* Selection highlight (shows original brightness) */}
          {selRect && selRect.width > 2 && selRect.height > 2 && (
            <div
              className="absolute border-2 border-white overflow-hidden pointer-events-none"
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
          <div className="fixed top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-white rounded-lg shadow-lg px-4 py-2 z-[10000]">
            <span className="text-sm text-gray-700 mr-2">
              Selecteer het relevante gebied
            </span>
            {selRect && selRect.width > 10 && selRect.height > 10 && !isDrawing && (
              <button
                onClick={captureSelection}
                className="px-3 py-1.5 bg-[#E62D75] text-white text-sm font-medium rounded hover:bg-[#d0256a] transition-colors"
              >
                Gebruik selectie
              </button>
            )}
            <button
              onClick={() => setSelection(null)}
              className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm font-medium rounded hover:bg-gray-200 transition-colors"
            >
              Opnieuw
            </button>
            <button
              onClick={skipScreenshot}
              className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm font-medium rounded hover:bg-gray-200 transition-colors"
            >
              Overslaan
            </button>
          </div>
        </div>
      )}

      {/* Loading state while html2canvas captures */}
      {state === 'selecting' && !pageCapture && (
        <div className="fixed inset-0 z-[9999] bg-black/50 flex items-center justify-center">
          <div className="bg-white rounded-lg px-6 py-4 flex items-center gap-3">
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
            <span className="text-sm font-semibold text-[#0E3261]">Feedback</span>
            <button
              onClick={reset}
              className="p-1 hover:bg-gray-200 rounded transition-colors"
              aria-label="Sluiten"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          <div className="p-4">
            {/* Screenshot preview */}
            {screenshot && (
              <div className="mb-3 relative">
                <img
                  src={screenshot}
                  alt="Schermafbeelding"
                  className="w-full rounded border border-gray-200"
                />
                <button
                  onClick={() => setScreenshot(null)}
                  className="absolute top-1 right-1 p-1 bg-black/60 hover:bg-black/80 rounded-full transition-colors"
                  aria-label="Verwijder schermafbeelding"
                >
                  <X className="w-3 h-3 text-white" />
                </button>
              </div>
            )}

            {/* Message textarea */}
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Beschrijf wat u opvalt..."
              className="w-full h-24 px-3 py-2 text-sm border border-gray-200 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-[#0E3261]/20 focus:border-[#0E3261]"
              disabled={state === 'sending'}
              autoFocus
            />

            {/* Error */}
            {error && (
              <p className="mt-2 text-xs text-red-600">{error}</p>
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
        <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-2">
          {/* Screenshot toggle (shown on hover via group) */}
          <div className="group">
            <div className="mb-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white rounded-lg shadow-lg border border-gray-200 px-3 py-2">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-600 whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={includeScreenshot}
                  onChange={(e) => setIncludeScreenshot(e.target.checked)}
                  className="rounded"
                />
                <Camera className="w-3.5 h-3.5" />
                Schermafbeelding meesturen
              </label>
            </div>
            <button
              onClick={handleStart}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#0E3261] text-white text-sm font-medium rounded-full shadow-lg hover:bg-[#0a2750] transition-colors"
            >
              <MessageSquare className="w-4 h-4" />
              Feedback
            </button>
          </div>
        </div>
      )}
    </>
  )
}
