import { useCallback, useMemo, useState } from 'react'
import { ChatPanel } from './components/ChatPanel'
import { DrawingCanvas } from './components/DrawingCanvas'
import { GameHeader } from './components/GameHeader'
import { GlassPanel } from './components/GlassPanel'
import { Toolbar } from './components/Toolbar'
import { WORD_BANK } from './data/words'
import { useRealtimeRoom } from './hooks/useRealtimeRoom'
import type { ChatMessage, DrawPath, SyncPayload } from './types'

function pickNextWord(currentWord: string) {
  const candidates = WORD_BANK.filter((word) => word !== currentWord)
  return candidates[Math.floor(Math.random() * candidates.length)]
}

function App() {
  const [paths, setPaths] = useState<DrawPath[]>([])
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [currentWord, setCurrentWord] = useState(WORD_BANK[0])
  const [color, setColor] = useState('#111827')
  const [width, setWidth] = useState(6)
  const [isArtist, setIsArtist] = useState(true)

  const handleRemotePayload = useCallback((payload: SyncPayload) => {
    if (payload.type === 'path') {
      setPaths((items) =>
        items.some((item) => item.id === payload.path.id)
          ? items
          : [...items, payload.path],
      )
    }

    if (payload.type === 'clear') {
      setPaths([])
    }

    if (payload.type === 'undo') {
      setPaths((items) => items.filter((item) => item.id !== payload.pathId))
    }

    if (payload.type === 'chat') {
      setMessages((items) =>
        items.some((item) => item.id === payload.message.id)
          ? items
          : [...items, payload.message],
      )
    }

    if (payload.type === 'word') {
      setCurrentWord(payload.word)
      setMessages((items) => [
        ...items,
        {
          id: crypto.randomUUID(),
          author: '系统',
          text: '画师换题了，新回合开始。',
          createdAt: Date.now(),
        },
      ])
    }
  }, [])

  const { connectionState, publish } = useRealtimeRoom(handleRemotePayload)

  const addPath = (path: DrawPath) => {
    setPaths((items) => [...items, path])
    publish({ type: 'path', path })
  }

  const undo = () => {
    const lastPath = paths.at(-1)
    if (!lastPath) return
    setPaths((items) => items.slice(0, -1))
    publish({ type: 'undo', pathId: lastPath.id })
  }

  const clear = () => {
    setPaths([])
    publish({ type: 'clear' })
  }

  const sendGuess = (text: string) => {
    const matched = text.trim().toLowerCase() === currentWord.toLowerCase()
    const message: ChatMessage = {
      id: crypto.randomUUID(),
      author: isArtist ? '画师' : '玩家',
      text: matched ? `${text}，答对了。` : text,
      createdAt: Date.now(),
      matched,
    }
    setMessages((items) => [...items, message])
    publish({ type: 'chat', message })
  }

  const nextWord = () => {
    const next = pickNextWord(currentWord)
    setCurrentWord(next)
    setMessages((items) => [
      ...items,
      {
        id: crypto.randomUUID(),
        author: '系统',
        text: '已切换题目，新回合开始。',
        createdAt: Date.now(),
      },
    ])
    publish({ type: 'word', word: next })
  }

  const progressText = useMemo(() => {
    if (isArtist) return `当前题目：${currentWord}`
    return `提示：${currentWord.length} 个字`
  }, [currentWord, isArtist])

  return (
    <main className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(191,219,254,0.80),transparent_34%),linear-gradient(135deg,#f8fafc_0%,#eef6f3_45%,#f7eef8_100%)] px-4 py-5 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <GameHeader
          connectionState={connectionState}
          isArtist={isArtist}
          onRoleChange={setIsArtist}
        />

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
          <GlassPanel className="p-4 sm:p-5">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Canvas</p>
                <h2 className="text-2xl font-semibold tracking-normal text-slate-950">
                  {progressText}
                </h2>
              </div>
              <div className="rounded-full border border-black/[0.06] bg-white/55 px-4 py-2 text-sm text-slate-500">
                {paths.length} 条轨迹
              </div>
            </div>

            <div className="space-y-4">
              <DrawingCanvas
                paths={paths}
                color={color}
                width={width}
                onPathComplete={addPath}
              />
              <Toolbar
                color={color}
                width={width}
                canUndo={paths.length > 0}
                onColorChange={setColor}
                onWidthChange={setWidth}
                onUndo={undo}
                onClear={clear}
              />
            </div>
          </GlassPanel>

          <ChatPanel
            messages={messages}
            currentWord={currentWord}
            isArtist={isArtist}
            onSendGuess={sendGuess}
            onNextWord={nextWord}
          />
        </div>
      </div>
    </main>
  )
}

export default App
