import Pusher from "pusher";

type AuthRequest = {
  method?: string;
  body?: {
    socket_id?: string;
    channel_name?: string;
  };
};

type AuthResponse = {
  status: (code: number) => AuthResponse;
  send: (body: unknown) => void;
};

const pusher = new Pusher({
  appId: process.env.VITE_PUSHER_APP_ID!,
  key: process.env.VITE_PUSHER_KEY!,
  secret: process.env.VITE_PUSHER_SECRET!,
  cluster: process.env.VITE_PUSHER_CLUSTER!,
  useTLS: true,
});

export default async function handler(req: AuthRequest, res: AuthResponse) {
  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  try {
    const socketId = req.body?.socket_id;
    const channel = req.body?.channel_name;

    if (!socketId || !channel) {
      return res.status(400).send("Missing socket_id or channel_name");
    }

    const authResponse = pusher.authorizeChannel(socketId, channel, {
      user_id: `user-${Math.random().toString(36).slice(2, 9)}`,
    });

    res.send(authResponse);
  } catch (error) {
    console.error("Auth Error:", error);
    res.status(403).send("Forbidden");
  }
}
