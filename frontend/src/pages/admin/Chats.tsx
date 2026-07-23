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
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [imagePreview, setImagePreview] = useState<{ file: File; url: string } | null>(null);

  useEffect(() => {
    api.get<any[]>("/admin/chat/conversations").then(setConvs).catch(() => {});
    
    const socket = connectSocket();
    socket.on('conversation:updated', (updatedConv: any) => {
      setConvs(prev => {
        const index = prev.findIndex(c => c.id === updatedConv.id);
        if (index !== -1) {
          const newConvs = [...prev];
          newConvs[index] = updatedConv;
          // Move updated conversation to top
          newConvs.splice(index, 1);
          newConvs.unshift(updatedConv);
          return newConvs;
        }
        return [updatedConv, ...prev];
      });
    });
    
    return () => {
      socket.off('conversation:updated');
    };
  }, []);

  useEffect(() => {
    if (!active) return;
    
    // Initial load
    api.get<any[]>(`/chat/conversation/${active.id}/messages`).then(setMsgs).catch(() => {});
    
    // Set up WebSocket connection for real-time updates
    const socket = connectSocket();
    socket.emit("join_conversation", active.id);
    
    const handler = (msg: any) => {
      console.log('[admin chat] Received message via socket:', msg);
      setMsgs((m) => {
        // Check if this message already exists (avoid duplicates from optimistic update)
        const exists = m.some(existing => existing.id === msg.id || (existing.body === msg.body && existing.sender_id === msg.sender_id));
        if (exists) {
          console.log('[admin chat] Message already exists, skipping duplicate');
          return m;
        }
        console.log('[admin chat] Adding new message to state');
        return [...m, msg];
      });
    };
    socket.on("chat_messages", handler);
    
    // Polling fallback: always poll every 2 seconds to ensure messages are updated
    // This ensures messages show even if WebSocket is not working
    const pollInterval = setInterval(() => {
      console.log('[admin chat] Polling messages from API');
      api.get<any[]>(`/chat/conversation/${active.id}/messages`).then((msgs) => {
        console.log('[admin chat] Polled', msgs.length, 'messages');
        setMsgs(msgs);
      }).catch((err) => {
        console.error('[admin chat] Failed to poll messages:', err);
      });
    }, 2000);
    
    return () => {
      clearInterval(pollInterval);
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
    
    // Optimistic update - add message immediately
    const tempMsg = {
      id: `temp-${Date.now()}`,
      conversation_id: active.id,
      sender_id: user.id,
      sender_role: 'admin',
      body,
      text: body,
      message_type: 'text',
      messageType: 'text',
      created_at: new Date().toISOString(),
    };
    setMsgs((m) => [...m, tempMsg]);
    
    try {
      await api.post<any>(`/chat/conversation/${active.id}/messages`, { body });
      // Message will be updated via socket event with proper ID
    } catch {
      // Remove temp message on error
      setMsgs((m) => m.filter((msg) => msg.id !== tempMsg.id));
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
    
    const file = files[0];
    if (file.type.startsWith('image/')) {
      // Create preview URL
      const url = URL.createObjectURL(file);
      setImagePreview({ file, url });
    }
    
    // Reset input
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

  const getUserInitials = (name?: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const renderMessage = (m: any) => {
    const isOwn = m.sender_id === user?.id;
    const timestamp = m.created_at || m.createdAt;
    const senderName = active?.profiles?.full_name || 'User';
    
    if (m.message_type === 'image' || m.messageType === 'image') {
      return (
        <div className={`flex gap-2 ${isOwn ? "justify-end" : "justify-start"}`}>
          {!isOwn && (
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold">
              {getUserInitials(senderName)}
            </div>
          )}
          <div className={`flex flex-col ${isOwn ? "items-end" : "items-start"} max-w-[70%]`}>
            <div className={`rounded-lg overflow-hidden ${isOwn ? "bg-primary" : "bg-accent"} cursor-pointer`}
                 onClick={() => setEnlargedImage(m.file_data || m.fileData)}>
              <img src={m.file_data || m.fileData} alt="Shared image" className="w-full max-w-sm max-h-64 object-contain" />
              {m.text && <p className={`px-3 py-2 text-sm ${isOwn ? "text-primary-foreground" : "text-accent-foreground"}`}>{m.text}</p>}
            </div>
            <span className={`text-xs text-muted-foreground mt-1 px-1`}>
              {formatMessageTime(timestamp)}
            </span>
          </div>
        </div>
      );
    }

    if (m.message_type === 'audio' || m.messageType === 'audio') {
      return (
        <div className={`flex gap-2 ${isOwn ? "justify-end" : "justify-start"}`}>
          {!isOwn && (
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold">
              {getUserInitials(senderName)}
            </div>
          )}
          <div className={`flex flex-col ${isOwn ? "items-end" : "items-start"} max-w-[70%]`}>
            <div className={`px-3 py-2 rounded-lg ${isOwn ? "bg-primary text-primary-foreground" : "bg-accent text-accent-foreground"}`}>
              <audio controls src={m.file_data || m.fileData} className="max-w-full" />
            </div>
            <span className={`text-xs text-muted-foreground mt-1 px-1`}>
              {formatMessageTime(timestamp)}
            </span>
          </div>
        </div>
      );
    }

    return (
      <div className={`flex gap-2 ${isOwn ? "justify-end" : "justify-start"}`}>
        {!isOwn && (
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold">
            {getUserInitials(senderName)}
          </div>
        )}
        <div className={`flex flex-col ${isOwn ? "items-end" : "items-start"} max-w-[70%]`}>
          <div className={`px-3 py-2 rounded-lg text-sm ${isOwn ? "bg-primary text-primary-foreground" : "bg-accent text-accent-foreground"}`}>
            {m.body || m.text}
          </div>
          <span className={`text-xs text-muted-foreground mt-1 px-1`}>
            {formatMessageTime(timestamp)}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div>
      <h1 className="text-2xl mb-6">Chats</h1>
      <div className="grid md:grid-cols-3 gap-4 h-[70vh]">
        {/* Conversation List - hide on mobile when chat is open */}
        <div className={`border border-border rounded-lg bg-card overflow-y-auto ${showMobileChat ? 'hidden md:block' : 'block'}`}>
          {convs.map((c) => {
            const unreadCount = c.unread_count || 0;
            const hasNewMessage = unreadCount > 0;
            return (
              <button key={c.id} onClick={() => { setActive(c); setShowMobileChat(true); }}
                className={`w-full text-left p-3 border-b border-border hover:bg-accent ${active?.id === c.id ? "bg-accent" : ""} relative`}>
                {/* New Message Banner */}
                {hasNewMessage && (
                  <div className="absolute top-0 left-0 right-0 bg-primary/10 border-b border-primary/20 px-2 py-1">
                    <span className="text-xs font-semibold text-primary">NEW MESSAGE</span>
                  </div>
                )}
                <div className={`flex items-start justify-between gap-2 ${hasNewMessage ? 'mt-6' : ''}`}>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{c.profiles?.full_name || "Guest User"}</p>
                    {c.last_message && (
                      <p className="text-xs text-muted-foreground truncate mt-1">{c.last_message}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">{new Date(c.last_message_at).toLocaleString()}</p>
                  </div>
                  {unreadCount > 0 && (
                    <div className="flex-shrink-0 bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-semibold">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
          {convs.length === 0 && <p className="p-4 text-sm text-muted-foreground">No conversations.</p>}
        </div>
        
        {/* Chat Area - show on mobile when conversation selected */}
        <div className={`md:col-span-2 border border-border rounded-lg bg-card flex flex-col h-[70vh] ${!showMobileChat ? 'hidden md:flex' : 'flex'}`}>
          {!active && (
            <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
              Select a conversation
            </div>
          )}
          {active && (
            <>
              {/* Mobile back button header */}
              <div className="md:hidden flex items-center gap-3 p-3 border-b border-border bg-accent/30">
                <button 
                  onClick={() => { setActive(null); setShowMobileChat(false); }}
                  className="p-1.5 hover:bg-accent rounded-lg transition-colors"
                  aria-label="Back to conversations"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold">
                    {getUserInitials(active.profiles?.full_name)}
                  </div>
                  <p className="text-sm font-medium">{active.profiles?.full_name || "Guest User"}</p>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {msgs.map((m) => (
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
                          disabled={!active}
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
