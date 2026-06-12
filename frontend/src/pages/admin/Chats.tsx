import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { connectSocket } from "@/lib/socket";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Send, Image } from "lucide-react";
import { toast } from "sonner";

const Chats = () => {
  const { user } = useAuth();
  const [convs, setConvs] = useState<any[]>([]);
  const [active, setActive] = useState<any | null>(null);
  const [msgs, setMsgs] = useState<any[]>([]);
  const [text, setText] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [enlargedImage, setEnlargedImage] = useState<string | null>(null);

  useEffect(() => {
    api.get<any[]>("/admin/chat/conversations").then(setConvs).catch(() => {});
  }, []);

  useEffect(() => {
    if (!active) return;
    api.get<any[]>(`/chat/conversation/${active.id}/messages`).then(setMsgs).catch(() => {});
    const socket = connectSocket();
    socket.emit("join_conversation", active.id);
    const handler = (msg: any) => setMsgs((m) => [...m, msg]);
    socket.on("chat_messages", handler);
    return () => {
      socket.off("chat_messages", handler);
      socket.emit("leave_conversation", active.id);
    };
  }, [active]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !active || !user) return;
    const body = text.trim();
    setText("");
    try {
      await api.post<any>(`/chat/conversation/${active.id}/messages`, { body });
      // Message will be added via socket event
    } catch {
      setText(body);
    }
  };

  const sendFile = async (file: File, type: 'image' | 'audio') => {
    if (!active || !user) return;
    
    // Validate file size
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File too large. Max 5MB.');
      return;
    }

    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('body', '📷 Image');
      
      await api.post<any>(`/chat/conversation/${active.id}/messages`, fd);
      toast.success('Image sent');
    } catch (error: any) {
      console.error('Failed to send file:', error);
      const errorMsg = error?.response?.data?.error || 'Failed to send file';
      toast.error(errorMsg);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    
    // Send each image separately
    files.forEach((file) => {
      if (file.type.startsWith('image/')) {
        sendFile(file, 'image');
      }
    });
    
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const renderMessage = (m: any) => {
    const isOwn = m.sender_id === user?.id;
    
    if (m.message_type === 'image' || m.messageType === 'image') {
      return (
        <div className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
          <div className={`max-w-[75%] rounded-lg overflow-hidden ${isOwn ? "bg-primary" : "bg-accent"} cursor-pointer`}
               onClick={() => setEnlargedImage(m.file_data || m.fileData)}>
            <img src={m.file_data || m.fileData} alt="Shared image" className="max-w-full max-h-64 object-contain" />
            {m.text && <p className={`px-3 py-2 text-sm ${isOwn ? "text-primary-foreground" : "text-accent-foreground"}`}>{m.text}</p>}
          </div>
        </div>
      );
    }

    if (m.message_type === 'audio' || m.messageType === 'audio') {
      return (
        <div className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
          <div className={`max-w-[75%] px-3 py-2 rounded-lg ${isOwn ? "bg-primary text-primary-foreground" : "bg-accent text-accent-foreground"}`}>
            <audio controls src={m.file_data || m.fileData} className="max-w-full" />
          </div>
        </div>
      );
    }

    return (
      <div className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
        <div className={`max-w-[75%] px-3 py-2 rounded-lg text-sm ${isOwn ? "bg-primary text-primary-foreground" : "bg-accent text-accent-foreground"}`}>
          {m.body || m.text}
        </div>
      </div>
    );
  };

  return (
    <div>
      <h1 className="text-2xl mb-6">Chats</h1>
      <div className="grid md:grid-cols-3 gap-4 h-[70vh]">
        <div className="border border-border rounded-lg bg-card overflow-y-auto">
          {convs.map((c) => (
            <button key={c.id} onClick={() => setActive(c)}
              className={`w-full text-left p-3 border-b border-border hover:bg-accent ${active?.id === c.id ? "bg-accent" : ""}`}>
              <p className="text-sm font-medium">{c.profiles?.full_name || "Guest User"}</p>
              {c.last_message && (
                <p className="text-xs text-muted-foreground truncate mt-1">{c.last_message}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">{new Date(c.last_message_at).toLocaleString()}</p>
            </button>
          ))}
          {convs.length === 0 && <p className="p-4 text-sm text-muted-foreground">No conversations.</p>}
        </div>
        <div className="md:col-span-2 border border-border rounded-lg bg-card flex flex-col h-[70vh]">
          {!active && <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">Select a conversation</div>}
          {active && (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {msgs.map((m) => (
                  <div key={m.id}>{renderMessage(m)}</div>
                ))}
                <div ref={endRef} />
              </div>
              <form onSubmit={send} className="border-t border-border p-2 flex gap-2">
                <input 
                  ref={fileInputRef}
                  type="file" 
                  accept="image/*"
                  multiple
                  onChange={handleImageSelect} 
                  className="hidden" 
                />
                <Button 
                  type="button" 
                  size="icon" 
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Image className="w-4 h-4" />
                </Button>
                <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Reply…" className="flex-1 bg-background border border-border rounded px-3 py-2 text-sm outline-none" />
                <Button type="submit" size="icon"><Send className="w-4 h-4" /></Button>
              </form>
            </>
          )}
        </div>
      </div>

      <Dialog open={!!enlargedImage} onOpenChange={(open) => !open && setEnlargedImage(null)}>
        <DialogContent className="max-w-4xl">
          {enlargedImage && (
            <img src={enlargedImage} alt="Enlarged view" className="w-full h-auto max-h-[80vh] object-contain" />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Chats;
