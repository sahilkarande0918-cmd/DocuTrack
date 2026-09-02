/** A small, friendly robot face. Uses currentColor for the line work. */
export function RobotFace({ className, eyes = "open" }: { className?: string; eyes?: "open" | "happy" }) {
  return (
    <svg viewBox="0 0 48 48" className={className} fill="none" aria-hidden>
      {/* antenna */}
      <line x1="24" y1="6" x2="24" y2="11" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="24" cy="5" r="2.5" fill="currentColor" />
      {/* head */}
      <rect x="8" y="11" width="32" height="26" rx="9" fill="currentColor" opacity="0.16" />
      <rect x="8" y="11" width="32" height="26" rx="9" stroke="currentColor" strokeWidth="2.5" />
      {/* ears */}
      <rect x="4.5" y="19" width="4" height="10" rx="2" fill="currentColor" />
      <rect x="39.5" y="19" width="4" height="10" rx="2" fill="currentColor" />
      {/* eyes */}
      {eyes === "happy" ? (
        <>
          <path d="M15 24c1.5-2 4-2 5.5 0" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M27.5 24c1.5-2 4-2 5.5 0" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        </>
      ) : (
        <>
          <circle cx="18" cy="24" r="2.6" fill="currentColor" />
          <circle cx="30" cy="24" r="2.6" fill="currentColor" />
        </>
      )}
      {/* smile */}
      <path d="M18 30c2 2.4 10 2.4 12 0" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}
