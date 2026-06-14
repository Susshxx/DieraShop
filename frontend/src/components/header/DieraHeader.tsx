import { Link } from "react-router-dom";
import SearchBar from "@/components/user/SearchBar";
import CartDrawer from "@/components/user/CartDrawer";
import UserMenu from "@/components/user/UserMenu";
import NotificationBell from "@/components/user/NotificationBell";
import ThemeSwitcher from "@/components/user/ThemeSwitcher";
import { useState, useEffect } from "react";
import { api, clearToken } from "@/lib/api";
import { Menu, ChevronDown, ChevronUp, Sparkles, Info, Palette, User, Package, MessageSquare, LogOut, Bell, ShieldCheck } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { useNavigate } from "react-router-dom";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const THEME_LABELS = {
  pink: "Light Pink",
  rose: "Dusty Rose",
  sage: "Sage Cream",
  golden: "Golden Glow",
};

const THEME_SWATCHES = {
  pink: "#f5c6d8",
  rose: "#e8c8b8",
  sage: "#c8dbc0",
  golden: "#fdf8e1",
};

const DieraHeader = () => {
  const { user, signOut } = useAuth();
  const { theme, setTheme, themes } = useTheme();
  const navigate = useNavigate();
  const [cats, setCats] = useState<{ name: string; slug: string; showInHeader?: boolean }[]>([]);
  const [open, setOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);

  useEffect(() => {
    // Try to load from localStorage first
    const cached = localStorage.getItem('diera-categories');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        const headerCats = parsed.filter((c: any) => c.showInHeader !== false).slice(0, 5);
        setCats(headerCats);
      } catch (e) {
        console.error('Failed to parse cached categories');
      }
    }

    // Fetch from API and update cache
    api.get<{ name: string; slug: string; showInHeader?: boolean }[]>("/categories")
      .then((data) => {
        // Save to localStorage
        localStorage.setItem('diera-categories', JSON.stringify(data));
        // Filter categories where showInHeader is true, limit to 5
        const headerCats = data.filter(c => c.showInHeader !== false).slice(0, 5);
        setCats(headerCats);
      })
      .catch(() => { });
  }, []);

  const handleSignOut = async () => {
    setOpen(false);
    clearToken();
    await signOut();
    navigate('/auth/login');
  };

  return (
    <header className="sticky top-0 z-40 bg-nav-background/95 backdrop-blur border-b border-border">
      <div className="flex items-center justify-between h-16 px-4 sm:px-6">
        {/* Mobile: Hamburger + Logo on left */}
        <div className="flex items-center gap-3 lg:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button className="p-2" aria-label="Menu">
                <Menu className="w-5 h-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] flex flex-col">
              <SheetHeader>
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-1 mt-6 flex-1 overflow-y-auto min-h-0">
                {/* New In */}
                <Link
                  to="/category/new-in"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 text-nav-foreground hover:bg-muted rounded font-medium"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>New In</span>
                </Link>

                {/* Categories Collapsible */}
                <div>
                  <button
                    onClick={() => setCategoriesOpen(!categoriesOpen)}
                    className="flex items-center justify-between w-full px-3 py-2.5 text-nav-foreground hover:bg-muted rounded"
                  >
                    <div className="flex items-center gap-3">
                      <Package className="w-4 h-4" />
                      <span>Categories</span>
                    </div>
                    {categoriesOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  {categoriesOpen && (
                    <div className="ml-7 mt-1 space-y-1">
                      {cats.map((c) => (
                        <Link
                          key={c.slug}
                          to={`/category/${c.slug}`}
                          onClick={() => setOpen(false)}
                          className="block px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded"
                        >
                          {c.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>

                {/* About */}
                <Link
                  to="/about/our-story"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 text-nav-foreground hover:bg-muted rounded"
                >
                  <Info className="w-4 h-4" />
                  <span>About</span>
                </Link>

                {/* Divider */}
                <div className="border-t border-border my-3"></div>

                {/* Theme Collapsible */}
                <div>
                  <button
                    onClick={() => setThemeOpen(!themeOpen)}
                    className="flex items-center justify-between w-full px-3 py-2.5 text-nav-foreground hover:bg-muted rounded"
                  >
                    <div className="flex items-center gap-3">
                      <Palette className="w-4 h-4" />
                      <span>Theme</span>
                    </div>
                    {themeOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  {themeOpen && (
                    <div className="ml-7 mt-1 space-y-1">
                      {themes.map((t) => (
                        <button
                          key={t}
                          onClick={() => setTheme(t)}
                          className={`flex items-center gap-2 w-full px-3 py-2 text-sm rounded hover:bg-muted ${
                            t === theme ? "text-foreground font-semibold" : "text-muted-foreground"
                          }`}
                        >
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-border flex-shrink-0"
                            style={{ backgroundColor: THEME_SWATCHES[t as keyof typeof THEME_SWATCHES] }}
                          />
                          {THEME_LABELS[t as keyof typeof THEME_LABELS]}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* ── Logged-in user / admin section ── */}
                {user && (
                  <>
                    <div className="border-t border-border my-3"></div>

                    {user.role === 'admin' ? (
                      /* Admin: user icon + email header, Admin dashboard link inside */
                      <div>
                        <button
                          onClick={() => setUserOpen(!userOpen)}
                          className="flex items-center justify-between w-full px-3 py-2.5 text-nav-foreground hover:bg-muted rounded"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <User className="w-4 h-4 flex-shrink-0" />
                            <span className="truncate text-sm">{user.email}</span>
                          </div>
                          {userOpen ? <ChevronUp className="w-4 h-4 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 flex-shrink-0" />}
                        </button>
                        {userOpen && (
                          <div className="ml-7 mt-1 space-y-1">
                            <Link
                              to="/admin"
                              onClick={() => setOpen(false)}
                              className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded"
                            >
                              <ShieldCheck className="w-4 h-4" />
                              <span>Admin dashboard</span>
                            </Link>
                          </div>
                        )}
                      </div>
                    ) : (
                      /* Regular user: user icon + email header, account links inside */
                      <div>
                        <button
                          onClick={() => setUserOpen(!userOpen)}
                          className="flex items-center justify-between w-full px-3 py-2.5 text-nav-foreground hover:bg-muted rounded"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <User className="w-4 h-4 flex-shrink-0" />
                            <span className="truncate text-sm">{user.email}</span>
                          </div>
                          {userOpen ? <ChevronUp className="w-4 h-4 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 flex-shrink-0" />}
                        </button>
                        {userOpen && (
                          <div className="ml-7 mt-1 space-y-1">
                            <Link to="/account/orders" onClick={() => setOpen(false)}
                              className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded">
                              <Package className="w-4 h-4" /><span>My Orders</span>
                            </Link>
                            <Link to="/account/chat" onClick={() => setOpen(false)}
                              className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded">
                              <MessageSquare className="w-4 h-4" /><span>Chat</span>
                            </Link>
                            <Link to="/account/profile" onClick={() => setOpen(false)}
                              className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded">
                              <User className="w-4 h-4" /><span>Profile</span>
                            </Link>
                            <Link to="/account/notifications" onClick={() => setOpen(false)}
                              className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded">
                              <Bell className="w-4 h-4" /><span>Notifications</span>
                            </Link>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </nav>

              {/* Sign Out — pinned at bottom for ALL logged-in users (admin + regular) */}
              {user && (
                <div className="border-t border-border pt-3 pb-4 px-1 mt-auto">
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-3 w-full px-3 py-2.5 text-nav-foreground hover:bg-muted rounded"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </SheetContent>
          </Sheet>
          <Link to="/" className="text-xl tracking-wider whitespace-nowrap text-primary" style={{ fontFamily: "'Playfair Display', serif" }}>
            Diera.Shop
          </Link>
        </div>

        {/* Desktop: Left nav */}
        <nav className="hidden lg:flex gap-6 text-sm">
          <Link to="/category/new-in" className="text-nav-foreground hover:text-nav-hover font-medium">New In</Link>
          {cats.map((c) => (
            <Link key={c.slug} to={`/category/${c.slug}`} className="text-nav-foreground hover:text-nav-hover">{c.name}</Link>
          ))}
          <Link to="/about/our-story" className="text-nav-foreground hover:text-nav-hover">About</Link>
        </nav>

        {/* Desktop: Centered logo */}
        <Link to="/" className="hidden lg:block absolute left-1/2 -translate-x-1/2 text-2xl tracking-wider text-primary" style={{ fontFamily: "'Playfair Display', serif" }}>
          Diera.Shop
        </Link>

        {/* Right side icons */}
        <div className="flex items-center gap-1 ml-4">
          <SearchBar />
          {/* Desktop: Theme and User Menu */}
          <div className="hidden lg:flex items-center gap-1">
            <ThemeSwitcher />
            {user?.role !== 'admin' && <NotificationBell />}
            <UserMenu />
          </div>
          {/* Mobile: notification bell for regular users only; admin controls are in the drawer */}
          {user ? (
            user.role !== 'admin' && (
              <div className="lg:hidden">
                <NotificationBell />
              </div>
            )
          ) : (
            <Link to="/auth/login" className="lg:hidden p-2" aria-label="Login">
              <User className="w-5 h-5" />
            </Link>
          )}
          {/* Cart on all screens */}
          <CartDrawer />
        </div>
      </div>
    </header>
  );
};

export default DieraHeader;
