import { Link, useNavigate } from "react-router-dom";
import { User as UserIcon, LogOut, Package, MessageCircle, ShieldCheck } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { clearToken } from "@/lib/api";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const UserMenu = () => {
  const { user, role, signOut } = useAuth();
  const nav = useNavigate();

  if (!user) {
    return (
      <Link to="/auth/login" className="p-2 text-nav-foreground hover:text-nav-hover" aria-label="Sign in">
        <UserIcon className="w-5 h-5" />
      </Link>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="p-2 text-nav-foreground hover:text-nav-hover" aria-label="Account">
        <UserIcon className="w-5 h-5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="truncate">{user.email}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {role !== "admin" && (
          <>
            <DropdownMenuItem onClick={() => nav("/account/profile")}><UserIcon className="w-4 h-4 mr-2" /> My account</DropdownMenuItem>
            <DropdownMenuItem onClick={() => nav("/account/orders")}><Package className="w-4 h-4 mr-2" /> Orders</DropdownMenuItem>
            <DropdownMenuItem onClick={() => nav("/account/chat")}><MessageCircle className="w-4 h-4 mr-2" /> Chat with us</DropdownMenuItem>
          </>
        )}
        {role === "admin" && (
          <>
            <DropdownMenuItem onClick={() => nav("/admin")}><ShieldCheck className="w-4 h-4 mr-2" /> Admin dashboard</DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        {role !== "admin" && <DropdownMenuSeparator />}
        <DropdownMenuItem onClick={async () => { clearToken(); await signOut(); nav("/auth/login"); }}><LogOut className="w-4 h-4 mr-2" /> Sign out</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserMenu;
