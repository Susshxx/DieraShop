import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { formatNPR } from "@/hooks/useCart";
import { Package, ShoppingBag, Users, HelpCircle, MessageCircle } from "lucide-react";

const AdminDashboard = () => {
  const [s, setS] = useState({ products: 0, orders: 0, revenue: 0, users: 0, questions: 0, chats: 0 });
  useEffect(() => {
    api.get<{
      products: number;
      orders: number;
      revenue: number;
      users: number;
      pendingQuestions: number;
      unreadChats: number;
    }>("/admin/stats").then((data) => {
      setS({
        products: data.products,
        orders: data.orders,
        revenue: data.revenue,
        users: data.users,
        questions: data.pendingQuestions,
        chats: data.unreadChats,
      });
    }).catch(() => {});
  }, []);

  const stats = [
    { label: "Revenue (NPR)", value: formatNPR(s.revenue), icon: ShoppingBag },
    { label: "Orders", value: s.orders, icon: ShoppingBag },
    { label: "Products", value: s.products, icon: Package },
    { label: "Customers", value: s.users, icon: Users },
    { label: "Questions", value: s.questions, icon: HelpCircle },
    { label: "Unread Chats", value: s.chats, icon: MessageCircle },
  ];

  return (
    <div>
      <h1 className="text-2xl mb-6">Dashboard</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {stats.map((st) => (
          <Card key={st.label} className="p-5">
            <st.icon className="w-5 h-5 text-primary mb-2" />
            <p className="text-xs text-muted-foreground">{st.label}</p>
            <p className="text-xl font-semibold">{st.value}</p>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboard;
