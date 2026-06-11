import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Package, MessageCircle, Bell } from "lucide-react";

const Dashboard = () => {
  const { user } = useAuth();
  return (
    <div className="space-y-6">
      <p className="text-muted-foreground">Welcome back, {user?.user_metadata?.full_name || user?.email}.</p>
      <div className="grid sm:grid-cols-3 gap-4">
        <Link to="/account/orders"><Card className="p-6 hover:bg-accent transition-colors"><Package className="w-6 h-6 mb-2 text-primary" /><p className="font-medium">Orders</p><p className="text-xs text-muted-foreground">Track shipments & history</p></Card></Link>
        <Link to="/account/chat"><Card className="p-6 hover:bg-accent transition-colors"><MessageCircle className="w-6 h-6 mb-2 text-primary" /><p className="font-medium">Chat with us</p><p className="text-xs text-muted-foreground">Talk directly to Diera support</p></Card></Link>
        <Link to="/account/notifications"><Card className="p-6 hover:bg-accent transition-colors"><Bell className="w-6 h-6 mb-2 text-primary" /><p className="font-medium">Notifications</p><p className="text-xs text-muted-foreground">Order updates & news</p></Card></Link>
      </div>
    </div>
  );
};

export default Dashboard;
