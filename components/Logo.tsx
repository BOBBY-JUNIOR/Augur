/**
 * Augur mark — an all-seeing eye whose iris is ringed by five points, one per
 * Skill Hub signal. Pure SVG, no hooks, safe in server or client components.
 */
export function Logo({ className = "h-6 w-6" }: { className?: string }) {
  // Five evenly-spaced points around the iris (one per skill), starting at top.
  const cx = 16;
  const cy = 16;
  const r = 9.4;
  const pts = Array.from({ length: 5 }, (_, i) => {
    const a = (-90 + i * 72) * (Math.PI / 180);
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)] as const;
  });

  return (
    <svg
      viewBox="0 0 32 32"
      className={className}
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="augurGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#d4a05c" />
          <stop offset="100%" stopColor="#c4633a" />
        </linearGradient>
      </defs>

      {/* Eye almond */}
      <path
        d="M2.5 16 C 7.5 8, 24.5 8, 29.5 16 C 24.5 24, 7.5 24, 2.5 16 Z"
        stroke="url(#augurGrad)"
        strokeWidth="1.8"
      />

      {/* Five skill points around the iris */}
      {pts.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="1.05" fill="url(#augurGrad)" />
      ))}

      {/* Iris + pupil */}
      <circle cx={cx} cy={cy} r="4.8" fill="url(#augurGrad)" />
      <circle cx={cx} cy={cy} r="1.9" fill="#0a0a0a" />
    </svg>
  );
}
