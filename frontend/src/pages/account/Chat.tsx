import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { connectSocket } from "@/lib/socket";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Send, Image } from "lucide-react";
import { toast } from "sonner";

const Chat = () => {
  const { user } = useAuth();
  const [convId, setConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.title = "Chat - Diera Shop | Customer Support";
  }, []);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [enlargedImage, setEnlargedImage] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<{ file: File; url: string } | null>(null);

  useEffect(() => {
    if (!user) return;
    api.get<{ id: string }>("/chat/conversation").then(async (conv) => {
      setConvId(conv.id);
      const msgs = await api.get<any[]>(`/chat/conversation/${conv.id}/messages`);
      setMessages(msgs || []);
    }).catch(() => {});
    
    const socket = connectSocket();
    socket.on('conversation:updated', (updatedConv: any) => {
      if (convId === updatedConv.id) {
        // Refresh messages if this is our conversation
        api.get<any[]>(`/chat/conversation/${updatedConv.id}/messages`).then(setMessages).catch(() => {});
      }
    });
    
    return () => {
      socket.off('conversation:updated');
    };
  }, [user, convId]);

  useEffect(() => {
    if (!convId) return;
    
    // Initial load
    api.get<any[]>(`/chat/conversation/${convId}/messages`).then(setMessages).catch(() => {});
    
    // Set up WebSocket connection for real-time updates
    const socket = connectSocket();
    socket.emit("join_conversation", convId);
    
    const handler = (msg: any) => {
      console.log('[chat] Received message via socket:', msg);
      setMessages((m) => {
        // Check if this message already exists (avoid duplicates from optimistic update)
        const exists = m.some(existing => existing.id === msg.id || (existing.body === msg.body && existing.sender_id === msg.sender_id));
        if (exists) {
          console.log('[chat] Message already exists, skipping duplicate');
          return m;
        }
        console.log('[chat] Adding new message to state');
        return [...m, msg];
      });
    };
    socket.on("chat_messages", handler);
    
    // Polling fallback: always poll every 2 seconds to ensure messages are updated
    // This ensures messages show even if WebSocket is not working
    const pollInterval = setInterval(() => {
      console.log('[chat] Polling messages from API');
      api.get<any[]>(`/chat/conversation/${convId}/messages`).then((msgs) => {
        console.log('[chat] Polled', msgs.length, 'messages');
        setMessages(msgs);
      }).catch((err) => {
        console.error('[chat] Failed to poll messages:', err);
      });
    }, 2000);
    
    return () => {
      clearInterval(pollInterval);
      socket.off("chat_messages", handler);
      socket.emit("leave_conversation", convId);
    };
  }, [convId]);

  useEffect(() => { 
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end", inline: "nearest" }); 
  }, [messages]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !convId || !user) return;
    const body = text.trim();
    console.log('[chat] Sending message:', body);
    setText("");
    
    // Optimistic update - add message immediately
    const tempMsg = {
      id: `temp-${Date.now()}`,
      conversation_id: convId,
      sender_id: user.id,
      sender_role: 'user',
      body,
      text: body,
      message_type: 'text',
      messageType: 'text',
      created_at: new Date().toISOString(),
    };
    console.log('[chat] Adding optimistic message to state:', tempMsg);
    setMessages((m) => {
      const newMessages = [...m, tempMsg];
      console.log('[chat] Messages after optimistic update:', newMessages.length);
      return newMessages;
    });
    
    try {
      console.log('[chat] Sending message to API...');
      const response = await api.post<any>(`/chat/conversation/${convId}/messages`, { body });
      console.log('[chat] Message sent successfully, response:', response);
      // The polling will pick up the confirmed message within 2 seconds
    } catch (err) {
      console.error('[chat] Failed to send message:', err);
      // Remove temp message on error
      setMessages((m) => m.filter((msg) => msg.id !== tempMsg.id));
      setText(body);
    }
  };

  const sendFile = async (file: File, type: 'image' | 'audio') => {
    if (!convId || !user) return;
    
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File too large. Max 5MB.');
      return;
    }

    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('body', '📷 Image');
      
      await api.post<any>(`/chat/conversation/${convId}/messages`, fd);
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
    
    const file = files[0];
    if (file.type.startsWith('image/')) {
      // Create preview URL
      const url = URL.createObjectURL(file);
      setImagePreview({ file, url });
    }
    
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const sendPreviewedImage = async () => {
    if (!imagePreview) return;
    await sendFile(imagePreview.file, 'image');
    setImagePreview(null);
  };

  const cancelImagePreview = () => {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview.url);
    }
    setImagePreview(null);
  };

  const formatMessageTime = (timestamp: string) => {
    const msgDate = new Date(timestamp);
    const today = new Date();
    const isToday = msgDate.toDateString() === today.toDateString();
    
    if (isToday) {
      return `Today at ${msgDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
    }
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (msgDate.toDateString() === yesterday.toDateString()) {
      return `Yesterday at ${msgDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
    }
    
    return msgDate.toLocaleString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      hour: 'numeric', 
      minute: '2-digit', 
      hour12: true 
    });
  };

  const renderMessage = (m: any) => {
    const isOwn = m.sender_id === user?.id;
    const timestamp = m.created_at || m.createdAt;
    
    if (m.message_type === 'image' || m.messageType === 'image') {
      return (
        <div className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
          <div className={`flex flex-col ${isOwn ? "items-end" : "items-start"} max-w-[70%]`}>
            <div className={`rounded-lg overflow-hidden ${isOwn ? "bg-primary" : "bg-accent"} cursor-pointer`}
                 onClick={() => setEnlargedImage(m.file_data || m.fileData)}>
              <img src={m.file_data || m.fileData} alt="Shared image" className="w-full max-w-sm max-h-64 object-contain" />
              {m.text && <p className={`px-3 py-2 text-sm ${isOwn ? "text-primary-foreground" : "text-accent-foreground"}`}>{m.text}</p>}
            </div>
            <span className="text-xs text-muted-foreground mt-1 px-1">
              {formatMessageTime(timestamp)}
            </span>
          </div>
        </div>
      );
    }

    if (m.message_type === 'audio' || m.messageType === 'audio') {
      return (
        <div className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
          <div className={`flex flex-col ${isOwn ? "items-end" : "items-start"} max-w-[70%]`}>
            <div className={`px-3 py-2 rounded-lg ${isOwn ? "bg-primary text-primary-foreground" : "bg-accent text-accent-foreground"}`}>
              <audio controls src={m.file_data || m.fileData} className="max-w-full" />
            </div>
            <span className="text-xs text-muted-foreground mt-1 px-1">
              {formatMessageTime(timestamp)}
            </span>
          </div>
        </div>
      );
    }

    return (
      <div className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
        <div className={`flex flex-col ${isOwn ? "items-end" : "items-start"} max-w-[70%]`}>
          <div className={`px-3 py-2 rounded-lg text-sm ${isOwn ? "bg-primary text-primary-foreground" : "bg-accent text-accent-foreground"}`}>
            {m.body || m.text}
          </div>
          <span className="text-xs text-muted-foreground mt-1 px-1">
            {formatMessageTime(timestamp)}
          </span>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="border border-border rounded-lg bg-card flex flex-col h-[60vh]">
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {messages.length === 0 && <p className="text-sm text-muted-foreground">Send us a message — we typically reply within a few hours.</p>}
          {messages.map((m) => (
            <div key={m.id}>{renderMessage(m)}</div>
          ))}
          <div ref={endRef} />
        </div>
        
        {/* Image Preview */}
        {imagePreview && (
          <div className="border-t border-border p-3 bg-muted/50">
            <div className="flex items-start gap-3">
              <div className="relative">
                <img 
                  src={imagePreview.url} 
                  alt="Preview" 
                  className="w-24 h-24 object-cover rounded-lg border border-border"
                />
                <button
                  type="button"
                  onClick={cancelImagePreview}
                  className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-destructive/90"
                >
                  ×
                </button>
              </div>
              <div className="flex-1 flex flex-col gap-2">
                <p className="text-xs text-muted-foreground">
                  {imagePreview.file.name} ({(imagePreview.file.size / 1024).toFixed(1)} KB)
                </p>
                <div className="flex gap-2">
                  <Button 
                    type="button"
                    size="sm"
                    onClick={sendPreviewedImage}
                    disabled={!convId}
                  >
                    Send
                  </Button>
                  <Button 
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={cancelImagePreview}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
        
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
          <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Type your message" className="flex-1 bg-background border border-border rounded px-3 py-2 text-sm outline-none" />
          <Button type="submit" size="icon"><Send className="w-4 h-4" /></Button>
        </form>
      </div>

      <Dialog open={!!enlargedImage} onOpenChange={(open) => !open && setEnlargedImage(null)}>
        <DialogContent className="max-w-4xl">
          {enlargedImage && (
            <img src={enlargedImage} alt="Enlarged view" className="w-full h-auto max-h-[80vh] object-contain" />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Chat;
