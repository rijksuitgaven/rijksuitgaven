'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Pencil, Square, MoveUpRight, Type, Undo2, X, Check } from 'lucide-react'

type Tool = 'pen' | 'rect' | 'arrow' | 'text'

type Stroke =
  | { tool: 'pen'; points: { x: number; y: number }[] }
  | { tool: 'rect'; start: { x: number; y: number }; end: { x: number; y: number } }
  | { tool: 'arrow'; start: { x: number; y: number }; end: { x: number; y: number } }
  | { tool: 'text'; position: { x: number; y: number }; text: string }

interface AnnotationCanvasProps {
  screenshotDataUrl: string
  onDone: (annotatedDataUrl: string) => void
  onCancel: () => void
}

const STROKE_COLOR = '#E62D75'
const PEN_WIDTH = 3
const SHAPE_WIDTH = 2
const TEXT_FONT_SIZE = 32
const TEXT_FONT = `bold ${TEXT_FONT_SIZE}px "IBM Plex Sans", sans-serif`
const ARROW_HEAD_LENGTH = 14
const ARROW_HEAD_ANGLE = Math.PI / 6

function drawStroke(ctx: CanvasRenderingContext2D, stroke: Stroke) {
  ctx.strokeStyle = STROKE_COLOR
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  if (stroke.tool === 'pen') {
    if (stroke.points.length < 2) return
    ctx.lineWidth = PEN_WIDTH
    ctx.beginPath()
    ctx.moveTo(stroke.points[0].x, stroke.points[0].y)
    for (let i = 1; i < stroke.points.length; i++) {
      ctx.lineTo(stroke.points[i].x, stroke.points[i].y)
    }
    ctx.stroke()
  } else if (stroke.tool === 'rect') {
    ctx.lineWidth = SHAPE_WIDTH
    const x = Math.min(stroke.start.x, stroke.end.x)
    const y = Math.min(stroke.start.y, stroke.end.y)
    const w = Math.abs(stroke.end.x - stroke.start.x)
    const h = Math.abs(stroke.end.y - stroke.start.y)
    ctx.strokeRect(x, y, w, h)
  } else if (stroke.tool === 'arrow') {
    ctx.lineWidth = SHAPE_WIDTH
    const { start, end } = stroke
    const angle = Math.atan2(end.y - start.y, end.x - start.x)
    ctx.beginPath()
    ctx.moveTo(start.x, start.y)
    ctx.lineTo(end.x, end.y)
    ctx.stroke()
    ctx.fillStyle = STROKE_COLOR
    ctx.beginPath()
    ctx.moveTo(end.x, end.y)
    ctx.lineTo(
      end.x - ARROW_HEAD_LENGTH * Math.cos(angle - ARROW_HEAD_ANGLE),
      end.y - ARROW_HEAD_LENGTH * Math.sin(angle - ARROW_HEAD_ANGLE)
    )
    ctx.lineTo(
      end.x - ARROW_HEAD_LENGTH * Math.cos(angle + ARROW_HEAD_ANGLE),
      end.y - ARROW_HEAD_LENGTH * Math.sin(angle + ARROW_HEAD_ANGLE)
    )
    ctx.closePath()
    ctx.fill()
  } else if (stroke.tool === 'text') {
    ctx.font = TEXT_FONT
    ctx.textBaseline = 'top'
    // White background for readability
    const metrics = ctx.measureText(stroke.text)
    const pad = 3
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)'
    ctx.fillRect(
      stroke.position.x - pad,
      stroke.position.y - pad,
      metrics.width + pad * 2,
      TEXT_FONT_SIZE + pad * 2
    )
    ctx.fillStyle = STROKE_COLOR
    ctx.fillText(stroke.text, stroke.position.x, stroke.position.y)
  }
}

export function AnnotationCanvas({ screenshotDataUrl, onDone, onCancel }: AnnotationCanvasProps) {
  const [tool, setTool] = useState<Tool>('pen')
  const [strokes, setStrokes] = useState<Stroke[]>([])
  const [isDrawing, setIsDrawing] = useState(false)
  const currentStrokeRef = useRef<Stroke | null>(null)

  // Text input state — screenX/Y relative to canvas wrapper, canvasX/Y for actual drawing
  const [textInput, setTextInput] = useState<{ screenX: number; screenY: number; canvasX: number; canvasY: number } | null>(null)
  const [textValue, setTextValue] = useState('')
  const textInputRef = useRef<HTMLInputElement>(null)
  const isCommittingTextRef = useRef(false)

  const bgCanvasRef = useRef<HTMLCanvasElement>(null)
  const drawCanvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const imgRef = useRef<HTMLImageElement | null>(null)

  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 })

  // Load screenshot image
  useEffect(() => {
    const img = new Image()
    img.onload = () => {
      imgRef.current = img
      setCanvasSize({ width: img.naturalWidth, height: img.naturalHeight })
    }
    img.src = screenshotDataUrl
  }, [screenshotDataUrl])

  // Draw background
  useEffect(() => {
    const bgCanvas = bgCanvasRef.current
    if (!bgCanvas || !imgRef.current || canvasSize.width === 0) return
    const ctx = bgCanvas.getContext('2d')
    if (!ctx) return
    ctx.drawImage(imgRef.current, 0, 0)
  }, [canvasSize])

  // Redraw all strokes
  const redrawStrokes = useCallback(() => {
    const canvas = drawCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    for (const stroke of strokes) {
      drawStroke(ctx, stroke)
    }
  }, [strokes])

  useEffect(() => { redrawStrokes() }, [redrawStrokes])

  // Focus text input when it appears
  useEffect(() => {
    if (textInput && textInputRef.current) {
      // Small delay to ensure DOM is ready
      setTimeout(() => textInputRef.current?.focus(), 10)
    }
  }, [textInput])

  // Commit text input as a stroke (guarded against double-commit)
  const commitTextInput = useCallback(() => {
    if (isCommittingTextRef.current) return
    isCommittingTextRef.current = true

    if (textInput && textValue.trim()) {
      setStrokes(prev => [...prev, {
        tool: 'text' as const,
        position: { x: textInput.canvasX, y: textInput.canvasY },
        text: textValue.trim(),
      }])
    }
    setTextInput(null)
    setTextValue('')

    // Reset guard after state updates
    setTimeout(() => { isCommittingTextRef.current = false }, 50)
  }, [textInput, textValue])

  // Canvas-relative coordinates
  const getCanvasPoint = useCallback((e: React.PointerEvent) => {
    const canvas = drawCanvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    return {
      x: (e.clientX - rect.left) * (canvas.width / rect.width),
      y: (e.clientY - rect.top) * (canvas.height / rect.height),
    }
  }, [])

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    // Text tool: place input at click position
    if (tool === 'text') {
      // If clicking on the text input itself, let it handle naturally
      if ((e.target as HTMLElement).tagName === 'INPUT') return

      // Commit existing text first
      if (textInput && textValue.trim()) {
        setStrokes(prev => [...prev, {
          tool: 'text' as const,
          position: { x: textInput.canvasX, y: textInput.canvasY },
          text: textValue.trim(),
        }])
      }
      const canvasPoint = getCanvasPoint(e)
      const canvasRect = drawCanvasRef.current?.getBoundingClientRect()
      setTextInput({
        screenX: canvasRect ? e.clientX - canvasRect.left : 0,
        screenY: canvasRect ? e.clientY - canvasRect.top : 0,
        canvasX: canvasPoint.x,
        canvasY: canvasPoint.y,
      })
      setTextValue('')
      return
    }

    e.preventDefault()
    const point = getCanvasPoint(e)
    setIsDrawing(true)
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)

    if (tool === 'pen') {
      currentStrokeRef.current = { tool: 'pen', points: [point] }
    } else if (tool === 'rect') {
      currentStrokeRef.current = { tool: 'rect', start: point, end: point }
    } else if (tool === 'arrow') {
      currentStrokeRef.current = { tool: 'arrow', start: point, end: point }
    }
  }, [tool, getCanvasPoint, textInput, textValue])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDrawing || !currentStrokeRef.current) return
    const point = getCanvasPoint(e)
    const canvas = drawCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const stroke = currentStrokeRef.current

    if (stroke.tool === 'pen') {
      stroke.points.push(point)
      if (stroke.points.length >= 2) {
        ctx.strokeStyle = STROKE_COLOR
        ctx.lineWidth = PEN_WIDTH
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        ctx.beginPath()
        ctx.moveTo(stroke.points[stroke.points.length - 2].x, stroke.points[stroke.points.length - 2].y)
        ctx.lineTo(point.x, point.y)
        ctx.stroke()
      }
    } else if (stroke.tool === 'rect' || stroke.tool === 'arrow') {
      stroke.end = point
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      for (const s of strokes) { drawStroke(ctx, s) }
      drawStroke(ctx, stroke)
    }
  }, [isDrawing, strokes, getCanvasPoint])

  const handlePointerUp = useCallback(() => {
    if (!isDrawing || !currentStrokeRef.current) return
    setIsDrawing(false)
    const stroke = currentStrokeRef.current
    currentStrokeRef.current = null

    if (stroke.tool === 'pen' && stroke.points.length < 2) return
    if (stroke.tool === 'rect' || stroke.tool === 'arrow') {
      const dx = Math.abs(stroke.end.x - stroke.start.x)
      const dy = Math.abs(stroke.end.y - stroke.start.y)
      if (dx < 3 && dy < 3) return
    }
    setStrokes(prev => [...prev, stroke])
  }, [isDrawing])

  const handleUndo = useCallback(() => {
    setStrokes(prev => prev.slice(0, -1))
  }, [])

  const handleDone = useCallback(() => {
    // Commit active text input
    if (textInput && textValue.trim()) {
      const canvas = drawCanvasRef.current
      if (canvas) {
        const ctx = canvas.getContext('2d')
        if (ctx) {
          drawStroke(ctx, { tool: 'text', position: { x: textInput.canvasX, y: textInput.canvasY }, text: textValue.trim() })
        }
      }
    }
    setTextInput(null)
    setTextValue('')

    const bgCanvas = bgCanvasRef.current
    const drawCanvas = drawCanvasRef.current
    if (!bgCanvas || !drawCanvas) return

    const mergedCanvas = document.createElement('canvas')
    mergedCanvas.width = bgCanvas.width
    mergedCanvas.height = bgCanvas.height
    const ctx = mergedCanvas.getContext('2d')
    if (!ctx) return

    ctx.drawImage(bgCanvas, 0, 0)
    ctx.drawImage(drawCanvas, 0, 0)
    onDone(mergedCanvas.toDataURL('image/png'))
  }, [onDone, textInput, textValue])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (textInput) {
        if (e.key === 'Escape') {
          setTextInput(null)
          setTextValue('')
        }
        return // Don't intercept keys while typing
      }
      if (e.key === 'Escape') onCancel()
      if (e.key === 'z' && (e.metaKey || e.ctrlKey) && strokes.length > 0) {
        e.preventDefault()
        handleUndo()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onCancel, handleUndo, strokes.length, textInput])

  if (canvasSize.width === 0) {
    return (
      <div className="fixed inset-0 z-[9999] bg-black/80 flex items-center justify-center">
        <div className="text-white text-sm">Laden...</div>
      </div>
    )
  }

  const toolDefs: { key: Tool; icon: typeof Pencil; label: string }[] = [
    { key: 'pen', icon: Pencil, label: 'Pen' },
    { key: 'rect', icon: Square, label: 'Rechthoek' },
    { key: 'arrow', icon: MoveUpRight, label: 'Pijl' },
    { key: 'text', icon: Type, label: 'Tekst' },
  ]

  return (
    <div className="fixed inset-0 z-[9999] bg-black/80 flex flex-col items-center" data-feedback-overlay>
      {/* Toolbar */}
      <div className="flex items-center gap-1 bg-[#0E3261] rounded-lg shadow-xl px-2 py-1.5 mt-4 z-10">
        {toolDefs.map(({ key, icon: Icon, label }) => (
          <button
            key={key}
            onClick={() => {
              if (textInput && textValue.trim()) commitTextInput()
              else { setTextInput(null); setTextValue('') }
              setTool(key)
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              tool === key
                ? 'bg-white/20 text-white ring-1 ring-[#E62D75]'
                : 'text-white/70 hover:text-white hover:bg-white/10'
            }`}
            title={label}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}

        <div className="w-px h-5 bg-white/20 mx-1" />

        <button
          onClick={handleUndo}
          disabled={strokes.length === 0}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white/70 hover:text-white hover:bg-white/10 rounded-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          title="Ongedaan maken (Ctrl+Z)"
        >
          <Undo2 className="w-3.5 h-3.5" />
          Ongedaan
        </button>

        <div className="w-px h-5 bg-white/20 mx-1" />

        <button
          onClick={onCancel}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white/70 hover:text-white hover:bg-white/10 rounded-md transition-colors"
          title="Annuleren (Esc)"
        >
          <X className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={handleDone}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[#E62D75] text-white rounded-md hover:bg-[#d0256a] transition-colors"
        >
          <Check className="w-3.5 h-3.5" />
          Klaar
        </button>
      </div>

      {/* Canvas area */}
      <div
        ref={containerRef}
        className="flex-1 flex items-center justify-center p-4 w-full overflow-auto"
      >
        <div className="relative shadow-2xl" style={{ cursor: tool === 'text' ? 'text' : 'crosshair' }}>
          <canvas
            ref={bgCanvasRef}
            width={canvasSize.width}
            height={canvasSize.height}
            className="block max-w-full max-h-[calc(100vh-80px)] object-contain"
            style={{ width: 'auto', height: 'auto', maxWidth: '100%', maxHeight: 'calc(100vh - 80px)' }}
          />
          <canvas
            ref={drawCanvasRef}
            width={canvasSize.width}
            height={canvasSize.height}
            className="absolute inset-0 block"
            style={{ width: '100%', height: '100%' }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          />
          {/* Floating text input */}
          {textInput && (
            <input
              ref={textInputRef}
              type="text"
              value={textValue}
              onChange={(e) => setTextValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitTextInput()
                if (e.key === 'Escape') { setTextInput(null); setTextValue('') }
              }}
              onBlur={() => {
                // Small delay so clicking another spot on canvas works
                setTimeout(() => commitTextInput(), 100)
              }}
              className="absolute bg-white/90 border-2 border-[#E62D75] rounded px-2 py-1 font-bold outline-none shadow-sm"
              style={{
                left: textInput.screenX,
                top: textInput.screenY,
                color: STROKE_COLOR,
                fontSize: '18px',
                minWidth: '120px',
                maxWidth: '400px',
                zIndex: 10,
              }}
              placeholder="Type hier..."
            />
          )}
        </div>
      </div>
    </div>
  )
}
