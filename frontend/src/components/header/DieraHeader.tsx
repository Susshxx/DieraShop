import { Link } from "react-router-dom";
import SearchBar from "@/components/user/SearchBar";
import CartDrawer from "@/components/user/CartDrawer";
import UserMenu from "@/components/user/UserMenu";
import NotificationBell from "@/components/user/NotificationBell";
import ThemeSwitcher from "@/components/user/ThemeSwitcher";
import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Menu } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const DieraHeader = () => {
  const { user } = useAuth();
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
        {/* Mobile: Hamburger + Logo on left */}
        <div className="flex items-center gap-3 lg:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button className="p-2" aria-label="Menu">
                <Menu className="w-5 h-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[50vw] sm:w-[300px]">
              <SheetHeader>
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-4 mt-6">
                <Link 
                  to="/category/new-in" 
                  onClick={() => setOpen(false)} 
                  className="text-nav-foreground hover:text-nav-hover font-medium"
                >
                  New In
                </Link>
                {cats.map((c) => (
                  <Link 
                    key={c.slug} 
                    to={`/category/${c.slug}`} 
                    onClick={() => setOpen(false)} 
                    className="text-nav-foreground hover:text-nav-hover"
                  >
                    {c.name}
                  </Link>
                ))}
                <Link 
                  to="/about/our-story" 
                  onClick={() => setOpen(false)} 
                  className="text-nav-foreground hover:text-nav-hover"
                >
                  About
                </Link>
              </nav>
            </SheetContent>
          </Sheet>
          <Link to="/" className="text-xl tracking-wider whitespace-nowrap" style={{ fontFamily: "'Playfair Display', serif" }}>
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
        <Link to="/" className="hidden lg:block absolute left-1/2 -translate-x-1/2 text-2xl tracking-wider" style={{ fontFamily: "'Playfair Display', serif" }}>
          Diera.Shop
        </Link>

        {/* Right side icons */}
        <div className="flex items-center ml-4">
          <SearchBar />
          <ThemeSwitcher />
          {user?.role !== 'admin' && <NotificationBell />}
          <UserMenu />
          <CartDrawer />
        </div>
      </div>
    </header>
  );
};

export default DieraHeader;
