import { useTheme, Theme } from "@/hooks/useTheme";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Palette } from "lucide-react";

const LABELS: Record<Theme, string> = {
  pink: "Light Pink",
  rose: "Dusty Rose",
  sage: "Sage Cream",
  dark: "Dark",
};

const ThemeSwitcher = () => {
  const { theme, setTheme, themes } = useTheme();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="p-2 text-nav-foreground hover:text-nav-hover" aria-label="Theme">
        <Palette className="w-5 h-5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {themes.map((t) => (
          <DropdownMenuItem key={t} onClick={() => setTheme(t)} className={t === theme ? "font-semibold" : ""}>
            {LABELS[t]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ThemeSwitcher;
