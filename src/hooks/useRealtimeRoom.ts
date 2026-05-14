import { useEffect, useMemo, useRef, useState } from 'react'
import Pusher, { type Channel } from 'pusher-js'
import type {
  GuessCorrectPayload,
  RoleClaimPayload,
  SetWordPayload,
  SyncPayload,
} from '../types'

declare global {
  interface Window {
    pusher?: Pusher
  }
}

type ConnectionState = 'connecting' | 'connected' | 'local' | 'error'
type OutgoingSyncPayload = SyncPayload extends infer Payload
  ? Payload extends { senderId: string }
    ? Omit<Payload, 'senderId'>
    : never
  : never

type BroadcastEvent =
  | { kind: 'sync'; payload: SyncPayload; senderId: string }
  | { kind: 'role-claim'; payload: RoleClaimPayload; senderId: string }
  | { kind: 'set-word'; payload: SetWordPayload; senderId: string }
  | { kind: 'guess-correct'; payload: GuessCorrectPayload; senderId: string }

type UseRealtimeRoomOptions = {
  onSyncPayload: (payload: SyncPayload) => void
  onRoleClaim: (payload: RoleClaimPayload) => void
  onSetWord: (payload: SetWordPayload) => void
  onGuessCorrect: (payload: GuessCorrectPayload) => void
}

const CHANNEL_NAME = 'presence-draw-room'
const SYNC_EVENT = 'client-sketch-sync'
const ROLE_CLAIM_EVENT = 'client-role-claim'
const SET_WORD_EVENT = 'client-set-word'
const GUESS_CORRECT_EVENT = 'client-guess-correct'

function getPlayerName() {
  const storageKey = 'draw-and-guess-player-name'
  const existing =
    typeof window !== 'undefined' ? window.localStorage.getItem(storageKey) : null

  if (existing) return existing

  const generated = `玩家${Math.random().toString(36).slice(2, 6).toUpperCase()}`
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(storageKey, generated)
  }
  return generated
}

export function useRealtimeRoom({
  onSyncPayload,
  onRoleClaim,
  onSetWord,
  onGuessCorrect,
}: UseRealtimeRoomOptions) {
  const [connectionState, setConnectionState] = useState<ConnectionState>(() =>
    import.meta.env.VITE_PUSHER_KEY && import.meta.env.VITE_PUSHER_CLUSTER
      ? 'connecting'
      : 'local',
  )
  const playerId = useMemo(() => crypto.randomUUID(), [])
  const playerName = useMemo(() => getPlayerName(), [])
  const channelRef = useRef<Channel | null>(null)
  const broadcastRef = useRef<BroadcastChannel | null>(null)
  const syncHandlerRef = useRef(onSyncPayload)
  const roleClaimHandlerRef = useRef(onRoleClaim)
  const setWordHandlerRef = useRef(onSetWord)
  const guessCorrectHandlerRef = useRef(onGuessCorrect)

  useEffect(() => {
    syncHandlerRef.current = onSyncPayload
    roleClaimHandlerRef.current = onRoleClaim
    setWordHandlerRef.current = onSetWord
    guessCorrectHandlerRef.current = onGuessCorrect
  }, [onGuessCorrect, onRoleClaim, onSetWord, onSyncPayload])

  useEffect(() => {
    const key = import.meta.env.VITE_PUSHER_KEY
    const cluster = import.meta.env.VITE_PUSHER_CLUSTER

    if (!key || !cluster) {
      const broadcast = new BroadcastChannel('draw-and-guess-preview-room')
      broadcastRef.current = broadcast
      broadcast.onmessage = (event: MessageEvent<BroadcastEvent>) => {
        if (event.data.senderId === playerId) return

        if (event.data.kind === 'sync') syncHandlerRef.current(event.data.payload)
        if (event.data.kind === 'role-claim') {
          roleClaimHandlerRef.current(event.data.payload)
        }
        if (event.data.kind === 'set-word') setWordHandlerRef.current(event.data.payload)
        if (event.data.kind === 'guess-correct') {
          guessCorrectHandlerRef.current(event.data.payload)
        }
      }

      return () => broadcast.close()
    }

    const pusher = new Pusher(key, {
      cluster,
      forceTLS: true,
      authEndpoint: '/api/pusher/auth',
      enabledTransports: ['ws', 'xhr_streaming'],
    })
    window.pusher = pusher

    pusher.connection.bind('connected', () => setConnectionState('connected'))
    pusher.connection.bind('error', (error: unknown) => {
      console.error('Pusher connection error:', error)
      setConnectionState('error')
    })

    const channel = pusher.subscribe(CHANNEL_NAME)
    channelRef.current = channel

    channel.bind('pusher:subscription_succeeded', () => {
      setConnectionState('connected')
    })
    channel.bind('pusher:subscription_error', (error: unknown) => {
      console.error('Pusher subscription error:', error)
      setConnectionState('error')
    })
    channel.bind(SYNC_EVENT, (payload: SyncPayload) => {
      if (payload.senderId !== playerId) syncHandlerRef.current(payload)
    })
    channel.bind(ROLE_CLAIM_EVENT, (payload: RoleClaimPayload) => {
      if (payload.playerId !== playerId) roleClaimHandlerRef.current(payload)
    })
    channel.bind(SET_WORD_EVENT, (payload: SetWordPayload) => {
      if (payload.drawerId !== playerId) setWordHandlerRef.current(payload)
    })
    channel.bind(GUESS_CORRECT_EVENT, (payload: GuessCorrectPayload) => {
      if (payload.winnerId !== playerId) guessCorrectHandlerRef.current(payload)
    })

    return () => {
      channel.unbind_all()
      pusher.unsubscribe(CHANNEL_NAME)
      pusher.disconnect()
      delete window.pusher
    }
  }, [playerId])

  const postBroadcast = (event: BroadcastEvent) => {
    broadcastRef.current?.postMessage(event)
  }

  const triggerEvent = <Payload,>(
    eventName: string,
    payload: Payload,
    fallback: BroadcastEvent,
  ) => {
    if (channelRef.current) {
      try {
        channelRef.current.trigger(eventName, payload)
        return
      } catch (error) {
        console.error(`Failed to trigger ${eventName}:`, error)
      }
    }

    postBroadcast(fallback)
  }

  const publishSync = (payload: OutgoingSyncPayload) => {
    const event = { ...payload, senderId: playerId } as SyncPayload
    triggerEvent(
      SYNC_EVENT,
      event,
      { kind: 'sync', payload: event, senderId: playerId },
    )
  }

  const claimRole = () => {
    const payload = { playerId, playerName }
    triggerEvent(
      ROLE_CLAIM_EVENT,
      payload,
      { kind: 'role-claim', payload, senderId: playerId },
    )
  }

  const setWord = (word: string) => {
    const payload = { word, drawerId: playerId, drawerName: playerName }
    triggerEvent(
      SET_WORD_EVENT,
      payload,
      { kind: 'set-word', payload, senderId: playerId },
    )
  }

  const guessCorrect = (word: string) => {
    const payload = { winnerId: playerId, winnerName: playerName, word }
    triggerEvent(
      GUESS_CORRECT_EVENT,
      payload,
      { kind: 'guess-correct', payload, senderId: playerId },
    )
  }

  return {
    connectionState,
    playerId,
    playerName,
    publishSync,
    claimRole,
    setWord,
    guessCorrect,
  }
}
