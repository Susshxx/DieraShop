import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { formatNPR } from "@/hooks/useCart";
import { Package, ShoppingBag, Users, HelpCircle, MessageCircle } from "lucide-react";

const AdminDashboard = () => {
  const navigate = useNavigate();
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
    { label: "Revenue (NPR)", value: formatNPR(s.revenue), icon: ShoppingBag, link: "/admin/orders" },
    { label: "Orders", value: s.orders, icon: ShoppingBag, link: "/admin/orders" },
    { label: "Products", value: s.products, icon: Package, link: "/admin/products" },
    { label: "Customers", value: s.users, icon: Users, link: "/admin/users" },
    { label: "Questions", value: s.questions, icon: HelpCircle, link: "/admin/questions" },
    { label: "Unread Chats", value: s.chats, icon: MessageCircle, link: "/admin/chats" },
  ];

  return (
    <div>
      <h1 className="text-2xl mb-6">Dashboard</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {stats.map((st) => (
          <Card 
            key={st.label} 
            className="p-5 cursor-pointer hover:ring-2 hover:ring-primary transition-all"
            onClick={() => navigate(st.link)}
          >
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
