import type { PropsWithChildren } from 'react'

type GlassPanelProps = PropsWithChildren<{
  className?: string
}>

export function GlassPanel({ children, className = '' }: GlassPanelProps) {
  return (
    <section
      className={`rounded-[28px] border border-white/55 bg-white/55 shadow-[0_24px_70px_rgba(31,41,55,0.10)] backdrop-blur-2xl ${className}`}
    >
      {children}
    </section>
  )
}
