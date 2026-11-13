// Original vector composition of a solar kit (panels, inverter, battery stack, cables), inspired by the
// product-shot style of the design reference. No third-party brands.
export function HeroIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 640 500" className={className} role="img" aria-label="Solar panels, a hybrid inverter and a stack of lithium batteries">
      <defs>
        <linearGradient id="hi-panel" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#24408f" />
          <stop offset="0.55" stopColor="#13235a" />
          <stop offset="1" stopColor="#0a1336" />
        </linearGradient>
        <linearGradient id="hi-sheen" x1="0" y1="0" x2="1" y2="0.6">
          <stop offset="0" stopColor="#fff" stopOpacity=".22" />
          <stop offset=".35" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <pattern id="hi-cells" width="22" height="22" patternUnits="userSpaceOnUse">
          <path d="M22 0H0V22" fill="none" stroke="#9fb6ff" strokeOpacity=".28" strokeWidth="1.2" />
        </pattern>
        <linearGradient id="hi-inverter" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#d6d8dc" />
        </linearGradient>
        <linearGradient id="hi-battery" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2a2a2c" />
          <stop offset="1" stopColor="#111113" />
        </linearGradient>
        <linearGradient id="hi-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f8e08e" />
          <stop offset=".5" stopColor="#dcab42" />
          <stop offset="1" stopColor="#a87923" />
        </linearGradient>
        <radialGradient id="hi-glow" cx=".5" cy=".5" r=".5">
          <stop offset="0" stopColor="#dcab42" stopOpacity=".45" />
          <stop offset="1" stopColor="#dcab42" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="hi-floor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity=".07" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>

      <ellipse cx="330" cy="440" rx="300" ry="70" fill="url(#hi-glow)" />
      <rect x="0" y="430" width="640" height="70" fill="url(#hi-floor)" />

      {/* panels */}
      {[
        { x: 40, y: 40, w: 220, h: 330 },
        { x: 215, y: 18, w: 230, h: 340 },
      ].map((p, i) => (
        <g key={i}>
          <rect x={p.x - 6} y={p.y - 6} width={p.w + 12} height={p.h + 12} rx="6" fill="#c9ccd2" />
          <rect x={p.x} y={p.y} width={p.w} height={p.h} rx="3" fill="url(#hi-panel)" />
          <rect x={p.x} y={p.y} width={p.w} height={p.h} rx="3" fill="url(#hi-cells)" />
          <rect x={p.x} y={p.y} width={p.w} height={p.h} rx="3" fill="url(#hi-sheen)" />
        </g>
      ))}

      {/* inverter */}
      <g>
        <rect x="58" y="215" width="190" height="215" rx="14" fill="#000" opacity=".35" transform="translate(6 8)" />
        <rect x="58" y="215" width="190" height="215" rx="14" fill="url(#hi-inverter)" />
        <rect x="58" y="215" width="12" height="215" rx="6" fill="#9a9da3" opacity=".5" />
        <text x="84" y="250" fontFamily="var(--font-display), sans-serif" fontWeight="800" fontSize="15" fill="#1d1d1f" letterSpacing="1.5">
          HYBRID 5kVA
        </text>
        <rect x="118" y="300" width="72" height="72" rx="20" fill="#111" />
        <rect x="132" y="318" width="44" height="22" rx="4" fill="#1d3b2a" />
        <text x="154" y="334" textAnchor="middle" fontFamily="monospace" fontSize="11" fill="#7ef0a8">
          4.2kW
        </text>
        {[138, 154, 170].map((cx) => (
          <circle key={cx} cx={cx} cy="356" r="3.4" fill="#d9d9d9" />
        ))}
        <circle cx="230" cy="234" r="4" fill="url(#hi-gold)" />
      </g>

      {/* battery stack */}
      {[0, 1, 2, 3].map((i) => {
        const y = 250 + i * 46;
        return (
          <g key={i}>
            <rect x="330" y={y} width="270" height="42" rx="6" fill="url(#hi-battery)" stroke="#3a3a3d" />
            <rect x="322" y={y + 8} width="10" height="26" rx="3" fill="#bfc2c7" />
            <rect x="598" y={y + 8} width="10" height="26" rx="3" fill="#bfc2c7" />
            <text x="346" y={y + 26} fontFamily="var(--font-display), sans-serif" fontWeight="800" fontSize="12" fill="url(#hi-gold)" letterSpacing="1.2">
              LiFePO4
            </text>
            <text x="500" y={y + 30} fontFamily="var(--font-display), sans-serif" fontWeight="600" fontSize="10" fill="#a1a1a6" letterSpacing="1">
              5.0 kWh
            </text>
            <rect x="560" y={y + 13} width="14" height="16" rx="3" fill="#e2702a" />
            <circle cx="585" cy={y + 21} r="5" fill="#d23c2c" />
          </g>
        );
      })}

      {/* breaker box */}
      <rect x="262" y="380" width="64" height="50" rx="6" fill="#ececee" />
      <rect x="270" y="392" width="48" height="16" rx="2" fill="#2b2b2e" />
      {[276, 288, 300, 312].map((x) => (
        <rect key={x} x={x - 3} y="394" width="6" height="12" rx="1" fill="#f2f2f2" />
      ))}

      {/* cables */}
      <g fill="none" strokeWidth="7">
        <ellipse cx="60" cy="440" rx="44" ry="16" stroke="#c0262d" />
        <ellipse cx="60" cy="432" rx="38" ry="13" stroke="#e03a3e" />
        <ellipse cx="160" cy="446" rx="44" ry="16" stroke="#1b1b1d" />
        <ellipse cx="160" cy="438" rx="38" ry="13" stroke="#2c2c2f" />
      </g>
    </svg>
  );
}
