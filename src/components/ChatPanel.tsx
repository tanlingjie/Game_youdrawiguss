import { Crown, MessageCircle, Send } from 'lucide-react'
import { useState } from 'react'
import type { ChatMessage, GameState, Role } from '../types'

type ChatPanelProps = {
  messages: ChatMessage[]
  role: Role
  gameState: GameState
  currentWord: string
  drawerName: string
  onSendGuess: (text: string) => void
}

function buildHint(word: string) {
  if (!word) return '等待本回合词语'
  return `${'• '.repeat(word.length).trim()} · 共 ${word.length} 个字`
}

export function ChatPanel({
  messages,
  role,
  gameState,
  currentWord,
  drawerName,
  onSendGuess,
}: ChatPanelProps) {
  const [draft, setDraft] = useState('')

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const value = draft.trim()
    if (!value) return
    onSendGuess(value)
    setDraft('')
  }

  const canGuess = role === 'guesser' && gameState === 'drawing'

  return (
    <aside className="flex h-full min-h-[560px] flex-col rounded-[28px] border border-white/55 bg-white/55 p-5 shadow-[0_24px_70px_rgba(31,41,55,0.10)] backdrop-blur-2xl">
      <div className="flex items-start justify-between gap-4 border-b border-black/[0.06] pb-5">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
            Round status
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">
            {role === 'drawer' && gameState === 'drawing'
              ? currentWord
              : role === 'guesser'
                ? buildHint(currentWord)
                : '准备开始'}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {role === 'drawer'
              ? gameState === 'idle'
                ? '输入你想让大家猜的词语。'
                : '你是画师，用画面给出线索。'
              : drawerName
                ? `${drawerName} 正在出题。`
                : '等待有人认领画师身份。'}
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-black/[0.06] bg-white/70 px-3 py-2 text-sm text-slate-600">
          <Crown className="h-4 w-4" />
          {drawerName || '暂无'}
        </div>
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
            <p className="text-sm">
              {role === 'guesser' ? '第一位抢答者会成为下一轮画师。' : '新一轮即将开始。'}
            </p>
          </div>
        )}
      </div>

      <form onSubmit={submit} className="flex gap-2 border-t border-black/[0.06] pt-4">
        <input
          value={draft}
          disabled={!canGuess}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={
            canGuess ? '输入你的猜测并按回车…' : '等待作画开始后再抢答'
          }
          className="min-w-0 flex-1 rounded-full border border-black/[0.06] bg-white/75 px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-300 focus:bg-white disabled:cursor-not-allowed disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!canGuess}
          className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-slate-950 text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
          aria-label="发送猜测"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </aside>
  )
}
