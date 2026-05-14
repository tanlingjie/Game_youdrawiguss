import Pusher from "pusher";

// 适配你 image_b09c81.jpg 中展示的变量名
const pusher = new Pusher({
  appId: process.env.VITE_PUSHER_APP_ID!,   // 对应截图中的 VITE_PUSHER_APP_ID
  key: process.env.VITE_PUSHER_KEY!,       // 对应截图中的 VITE_PUSHER_KEY
  secret: process.env.VITE_PUSHER_SECRET!, // 对应截图中的 VITE_PUSHER_SECRET
  cluster: process.env.VITE_PUSHER_CLUSTER!, // 对应截图中的 VITE_PUSHER_CLUSTER
  useTLS: true,
});

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  try {
    const socketId = req.body.socket_id;
    const channel = req.body.channel_name;
    
    const authResponse = pusher.authorizeChannel(socketId, channel, {
      user_id: `user-${Math.random().toString(36).slice(2, 9)}`,
    });

    res.send(authResponse);
  } catch (error) {
    console.error("Auth Error:", error);
    res.status(403).send("Forbidden");
  }
}
