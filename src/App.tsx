import { useEffect, useRef, useState } from 'react'
import { ChatPanel } from './components/ChatPanel'
import { DrawingCanvas } from './components/DrawingCanvas'
import { GameHeader } from './components/GameHeader'
import { GlassPanel } from './components/GlassPanel'
import { RoundResultOverlay, WelcomeModal } from './components/WelcomeModal'
import { Toolbar } from './components/Toolbar'
import { useRealtimeRoom } from './hooks/useRealtimeRoom'
import type {
  ChatMessage,
  DrawPath,
  GameState,
  GuessCorrectPayload,
  Role,
  RoleClaimPayload,
  SetWordPayload,
  SyncPayload,
} from './types'

type RoundResult = {
  winnerId: string
  winnerName: string
  word: string
}

function createSystemMessage(text: string): ChatMessage {
  return {
    id: crypto.randomUUID(),
    author: '系统',
    text,
    createdAt: Date.now(),
  }
}

function normalizeAnswer(value: string) {
  return value.trim().toLowerCase()
}

function App() {
  const [role, setRole] = useState<Role>(null)
  const [gameState, setGameState] = useState<GameState>('idle')
  const [currentWord, setCurrentWord] = useState('')
  const [wordDraft, setWordDraft] = useState('')
  const [paths, setPaths] = useState<DrawPath[]>([])
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [color, setColor] = useState('#111827')
  const [width, setWidth] = useState(6)
  const [drawerName, setDrawerName] = useState('')
  const [roundResult, setRoundResult] = useState<RoundResult | null>(null)
  const transitionTimerRef = useRef<number | null>(null)

  const {
    connectionState,
    playerId,
    playerName,
    publishSync,
    claimRole,
    setWord,
    guessCorrect,
  } = useRealtimeRoom({
    onSyncPayload: handleSyncPayload,
    onRoleClaim: handleRoleClaim,
    onSetWord: handleSetWord,
    onGuessCorrect: handleGuessCorrect,
  })

  useEffect(() => {
    return () => {
      if (transitionTimerRef.current) {
        window.clearTimeout(transitionTimerRef.current)
      }
    }
  }, [])

  function handleSyncPayload(payload: SyncPayload) {
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
  }

  function handleRoleClaim(payload: RoleClaimPayload) {
    setDrawerName(payload.playerName)
    setCurrentWord('')
    setWordDraft('')
    setPaths([])
    setGameState('idle')
    setRoundResult(null)
    setRole(payload.playerId === playerId ? 'drawer' : 'guesser')
    setMessages((items) => [
      ...items,
      createSystemMessage(`${payload.playerName} 成为了本轮画师。`),
    ])
  }

  function handleSetWord(payload: SetWordPayload) {
    setDrawerName(payload.drawerName)
    setCurrentWord(payload.word)
    setWordDraft('')
    setPaths([])
    setGameState('drawing')
    setRoundResult(null)
    setMessages((items) => [
      ...items,
      createSystemMessage(`${payload.drawerName} 已经开始作画。`),
    ])
  }

  function finishRoundTransition(payload: GuessCorrectPayload) {
    setRole(payload.winnerId === playerId ? 'drawer' : 'guesser')
    setDrawerName(payload.winnerName)
    setCurrentWord('')
    setWordDraft('')
    setPaths([])
    setGameState('idle')
    setRoundResult(null)
    setMessages((items) => [
      ...items,
      createSystemMessage(`${payload.winnerName} 获胜，等待新画师输入下一题。`),
    ])
  }

  function handleGuessCorrect(payload: GuessCorrectPayload) {
    if (transitionTimerRef.current) {
      window.clearTimeout(transitionTimerRef.current)
    }

    setPaths([])
    setGameState('animating')
    setRoundResult({
      winnerId: payload.winnerId,
      winnerName: payload.winnerName,
      word: payload.word,
    })
    setMessages((items) => [
      ...items,
      createSystemMessage(`${payload.winnerName} 抢答成功，答案是 ${payload.word}。`),
    ])

    transitionTimerRef.current = window.setTimeout(() => {
      finishRoundTransition(payload)
      transitionTimerRef.current = null
    }, 3000)
  }

  function clearCanvas(sync = true) {
    setPaths([])
    if (sync) publishSync({ type: 'clear' })
  }

  function addPath(path: DrawPath) {
    setPaths((items) => [...items, path])
    publishSync({ type: 'path', path })
  }

  function undo() {
    const lastPath = paths.at(-1)
    if (!lastPath) return
    setPaths((items) => items.slice(0, -1))
    publishSync({ type: 'undo', pathId: lastPath.id })
  }

  function chooseDrawer() {
    setRole('drawer')
    setDrawerName(playerName)
    setCurrentWord('')
    setGameState('idle')
    setMessages((items) => [
      ...items,
      createSystemMessage(`${playerName} 认领了画师身份。`),
    ])
    claimRole()
  }

  function chooseGuesser() {
    setRole('guesser')
  }

  function startDrawing() {
    const value = wordDraft.trim()
    if (!value || role !== 'drawer') return

    clearCanvas(true)
    setCurrentWord(value)
    setGameState('drawing')
    setMessages((items) => [
      ...items,
      createSystemMessage('新回合开始，请大家开始猜题。'),
    ])
    setWord(value)
  }

  function submitGuess(text: string) {
    const matched =
      gameState === 'drawing' &&
      role === 'guesser' &&
      normalizeAnswer(text) === normalizeAnswer(currentWord)

    const message: ChatMessage = {
      id: crypto.randomUUID(),
      author: playerName,
      text: matched ? `${text}，答对了。` : text,
      createdAt: Date.now(),
      matched,
    }

    setMessages((items) => [...items, message])
    publishSync({ type: 'chat', message })

    if (matched) {
      clearCanvas(true)
      const result = { winnerId: playerId, winnerName: playerName, word: currentWord }
      handleGuessCorrect(result)
      guessCorrect(currentWord)
    }
  }

  const canDraw = role === 'drawer' && gameState === 'drawing'
  const showWordComposer = role === 'drawer' && gameState === 'idle'

  const progressText =
    role === 'drawer'
      ? gameState === 'drawing'
        ? `当前词语：${currentWord}`
        : '输入一个词语，开启新回合'
      : currentWord
        ? `猜猜看，一共 ${currentWord.length} 个字`
        : '等待画师出题'

  return (
    <main className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(191,219,254,0.80),transparent_34%),linear-gradient(135deg,#f8fafc_0%,#eef6f3_45%,#f7eef8_100%)] px-4 py-5 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <GameHeader
          connectionState={connectionState}
          role={role}
          playerName={playerName}
          drawerName={drawerName}
        />

        <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
          {role === null && (
            <WelcomeModal
              onChooseDrawer={chooseDrawer}
              onChooseGuesser={chooseGuesser}
            />
          )}

          <RoundResultOverlay
            open={gameState === 'animating' && !!roundResult}
            winnerName={roundResult?.winnerName ?? ''}
            word={roundResult?.word ?? ''}
          />

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

            {showWordComposer ? (
              <div className="flex min-h-[540px] items-center justify-center">
                <div className="w-full max-w-2xl rounded-[28px] border border-black/[0.06] bg-white/76 p-8 text-center shadow-inner">
                  <p className="text-sm uppercase tracking-[0.22em] text-slate-400">
                    New prompt
                  </p>
                  <h3 className="mt-4 text-3xl font-semibold text-slate-950">
                    请输入你要画的词语
                  </h3>
                  <p className="mt-3 text-sm text-slate-500">
                    词语会同步给所有玩家，但只有你能直接看到它。
                  </p>
                  <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                    <input
                      value={wordDraft}
                      onChange={(event) => setWordDraft(event.target.value)}
                      placeholder="例如：资产负债表、咖啡机、便利店"
                      className="h-14 flex-1 rounded-full border border-black/[0.06] bg-white px-5 text-base outline-none transition placeholder:text-slate-400 focus:border-slate-300"
                    />
                    <button
                      type="button"
                      onClick={startDrawing}
                      className="h-14 rounded-full bg-slate-950 px-6 text-sm font-medium text-white transition hover:bg-slate-800"
                    >
                      开始作画
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <DrawingCanvas
                  paths={paths}
                  color={color}
                  width={width}
                  disabled={!canDraw}
                  disabledLabel={
                    role === 'guesser'
                      ? '猜题人不可作画'
                      : gameState === 'animating'
                        ? '身份切换中'
                        : '等待你输入新题目'
                  }
                  onPathComplete={addPath}
                />
                <Toolbar
                  color={color}
                  width={width}
                  canUndo={paths.length > 0}
                  disabled={!canDraw}
                  onColorChange={setColor}
                  onWidthChange={setWidth}
                  onUndo={undo}
                  onClear={() => clearCanvas(true)}
                />
              </div>
            )}
          </GlassPanel>

          <ChatPanel
            messages={messages}
            role={role}
            gameState={gameState}
            currentWord={currentWord}
            drawerName={drawerName}
            onSendGuess={submitGuess}
          />
        </div>
      </div>
    </main>
  )
}

export default App
