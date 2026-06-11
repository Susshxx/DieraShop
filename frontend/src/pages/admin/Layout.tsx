import { NavLink, Outlet, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { LayoutDashboard, Package, Tag, ShoppingBag, MessageCircle, HelpCircle, Image as ImgIcon, Users, LogOut, Home } from "lucide-react";

const nav = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin/products", label: "Products", icon: Package },
  { to: "/admin/categories", label: "Categories", icon: Tag },
  { to: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { to: "/admin/questions", label: "Q&A", icon: HelpCircle },
  { to: "/admin/chats", label: "Chats", icon: MessageCircle },
  { to: "/admin/site-images", label: "Site images", icon: ImgIcon },
  { to: "/admin/users", label: "Users", icon: Users },
];

const AdminLayout = () => {
  const { signOut, user } = useAuth();
  return (
    <div className="min-h-screen flex bg-background">
      <aside className="hidden md:flex w-60 flex-col border-r border-border bg-sidebar">
        <div className="p-4 border-b border-sidebar-border">
          <Link to="/admin" className="text-lg font-semibold">Diera · Admin</Link>
        </div>
        <nav className="flex-1 py-4 space-y-1 px-2">
          {nav.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-2 rounded text-sm ${isActive ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground hover:bg-sidebar-accent"}`
              }
            >
              <n.icon className="w-4 h-4" /> {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-2 border-t border-sidebar-border space-y-1">
          <Link to="/" className="flex items-center gap-2 px-3 py-2 rounded text-sm text-sidebar-foreground hover:bg-sidebar-accent"><Home className="w-4 h-4" /> View site</Link>
          <button onClick={signOut} className="w-full text-left flex items-center gap-2 px-3 py-2 rounded text-sm text-sidebar-foreground hover:bg-sidebar-accent"><LogOut className="w-4 h-4" /> Sign out</button>
        </div>
      </aside>
      <div className="flex-1 flex flex-col min-w-0">
        <div className="md:hidden flex overflow-x-auto border-b border-border bg-card px-2 py-2 gap-1">
          {nav.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end}
              className={({ isActive }) => `flex-shrink-0 px-3 py-1 rounded text-xs ${isActive ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
              {n.label}
            </NavLink>
          ))}
        </div>
        <main className="flex-1 p-4 sm:p-6 overflow-x-hidden">
          <div className="mb-4 text-xs text-muted-foreground hidden sm:block">Signed in as {user?.email}</div>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
