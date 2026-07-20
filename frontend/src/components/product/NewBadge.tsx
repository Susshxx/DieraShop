import { useTheme } from "@/hooks/useTheme";

// NEW badge component for recently added products - with blur effect
const NewBadge = () => {
  return (
    <div className="absolute top-2 left-2 z-10">
      <span
        style={{
          backgroundColor: "rgba(255, 255, 255, 0.7)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          color: "#000",
          fontSize: "9px",
          fontWeight: 700,
          // letterSpacing: "0.08em",
          padding: "2px 5px",
          borderRadius: "2px",
          display: "inline-block",
          lineHeight: 1.4,
          textTransform: "uppercase",
          boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
          fontFamily: "'SF Pro Display', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', sans-serif",
          fontVariantNumeric: 'tabular-nums', 
          letterSpacing: '-0.01em'
        }}
      >
        NEW
      </span>
    </div>
  );
};

export default NewBadge;
