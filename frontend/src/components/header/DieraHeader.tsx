import { Link } from "react-router-dom";
import SearchBar from "@/components/user/SearchBar";
import CartDrawer from "@/components/user/CartDrawer";
import UserMenu from "@/components/user/UserMenu";
import NotificationBell from "@/components/user/NotificationBell";
import ThemeSwitcher from "@/components/user/ThemeSwitcher";
import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Menu, X } from "lucide-react";

const DieraHeader = () => {
  const [cats, setCats] = useState<{ name: string; slug: string; showInHeader?: boolean }[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    api.get<{ name: string; slug: string; showInHeader?: boolean }[]>("/categories")
      .then((data) => {
        // Filter categories where showInHeader is true, limit to 5
        const headerCats = data.filter(c => c.showInHeader !== false).slice(0, 5);
        setCats(headerCats);
      })
      .catch(() => {});
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-nav-background/95 backdrop-blur border-b border-border">
      <div className="flex items-center justify-between h-16 px-4 sm:px-6">
        <button className="lg:hidden p-2" onClick={() => setOpen(!open)} aria-label="Menu">
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        <nav className="hidden lg:flex gap-6 text-sm">
          <Link to="/category/new-in" className="text-nav-foreground hover:text-nav-hover font-medium">New In</Link>
          {cats.map((c) => (
            <Link key={c.slug} to={`/category/${c.slug}`} className="text-nav-foreground hover:text-nav-hover">{c.name}</Link>
          ))}
          <Link to="/about/our-story" className="text-nav-foreground hover:text-nav-hover">About</Link>
        </nav>

        <Link to="/" className="absolute left-1/2 -translate-x-1/2 text-2xl tracking-wider" style={{ fontFamily: "'Playfair Display', serif" }}>
          Diera.Shop
        </Link>

        <div className="flex items-center gap-1">
          <SearchBar />
          <ThemeSwitcher />
          <NotificationBell />
          <UserMenu />
          <CartDrawer />
        </div>
      </div>

      {open && (
        <div className="lg:hidden border-t border-border bg-card px-4 py-4 space-y-2">
          <Link to="/category/new-in" onClick={() => setOpen(false)} className="block py-2 text-sm font-medium">New In</Link>
          {cats.map((c) => (
            <Link key={c.slug} to={`/category/${c.slug}`} onClick={() => setOpen(false)} className="block py-2 text-sm">{c.name}</Link>
          ))}
          <Link to="/about/our-story" onClick={() => setOpen(false)} className="block py-2 text-sm">About</Link>
        </div>
      )}
    </header>
  );
};

export default DieraHeader;
