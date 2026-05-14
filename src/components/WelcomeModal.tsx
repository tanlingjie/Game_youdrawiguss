import { Pencil, Sparkles } from 'lucide-react'

type WelcomeModalProps = {
  onChooseDrawer: () => void
  onChooseGuesser: () => void
}

export function WelcomeModal({
  onChooseDrawer,
  onChooseGuesser,
}: WelcomeModalProps) {
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-[rgba(236,242,248,0.52)] px-4 backdrop-blur-xl">
      <div className="w-full max-w-xl rounded-[32px] border border-white/70 bg-white/72 p-8 text-center shadow-[0_30px_100px_rgba(15,23,42,0.16)]">
        <p className="text-sm font-medium uppercase tracking-[0.24em] text-slate-400">
          Join round
        </p>
        <h2 className="mt-3 text-4xl font-semibold tracking-normal text-slate-950">
          选择你的身份
        </h2>
        <p className="mt-3 text-sm leading-6 text-slate-500">
          第一位抢到正确答案的人，会在下一轮自动升为画师。
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <button
            type="button"
            onClick={onChooseDrawer}
            className="rounded-[26px] border border-black/[0.06] bg-slate-950 px-6 py-6 text-left text-white shadow-sm transition hover:bg-slate-800"
          >
            <Pencil className="h-6 w-6" />
            <p className="mt-6 text-2xl font-semibold">我要当画师</p>
            <p className="mt-2 text-sm text-slate-300">出题、作画，并掌控新回合的开始。</p>
          </button>
          <button
            type="button"
            onClick={onChooseGuesser}
            className="rounded-[26px] border border-black/[0.06] bg-white/85 px-6 py-6 text-left text-slate-900 shadow-sm transition hover:bg-white"
          >
            <Sparkles className="h-6 w-6 text-slate-500" />
            <p className="mt-6 text-2xl font-semibold">我要猜题</p>
            <p className="mt-2 text-sm text-slate-500">观察线索，抢答成功后直接接管下一轮。</p>
          </button>
        </div>
      </div>
    </div>
  )
}

type RoundResultOverlayProps = {
  open: boolean
  winnerName: string
  word: string
}

export function RoundResultOverlay({
  open,
  winnerName,
  word,
}: RoundResultOverlayProps) {
  if (!open) return null

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-[rgba(15,23,42,0.22)] px-4 backdrop-blur-lg">
      <div className="animate-round-pop w-full max-w-2xl rounded-[32px] border border-white/75 bg-white/82 p-8 text-center shadow-[0_35px_120px_rgba(15,23,42,0.22)]">
        <div className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
          <Sparkles className="h-8 w-8" />
        </div>
        <h2 className="mt-6 text-4xl font-semibold tracking-normal text-slate-950">
          恭喜 {winnerName} 猜对了
        </h2>
        <p className="mt-4 text-lg text-slate-600">答案是 “{word}”</p>
        <p className="mt-3 text-sm uppercase tracking-[0.22em] text-slate-400">
          身份互换中…
        </p>
      </div>
    </div>
  )
}
