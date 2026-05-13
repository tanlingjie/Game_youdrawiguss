export type Point = {
  x: number
  y: number
  t: number
}

export type DrawPath = {
  id: string
  color: string
  width: number
  points: Point[]
}

export type ChatMessage = {
  id: string
  author: string
  text: string
  createdAt: number
  matched?: boolean
}

export type SyncPayload =
  | { type: 'path'; path: DrawPath; senderId: string }
  | { type: 'clear'; senderId: string }
  | { type: 'undo'; pathId: string; senderId: string }
  | { type: 'chat'; message: ChatMessage; senderId: string }
  | { type: 'word'; word: string; senderId: string }
