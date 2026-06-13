import { NavLink, Outlet, Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { LayoutDashboard, Package, Tag, ShoppingBag, MessageCircle, HelpCircle, Image as ImgIcon, Users, LogOut, Home, Menu, Bell, X, CreditCard } from "lucide-react";
import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { api } from "@/lib/api";
import { connectSocket } from "@/lib/socket";

const nav = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin/products", label: "Products", icon: Package },
  { to: "/admin/categories", label: "Categories", icon: Tag },
  { to: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { to: "/admin/questions", label: "Q&A", icon: HelpCircle },
  { to: "/admin/chats", label: "Chats", icon: MessageCircle },
  { to: "/admin/notifications", label: "Notifications", icon: Bell },
  { to: "/admin/payment-settings", label: "Payment Settings", icon: CreditCard },
  { to: "/admin/site-images", label: "Site images", icon: ImgIcon },
  { to: "/admin/users", label: "Users", icon: Users },
];

const AdminLayout = () => {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [banners, setBanners] = useState<Array<{ id: string; type: string; message: string }>>([]);

  const loadNotificationCount = async () => {
    if (!user) return;
    try {
      const { count } = await api.get<{ count: number }>("/notifications/unread-count");
      setNotificationCount(count ?? 0);
    } catch (error) {
      console.error("Failed to load notification count:", error);
    }
  };

  const addBanner = (type: string, message: string) => {
    const id = `${Date.now()}-${Math.random()}`;
    setBanners((prev) => [...prev, { id, type, message }]);
  };

  const removeBanner = (id: string) => {
    setBanners((prev) => prev.filter((b) => b.id !== id));
  };

  useEffect(() => {
    if (!user) return;
    loadNotificationCount();
    const socket = connectSocket();
    
    const handleNewNotification = (data: any) => {
      loadNotificationCount();
      // Show banner for new orders, chats, and messages
      if (data?.type === "order") {
        addBanner("order", "New order received!");
      } else if (data?.type === "chat" || data?.type === "message") {
        addBanner("chat", "New chat message received!");
      }
    };
    
    const handleNotificationsRead = () => {
      setNotificationCount(0);
      loadNotificationCount();
    };
    
    socket.on("notification:new", handleNewNotification);
    socket.on("notifications:read", handleNotificationsRead);
    
    return () => { 
      socket.off("notification:new", handleNewNotification);
      socket.off("notifications:read", handleNotificationsRead);
    };
  }, [user]);

  const handleSignOut = async () => {
    setMenuOpen(false);
    await signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen flex bg-background">
      <aside className="hidden md:flex w-60 flex-col border-r border-border bg-sidebar fixed h-screen">
        <div className="p-4 border-b border-sidebar-border">
          <Link to="/admin" className="text-lg font-semibold">Diera · Admin</Link>
        </div>
        <nav className="flex-1 py-4 space-y-1 px-2 overflow-y-auto">
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
          <button onClick={handleSignOut} className="w-full text-left flex items-center gap-2 px-3 py-2 rounded text-sm text-sidebar-foreground hover:bg-sidebar-accent"><LogOut className="w-4 h-4" /> Sign out</button>
        </div>
      </aside>

      {/* Mobile Layout */}
      <div className="flex-1 flex flex-col min-w-0 md:ml-60">
        {/* Notification Banners */}
        {banners.length > 0 && (
          <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
            {banners.map((banner) => (
              <div
                key={banner.id}
                className="bg-primary text-primary-foreground px-4 py-3 rounded-lg shadow-lg flex items-center justify-between gap-3 animate-in slide-in-from-right"
              >
                <div className="flex items-center gap-2">
                  {banner.type === "order" && <ShoppingBag className="w-5 h-5" />}
                  {banner.type === "chat" && <MessageCircle className="w-5 h-5" />}
                  <span className="text-sm font-medium">{banner.message}</span>
                </div>
                <button
                  onClick={() => removeBanner(banner.id)}
                  className="hover:opacity-70 transition-opacity"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="md:hidden flex items-center justify-between border-b border-border bg-card px-4 py-3">
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <button className="p-2">
                <Menu className="w-5 h-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <SheetHeader className="p-4 border-b border-border text-left">
                <SheetTitle>Diera · Admin</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col h-[calc(100vh-5rem)]">
                <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
                  {nav.map((n) => (
                    <NavLink
                      key={n.to}
                      to={n.to}
                      end={n.end}
                      onClick={() => setMenuOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center gap-2 px-3 py-2 rounded text-sm ${isActive ? "bg-primary text-primary-foreground" : "hover:bg-accent"}`
                      }
                    >
                      <n.icon className="w-4 h-4" /> {n.label}
                    </NavLink>
                  ))}
                </nav>
                <div className="p-2 pb-8 border-t border-border space-y-1">
                  <Link 
                    to="/" 
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded text-sm hover:bg-accent"
                  >
                    <Home className="w-4 h-4" /> View site
                  </Link>
                  <button 
                    onClick={handleSignOut}
                    className="w-full text-left flex items-center gap-2 px-3 py-2 rounded text-sm hover:bg-accent"
                  >
                    <LogOut className="w-4 h-4" /> Sign out
                  </button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
          <Link to="/admin" className="text-lg font-semibold">Diera · Admin</Link>
          <Link to="/admin/notifications" className="relative p-2" aria-label="Notifications">
            <Bell className="w-5 h-5" />
            {notificationCount > 0 && (
              <span className="absolute top-0 right-0 bg-primary text-primary-foreground text-[10px] rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                {notificationCount > 9 ? "9+" : notificationCount}
              </span>
            )}
          </Link>
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
