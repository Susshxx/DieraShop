import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { formatDistanceToNow } from "date-fns";
import { CheckCircle2, Package, MessageCircle, HelpCircle, Trash2 } from "lucide-react";
import { connectSocket } from "@/lib/socket";
import { toast } from "sonner";

interface Notification {
  _id: string;
  user_id?: string;
  type: string;
  title: string;
  message: string;
  body: string;
  link?: string;
  order_id?: string;
  orderId?: string;
  read: boolean;
  read_at?: string;
  created_at: string;
  createdAt: string;
}

const AdminNotifications = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const loadNotifications = async () => {
    try {
      const data = await api.get<Notification[]>("/notifications");
      setNotifications(data);
    } catch (error) {
      console.error("Failed to load notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
      // Emit socket so the Layout banner + badge update immediately
      const socket = connectSocket();
      socket.emit("notifications:read");
      toast.success("Marked as read");
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
      toast.error("Failed to mark as read");
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put("/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      // Emit socket so Layout banner + badge clear immediately
      const socket = connectSocket();
      socket.emit("notifications:read");
      toast.success("All notifications marked as read");
    } catch (error) {
      console.error("Failed to mark all as read:", error);
      toast.error("Failed to mark all as read");
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      toast.success("Notification deleted");
    } catch (error) {
      console.error("Failed to delete notification:", error);
      toast.error("Failed to delete notification");
    }
  };

  const deleteAllNotifications = async () => {
    try {
      await api.delete("/notifications");
      setNotifications([]);
      toast.success("All notifications deleted");
    } catch (error) {
      console.error("Failed to delete all notifications:", error);
      toast.error("Failed to delete notifications");
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    let orderId = notification.order_id || notification.orderId;
    if (!orderId) {
      const text = notification.body || notification.message || notification.title || "";
      const orderIdMatch = text.match(/#([a-zA-Z0-9]{6,})/);
      if (orderIdMatch) orderId = orderIdMatch[1];
    }
    if (!notification.read) markAsRead(notification._id);
    if (orderId) {
      navigate(`/admin/orders?orderId=${orderId}`);
    } else if (notification.link) {
      navigate(notification.link);
    }
  };

  useEffect(() => {
    loadNotifications();
    const socket = connectSocket();
    const handleNewNotification = () => { loadNotifications(); };
    socket.on("notification:new", handleNewNotification);
    return () => { socket.off("notification:new", handleNewNotification); };
  }, []);

  const getIcon = (type: string) => {
    switch (type) {
      case "order":    return <Package className="w-5 h-5 text-primary" />;
      case "chat":
      case "message":  return <MessageCircle className="w-5 h-5 text-primary" />;
      case "question": return <HelpCircle className="w-5 h-5 text-primary" />;
      default:         return <CheckCircle2 className="w-5 h-5 text-primary" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading notifications...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Notifications</h1>
        <div className="flex gap-3">
          {notifications.length > 0 && (
            <button
              onClick={deleteAllNotifications}
              className="text-sm text-destructive hover:underline"
            >
              Delete all
            </button>
          )}
          {notifications.some((n) => !n.read) && (
            <button
              onClick={markAllAsRead}
              className="text-sm text-primary hover:underline font-medium"
            >
              Mark all as read
            </button>
          )}
        </div>
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-lg border border-border">
          <p className="text-muted-foreground">No notifications yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notification) => (
            <div
              key={notification._id}
              className={`p-4 rounded-lg border transition-all duration-300 ${
                notification.read
                  ? "bg-card border-border opacity-70"
                  : "bg-primary/5 border-primary/25 shadow-sm"
              }`}
            >
              <div className="flex gap-3">
                {/* Unread dot indicator */}
                <div className="flex-shrink-0 mt-1 relative">
                  {getIcon(notification.type)}
                  {!notification.read && (
                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-primary rounded-full" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div
                      className="flex-1 cursor-pointer hover:opacity-70"
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <h3 className={`text-sm mb-1 ${notification.read ? "font-normal text-muted-foreground" : "font-semibold text-foreground"}`}>
                        {notification.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        {notification.body || notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(
                          new Date(notification.created_at || notification.createdAt),
                          { addSuffix: true }
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {!notification.read && (
                        <button
                          onClick={() => markAsRead(notification._id)}
                          className="text-xs text-primary hover:underline whitespace-nowrap px-2 py-1 rounded hover:bg-primary/10 transition-colors"
                        >
                          Mark as read
                        </button>
                      )}
                      <button
                        onClick={() => deleteNotification(notification._id)}
                        className="text-destructive hover:bg-destructive/10 p-1 rounded transition-colors"
                        title="Delete notification"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminNotifications;
