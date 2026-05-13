import { MessageCircle, Send, Sparkles } from 'lucide-react'
import { useState } from 'react'
import type { ChatMessage } from '../types'

type ChatPanelProps = {
  messages: ChatMessage[]
  currentWord: string
  isArtist: boolean
  onSendGuess: (text: string) => void
  onNextWord: () => void
}

export function ChatPanel({
  messages,
  currentWord,
  isArtist,
  onSendGuess,
  onNextWord,
}: ChatPanelProps) {
  const [draft, setDraft] = useState('')

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const value = draft.trim()
    if (!value) return
    onSendGuess(value)
    setDraft('')
  }

  return (
    <aside className="flex h-full min-h-[560px] flex-col rounded-[28px] border border-white/55 bg-white/55 p-5 shadow-[0_24px_70px_rgba(31,41,55,0.10)] backdrop-blur-2xl">
      <div className="flex items-start justify-between gap-4 border-b border-black/[0.06] pb-5">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
            Round word
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">
            {isArtist ? currentWord : '猜猜看'}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {isArtist ? '你是画师，用画面提示大家。' : '输入你的答案。'}
          </p>
        </div>
        {isArtist && (
          <button
            type="button"
            onClick={onNextWord}
            className="inline-flex h-11 shrink-0 items-center gap-2 rounded-full border border-black/[0.06] bg-slate-950 px-4 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800"
          >
            <Sparkles className="h-4 w-4" />
            换一题
          </button>
        )}
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto py-5">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`rounded-2xl border px-4 py-3 ${
              message.matched
                ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                : 'border-black/[0.05] bg-white/65 text-slate-700'
            }`}
          >
            <div className="mb-1 flex items-center justify-between gap-3">
              <span className="text-xs font-semibold text-slate-500">
                {message.author}
              </span>
              <span className="text-[11px] text-slate-400">
                {new Date(message.createdAt).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
            <p className="break-words text-sm">{message.text}</p>
          </div>
        ))}

        {messages.length === 0 && (
          <div className="flex h-full min-h-64 flex-col items-center justify-center rounded-3xl border border-dashed border-black/[0.08] bg-white/35 text-center text-slate-400">
            <MessageCircle className="mb-3 h-7 w-7" />
            <p className="text-sm">还没有猜测，先画一笔。</p>
          </div>
        )}
      </div>

      <form onSubmit={submit} className="flex gap-2 border-t border-black/[0.06] pt-4">
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="输入猜测..."
          className="min-w-0 flex-1 rounded-full border border-black/[0.06] bg-white/75 px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-300 focus:bg-white"
        />
        <button
          type="submit"
          className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-slate-950 text-white transition hover:bg-slate-800"
          aria-label="发送"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </aside>
  )
}
