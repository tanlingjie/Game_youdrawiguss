import { useEffect, useMemo, useRef, useState } from 'react'
import Pusher, { type Channel } from 'pusher-js'
import type { SyncPayload } from '../types'

type ConnectionState = 'connecting' | 'connected' | 'local' | 'error'
type OutgoingPayload = SyncPayload extends infer Payload
  ? Payload extends { senderId: string }
    ? Omit<Payload, 'senderId'>
    : never
  : never

const EVENT_NAME = 'client-sketch-sync'
const CHANNEL_NAME = 'private-draw-and-guess-room'

export function useRealtimeRoom(onRemotePayload: (payload: SyncPayload) => void) {
  const [connectionState, setConnectionState] = useState<ConnectionState>(() =>
    import.meta.env.VITE_PUSHER_KEY && import.meta.env.VITE_PUSHER_CLUSTER
      ? 'connecting'
      : 'local',
  )
  const senderId = useMemo(() => crypto.randomUUID(), [])
  const broadcastRef = useRef<BroadcastChannel | null>(null)
  const pusherChannelRef = useRef<Channel | null>(null)
  const remoteHandlerRef = useRef(onRemotePayload)

  useEffect(() => {
    remoteHandlerRef.current = onRemotePayload
  }, [onRemotePayload])

  useEffect(() => {
    const broadcast = new BroadcastChannel('draw-and-guess-preview-room')
    broadcastRef.current = broadcast
    broadcast.onmessage = (event: MessageEvent<SyncPayload>) => {
      if (event.data.senderId !== senderId) {
        remoteHandlerRef.current(event.data)
      }
    }

    const key = import.meta.env.VITE_PUSHER_KEY as string | undefined
    const cluster = import.meta.env.VITE_PUSHER_CLUSTER as string | undefined

    if (!key || !cluster) {
      return () => broadcast.close()
    }

    const pusher = new Pusher(key, {
      cluster,
      authEndpoint: '/pusher/auth',
    })

    pusher.connection.bind('connected', () => setConnectionState('connected'))
    pusher.connection.bind('error', () => setConnectionState('local'))

    const channel = pusher.subscribe(CHANNEL_NAME)
    pusherChannelRef.current = channel

    channel.bind('pusher:subscription_error', () => setConnectionState('local'))
    channel.bind(EVENT_NAME, (payload: SyncPayload) => {
      if (payload.senderId !== senderId) {
        remoteHandlerRef.current(payload)
      }
    })

    return () => {
      channel.unbind_all()
      pusher.unsubscribe(CHANNEL_NAME)
      pusher.disconnect()
      broadcast.close()
    }
  }, [senderId])

  const publish = (payload: OutgoingPayload) => {
    const event = { ...payload, senderId } as SyncPayload
    broadcastRef.current?.postMessage(event)

    try {
      pusherChannelRef.current?.trigger(EVENT_NAME, event)
    } catch {
      setConnectionState((state) => (state === 'connected' ? 'local' : state))
    }
  }

  return { connectionState, publish }
}
