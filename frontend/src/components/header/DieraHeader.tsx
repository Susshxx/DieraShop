// import { Link } from "react-router-dom";
// import SearchBar from "@/components/user/SearchBar";
// import CartDrawer from "@/components/user/CartDrawer";
// import UserMenu from "@/components/user/UserMenu";
// import NotificationBell from "@/components/user/NotificationBell";
// import ThemeSwitcher from "@/components/user/ThemeSwitcher";
// import { useState, useEffect } from "react";
// import { api, clearToken } from "@/lib/api";
// import { Menu, ChevronDown, ChevronUp, Sparkles, Info, Palette, User, Package, MessageSquare, LogOut, Bell, ShieldCheck, Grid3x3, Glasses, Watch, Gem, Shirt, ShoppingBag, CircleDot, Footprints, BadgePercent } from "lucide-react";
// import { useAuth } from "@/hooks/useAuth";
// import { useTheme } from "@/hooks/useTheme";
// import { useNavigate } from "react-router-dom";
// import {
//   Sheet,
//   SheetContent,
//   SheetHeader,
//   SheetTitle,
//   SheetTrigger,
// } from "@/components/ui/sheet";

// const THEME_LABELS = {
//   white: "Pure White",
//   pink: "Light Pink",
//   rose: "Dusty Rose",
//   sage: "Sage Cream",
//   golden: "Golden Glow",
// };

// const THEME_SWATCHES = {
//   white: "#ffffff",
//   pink: "#f5c6d8",
//   rose: "#e8c8b8",
//   sage: "#c8dbc0",
//   golden: "#fdf8e1",
// };

// // Map category names/slugs to appropriate icons
// const getCategoryIcon = (categoryName: string, categorySlug: string) => {
//   const name = categoryName.toLowerCase();
//   const slug = categorySlug.toLowerCase();
  
//   // Check for specific category types
//   if (name.includes('ring') || slug.includes('ring')) return Gem;
//   if (name.includes('bracelet') || slug.includes('bracelet')) return Watch;
//   if (name.includes('necklace') || slug.includes('necklace')) return Gem;
//   if (name.includes('earring') || slug.includes('earring')) return Gem;
//   if (name.includes('shoe') || slug.includes('shoe')) return Footprints;
//   if (name.includes('bag') || slug.includes('bag')) return ShoppingBag;
//   if (name.includes('cap') || slug.includes('cap')) return CircleDot;
//   if (name.includes('hat') || slug.includes('hat')) return CircleDot;
//   if (name.includes('glass') || slug.includes('glass')) return Glasses;
//   if (name.includes('hoodie') || name.includes('jacket') || slug.includes('hoodie')) return Shirt;
//   if (name.includes('trouser') || name.includes('pant') || slug.includes('trouser')) return Shirt;
//   if (name.includes('shirt') || name.includes('tshirt') || slug.includes('shirt')) return Shirt;
//   if (name.includes('boot') || slug.includes('boot')) return Footprints;
//   if (name.includes('accessori') || slug.includes('accessori')) return BadgePercent;
  
//   // Default icon
//   return Grid3x3;
// };

// const DieraHeader = () => {
//   const { user, signOut } = useAuth();
//   const { theme, setTheme, themes } = useTheme();
//   const navigate = useNavigate();
//   const [cats, setCats] = useState<{ name: string; slug: string; showInHeader?: boolean }[]>([]);
//   const [headerCats, setHeaderCats] = useState<{ name: string; slug: string; showInHeader?: boolean }[]>([]);
//   const [open, setOpen] = useState(false);
//   const [themeOpen, setThemeOpen] = useState(false);
//   const [userOpen, setUserOpen] = useState(false);

//   useEffect(() => {
//     // Filter: show only if showInHeader is explicitly true
//     const filterHeader = (list: any[]) => {
//       const filtered = list.filter((c) => {
//         const val = c.showInHeader ?? c.show_in_header;
//         // Check for explicit true or 1
//         return val === true || val === 1;
//       });
//       console.log('All categories:', list);
//       console.log('Filtered for header (showInHeader=true):', filtered);
//       return filtered;
//     };

//     // Force fresh fetch - clear all caches
//     localStorage.removeItem('diera-categories');
//     sessionStorage.clear();

//     // Fetch with cache-busting timestamp
//     api.get<{ name: string; slug: string; showInHeader?: boolean; show_in_header?: boolean; showInFooter?: boolean; show_in_footer?: boolean }[]>(`/categories?_=${Date.now()}`)
//       .then((data) => {
//         console.log('Raw API response:', data);
//         const filtered = filterHeader(data);
//         setCats(data);
//         setHeaderCats(filtered);
//         // Don't cache categories in localStorage to avoid stale data
//       })
//       .catch((err) => { 
//         console.error('Failed to fetch categories:', err);
//       });
//   }, []);

//   const handleSignOut = async () => {
//     setOpen(false);
//     clearToken();
//     await signOut();
//     navigate('/auth/login');
//   };

//   return (
//     <header className="sticky top-0 z-40 bg-nav-background/95 sm:bg-nav-background/95 lg:bg-nav-background/95 backdrop-blur border-b border-border">
//       {/* Mobile: White background with dark text */}
//       <style>{`
//         @media (max-width: 639px) {
//           header {
//             background: rgba(255, 255, 255, 0.98) !important;
//             backdrop-filter: blur(8px);
//           }
//           header button,
//           header a,
//           header svg {
//             color: #333 !important;
//           }
//           header .text-primary {
//             color: #8B4789 !important;
//           }
//         }
//       `}</style>
//       <div className="flex items-center justify-between h-16 px-4 sm:px-6">
//         {/* Mobile: Hamburger + Logo on left */}
//         <div className="flex items-center gap-3 lg:hidden">
//           <Sheet open={open} onOpenChange={setOpen}>
//             <SheetTrigger asChild>
//               <button className="p-2" aria-label="Menu">
//                 <Menu className="w-5 h-5" />
//               </button>
//             </SheetTrigger>
//             <SheetContent side="left" className="w-[280px] flex flex-col">
//               <SheetHeader>
//                 <SheetTitle>Menu</SheetTitle>
//               </SheetHeader>
//               <nav className="flex flex-col gap-1 mt-6 flex-1 overflow-y-auto min-h-0">
//                 {/* New In */}
//                 <Link
//                   to="/category/new-in"
//                   onClick={() => setOpen(false)}
//                   className="flex items-center gap-3 px-3 py-2.5 text-nav-foreground hover:bg-muted rounded text-base"
//                 >
//                   <Sparkles className="w-5 h-5" />
//                   <span>New In</span>
//                 </Link>

//                 {/* Individual category links */}
//                 {headerCats.map((c) => {
//                   const IconComponent = getCategoryIcon(c.name, c.slug);
//                   return (
//                     <Link
//                       key={c.slug}
//                       to={`/category/${c.slug}`}
//                       onClick={() => setOpen(false)}
//                       className="flex items-center gap-3 px-3 py-2.5 text-nav-foreground hover:bg-muted rounded"
//                     >
//                       <IconComponent className="w-4 h-4" />
//                       <span>{c.name}</span>
//                     </Link>
//                   );
//                 })}

//                 {/* Collections Link */}
//                 <Link
//                   to="/collections"
//                   onClick={() => setOpen(false)}
//                   className="flex items-center gap-3 px-3 py-2.5 text-nav-foreground hover:bg-muted rounded text-base"
//                 >
//                   <Grid3x3 className="w-5 h-5" />
//                   <span>Collections</span>
//                 </Link>

//                 {/* Divider */}
//                 <div className="border-t border-border my-3"></div>

//                 {/* Theme Collapsible */}
//                 <div>
//                   <button
//                     onClick={() => setThemeOpen(!themeOpen)}
//                     className="flex items-center justify-between w-full px-3 py-2.5 text-nav-foreground hover:bg-muted rounded"
//                   >
//                     <div className="flex items-center gap-3">
//                       <Palette className="w-4 h-4" />
//                       <span>Theme</span>
//                     </div>
//                     {themeOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
//                   </button>
//                   {themeOpen && (
//                     <div className="ml-7 mt-1 space-y-1">
//                       {themes.map((t) => (
//                         <button
//                           key={t}
//                           onClick={() => setTheme(t)}
//                           className={`flex items-center gap-2 w-full px-3 py-2 text-sm rounded hover:bg-muted ${
//                             t === theme ? "font-semibold" : ""
//                           }`}
//                           style={{ color: '#000000' }}
//                         >
//                           <span
//                             className="w-3.5 h-3.5 rounded-full flex-shrink-0"
//                             style={{
//                               backgroundColor: THEME_SWATCHES[t as keyof typeof THEME_SWATCHES],
//                               border: t === 'white' ? '1.5px solid #999' : '1px solid var(--border)',
//                             }}
//                           />
//                           {THEME_LABELS[t as keyof typeof THEME_LABELS]}
//                         </button>
//                       ))}
//                     </div>
//                   )}
//                 </div>

//                 {/* ── Logged-in user / admin section ── */}
//                 {user && (
//                   <>
//                     <div className="border-t border-border my-3"></div>

//                     {user.role === 'admin' ? (
//                       /* Admin: user icon + email header, Admin dashboard link inside */
//                       <div>
//                         <button
//                           onClick={() => setUserOpen(!userOpen)}
//                           className="flex items-center justify-between w-full px-3 py-2.5 text-nav-foreground hover:bg-muted rounded"
//                         >
//                           <div className="flex items-center gap-3 min-w-0">
//                             <User className="w-4 h-4 flex-shrink-0" />
//                             <span className="truncate text-sm">{user.email}</span>
//                           </div>
//                           {userOpen ? <ChevronUp className="w-4 h-4 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 flex-shrink-0" />}
//                         </button>
//                         {userOpen && (
//                           <div className="ml-7 mt-1 space-y-1">
//                             <Link
//                               to="/admin"
//                               onClick={() => setOpen(false)}
//                               className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded"
//                             >
//                               <ShieldCheck className="w-4 h-4" />
//                               <span>Admin dashboard</span>
//                             </Link>
//                           </div>
//                         )}
//                       </div>
//                     ) : (
//                       /* Regular user: user icon + email header, account links inside */
//                       <div>
//                         <button
//                           onClick={() => setUserOpen(!userOpen)}
//                           className="flex items-center justify-between w-full px-3 py-2.5 text-nav-foreground hover:bg-muted rounded"
//                         >
//                           <div className="flex items-center gap-3 min-w-0">
//                             <User className="w-4 h-4 flex-shrink-0" />
//                             <span className="truncate text-sm">{user.email}</span>
//                           </div>
//                           {userOpen ? <ChevronUp className="w-4 h-4 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 flex-shrink-0" />}
//                         </button>
//                         {userOpen && (
//                           <div className="ml-7 mt-1 space-y-1">
//                             <Link to="/account/profile" onClick={() => setOpen(false)}
//                               className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded">
//                               <User className="w-4 h-4" /><span>My Account</span>
//                             </Link>
//                             <Link to="/account/orders" onClick={() => setOpen(false)}
//                               className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded">
//                               <Package className="w-4 h-4" /><span>Orders</span>
//                             </Link>
//                             <Link to="/account/chat" onClick={() => setOpen(false)}
//                               className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded">
//                               <MessageSquare className="w-4 h-4" /><span>Chat with us</span>
//                             </Link>
//                           </div>
//                         )}
//                       </div>
//                     )}
//                   </>
//                 )}
//               </nav>

//               {/* Sign Out — pinned at bottom for ALL logged-in users (admin + regular) */}
//               {user && (
//                 <div className="border-t border-border pt-3 pb-4 px-1 mt-auto">
//                   <button
//                     onClick={handleSignOut}
//                     className="flex items-center gap-3 w-full px-3 py-2.5 text-nav-foreground hover:bg-muted rounded"
//                   >
//                     <LogOut className="w-4 h-4" />
//                     <span>Sign Out</span>
//                   </button>
//                 </div>
//               )}
//             </SheetContent>
//           </Sheet>
//           <Link to="/" className="flex items-center whitespace-nowrap">
//             <img 
//               src="/diera_shop.svg" 
//               alt="Diera.Shop" 
//               className="h-50 w-auto sm:h-60"
//               style={{ filter: 'brightness(0) saturate(100%) invert(47%) sepia(43%) saturate(1234%) hue-rotate(273deg) brightness(91%) contrast(89%)' }}
//             />
//           </Link>
//         </div>

//         {/* Desktop: Left nav */}
//         <nav className="hidden lg:flex gap-6 text-sm">
//           <Link to="/category/new-in" className="text-nav-foreground hover:text-nav-hover text-base">New In</Link>
//           {/* Show individual category links for all users */}
//           {headerCats.map((c) => (
//             <Link key={c.slug} to={`/category/${c.slug}`} className="text-nav-foreground hover:text-nav-hover">{c.name}</Link>
//           ))}
//           <Link to="/collections" className="text-nav-foreground hover:text-nav-hover text-base">Collections</Link>
//         </nav>

//         {/* Desktop: Centered logo */}
//         <Link to="/" className="hidden lg:block absolute left-1/2 -translate-x-1/2">
//           <img 
//             src="/diera_shop.svg" 
//             alt="Diera.Shop" 
//             className="h-14 w-auto"
//             style={{ filter: 'brightness(0) saturate(100%) invert(47%) sepia(43%) saturate(1234%) hue-rotate(273deg) brightness(91%) contrast(89%)' }}
//           />
//         </Link>

//         {/* Right side icons */}
//         <div className="flex items-center gap-1 ml-4">
//           <SearchBar />
//           {/* Desktop: Theme and User Menu */}
//           <div className="hidden lg:flex items-center gap-1">
//             <ThemeSwitcher />
//             {user?.role !== 'admin' && <NotificationBell />}
//             <UserMenu />
//           </div>
//           {/* Mobile: notification bell for regular users only; admin controls are in the drawer */}
//           {user ? (
//             user.role !== 'admin' && (
//               <div className="lg:hidden">
//                 <NotificationBell />
//               </div>
//             )
//           ) : (
//             <Link to="/auth/login" className="lg:hidden p-2" aria-label="Login">
//               <User className="w-5 h-5" />
//             </Link>
//           )}
//           {/* Cart on all screens */}
//           <CartDrawer />
//         </div>
//       </div>
//     </header>
//   );
// };

// export default DieraHeader;


import { Link } from "react-router-dom";
import SearchBar from "@/components/user/SearchBar";
import CartDrawer from "@/components/user/CartDrawer";
import UserMenu from "@/components/user/UserMenu";
import NotificationBell from "@/components/user/NotificationBell";
import ThemeSwitcher from "@/components/user/ThemeSwitcher";
import { useState, useEffect } from "react";
import { api, clearToken } from "@/lib/api";
import { Menu, ChevronDown, ChevronUp, Sparkles, Info, Palette, User, Package, MessageSquare, LogOut, Bell, ShieldCheck, Grid3x3, Glasses, Watch, Gem, Shirt, ShoppingBag, CircleDot, Footprints, BadgePercent } from "lucide-react";
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
  white: "Pure White",
  pink: "Light Pink",
  rose: "Dusty Rose",
  sage: "Sage Cream",
  golden: "Golden Glow",
};

const THEME_SWATCHES = {
  white: "#ffffff",
  pink: "#f5c6d8",
  rose: "#e8c8b8",
  sage: "#c8dbc0",
  golden: "#fdf8e1",
};

// Map category names/slugs to appropriate icons
const getCategoryIcon = (categoryName: string, categorySlug: string) => {
  const name = categoryName.toLowerCase();
  const slug = categorySlug.toLowerCase();
  
  // Check for specific category types
  if (name.includes('ring') || slug.includes('ring')) return Gem;
  if (name.includes('bracelet') || slug.includes('bracelet')) return Watch;
  if (name.includes('necklace') || slug.includes('necklace')) return Gem;
  if (name.includes('earring') || slug.includes('earring')) return Gem;
  if (name.includes('shoe') || slug.includes('shoe')) return Footprints;
  if (name.includes('bag') || slug.includes('bag')) return ShoppingBag;
  if (name.includes('cap') || slug.includes('cap')) return CircleDot;
  if (name.includes('hat') || slug.includes('hat')) return CircleDot;
  if (name.includes('glass') || slug.includes('glass')) return Glasses;
  if (name.includes('hoodie') || name.includes('jacket') || slug.includes('hoodie')) return Shirt;
  if (name.includes('trouser') || name.includes('pant') || slug.includes('trouser')) return Shirt;
  if (name.includes('shirt') || name.includes('tshirt') || slug.includes('shirt')) return Shirt;
  if (name.includes('boot') || slug.includes('boot')) return Footprints;
  if (name.includes('accessori') || slug.includes('accessori')) return BadgePercent;
  
  // Default icon
  return Grid3x3;
};

const DieraHeader = () => {
  const { user, signOut } = useAuth();
  const { theme, setTheme, themes } = useTheme();
  const navigate = useNavigate();
  const [cats, setCats] = useState<{ name: string; slug: string; showInHeader?: boolean }[]>([]);
  const [headerCats, setHeaderCats] = useState<{ name: string; slug: string; showInHeader?: boolean }[]>([]);
  const [open, setOpen] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);

  useEffect(() => {
    // Filter: show only if showInHeader is explicitly true
    const filterHeader = (list: any[]) => {
      const filtered = list.filter((c) => {
        const val = c.showInHeader ?? c.show_in_header;
        // Check for explicit true or 1
        return val === true || val === 1;
      });
      console.log('All categories:', list);
      console.log('Filtered for header (showInHeader=true):', filtered);
      return filtered;
    };

    // Force fresh fetch - clear all caches
    localStorage.removeItem('diera-categories');
    sessionStorage.clear();

    // Fetch with cache-busting timestamp
    api.get<{ name: string; slug: string; showInHeader?: boolean; show_in_header?: boolean; showInFooter?: boolean; show_in_footer?: boolean }[]>(`/categories?_=${Date.now()}`)
      .then((data) => {
        console.log('Raw API response:', data);
        const filtered = filterHeader(data);
        setCats(data);
        setHeaderCats(filtered);
        // Don't cache categories in localStorage to avoid stale data
      })
      .catch((err) => { 
        console.error('Failed to fetch categories:', err);
      });
  }, []);

  const handleSignOut = async () => {
    setOpen(false);
    clearToken();
    await signOut();
    navigate('/auth/login');
  };

  return (
    <header className="sticky top-0 z-40 bg-nav-background/95 sm:bg-nav-background/95 lg:bg-nav-background/95 backdrop-blur border-b border-border">
      {/* Mobile: White background with dark text */}
      <style>{`
        @media (max-width: 639px) {
          header {
            background: rgba(255, 255, 255, 0.98) !important;
            backdrop-filter: blur(8px);
          }
          header button,
          header a,
          header svg {
            color: #333 !important;
          }
          header .text-primary {
            color: #000000ff !important;
          }
        }
      `}</style>
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
                  className="flex items-center gap-3 px-3 py-2.5 text-nav-foreground hover:bg-muted rounded text-base"
                >
                  <Sparkles className="w-5 h-5" />
                  <span>New In</span>
                </Link>

                {/* Individual category links */}
                {headerCats.map((c) => {
                  const IconComponent = getCategoryIcon(c.name, c.slug);
                  return (
                    <Link
                      key={c.slug}
                      to={`/category/${c.slug}`}
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 text-nav-foreground hover:bg-muted rounded"
                    >
                      <IconComponent className="w-4 h-4" />
                      <span>{c.name}</span>
                    </Link>
                  );
                })}

                {/* Collections Link */}
                <Link
                  to="/collections"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 text-nav-foreground hover:bg-muted rounded text-base"
                >
                  <Grid3x3 className="w-5 h-5" />
                  <span>Collections</span>
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
                            t === theme ? "font-semibold" : ""
                          }`}
                          style={{ color: '#000000' }}
                        >
                          <span
                            className="w-3.5 h-3.5 rounded-full flex-shrink-0"
                            style={{
                              backgroundColor: THEME_SWATCHES[t as keyof typeof THEME_SWATCHES],
                              border: t === 'white' ? '1.5px solid #999' : '1px solid var(--border)',
                            }}
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
                            <Link to="/account/profile" onClick={() => setOpen(false)}
                              className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded">
                              <User className="w-4 h-4" /><span>My Account</span>
                            </Link>
                            <Link to="/account/orders" onClick={() => setOpen(false)}
                              className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded">
                              <Package className="w-4 h-4" /><span>Orders</span>
                            </Link>
                            <Link to="/account/chat" onClick={() => setOpen(false)}
                              className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded">
                              <MessageSquare className="w-4 h-4" /><span>Chat with us</span>
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
          <Link to="/" className="flex items-center whitespace-nowrap">
            <span className="text-2xl sm:text-3xl font-medium tracking-wide text-primary">
              Diera Shop
            </span>
          </Link>
        </div>

        {/* Desktop: Left nav */}
        <nav className="hidden lg:flex gap-6 text-l">
          <Link to="/category/new-in" className="text-nav-foreground hover:text-nav-hover text-base">New In</Link>
          {/* Show individual category links for all users */}
          {headerCats.map((c) => (
            <Link key={c.slug} to={`/category/${c.slug}`} className="text-nav-foreground hover:text-nav-hover">{c.name}</Link>
          ))}
          <Link to="/collections" className="text-nav-foreground hover:text-nav-hover text-base">Collections</Link>
        </nav>

        {/* Desktop: Centered logo */}
        <Link to="/" className="hidden lg:flex items-center absolute left-1/2 -translate-x-1/2">
          <span className="text-3xl  font-medium tracking-wide text-primary whitespace-nowrap">
            Diera Shop
          </span>
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