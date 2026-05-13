import { Radio, UsersRound } from 'lucide-react'

type GameHeaderProps = {
  connectionState: 'connecting' | 'connected' | 'local' | 'error'
  isArtist: boolean
  onRoleChange: (isArtist: boolean) => void
}

const STATUS_LABEL = {
  connecting: '连接中',
  connected: 'Pusher 在线',
  local: '本地预览',
  error: '连接异常',
}

export function GameHeader({
  connectionState,
  isArtist,
  onRoleChange,
}: GameHeaderProps) {
  return (
    <header className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
      <div>
        <p className="text-sm font-medium text-slate-500">Multiplayer Sketch</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-normal text-slate-950 md:text-5xl">
          多人联机你画我猜
        </h1>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-black/[0.06] bg-white/55 px-4 py-2 text-sm text-slate-600 backdrop-blur-xl">
          <Radio className="h-4 w-4" />
          {STATUS_LABEL[connectionState]}
        </div>

        <div className="inline-flex rounded-full border border-black/[0.06] bg-white/55 p-1 backdrop-blur-xl">
          <button
            type="button"
            onClick={() => onRoleChange(true)}
            className={`h-10 rounded-full px-4 text-sm font-medium transition ${
              isArtist ? 'bg-slate-950 text-white' : 'text-slate-600'
            }`}
          >
            画师
          </button>
          <button
            type="button"
            onClick={() => onRoleChange(false)}
            className={`inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-medium transition ${
              !isArtist ? 'bg-slate-950 text-white' : 'text-slate-600'
            }`}
          >
            <UsersRound className="h-4 w-4" />
            猜题
          </button>
        </div>
      </div>
    </header>
  )
}
