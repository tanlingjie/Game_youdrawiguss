import { Brush, Eraser, RotateCcw, Trash2 } from 'lucide-react'

type ToolbarProps = {
  color: string
  width: number
  canUndo: boolean
  disabled?: boolean
  onColorChange: (color: string) => void
  onWidthChange: (width: number) => void
  onUndo: () => void
  onClear: () => void
}

const COLORS = ['#111827', '#2563eb', '#ef4444', '#16a34a', '#f59e0b']

export function Toolbar({
  color,
  width,
  canUndo,
  disabled = false,
  onColorChange,
  onWidthChange,
  onUndo,
  onClear,
}: ToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-black/[0.06] bg-white/45 p-2 backdrop-blur-xl">
      <div className="flex items-center gap-1 rounded-xl bg-white/70 p-1">
        {COLORS.map((item) => (
          <button
            key={item}
            type="button"
            aria-label={`选择 ${item}`}
            disabled={disabled}
            onClick={() => onColorChange(item)}
            className={`h-8 w-8 rounded-full border transition ${
              color === item
                ? 'border-slate-950 shadow-[0_0_0_3px_rgba(17,24,39,0.10)]'
                : 'border-black/5'
            } disabled:cursor-not-allowed disabled:opacity-40`}
            style={{ backgroundColor: item }}
          />
        ))}
      </div>

      <label className="flex min-w-44 items-center gap-2 rounded-xl bg-white/70 px-3 py-2 text-sm text-slate-600">
        <Brush className="h-4 w-4" />
        <input
          aria-label="画笔粗细"
          type="range"
          min="2"
          max="18"
          disabled={disabled}
          value={width}
          onChange={(event) => onWidthChange(Number(event.target.value))}
          className="w-24 accent-slate-900 disabled:opacity-40"
        />
        <span className="w-6 text-right">{width}</span>
      </label>

      <button
        type="button"
        onClick={onUndo}
        disabled={disabled || !canUndo}
        className="inline-flex h-11 items-center gap-2 rounded-xl border border-black/[0.06] bg-white/70 px-4 text-sm font-medium text-slate-700 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
      >
        <RotateCcw className="h-4 w-4" />
        撤销
      </button>
      <button
        type="button"
        onClick={onClear}
        disabled={disabled}
        className="inline-flex h-11 items-center gap-2 rounded-xl border border-black/[0.06] bg-white/70 px-4 text-sm font-medium text-slate-700 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Trash2 className="h-4 w-4" />
        清空
      </button>
      <div className="ml-auto hidden items-center gap-2 rounded-xl bg-white/50 px-3 py-2 text-xs text-slate-500 sm:flex">
        <Eraser className="h-4 w-4" />
        平滑笔触
      </div>
    </div>
  )
}
