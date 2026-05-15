import { Link } from "react-router-dom";

export function Card({ children, className = "", style = {} }) {
  return (
    <div className={`dash-card ${className}`} style={style}>
      {children}
    </div>
  );
}

export function CardLabel({ icon: Icon, children }) {
  return (
    <div className="section-label mb-4">
      <div
        style={{
          width: 3,
          height: 14,
          borderRadius: 2,
          background: "var(--accent)",
          display: "inline-block",
          marginRight: 8,
        }}
      />
      {Icon && (
        <Icon size={12} style={{ color: "var(--accent)", marginRight: 6 }} />
      )}
      <span>{children}</span>
    </div>
  );
}

export function Toast({ message, type = "success" }) {
  if (!message) return null;
  const isError = type === "error";
  return (
    <div
      className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl text-sm font-medium shadow-lg max-w-xs"
      style={{
        background: isError
          ? "rgba(254,226,226,0.95)"
          : "color-mix(in srgb, var(--accent2) 15%, var(--bg-card))",
        color: isError ? "#991B1B" : "var(--accent2)",
        border: isError
          ? "1px solid rgba(251,191,36,0.2)"
          : "1px solid color-mix(in srgb, var(--accent2) 30%, transparent)",
      }}
    >
      {message}
    </div>
  );
}

export function GuestBanner() {
  return (
    <div
      className="flex items-center justify-between gap-3 flex-wrap px-4 py-3 mb-4 rounded-xl text-sm"
      style={{
        background: "color-mix(in srgb, var(--accent) 10%, transparent)",
        border: "1px solid color-mix(in srgb, var(--accent) 25%, transparent)",
      }}
    >
      <div style={{ color: "var(--text-b)" }}>
        <span className="font-semibold" style={{ color: "var(--text-h)" }}>
          You are browsing as a guest.
        </span>{" "}
        Log in to save reflections, track streaks, and join prayer.
      </div>
      <div className="flex gap-2 flex-shrink-0">
        <Link to="/register" className="btn-primary text-xs py-1.5 px-4">
          Create Account
        </Link>
        <Link to="/login" className="btn-secondary text-xs py-1.5 px-4">
          Log In
        </Link>
      </div>
    </div>
  );
}
