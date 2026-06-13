import { useTheme, Theme } from "@/hooks/useTheme";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Palette } from "lucide-react";

const LABELS: Record<Theme, string> = {
  pink: "Light Pink",
  rose: "Dusty Rose",
  sage: "Sage Cream",
  golden: "Golden Glow",
};

const SWATCHES: Record<Theme, string> = {
  pink: "#f5c6d8",
  rose: "#e8c8b8",
  sage: "#c8dbc0",
  golden: "#fdf8e1",
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
          <DropdownMenuItem key={t} onClick={() => setTheme(t)} className={`flex items-center gap-2 ${t === theme ? "font-semibold" : ""}`}>
            <span className="w-3.5 h-3.5 rounded-full border border-border flex-shrink-0" style={{ backgroundColor: SWATCHES[t] }} />
            {LABELS[t]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ThemeSwitcher;
