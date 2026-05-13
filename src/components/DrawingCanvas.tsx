import { useEffect, useRef, useState } from 'react'
import type { DrawPath, Point } from '../types'

type DrawingCanvasProps = {
  paths: DrawPath[]
  color: string
  width: number
  onPathComplete: (path: DrawPath) => void
}

function drawPath(context: CanvasRenderingContext2D, path: DrawPath) {
  if (path.points.length < 1) return

  context.strokeStyle = path.color
  context.lineWidth = path.width
  context.lineCap = 'round'
  context.lineJoin = 'round'

  context.beginPath()
  context.moveTo(path.points[0].x, path.points[0].y)

  if (path.points.length === 1) {
    context.lineTo(path.points[0].x + 0.1, path.points[0].y + 0.1)
  } else {
    for (let index = 1; index < path.points.length - 1; index += 1) {
      const current = path.points[index]
      const next = path.points[index + 1]
      const midPoint = {
        x: (current.x + next.x) / 2,
        y: (current.y + next.y) / 2,
      }
      context.quadraticCurveTo(current.x, current.y, midPoint.x, midPoint.y)
    }
    const last = path.points[path.points.length - 1]
    context.lineTo(last.x, last.y)
  }

  context.stroke()
}

export function DrawingCanvas({
  paths,
  color,
  width,
  onPathComplete,
}: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const currentPathRef = useRef<DrawPath | null>(null)
  const [isDrawing, setIsDrawing] = useState(false)

  const getCanvasPoint = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return null
    const rect = canvas.getBoundingClientRect()
    return {
      x: ((event.clientX - rect.left) / rect.width) * canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * canvas.height,
      t: performance.now(),
    } satisfies Point
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      const ratio = window.devicePixelRatio || 1
      canvas.width = Math.floor(rect.width * ratio)
      canvas.height = Math.floor(rect.height * ratio)

      const context = canvas.getContext('2d')
      if (!context) return
      context.clearRect(0, 0, canvas.width, canvas.height)
      paths.forEach((path) => drawPath(context, path))
    }

    resize()
    const observer = new ResizeObserver(resize)
    observer.observe(canvas)
    return () => observer.disconnect()
  }, [paths])

  const redrawWithCurrentPath = () => {
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')
    if (!canvas || !context) return
    context.clearRect(0, 0, canvas.width, canvas.height)
    paths.forEach((path) => drawPath(context, path))
    if (currentPathRef.current) drawPath(context, currentPathRef.current)
  }

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const point = getCanvasPoint(event)
    if (!point) return
    event.currentTarget.setPointerCapture(event.pointerId)
    currentPathRef.current = {
      id: crypto.randomUUID(),
      color,
      width,
      points: [point],
    }
    setIsDrawing(true)
    redrawWithCurrentPath()
  }

  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !currentPathRef.current) return
    const point = getCanvasPoint(event)
    if (!point) return

    const last = currentPathRef.current.points.at(-1)
    if (last && Math.hypot(point.x - last.x, point.y - last.y) < 3) return

    currentPathRef.current.points.push(point)
    redrawWithCurrentPath()
  }

  const finishPath = () => {
    if (!currentPathRef.current) return
    const path = currentPathRef.current
    currentPathRef.current = null
    setIsDrawing(false)
    if (path.points.length > 0) {
      onPathComplete(path)
    }
  }

  return (
    <canvas
      ref={canvasRef}
      className="h-[58vh] min-h-[420px] w-full touch-none rounded-[24px] border border-black/[0.06] bg-white/85 shadow-inner outline-none"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={finishPath}
      onPointerCancel={finishPath}
      aria-label="你画我猜画板"
    />
  )
}
