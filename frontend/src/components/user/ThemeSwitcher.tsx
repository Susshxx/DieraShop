import { useTheme, Theme } from "@/hooks/useTheme";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Palette } from "lucide-react";

const LABELS: Record<Theme, string> = {
  white: "Pure White",
  pink: "Light Pink",
  rose: "Dusty Rose",
  sage: "Sage Cream",
  golden: "Golden Glow",
};

const SWATCHES: Record<Theme, string> = {
  white: "#ffffff",
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
          <DropdownMenuItem key={t} onClick={() => setTheme(t)} className={`flex items-center gap-2 ${t === theme ? "font-semibold" : ""}`} style={{ color: '#000000' }}>
            <span
              className="w-3.5 h-3.5 rounded-full flex-shrink-0"
              style={{
                backgroundColor: SWATCHES[t],
                border: t === 'white' ? '1.5px solid #999' : '1px solid var(--border)',
              }}
            />
            {LABELS[t]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ThemeSwitcher;
