import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Bell } from "lucide-react";
import { api } from "@/lib/api";
import { connectSocket } from "@/lib/socket";
import { useAuth } from "@/hooks/useAuth";

const NotificationBell = () => {
  const { user } = useAuth();
  const [count, setCount] = useState(0);

  const loadCount = async () => {
    if (!user) return;
    try {
      const { count: c } = await api.get<{ count: number }>("/notifications/unread-count");
      console.log('[NotificationBell] Loaded count:', c);
      setCount(c ?? 0);
    } catch (error) {
      console.error("Failed to load notification count:", error);
    }
  };

  useEffect(() => {
    if (!user) return;
    loadCount();
    const socket = connectSocket();
    
    // Listen for new notifications
    const handleNewNotification = () => {
      console.log('[NotificationBell] Received notification:new event');
      loadCount();
    };
    
    // Listen for notifications marked as read
    const handleNotificationsRead = () => {
      console.log('[NotificationBell] Received notifications:read event');
      // Immediately set count to 0 for instant feedback
      setCount(0);
      // Then reload to confirm
      loadCount();
    };
    
    socket.on("notification:new", handleNewNotification);
    socket.on("notifications:read", handleNotificationsRead);
    
    return () => { 
      socket.off("notification:new", handleNewNotification);
      socket.off("notifications:read", handleNotificationsRead);
    };
  }, [user]);

  if (!user) return null;
  return (
    <Link to="/account/notifications" className="relative p-2 text-nav-foreground hover:text-nav-hover" aria-label="Notifications">
      <Bell className="w-5 h-5" />
      {count > 0 && (
        <span className="absolute top-0 right-0 bg-primary text-primary-foreground text-[10px] rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </Link>
  );
};

export default NotificationBell;
