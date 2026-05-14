import { Crown, Radio, UsersRound } from 'lucide-react'
import type { Role } from '../types'

type GameHeaderProps = {
  connectionState: 'connecting' | 'connected' | 'local' | 'error'
  role: Role
  playerName: string
  drawerName: string
}

const STATUS_LABEL = {
  connecting: '连接中',
  connected: '房间在线',
  local: '本地演示',
  error: '连接异常',
}

const ROLE_LABEL: Record<Exclude<Role, null>, string> = {
  drawer: '画师',
  guesser: '猜题人',
}

export function GameHeader({
  connectionState,
  role,
  playerName,
  drawerName,
}: GameHeaderProps) {
  return (
    <header className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
      <div>
        <p className="text-sm font-medium text-slate-500">Multiplayer Sketch Room</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-normal text-slate-950 md:text-5xl">
          多人联机你画我猜
        </h1>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-black/[0.06] bg-white/55 px-4 py-2 text-sm text-slate-600 backdrop-blur-xl">
          <Radio className="h-4 w-4" />
          {STATUS_LABEL[connectionState]}
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-black/[0.06] bg-white/55 px-4 py-2 text-sm text-slate-600 backdrop-blur-xl">
          <UsersRound className="h-4 w-4" />
          {playerName}
          <span className="text-slate-400">
            {role ? `· ${ROLE_LABEL[role]}` : '· 待选择'}
          </span>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-black/[0.06] bg-white/55 px-4 py-2 text-sm text-slate-600 backdrop-blur-xl">
          <Crown className="h-4 w-4" />
          当前画师：{drawerName || '等待认领'}
        </div>
      </div>
    </header>
  )
}
