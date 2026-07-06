interface CircularProgressProps {
  value: number;
  size?: number;
  strokeWidth?: number;
  /** Texto pequeno acima do valor */
  topLabel?: string;
  /** Texto pequeno abaixo do valor */
  bottomLabel?: string;
}

/**
 * Donut de progresso pintado com gradient teal→cyan. SVG puro, sem deps.
 * Aceita 0..100; clamp aplicado.
 *
 * Adaptativo:
 *  - Track e textos mudam entre light e dark via classes Tailwind.
 *  - Tamanhos das fontes escalam proporcionalmente ao `size` para que o
 *    valor central nunca estoure o círculo (problema visto em size=92 do
 *    layout mobile, que usava text-3xl fixo de 30px).
 *
 * Tamanhos esperados:
 *   size=160 → valor ≈ 28px, labels ≈ 11px (default desktop)
 *   size=140 → valor ≈ 24px, labels ≈ 10px
 *   size=92  → valor ≈ 16px, labels ≈ 9px  (mobile)
 */
export function CircularProgress({
  value,
  size = 160,
  strokeWidth = 12,
  topLabel = "Meta",
  bottomLabel = "do objetivo",
}: CircularProgressProps) {
  const normalized = Math.max(0, Math.min(100, value));
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (normalized / 100) * circumference;
  const gradientId = `weightProgress-${size}-${strokeWidth}`;

  // Tamanhos de fonte proporcionais ao tamanho do círculo, com clamp.
  const valueFontSize = Math.max(14, Math.round(size * 0.18));
  const labelFontSize = Math.max(9, Math.round(size * 0.078));
  const verticalGap = Math.max(0, Math.round(size * 0.02));

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
        aria-hidden="true"
      >
        {/* Track */}
        <circle
          className="stroke-slate-200 dark:stroke-slate-700/85"
          fill="transparent"
          strokeWidth={strokeWidth}
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        {/* Progress */}
        <circle
          stroke={`url(#${gradientId})`}
          fill="transparent"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          r={radius}
          cx={size / 2}
          cy={size / 2}
          style={{ transition: "stroke-dashoffset 600ms ease" }}
        />
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2EE6C6" />
            <stop offset="100%" stopColor="#22D3EE" />
          </linearGradient>
        </defs>
      </svg>

      <div
        className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none px-1 leading-none"
        style={{ gap: `${verticalGap}px` }}
      >
        <p
          className="font-semibold uppercase tracking-wider text-cyan-700 dark:text-cyan-200/80 leading-none"
          style={{ fontSize: `${labelFontSize}px` }}
        >
          {topLabel}
        </p>
        <p
          className="font-bold text-slate-900 dark:text-slate-50 leading-none"
          style={{ fontSize: `${valueFontSize}px` }}
        >
          {normalized.toFixed(1)}%
        </p>
        <p
          className="text-slate-500 dark:text-slate-400 leading-none"
          style={{ fontSize: `${labelFontSize}px` }}
        >
          {bottomLabel}
        </p>
      </div>
    </div>
  );
}
