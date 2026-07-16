import { NavLink, Outlet, Navigate } from "react-router-dom";
import DieraHeader from "@/components/header/DieraHeader";
import Footer from "@/components/footer/Footer";
import { useAuth } from "@/hooks/useAuth";

const tabs = [
  { to: "/account/orders", label: "Orders" },
  { to: "/account/chat", label: "Chat" },
  { to: "/account/notifications", label: "Notifications" },
  { to: "/account/profile", label: "Profile" },
];

const AccountLayout = () => {
  const { role } = useAuth();

  // Redirect admin users to admin dashboard instead of account page
  if (role === "admin") {
    return <Navigate to="/admin" replace />;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <DieraHeader />
      <main className="flex-1 px-4 sm:px-6 py-8 max-w-6xl mx-auto w-full">
        <h1 className="text-3xl mb-6">My account</h1>
        <div className="flex flex-wrap gap-1 border-b border-border mb-6">
          {tabs.map((t) => (
            <NavLink
              key={t.to}
              to={t.to}
              end={t.end}
              className={({ isActive }) =>
                `px-4 py-2 text-sm border-b-2 -mb-px transition-colors ${isActive ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`
              }
            >
              {t.label}
            </NavLink>
          ))}
        </div>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default AccountLayout;
