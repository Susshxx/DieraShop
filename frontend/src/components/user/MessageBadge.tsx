import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MessageCircle } from "lucide-react";
import { api } from "@/lib/api";
import { connectSocket } from "@/lib/socket";
import { useAuth } from "@/hooks/useAuth";

const MessageBadge = () => {
  const { user, role } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const loadUnreadCount = async () => {
    if (!user) return;
    try {
      const data = await api.get<{ unread_count: number }>("/chat/unread-count");
      setUnreadCount(data.unread_count ?? 0);
    } catch (error) {
      console.error("Failed to load unread message count:", error);
    }
  };

  useEffect(() => {
    if (!user) return;
    loadUnreadCount();
    
    const socket = connectSocket();
    
    // Listen for new messages
    socket.on("chat_messages", loadUnreadCount);
    
    // Listen for messages read
    socket.on("messages:read", loadUnreadCount);
    
    return () => { 
      socket.off("chat_messages", loadUnreadCount);
      socket.off("messages:read", loadUnreadCount);
    };
  }, [user]);

  if (!user) return null;
  
  const link = role === "admin" ? "/admin/chats" : "/account/chat";

  return (
    <Link to={link} className="relative p-2 text-nav-foreground hover:text-nav-hover" aria-label="Messages">
      <MessageCircle className="w-5 h-5" />
      {unreadCount > 0 && (
        <span className="absolute top-0 right-0 bg-primary text-primary-foreground text-[10px] rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </Link>
  );
};

export default MessageBadge;
