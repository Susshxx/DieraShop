import { useEffect, useRef, useState } from "react";
import { MessageCircle, Send, X } from "lucide-react";
import { api } from "@/lib/api";
import { connectSocket } from "@/lib/socket";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

interface Msg { id: string; sender_id: string; body: string; text?: string; created_at: string; }

const ChatWidget = () => {
  const { user, role } = useAuth();
  const [open, setOpen] = useState(false);
  const [convId, setConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user || role === "admin") return;
    api.get<{ id: string }>("/chat/conversation").then(async (conv) => {
      setConvId(conv.id);
      const msgs = await api.get<Msg[]>(`/chat/conversation/${conv.id}/messages`);
      setMessages(msgs || []);
    }).catch(() => {});
  }, [user, role]);

  useEffect(() => {
    if (!convId) return;
    const socket = connectSocket();
    socket.emit("join_conversation", convId);
    const handler = (msg: Msg) => setMessages((m) => [...m, msg]);
    socket.on("chat_messages", handler);
    return () => {
      socket.off("chat_messages", handler);
      socket.emit("leave_conversation", convId);
    };
  }, [convId]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, open]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !convId || !user) return;
    const body = text.trim();
    setText("");
    try {
      await api.post<Msg>(`/chat/conversation/${convId}/messages`, { body });
      // Message will be added via socket event
    } catch {
      setText(body);
    }
  };

  if (!user || role === "admin") return null;

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-6 right-6 z-50 bg-primary text-primary-foreground rounded-full p-4 shadow-lg hover:opacity-90"
        aria-label="Chat with us"
      >
        {open ? <X className="w-5 h-5" /> : <MessageCircle className="w-5 h-5" />}
      </button>
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-[90vw] max-w-sm h-[28rem] bg-card border border-border rounded-lg shadow-xl flex flex-col">
          <div className="p-3 border-b border-border">
            <p className="font-semibold text-sm">Chat with Diera</p>
            <p className="text-xs text-muted-foreground">We usually reply within a few hours.</p>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {messages.length === 0 && <p className="text-sm text-muted-foreground">Say hi 👋</p>}
            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.sender_id === user.id ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] px-3 py-2 rounded-lg text-sm ${m.sender_id === user.id ? "bg-primary text-primary-foreground" : "bg-accent text-accent-foreground"}`}>
                  {m.body || m.text}
                </div>
              </div>
            ))}
            <div ref={endRef} />
          </div>
          <form onSubmit={send} className="p-2 border-t border-border flex gap-2">
            <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Type a message" className="flex-1 bg-background border border-border rounded px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring" />
            <Button size="icon" type="submit"><Send className="w-4 h-4" /></Button>
          </form>
        </div>
      )}
    </>
  );
};

export default ChatWidget;
