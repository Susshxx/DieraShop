import { useTheme } from "@/hooks/useTheme";

// Theme-aware color map for the NEW badge background
const BADGE_COLORS: Record<string, { bg: string; text: string }> = {
  pink:   { bg: "#d4547a", text: "#fff" },
  rose:   { bg: "#b5714d", text: "#fff" },
  sage:   { bg: "#5a8a6a", text: "#fff" },
  golden: { bg: "#b8860b", text: "#fff" },
};

// NEW badge component for recently added products
const NewBadge = () => {
  const { theme } = useTheme();
  const colors = BADGE_COLORS[theme] ?? BADGE_COLORS.pink;

  return (
    <div className="absolute top-2 left-2 z-10">
      <span
        style={{
          backgroundColor: colors.bg,
          color: colors.text,
          fontSize: "9px",
          fontWeight: 700,
          letterSpacing: "0.08em",
          padding: "2px 5px",
          borderRadius: "2px",
          display: "inline-block",
          lineHeight: 1.4,
          textTransform: "uppercase",
          boxShadow: "0 1px 3px rgba(0,0,0,0.25)",
        }}
      >
        NEW
      </span>
    </div>
  );
};

export default NewBadge;
