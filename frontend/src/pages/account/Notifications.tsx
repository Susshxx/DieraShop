import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { connectSocket } from "@/lib/socket";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

const Notifications = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    document.title = "Notifications - Diera Shop | Updates & Alerts";
  }, []);

  const load = async () => {
    if (!user) return;
    const data = await api.get<any[]>("/notifications");
    // Filter out chat notifications
    const filteredData = (data || []).filter((n: any) => n.type !== 'chat');
    setItems(filteredData);
  };

  useEffect(() => { load(); }, [user]);

  const markAll = async () => {
    if (!user) return;
    // Optimistically update local state
    setItems(prevItems => prevItems.map(item => ({ ...item, read_at: new Date().toISOString() })));
    await api.post("/notifications/mark-read");
    // Reload to ensure consistency with server
    load();
  };

  const handleNotificationClick = (notification: any) => {
    // Try to get orderId from the notification object
    let orderId = notification.order_id || notification.orderId;
    
    // If not found in object, try to extract from message/body text
    if (!orderId) {
      const text = notification.body || notification.message || notification.title || '';
      // Match patterns like: #abc123, Order #abc123, etc.
      const orderIdMatch = text.match(/#([a-zA-Z0-9]{6,})/);
      if (orderIdMatch) {
        orderId = orderIdMatch[1];
      }
    }
    
    if (orderId) {
      navigate(`/account/orders?orderId=${orderId}`);
    } else if (notification.link) {
      navigate(notification.link);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-end"><Button variant="outline" size="sm" onClick={markAll}>Mark all read</Button></div>
      {items.length === 0 && <p className="text-muted-foreground">No notifications yet.</p>}
      {items.map((n) => (
        <div 
          key={n.id} 
          className={`p-4 rounded-lg border cursor-pointer hover:opacity-70 transition-opacity ${n.read_at ? "bg-card border-border" : "bg-accent border-primary"}`}
          onClick={() => handleNotificationClick(n)}
        >
          <div className="flex justify-between gap-2">
            <p className="font-medium text-sm">{n.title}</p>
            <span className="text-xs text-muted-foreground">{new Date(n.created_at).toLocaleString()}</span>
          </div>
          {n.body && <p className="text-sm text-muted-foreground mt-1">{n.body}</p>}
        </div>
      ))}
    </div>
  );
};

export default Notifications;
